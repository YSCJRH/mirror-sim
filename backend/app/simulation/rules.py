from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

from pydantic import Field

from backend.app.domain.models import ActionType, InjectionKind, MirrorBaseModel
from backend.app.utils import load_yaml


class OutcomeDefinition(MirrorBaseModel):
    field: str
    label: str
    action_types: list[ActionType] = Field(default_factory=list)


class InjectionRule(MirrorBaseModel):
    kind: InjectionKind
    operation: Literal["add_int", "max_int", "append_contact"]
    field: str
    param: str | None = None
    note_template: str | None = None


class StepCondition(MirrorBaseModel):
    kind: Literal["state_equals", "state_truthy", "state_falsy", "turn_gte_state", "communication_available"]
    field: str | None = None
    value: Any = None
    target_id: str | None = None


class StateUpdate(MirrorBaseModel):
    kind: Literal["set", "set_current_turn", "union_actor_entity"]
    field: str
    value: Any = None


class StepAction(MirrorBaseModel):
    action_type: ActionType
    target_id: str | None = None
    rationale: str
    updates: list[StateUpdate] = Field(default_factory=list)


class StepChoice(MirrorBaseModel):
    when: list[StepCondition] = Field(default_factory=list)
    action: StepAction


class StepRule(MirrorBaseModel):
    turn_index: int = Field(ge=1)
    choices: list[StepChoice] = Field(default_factory=list)


class SimulationPlan(MirrorBaseModel):
    world_id: str
    compare_id: str
    default_report_scenario: str
    communications_down_field: str = "communications_down_until"
    blocked_contacts_field: str = "blocked_contacts"
    turn_sequence: list[str] = Field(default_factory=list)
    initial_state: dict[str, Any] = Field(default_factory=dict)
    tracked_outcomes: list[OutcomeDefinition] = Field(default_factory=list)
    injection_rules: list[InjectionRule] = Field(default_factory=list)
    steps: list[StepRule] = Field(default_factory=list)


def load_simulation_plan(path: Path) -> SimulationPlan:
    return SimulationPlan.model_validate(load_yaml(path))
