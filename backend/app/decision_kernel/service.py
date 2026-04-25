from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any
from urllib import error, request

from backend.app.domain.models import DecisionTraceEntry
from backend.app.model_access import HOSTED_PROVIDER, hosted_openai_base_url, hosted_openai_key
from backend.app.perturbations.service import DecisionSchema
from backend.app.simulation.rules import StepChoice
from backend.app.utils import ensure_dir, read_jsonl


def _hash_json(payload: Any) -> str:
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()


def _append_trace(path: Path, entry: DecisionTraceEntry) -> None:
    ensure_dir(path.parent)
    with path.open("a", encoding="utf-8") as handle:
      handle.write(json.dumps(entry.model_dump(), ensure_ascii=False) + "\n")


def _load_replay_cache(path: Path | None) -> dict[str, DecisionTraceEntry]:
    if path is None or not path.exists():
        return {}
    rows = read_jsonl(path)
    cache: dict[str, DecisionTraceEntry] = {}
    for row in rows:
        entry = DecisionTraceEntry.model_validate(row)
        cache[entry.input_hash] = entry
    return cache


def _choice_summary(choice: StepChoice) -> str:
    target_id = f" -> {choice.action.target_id}" if choice.action.target_id else ""
    return f"{choice.action.action_type}{target_id}: {choice.action.rationale}"


def _extract_json_object(text: str) -> dict[str, Any]:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        if "\n" in stripped:
            stripped = stripped.split("\n", 1)[1]
    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("LLM output did not contain a JSON object.")
    return json.loads(stripped[start : end + 1])


