from __future__ import annotations

import shutil
from copy import deepcopy
from dataclasses import dataclass
from itertools import combinations
from pathlib import Path
from typing import Any

from backend.app.config import get_settings
from backend.app.decision_kernel import DecisionKernel
from backend.app.domain.models import (
    CompareArtifact,
    CompareBranch,
    CompareBranchDelta,
    CompareOutcomeDelta,
    CompareTurnDelta,
    Persona,
    RunTrace,
    Scenario,
    TurnAction,
)
from backend.app.perturbations import load_decision_schema
from backend.app.scenarios.service import load_scenario
from backend.app.simulation.rules import OutcomeDefinition, SimulationPlan, StepChoice, load_simulation_plan
from backend.app.utils import ensure_dir, read_json, read_jsonl, slugify, write_json, write_jsonl


@dataclass(frozen=True)
class BranchExecutionPlan:
    branch_id: str
    label: str
    scenario: Scenario
    injection_ids: tuple[str, ...]


@dataclass(frozen=True)
class BranchRunArtifacts:
    branch_id: str
    label: str
    summary: RunTrace
    actions: list[TurnAction]
    run_dir: Path


def _load_personas(path: Path) -> dict[str, Persona]:
    payload = read_json(path)
    return {item["persona_id"]: Persona.model_validate(item) for item in payload["personas"]}


def load_run_artifacts(run_dir: Path) -> tuple[RunTrace, list[TurnAction]]:
    summary = RunTrace.model_validate(read_json(run_dir / "summary.json"))
    actions = [TurnAction.model_validate(row) for row in read_jsonl(run_dir / "run_trace.jsonl")]
    return summary, actions


def _simulation_plan_path_for_scenario(scenario_path: Path) -> Path:
    return scenario_path.parent.parent / "config" / "simulation_rules.yaml"


def _decision_schema_path_for_scenario(scenario_path: Path) -> Path:
    schema_path = scenario_path.parent.parent / "config" / "decision_schema.yaml"
    if not schema_path.exists():
        schema_path = get_settings().decision_schema_path
    return schema_path


def _load_plan_for_scenario(scenario_path: Path, scenario: Scenario) -> SimulationPlan:
    plan_path = _simulation_plan_path_for_scenario(scenario_path)
    if not plan_path.exists():
        plan_path = get_settings().simulation_rules_path
    plan = load_simulation_plan(plan_path)
    if plan.world_id != scenario.world_id:
        raise ValueError(
            f"Scenario {scenario.scenario_id} targets world_id={scenario.world_id}, "
            f"but simulation rules declare world_id={plan.world_id}."
        )
    return plan


def _format_injection_note(rule_kind: str, injection: dict[str, Any], template: str | None) -> str:
    if template:
        return template.format(**injection)
    return f"{injection['injection_id']}: applied {rule_kind}."


def _apply_injections(scenario: Scenario, plan: SimulationPlan, state: dict[str, Any], notes: list[str]) -> None:
    rules_by_kind = {rule.kind: rule for rule in plan.injection_rules}
    for injection in scenario.injections:
        rule = rules_by_kind.get(injection.kind)
        if rule is None:
            raise ValueError(f"Missing simulation injection rule for kind={injection.kind}.")

        payload = {
            "injection_id": injection.injection_id,
            "actor_id": injection.actor_id,
            "target_id": injection.target_id,
            **injection.params,
        }
        if rule.operation == "add_int":
            param_name = rule.param or "value"
            state[rule.field] = int(state.get(rule.field, 0)) + int(injection.params.get(param_name, 0))
        elif rule.operation == "max_int":
            param_name = rule.param or "value"
            state[rule.field] = max(int(state.get(rule.field, 0)), int(injection.params.get(param_name, 0)))
        elif rule.operation == "append_contact":
            blocked = list(state.get(rule.field, []))
            blocked.append((injection.actor_id, injection.target_id))
            state[rule.field] = blocked
        else:
            raise ValueError(f"Unsupported injection operation: {rule.operation}")
        notes.append(_format_injection_note(rule.kind, payload, rule.note_template))


