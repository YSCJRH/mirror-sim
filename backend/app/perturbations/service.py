from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from pydantic import Field

from backend.app.domain.models import MirrorBaseModel, PerturbationPayload, PerturbationResolution
from backend.app.utils import load_yaml
from backend.app.worlds import resolve_world_paths


class DecisionKernelPolicy(MirrorBaseModel):
    prompt_version: str
    max_attempts: int = Field(default=2, ge=1)
    fallback_strategy: str
    model_env_var: str = "MIRROR_DECISION_MODEL"


class PerturbationSchema(MirrorBaseModel):
    kind: str
    target_sources: list[str] = Field(default_factory=list)
    actor_sources: list[str] = Field(default_factory=list)
    timing_tokens: list[str] = Field(default_factory=list)
    required_parameters: dict[str, str] = Field(default_factory=dict)
    optional_parameters: dict[str, str] = Field(default_factory=dict)


class DecisionSchema(MirrorBaseModel):
    world_id: str
    schema_version: str
    allowed_action_types: list[str] = Field(default_factory=list)
    timing_tokens: list[str] = Field(default_factory=list)
    perturbations: list[PerturbationSchema] = Field(default_factory=list)
    decision_kernel: DecisionKernelPolicy


class WorldTargetCatalog(MirrorBaseModel):
    entities: list[str] = Field(default_factory=list)
    personas: list[str] = Field(default_factory=list)
    events: list[str] = Field(default_factory=list)
    documents: list[str] = Field(default_factory=list)

    def source_for_id(self, stable_id: str) -> str | None:
        if stable_id in self.entities:
            return "entity"
        if stable_id in self.personas:
            return "persona"
        if stable_id in self.events:
            return "event"
        if stable_id in self.documents:
            return "document"
        return None


def load_decision_schema(path: Path) -> DecisionSchema:
    return DecisionSchema.model_validate(load_yaml(path))


def load_world_target_catalog(world_id: str, *, repo_root: Path | None = None) -> WorldTargetCatalog:
    world_paths = resolve_world_paths(world_id, repo_root=repo_root)
    world_model = load_yaml(world_paths.world_model_path)
    manifest = load_yaml(world_paths.manifest_path)

    return WorldTargetCatalog(
        entities=[item["entity_id"] for item in world_model.get("entities", [])],
        personas=[item["persona_id"] for item in world_model.get("personas", [])],
        events=[item["event_id"] for item in world_model.get("events", [])],
        documents=[item["document_id"] for item in manifest.get("docs", [])],
    )


def _coerce_parameter(name: str, value: Any, expected_type: str) -> Any:
    if expected_type == "int":
        if not isinstance(value, int):
            raise ValueError(f"Parameter `{name}` must be an integer.")
        return value
    if expected_type == "float":
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            raise ValueError(f"Parameter `{name}` must be numeric.")
        return float(value)
    if expected_type == "bool":
        if not isinstance(value, bool):
            raise ValueError(f"Parameter `{name}` must be a boolean.")
        return value
    if expected_type == "str":
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"Parameter `{name}` must be a non-empty string.")
        return value.strip()
    raise ValueError(f"Unsupported parameter type `{expected_type}` for `{name}`.")


def resolve_perturbation_payload(
    world_id: str,
    payload: PerturbationPayload,
    *,
    repo_root: Path | None = None,
) -> PerturbationResolution:
    world_paths = resolve_world_paths(world_id, repo_root=repo_root)
    schema = load_decision_schema(world_paths.decision_schema_path)
    if schema.world_id != world_id:
        raise ValueError(
            f"Decision schema world_id `{schema.world_id}` does not match requested world `{world_id}`."
        )

    perturbation_schema = next(
        (item for item in schema.perturbations if item.kind == payload.kind),
        None,
    )
    if perturbation_schema is None:
        raise ValueError(f"Unsupported perturbation kind `{payload.kind}` for world `{world_id}`.")

    if payload.timing not in perturbation_schema.timing_tokens:
        raise ValueError(
            f"Unsupported timing token `{payload.timing}` for perturbation `{payload.kind}` in world `{world_id}`."
        )

    catalog = load_world_target_catalog(world_id, repo_root=repo_root)
    target_source = catalog.source_for_id(payload.target_id)
    if target_source is None or target_source not in perturbation_schema.target_sources:
        raise ValueError(
            f"Target `{payload.target_id}` does not resolve to an allowed source for perturbation `{payload.kind}`."
        )

    actor_id = payload.parameters.get("actor_id")
    actor_source: str | None = None
    if actor_id is not None:
        if not isinstance(actor_id, str) or not actor_id.strip():
            raise ValueError("`actor_id` must be a non-empty string when provided.")
        actor_source = catalog.source_for_id(actor_id)
        if actor_source is None or actor_source not in perturbation_schema.actor_sources:
            raise ValueError(
                f"Actor `{actor_id}` does not resolve to an allowed source for perturbation `{payload.kind}`."
            )

    validated_parameters: dict[str, Any] = {}
    for name, expected_type in perturbation_schema.required_parameters.items():
        if name not in payload.parameters:
            raise ValueError(f"Missing required parameter `{name}` for perturbation `{payload.kind}`.")
        validated_parameters[name] = _coerce_parameter(name, payload.parameters[name], expected_type)

    for name, expected_type in perturbation_schema.optional_parameters.items():
        if name in payload.parameters:
            validated_parameters[name] = _coerce_parameter(name, payload.parameters[name], expected_type)

    unexpected_parameters = sorted(
        key
        for key in payload.parameters.keys()
        if key not in validated_parameters and key != "actor_id"
    )
    if unexpected_parameters:
        raise ValueError(
            f"Unexpected parameter(s) for perturbation `{payload.kind}`: {', '.join(unexpected_parameters)}."
        )

    normalized_payload = payload.model_copy(
        update={
            "parameters": {
                **validated_parameters,
                **({"actor_id": actor_id} if actor_id is not None else {}),
            }
        }
    )
    resolution_payload = {
        "world_id": world_id,
        "schema_version": schema.schema_version,
        "perturbation": normalized_payload.model_dump(),
        "target_source": target_source,
        "actor_source": actor_source,
        "resolved_actor_id": actor_id,
        "timing_token": payload.timing,
        "validated_parameters": validated_parameters,
    }
    resolution_hash = hashlib.sha256(
        json.dumps(resolution_payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()

    return PerturbationResolution(
        world_id=world_id,
        schema_version=schema.schema_version,
        perturbation=normalized_payload,
        target_source=target_source,
        actor_source=actor_source,
        resolved_actor_id=actor_id,
        timing_token=payload.timing,
        validated_parameters=validated_parameters,
        notes=[
            f"Resolved against decision schema `{world_paths.decision_schema_path.name}`.",
            f"Target source: {target_source}.",
            f"Timing token: {payload.timing}.",
        ],
        resolution_hash=resolution_hash,
    )
