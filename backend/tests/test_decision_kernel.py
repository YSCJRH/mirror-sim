from __future__ import annotations

import json
from pathlib import Path

from backend.app.decision_kernel import DecisionKernel
import backend.app.decision_kernel.service as decision_kernel_service
from backend.app.perturbations import load_decision_schema, resolve_perturbation_payload
from backend.app.domain.models import PerturbationPayload
from backend.app.simulation.rules import StepAction, StepChoice


def test_resolve_perturbation_payload_accepts_fog_harbor_document_target() -> None:
    resolution = resolve_perturbation_payload(
        "fog-harbor-east-gate",
        PerturbationPayload(
            kind="delay_document",
            target_id="doc_ledger_copy",
            timing="before_publication",
            summary="Delay the copied ledger before publication.",
            parameters={
                "actor_id": "entity_lin_lan",
                "delay_turns": 2,
                "cause": "courier_interruption",
            },
        ),
    )
    assert resolution.target_source == "document"
    assert resolution.actor_source == "entity"
    assert resolution.validated_parameters["delay_turns"] == 2


def test_resolve_perturbation_payload_accepts_museum_night_document_target() -> None:
    resolution = resolve_perturbation_payload(
        "museum-night",
        PerturbationPayload(
            kind="delay_document",
            target_id="doc_volunteer_packet",
            timing="before_checklist_publication",
            summary="Delay the printed checklist copy.",
            parameters={
                "actor_id": "persona_mina_park",
                "delay_turns": 2,
                "cause": "print_room_backlog",
            },
        ),
    )
    assert resolution.target_source == "document"
    assert resolution.actor_source == "persona"


def test_resolve_perturbation_payload_rejects_invalid_target() -> None:
    try:
        resolve_perturbation_payload(
            "fog-harbor-east-gate",
            PerturbationPayload(
                kind="delay_document",
                target_id="entity_east_gate",
                timing="before_publication",
                summary="Invalid target type.",
                parameters={
                    "actor_id": "entity_lin_lan",
                    "delay_turns": 2,
                },
            ),
        )
    except ValueError as exc:
        assert "allowed source" in str(exc)
    else:
        raise AssertionError("invalid target did not fail resolution")


def test_resolve_perturbation_payload_rejects_invalid_timing() -> None:
    try:
        resolve_perturbation_payload(
            "fog-harbor-east-gate",
            PerturbationPayload(
                kind="block_contact",
                target_id="persona_zhao_ke",
                timing="before_publication",
                summary="Invalid timing for contact block.",
                parameters={
                    "actor_id": "persona_chen_yu",
                },
            ),
        )
    except ValueError as exc:
        assert "Unsupported timing token" in str(exc)
    else:
        raise AssertionError("invalid timing did not fail resolution")


def test_decision_kernel_replays_cached_choice(tmp_path: Path) -> None:
    schema = load_decision_schema(Path("data/demo/config/decision_schema.yaml"))
    trace_path = tmp_path / "decision_trace.jsonl"

    first_kernel = DecisionKernel(
        world_id="fog-harbor-east-gate",
        schema=schema,
        run_id="run_demo",
        decision_trace_path=trace_path,
    )
    choices = [
        StepChoice(
            action=StepAction(
                action_type="inspect",
                target_id="entity_east_gate",
                rationale="Inspect the gate.",
                updates=[],
            )
        ),
        StepChoice(
            action=StepAction(
                action_type="inform",
                target_id="persona_zhao_ke",
                rationale="Inform the deputy mayor.",
                updates=[],
            )
        ),
    ]
    selected = first_kernel.choose(
        scenario_id="scenario_baseline",
        turn_index=2,
        actor_id="persona_chen_yu",
        state={"communications_down_until": 0, "blocked_contacts": []},
        choices=choices,
    )
    assert selected.action.action_type == "inspect"
    assert trace_path.exists()

    replay_kernel = DecisionKernel(
        world_id="fog-harbor-east-gate",
        schema=schema,
        run_id="run_demo_replay",
        decision_trace_path=trace_path,
    )
    replayed = replay_kernel.choose(
        scenario_id="scenario_baseline",
        turn_index=2,
        actor_id="persona_chen_yu",
        state={"communications_down_until": 0, "blocked_contacts": []},
        choices=choices,
    )
    assert replayed.action.action_type == "inspect"


def test_decision_kernel_replay_uses_cached_choice_without_provider_call(
    monkeypatch,
    tmp_path: Path,
) -> None:
    schema = load_decision_schema(Path("data/demo/config/decision_schema.yaml"))
    trace_path = tmp_path / "decision_trace.jsonl"
    first_kernel = DecisionKernel(
        world_id="fog-harbor-east-gate",
        schema=schema,
        run_id="run_demo",
        decision_trace_path=trace_path,
        provider_override="deterministic_only",
    )
    choices = _kernel_test_choices()

    first_selected = _choose_with_kernel(first_kernel, choices)
    assert first_selected.action.action_type == "inspect"

    def fail_if_called(**_: object) -> tuple[int, str, str]:
        raise AssertionError("provider should not be called for replay cache hits")

    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-replay")
    monkeypatch.setenv("MIRROR_DECISION_MODEL", "gpt-replay-new")
    monkeypatch.setattr(decision_kernel_service, "_openai_choose_choice", fail_if_called)
    replay_kernel = DecisionKernel(
        world_id="fog-harbor-east-gate",
        schema=schema,
        run_id="run_demo_replay",
        decision_trace_path=trace_path,
    )

    replayed = _choose_with_kernel(replay_kernel, choices)

    assert replayed.action.action_type == "inspect"
    rows = [json.loads(line) for line in trace_path.read_text(encoding="utf-8").splitlines()]
    assert len(rows) == 2
    original, replay = rows
    assert original["provider_mode"] == "deterministic_fallback"
    assert replay["provider_mode"] == "replay_cache"
    assert replay["validation_status"] == "accepted_from_replay"
    assert replay["selected_choice_index"] == original["selected_choice_index"]
    assert replay["output_hash"] == original["output_hash"]
    assert replay["rationale"] == original["rationale"]
    assert replay["model_id"] == original["model_id"]
    assert replay["prompt_version"] == original["prompt_version"]