def _supports_communication(
    state: dict[str, Any],
    turn_index: int,
    actor_id: str,
    target_id: str | None,
    plan: SimulationPlan,
) -> bool:
    if turn_index <= int(state.get(plan.communications_down_field, 0)):
        return False
    if target_id is None:
        return True
    blocked_pairs = {tuple(pair) for pair in state.get(plan.blocked_contacts_field, [])}
    return (actor_id, target_id) not in blocked_pairs


def _persona_evidence(personas: dict[str, Persona], persona_id: str) -> list[str]:
    return personas[persona_id].evidence_ids[:3]


def _state_patch(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in after.items() if before.get(key) != value}


def _condition_matches(
    condition_kind: str,
    *,
    condition_field: str | None,
    condition_value: Any,
    condition_target_id: str | None,
    state: dict[str, Any],
    turn_index: int,
    actor_id: str,
    plan: SimulationPlan,
) -> bool:
    if condition_kind == "state_equals":
        return state.get(condition_field or "") == condition_value
    if condition_kind == "state_truthy":
        return bool(state.get(condition_field or ""))
    if condition_kind == "state_falsy":
        return not bool(state.get(condition_field or ""))
    if condition_kind == "turn_gte_state":
        return turn_index >= int(state.get(condition_field or "", 0))
    if condition_kind == "communication_available":
        return _supports_communication(state, turn_index, actor_id, condition_target_id, plan)
    raise ValueError(f"Unsupported step condition: {condition_kind}")


def _choice_matches(
    choice: StepChoice,
    *,
    state: dict[str, Any],
    turn_index: int,
    actor_id: str,
    plan: SimulationPlan,
) -> bool:
    return all(
        _condition_matches(
            condition.kind,
            condition_field=condition.field,
            condition_value=condition.value,
            condition_target_id=condition.target_id,
            state=state,
            turn_index=turn_index,
            actor_id=actor_id,
            plan=plan,
        )
        for condition in choice.when
    )


def _apply_updates(
    *,
    state: dict[str, Any],
    actor_entity_id: str,
    turn_index: int,
    updates: list[Any],
) -> None:
    for update in updates:
        if update.kind == "set":
            state[update.field] = deepcopy(update.value)
        elif update.kind == "set_current_turn":
            state[update.field] = turn_index
        elif update.kind == "union_actor_entity":
            state[update.field] = sorted({*state.get(update.field, []), actor_entity_id})
        else:
            raise ValueError(f"Unsupported state update kind: {update.kind}")


def _action_for_turn(
    turn_index: int,
    run_id: str,
    persona_id: str,
    personas: dict[str, Persona],
    state: dict[str, Any],
    plan: SimulationPlan,
    step_choices: list[StepChoice],
    decision_kernel: DecisionKernel,
    scenario_id: str,
) -> TurnAction:
    evidence_ids = _persona_evidence(personas, persona_id)
    actor_entity = personas[persona_id].entity_id
    before = deepcopy(state)

    matching_choices = [
        choice
        for choice in step_choices
        if _choice_matches(choice, state=state, turn_index=turn_index, actor_id=persona_id, plan=plan)
    ]
    if not matching_choices:
        raise ValueError(f"No matching simulation step choice for turn {turn_index} in world {plan.world_id}.")
    selected = decision_kernel.choose(
        scenario_id=scenario_id,
        turn_index=turn_index,
        actor_id=persona_id,
        state=before,
        choices=matching_choices,
    )

    _apply_updates(
        state=state,
        actor_entity_id=actor_entity,
        turn_index=turn_index,
        updates=selected.action.updates,
    )
    action = TurnAction(
        turn_id=f"{run_id}_turn_{turn_index:02d}",
        run_id=run_id,
        turn_index=turn_index,
        actor_id=persona_id,
        action_type=selected.action.action_type,
        target_id=selected.action.target_id,
        rationale=selected.action.rationale,
        evidence_ids=evidence_ids,
        state_patch={},
    )
    action.state_patch = _state_patch(before, state)
    return action


