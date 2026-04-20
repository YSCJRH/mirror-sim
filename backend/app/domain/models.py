from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


ClaimLabel = Literal["evidence_backed", "inferred", "speculative"]
InjectionKind = Literal["delay_document", "block_contact", "resource_failure"]
ActionType = Literal["inform", "hide", "inspect", "move", "request", "delay", "publish", "evacuate"]


class MirrorBaseModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Document(MirrorBaseModel):
    document_id: str
    title: str
    kind: str
    source_path: str
    created_at: str | None = None
    source_time: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class Chunk(MirrorBaseModel):
    chunk_id: str
    document_id: str
    text: str
    char_start: int
    char_end: int
    source_id: str


class Entity(MirrorBaseModel):
    entity_id: str
    name: str
    type: str
    aliases: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)


class Relation(MirrorBaseModel):
    relation_id: str
    source_entity_id: str
    relation_type: str
    target_entity_id: str
    evidence_ids: list[str] = Field(default_factory=list)


class Event(MirrorBaseModel):
    event_id: str
    name: str
    kind: str
    participant_entity_ids: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)


class Persona(MirrorBaseModel):
    persona_id: str
    entity_id: str
    public_role: str
    goals: list[str] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    known_facts: list[str] = Field(default_factory=list)
    private_info: list[str] = Field(default_factory=list)
    relationships: list[dict[str, str]] = Field(default_factory=list)
    field_provenance: dict[str, list[str]] = Field(default_factory=dict)
    evidence_ids: list[str] = Field(default_factory=list)


class Injection(MirrorBaseModel):
    injection_id: str
    kind: InjectionKind
    target_id: str | None = None
    actor_id: str | None = None
    params: dict[str, Any] = Field(default_factory=dict)
    rationale: str | None = None


class Scenario(MirrorBaseModel):
    scenario_id: str
    world_id: str
    title: str
    description: str
    seed: int
    turn_budget: int = Field(default=8, ge=1, le=8)
    branch_count: int = Field(default=1, ge=1)
    injections: list[Injection] = Field(default_factory=list)
    evaluation_questions: list[str] = Field(default_factory=list)


class TurnAction(MirrorBaseModel):
    turn_id: str
    run_id: str
    turn_index: int
    actor_id: str
    action_type: ActionType
    target_id: str | None = None
    rationale: str
    evidence_ids: list[str] = Field(default_factory=list)
    state_patch: dict[str, Any] = Field(default_factory=dict)


class RunTrace(MirrorBaseModel):
    run_id: str
    scenario_id: str
    seed: int
    turn_budget: int
    executed_turns: int
    ledger_public_turn: int | None = None
    budget_exposed_turn: int | None = None
    evacuation_turn: int | None = None
    final_state: dict[str, Any] = Field(default_factory=dict)
    action_count: int
    action_types: list[ActionType] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class CompareBranch(MirrorBaseModel):
    branch_id: str
    label: str
    run_id: str
    is_reference: bool
    summary_path: str
    trace_path: str
    snapshot_dir: str


class CompareTurnDelta(MirrorBaseModel):
    turn_index: int
    reference_turn_id: str | None = None
    candidate_turn_id: str | None = None


class CompareOutcomeDelta(MirrorBaseModel):
    reference: Any = None
    candidate: Any = None
    delta: Any = None


class CompareBranchDelta(MirrorBaseModel):
    branch_id: str
    divergent_turn_count: int
    divergent_turns: list[CompareTurnDelta] = Field(default_factory=list)
    outcome_deltas: dict[str, CompareOutcomeDelta] = Field(default_factory=dict)


class CompareArtifact(MirrorBaseModel):
    compare_id: str
    scenario_id: str
    seed: int
    branch_count: int
    reference_branch_id: str
    branches: list[CompareBranch] = Field(default_factory=list)
    reference_deltas: list[CompareBranchDelta] = Field(default_factory=list)


class Claim(MirrorBaseModel):
    claim_id: str
    text: str
    label: ClaimLabel
    evidence_ids: list[str] = Field(default_factory=list)
    related_turn_ids: list[str] = Field(default_factory=list)
    confidence_note: str | None = None


class EvalResult(MirrorBaseModel):
    eval_name: str
    world_id: str | None = None
    status: str
    metrics: dict[str, Any] = Field(default_factory=dict)
    failures: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)
    artifact_paths: dict[str, str] = Field(default_factory=dict)