def _openai_choose_choice(
    *,
    model_id: str,
    api_key: str,
    api_base_url: str,
    prompt_version: str,
    input_payload: dict[str, Any],
    max_completion_tokens: int | None = None,
) -> tuple[int, str, str]:
    endpoint_root = api_base_url.rstrip("/")
    endpoint = f"{endpoint_root}/chat/completions"
    system_prompt = (
        "You are a rule-bounded simulation decision model. "
        "Choose exactly one legal action index from the provided choices. "
        "Return strict JSON with keys `selected_choice_index` and `rationale`."
    )
    payload = {
        "model": model_id,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "prompt_version": prompt_version,
                        **input_payload,
                    },
                    ensure_ascii=False,
                ),
            },
        ],
    }
    if max_completion_tokens is not None:
        payload["max_completion_tokens"] = max_completion_tokens
    raw_payload = json.dumps(payload).encode("utf-8")
    req = request.Request(
        endpoint,
        data=raw_payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except error.URLError as exc:
        raise RuntimeError(f"OpenAI decision request failed: {exc}") from exc

    content = (
        response_payload.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
    )
    parsed = _extract_json_object(content)
    selected_index = parsed.get("selected_choice_index")
    rationale = parsed.get("rationale", "")
    if not isinstance(selected_index, int):
        raise ValueError("LLM output did not include an integer `selected_choice_index`.")
    if not isinstance(rationale, str):
        rationale = ""
    return selected_index, rationale, _hash_json(parsed)


class DecisionKernel:
    def __init__(
        self,
        *,
        world_id: str,
        schema: DecisionSchema,
        run_id: str,
        decision_trace_path: Path | None,
        provider_override: str | None = None,
        model_id_override: str | None = None,
    ) -> None:
        self.world_id = world_id
        self.schema = schema
        self.run_id = run_id
        self.decision_trace_path = decision_trace_path
        self.replay_cache = _load_replay_cache(decision_trace_path)
        self.provider = provider_override or "openai_compatible"
        if self.provider not in {"openai_compatible", HOSTED_PROVIDER, "deterministic_only"}:
            raise ValueError(f"Unsupported decision provider `{self.provider}`.")
        env_model_id = os.environ.get(schema.decision_kernel.model_env_var)
        if self.provider == HOSTED_PROVIDER:
            env_model_id = os.environ.get("MIRROR_HOSTED_DECISION_MODEL") or env_model_id
        self.model_id = (
            None
            if self.provider == "deterministic_only"
            else model_id_override or env_model_id
        )
        self.api_key = (
            hosted_openai_key()
            if self.provider == HOSTED_PROVIDER
            else os.environ.get("OPENAI_API_KEY")
        )
        self.api_base_url = (
            hosted_openai_base_url()
            if self.provider == HOSTED_PROVIDER
            else os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
        )
        max_output_tokens = os.environ.get("MIRROR_HOSTED_MAX_OUTPUT_TOKENS")
        self.max_completion_tokens = (
            int(max_output_tokens)
            if self.provider == HOSTED_PROVIDER and max_output_tokens
            else None
        )

    def choose(
        self,
        *,
        scenario_id: str,
        turn_index: int,
        actor_id: str,
        state: dict[str, Any],
        choices: list[StepChoice],
    ) -> StepChoice:
        available_choices = [
            {
                "index": index,
                "action_type": choice.action.action_type,
                "target_id": choice.action.target_id,
                "rationale": choice.action.rationale,
            }
            for index, choice in enumerate(choices)
        ]
        input_payload = {
            "world_id": self.world_id,
            "scenario_id": scenario_id,
            "turn_index": turn_index,
            "actor_id": actor_id,
            "state": state,
            "available_choices": available_choices,
        }
        input_hash = _hash_json(input_payload)
        replay_entry = self.replay_cache.get(input_hash)

        if replay_entry and 0 <= replay_entry.selected_choice_index < len(choices):
            return self._finalize(
                turn_index=turn_index,
                actor_id=actor_id,
                input_hash=input_hash,
                choices=choices,
                selected_choice_index=replay_entry.selected_choice_index,
                provider_mode="replay_cache",
                rationale=replay_entry.rationale,
                output_hash=replay_entry.output_hash,
                fallback_used=replay_entry.fallback_used,
                validation_status="accepted_from_replay",
            )

        if len(choices) == 1:
            return self._finalize(
                turn_index=turn_index,
                actor_id=actor_id,
                input_hash=input_hash,
                choices=choices,
                selected_choice_index=0,
                provider_mode="single_choice",
                rationale="Only one legal choice matched the current world state.",
                output_hash=_hash_json({"selected_choice_index": 0}),
                fallback_used=False,
                validation_status="accepted_single_choice",
            )

        if self.provider in {"openai_compatible", HOSTED_PROVIDER} and self.model_id and self.api_key:
            for attempt in range(self.schema.decision_kernel.max_attempts):
                try:
                    selected_choice_index, rationale, output_hash = _openai_choose_choice(
                        model_id=self.model_id,
                        api_key=self.api_key,
                        api_base_url=self.api_base_url,
                        prompt_version=self.schema.decision_kernel.prompt_version,
                        input_payload=input_payload,
                        max_completion_tokens=self.max_completion_tokens,
                    )
                    if 0 <= selected_choice_index < len(choices):
                        return self._finalize(
                            turn_index=turn_index,
                            actor_id=actor_id,
                            input_hash=input_hash,
                            choices=choices,
                            selected_choice_index=selected_choice_index,
                            provider_mode=self.provider,
                            rationale=rationale,
                            output_hash=output_hash,
                            fallback_used=False,
                            validation_status=f"accepted_after_attempt_{attempt + 1}",
                        )
                except Exception as exc:  # noqa: BLE001
                    last_error = str(exc)
                    continue
            fallback_rationale = (
                f"LLM proposal was unavailable or invalid; fallback strategy "
                f"`{self.schema.decision_kernel.fallback_strategy}` selected the first legal choice."
            )
            if "last_error" in locals():
                fallback_rationale += f" Last error: {last_error}"
        elif self.provider in {"openai_compatible", HOSTED_PROVIDER}:
            fallback_rationale = (
                "No model or API credential is configured for the selected provider; "
                "fallback strategy selected the first legal choice."
            )
        else:
            fallback_rationale = (
                "Session is pinned to `deterministic_only`; "
                "fallback strategy selected the first legal choice."
            )

        return self._finalize(
            turn_index=turn_index,
            actor_id=actor_id,
            input_hash=input_hash,
            choices=choices,
            selected_choice_index=0,
            provider_mode="deterministic_fallback",
            rationale=fallback_rationale,
            output_hash=_hash_json({"selected_choice_index": 0, "mode": "fallback"}),
            fallback_used=True,
            validation_status="accepted_via_fallback",
        )

    def _finalize(
        self,
        *,
        turn_index: int,
        actor_id: str,
        input_hash: str,
        choices: list[StepChoice],
        selected_choice_index: int,
        provider_mode: str,
        rationale: str,
        output_hash: str | None,
        fallback_used: bool,
        validation_status: str,
    ) -> StepChoice:
        selected = choices[selected_choice_index]
        entry = DecisionTraceEntry(
            run_id=self.run_id,
            turn_index=turn_index,
            actor_id=actor_id,
            provider_mode=provider_mode,
            model_id=self.model_id,
            prompt_version=self.schema.decision_kernel.prompt_version,
            input_hash=input_hash,
            output_hash=output_hash,
            available_choices=[_choice_summary(choice) for choice in choices],
            selected_choice_index=selected_choice_index,
            selected_action_type=selected.action.action_type,
            selected_target_id=selected.action.target_id,
            rationale=rationale,
            validation_status=validation_status,
            fallback_used=fallback_used,
        )
        if self.decision_trace_path is not None:
            _append_trace(self.decision_trace_path, entry)
        self.replay_cache[input_hash] = entry
        return selected