def test_decision_kernel_rejects_choice_outside_world_decision_schema(tmp_path: Path) -> None:
    schema = load_decision_schema(Path("data/demo/config/decision_schema.yaml"))
    kernel = DecisionKernel(
        world_id="fog-harbor-east-gate",
        schema=schema,
        run_id="run_demo",
        decision_trace_path=tmp_path / "decision_trace.jsonl",
        provider_override="deterministic_only",
    )
    choices = [
        StepChoice(
            action=StepAction(
                action_type="invent_state_patch",
                target_id="entity_east_gate",
                rationale="Illegal action outside the world schema.",
                updates=[],
            )
        )
    ]

    try:
        _choose_with_kernel(kernel, choices)
    except ValueError as exc:
        assert "not allowed by decision schema" in str(exc)
    else:
        raise AssertionError("kernel accepted an action outside the decision schema")


def _kernel_test_choices() -> list[StepChoice]:
    return [
        StepChoice(
            action=StepAction(
                action_type="inspect",
                target_id="entity_east_gate",
                rationale="Inspect the gate.",
                updates=[],
            )
        ),
        StepChoice(
            action=StepAction(
                action_type="inform",
                target_id="persona_zhao_ke",
                rationale="Inform the deputy mayor.",
                updates=[],
            )
        ),
    ]


def _choose_with_kernel(kernel: DecisionKernel, choices: list[StepChoice]) -> StepChoice:
    return kernel.choose(
        scenario_id="scenario_baseline",
        turn_index=2,
        actor_id="persona_chen_yu",
        state={"communications_down_until": 0, "blocked_contacts": []},
        choices=choices,
    )


def test_decision_kernel_invalid_model_output_falls_back_with_contract_trace(
    monkeypatch,
    tmp_path: Path,
) -> None:
    schema = load_decision_schema(Path("data/demo/config/decision_schema.yaml"))
    trace_path = tmp_path / "decision_trace.jsonl"
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-invalid-output")
    monkeypatch.setenv("MIRROR_DECISION_MODEL", "gpt-test")

    def choose_invalid_index(**_: object) -> tuple[int, str, str]:
        return 99, "Invalid out-of-range proposal.", "invalid-output-hash"

    monkeypatch.setattr(decision_kernel_service, "_openai_choose_choice", choose_invalid_index)
    kernel = DecisionKernel(
        world_id="fog-harbor-east-gate",
        schema=schema,
        run_id="run_demo",
        decision_trace_path=trace_path,
    )

    selected = _choose_with_kernel(kernel, _kernel_test_choices())

    assert selected.action.action_type == "inspect"
    rows = [json.loads(line) for line in trace_path.read_text(encoding="utf-8").splitlines()]
    assert len(rows) == 1
    trace = rows[0]
    assert set(trace) == {
        "run_id",
        "turn_index",
        "actor_id",
        "provider_mode",
        "model_id",
        "prompt_version",
        "input_hash",
        "output_hash",
        "available_choices",
        "selected_choice_index",
        "selected_action_type",
        "selected_target_id",
        "rationale",
        "validation_status",
        "fallback_used",
    }
    assert trace["provider_mode"] == "deterministic_fallback"
    assert trace["model_id"] == "gpt-test"
    assert trace["selected_choice_index"] == 0
    assert trace["selected_action_type"] == "inspect"
    assert trace["fallback_used"] is True
    assert trace["validation_status"] == "accepted_via_fallback"
    assert trace["available_choices"] == [
        "inspect -> entity_east_gate: Inspect the gate.",
        "inform -> persona_zhao_ke: Inform the deputy mayor.",
    ]


def test_decision_kernel_provider_error_fallback_redacts_raw_error_and_secret(
    monkeypatch,
    tmp_path: Path,
) -> None:
    schema = load_decision_schema(Path("data/demo/config/decision_schema.yaml"))
    trace_path = tmp_path / "decision_trace.jsonl"
    secret = "sk-test-secret"
    monkeypatch.setenv("OPENAI_API_KEY", secret)
    monkeypatch.setenv("MIRROR_DECISION_MODEL", "gpt-test")

    def raise_provider_error(**_: object) -> tuple[int, str, str]:
        raise RuntimeError(f"provider exploded with {secret} from OPENAI_API_KEY")

    monkeypatch.setattr(decision_kernel_service, "_openai_choose_choice", raise_provider_error)
    kernel = DecisionKernel(
        world_id="fog-harbor-east-gate",
        schema=schema,
        run_id="run_demo",
        decision_trace_path=trace_path,
    )

    selected = _choose_with_kernel(kernel, _kernel_test_choices())

    assert selected.action.action_type == "inspect"
    trace_text = trace_path.read_text(encoding="utf-8")
    assert secret not in trace_text
    assert "OPENAI_API_KEY" not in trace_text
    assert "provider exploded" not in trace_text
    trace = json.loads(trace_text)
    assert trace["provider_mode"] == "deterministic_fallback"
    assert trace["fallback_used"] is True
    assert trace["validation_status"] == "accepted_via_fallback"
    assert trace["rationale"] == (
        "LLM proposal was unavailable or invalid; fallback strategy "
        "`first_legal_choice` selected the first legal choice."
    )