def _summary_outcome_value(summary: RunTrace, field: str) -> Any:
    if hasattr(summary, field):
        return getattr(summary, field)
    return summary.final_state.get(field)


def _simulate_loaded_scenario(
    scenario: Scenario,
    scenario_path: Path,
    plan: SimulationPlan,
    graph_path: Path,
    personas_path: Path,
    out_dir: Path,
    *,
    run_id: str | None = None,
    notes_prefix: list[str] | None = None,
    decision_trace_path: Path | None = None,
    decision_provider: str | None = None,
    decision_model_id: str | None = None,
) -> tuple[RunTrace, list[TurnAction]]:
    _ = read_json(graph_path)
    personas = _load_personas(personas_path)
    if scenario.turn_budget > len(plan.turn_sequence):
        raise ValueError(
            f"Scenario {scenario.scenario_id} requests turn_budget={scenario.turn_budget}, "
            f"but only {len(plan.turn_sequence)} turn owners are defined in simulation rules."
        )

    step_index = {step.turn_index: step for step in plan.steps}
    resolved_run_id = run_id or f"run_{scenario.scenario_id}_{scenario.seed}"
    notes = [f"Deterministic run for {scenario.scenario_id}.", *(notes_prefix or [])]
    state = deepcopy(plan.initial_state)
    _apply_injections(scenario, plan, state, notes)
    decision_schema = load_decision_schema(_decision_schema_path_for_scenario(scenario_path))
    kernel = DecisionKernel(
        world_id=scenario.world_id,
        schema=decision_schema,
        run_id=resolved_run_id,
        decision_trace_path=decision_trace_path,
        provider_override=decision_provider,
        model_id_override=decision_model_id,
    )

    snapshots_dir = ensure_dir(out_dir / "snapshots")
    for existing in snapshots_dir.glob("*.json"):
        existing.unlink()

    actions: list[TurnAction] = []
    for turn_index in range(1, scenario.turn_budget + 1):
        persona_id = plan.turn_sequence[turn_index - 1]
        step = step_index.get(turn_index)
        if step is None:
            raise ValueError(f"Missing simulation step definition for turn {turn_index} in world {plan.world_id}.")
        action = _action_for_turn(
            turn_index,
            resolved_run_id,
            persona_id,
            personas,
            state,
            plan,
            step.choices,
            kernel,
            scenario.scenario_id,
        )
        actions.append(action)
        write_json(snapshots_dir / f"turn-{turn_index:02d}.json", {"turn_index": turn_index, "state": state})

    summary = RunTrace(
        run_id=resolved_run_id,
        scenario_id=scenario.scenario_id,
        seed=scenario.seed,
        turn_budget=scenario.turn_budget,
        executed_turns=len(actions),
        ledger_public_turn=state.get("ledger_public_turn"),
        budget_exposed_turn=state.get("budget_exposed_turn"),
        evacuation_turn=state.get("evacuation_turn"),
        final_state=deepcopy(state),
        action_count=len(actions),
        action_types=[action.action_type for action in actions],
        notes=notes,
    )

    write_jsonl(out_dir / "run_trace.jsonl", actions)
    write_json(out_dir / "summary.json", summary.model_dump())
    return summary, actions


def simulate_scenario(scenario_path: Path, graph_path: Path, personas_path: Path, out_dir: Path) -> RunTrace:
    scenario = load_scenario(scenario_path)
    plan = _load_plan_for_scenario(scenario_path, scenario)
    summary, _ = _simulate_loaded_scenario(
        scenario,
        scenario_path,
        plan,
        graph_path,
        personas_path,
        out_dir,
        decision_trace_path=out_dir / "decision_trace.jsonl",
    )
    return summary


def simulate_runtime_scenario(
    scenario: Scenario,
    *,
    scenario_path: Path,
    graph_path: Path,
    personas_path: Path,
    out_dir: Path,
    run_id: str,
    branch_id: str,
    label: str,
    notes_prefix: list[str] | None = None,
    decision_provider: str | None = None,
    decision_model_id: str | None = None,
) -> BranchRunArtifacts:
    plan = _load_plan_for_scenario(scenario_path, scenario)
    summary, actions = _simulate_loaded_scenario(
        scenario,
        scenario_path,
        plan,
        graph_path,
        personas_path,
        out_dir,
        run_id=run_id,
        notes_prefix=notes_prefix,
        decision_trace_path=out_dir.parent / "decision_trace.jsonl",
        decision_provider=decision_provider,
        decision_model_id=decision_model_id,
    )
    return BranchRunArtifacts(
        branch_id=branch_id,
        label=label,
        summary=summary,
        actions=actions,
        run_dir=out_dir,
    )


def _branch_label(injection_ids: tuple[str, ...]) -> str:
    if not injection_ids:
        return "Reference"
    if len(injection_ids) == 1:
        return f"Intervention: {injection_ids[0]}"
    return "Intervention mix: " + ", ".join(injection_ids)


def _branch_execution_plans(scenario: Scenario) -> list[BranchExecutionPlan]:
    available_index_sets = [()] + [
        combo
        for size in range(1, len(scenario.injections) + 1)
        for combo in combinations(range(len(scenario.injections)), size)
    ]

    if scenario.branch_count > len(available_index_sets):
        raise ValueError(
            f"Scenario {scenario.scenario_id} requests branch_count={scenario.branch_count}, "
            f"but only {len(available_index_sets)} deterministic injection subsets are available."
        )

    plans: list[BranchExecutionPlan] = []
    for combo in available_index_sets[: scenario.branch_count]:
        injection_ids = tuple(scenario.injections[index].injection_id for index in combo)
        branch_id = "branch_reference" if not injection_ids else f"branch_{slugify('__'.join(injection_ids))}"
        branch_scenario = scenario.model_copy(update={"injections": [scenario.injections[index] for index in combo]})
        plans.append(
            BranchExecutionPlan(
                branch_id=branch_id,
                label=_branch_label(injection_ids),
                scenario=branch_scenario,
                injection_ids=injection_ids,
            )
        )
    return plans


def _delta_value(reference: Any, candidate: Any) -> Any:
    if (
        isinstance(reference, (int, float))
        and isinstance(candidate, (int, float))
        and not isinstance(reference, bool)
        and not isinstance(candidate, bool)
    ):
        return candidate - reference
    return None


def _outcome_deltas(
    reference: RunTrace,
    candidate: RunTrace,
    tracked_outcomes: list[OutcomeDefinition],
) -> dict[str, CompareOutcomeDelta]:
    return {
        outcome.field: CompareOutcomeDelta(
            reference=_summary_outcome_value(reference, outcome.field),
            candidate=_summary_outcome_value(candidate, outcome.field),
            delta=_delta_value(
                _summary_outcome_value(reference, outcome.field),
                _summary_outcome_value(candidate, outcome.field),
            ),
        )
        for outcome in tracked_outcomes
    }


def _divergent_turns(reference_actions: list[TurnAction], candidate_actions: list[TurnAction]) -> list[CompareTurnDelta]:
    divergent_turns: list[CompareTurnDelta] = []
    for index in range(max(len(reference_actions), len(candidate_actions))):
        reference_action = reference_actions[index] if index < len(reference_actions) else None
        candidate_action = candidate_actions[index] if index < len(candidate_actions) else None
        if reference_action is None or candidate_action is None:
            divergent_turns.append(
                CompareTurnDelta(
                    turn_index=index + 1,
                    reference_turn_id=reference_action.turn_id if reference_action else None,
                    candidate_turn_id=candidate_action.turn_id if candidate_action else None,
                )
            )
            continue

        if (
            reference_action.actor_id != candidate_action.actor_id
            or reference_action.action_type != candidate_action.action_type
            or reference_action.target_id != candidate_action.target_id
        ):
            divergent_turns.append(
                CompareTurnDelta(
                    turn_index=index + 1,
                    reference_turn_id=reference_action.turn_id,
                    candidate_turn_id=candidate_action.turn_id,
                )
            )
    return divergent_turns


def write_compare_artifact(
    scope_root: Path,
    compare_dir: Path,
    *,
    scenario_id: str,
    seed: int,
    branch_runs: list[BranchRunArtifacts],
    reference_branch_id: str,
    tracked_outcomes: list[OutcomeDefinition],
) -> CompareArtifact:
    reference_branch = next((branch for branch in branch_runs if branch.branch_id == reference_branch_id), None)
    if reference_branch is None:
        raise ValueError(f"Missing reference branch {reference_branch_id} for compare artifact {scenario_id}.")

    compare = CompareArtifact(
        compare_id=f"compare_{slugify(scenario_id)}_{seed}",
        scenario_id=scenario_id,
        seed=seed,
        branch_count=len(branch_runs),
        reference_branch_id=reference_branch_id,
        branches=[
            CompareBranch(
                branch_id=branch.branch_id,
                label=branch.label,
                run_id=branch.summary.run_id,
                is_reference=branch.branch_id == reference_branch_id,
                summary_path=(branch.run_dir.relative_to(scope_root) / "summary.json").as_posix(),
                trace_path=(branch.run_dir.relative_to(scope_root) / "run_trace.jsonl").as_posix(),
                snapshot_dir=(branch.run_dir.relative_to(scope_root) / "snapshots").as_posix(),
            )
            for branch in branch_runs
        ],
        reference_deltas=[
            CompareBranchDelta(
                branch_id=branch.branch_id,
                divergent_turn_count=len(_divergent_turns(reference_branch.actions, branch.actions)),
                divergent_turns=_divergent_turns(reference_branch.actions, branch.actions),
                outcome_deltas=_outcome_deltas(reference_branch.summary, branch.summary, tracked_outcomes),
            )
            for branch in branch_runs
            if branch.branch_id != reference_branch_id
        ],
    )

    if compare_dir.exists():
        shutil.rmtree(compare_dir)
    write_json(compare_dir / "compare.json", compare.model_dump())
    return compare


def simulate_branching_scenario(
    scenario_path: Path,
    graph_path: Path,
    personas_path: Path,
    run_root: Path,
    scope_root: Path,
    *,
    compare_dir: Path | None = None,
) -> CompareArtifact:
    scenario = load_scenario(scenario_path)
    if scenario.branch_count <= 1:
        raise ValueError(f"Scenario {scenario.scenario_id} does not request multi-branch execution.")
    plan = _load_plan_for_scenario(scenario_path, scenario)

    branches_root = run_root / "branches"
    if branches_root.exists():
        shutil.rmtree(branches_root)
    ensure_dir(branches_root)

    branch_runs: list[BranchRunArtifacts] = []
    for branch_plan in _branch_execution_plans(scenario):
        branch_run_dir = branches_root / branch_plan.branch_id
        branch_notes = ["Branch injections: " + (", ".join(branch_plan.injection_ids) if branch_plan.injection_ids else "none")]
        summary, actions = _simulate_loaded_scenario(
            branch_plan.scenario,
            scenario_path,
            plan,
            graph_path,
            personas_path,
            branch_run_dir,
            run_id=f"run_{scenario.scenario_id}_{scenario.seed}_{branch_plan.branch_id}",
            notes_prefix=branch_notes,
            decision_trace_path=branch_run_dir / "decision_trace.jsonl",
        )
        branch_runs.append(
            BranchRunArtifacts(
                branch_id=branch_plan.branch_id,
                label=branch_plan.label,
                summary=summary,
                actions=actions,
                run_dir=branch_run_dir,
            )
        )

    resolved_compare_dir = compare_dir or (scope_root / "compare" / scenario.scenario_id)
    return write_compare_artifact(
        scope_root,
        resolved_compare_dir,
        scenario_id=scenario.scenario_id,
        seed=scenario.seed,
        branch_runs=branch_runs,
        reference_branch_id="branch_reference",
        tracked_outcomes=plan.tracked_outcomes,
    )
