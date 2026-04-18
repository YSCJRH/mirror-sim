from __future__ import annotations

import shutil
from dataclasses import dataclass
from itertools import combinations
from pathlib import Path
from typing import Any

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
from backend.app.scenarios.service import load_scenario
from backend.app.utils import ensure_dir, read_json, read_jsonl, slugify, write_json, write_jsonl


TURN_SEQUENCE = [
    "persona_su_he",
    "persona_chen_yu",
    "persona_lin_lan",
    "persona_su_he",
    "persona_zhao_ke",
    "persona_lin_lan",
    "persona_su_he",
    "persona_zhao_ke",
]

OUTCOME_DELTA_FIELDS = (
    "ledger_public_turn",
    "budget_exposed_turn",
    "evacuation_turn",
    "festival_status",
    "budget_exposed",
    "ledger_public",
    "evacuation_triggered",
    "risk_known_by",
)


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


def _apply_injections(scenario: Scenario, state: dict[str, Any], notes: list[str]) -> None:
    for injection in scenario.injections:
        if injection.kind == "delay_document":
            delay_turns = int(injection.params.get("delay_turns", 0))
            state["ledger_available_turn"] += delay_turns
            notes.append(f"{injection.injection_id}: ledger availability delayed by {delay_turns} turn(s).")
        elif injection.kind == "resource_failure":
            outage_turns = int(injection.params.get("duration_turns", 1))
            state["communications_down_until"] = max(state["communications_down_until"], outage_turns)
            notes.append(f"{injection.injection_id}: communications degraded for {outage_turns} turn(s).")
        elif injection.kind == "block_contact":
            state["blocked_contacts"].append((injection.actor_id, injection.target_id))
            notes.append(f"{injection.injection_id}: contact blocked between {injection.actor_id} and {injection.target_id}.")


def _supports_communication(state: dict[str, Any], turn_index: int, actor_id: str, target_id: str | None) -> bool:
    if turn_index <= state["communications_down_until"]:
        return False
    if target_id is None:
        return True
    return (actor_id, target_id) not in state["blocked_contacts"]


def _persona_evidence(personas: dict[str, Persona], persona_id: str) -> list[str]:
    return personas[persona_id].evidence_ids[:3]


def _state_patch(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in after.items() if before.get(key) != value}


def _action_for_turn(
    turn_index: int,
    run_id: str,
    persona_id: str,
    personas: dict[str, Persona],
    state: dict[str, Any],
) -> TurnAction:
    evidence_ids = _persona_evidence(personas, persona_id)
    actor_entity = personas[persona_id].entity_id
    before = dict(state)

    if turn_index == 1:
        state["risk_known_by"] = sorted({*state["risk_known_by"], actor_entity})
        action = TurnAction(
            turn_id=f"{run_id}_turn_{turn_index:02d}",
            run_id=run_id,
            turn_index=turn_index,
            actor_id=persona_id,
            action_type="inspect",
            target_id="entity_east_gate",
            rationale="Su He inspects the gate because the fracture is already widening under storm pressure.",
            evidence_ids=evidence_ids,
            state_patch={},
        )
    elif turn_index == 2:
        target_id = "persona_zhao_ke"
        if _supports_communication(state, turn_index, persona_id, target_id):
            state["risk_known_by"] = sorted({*state["risk_known_by"], actor_entity})
            state["mayor_alerted"] = True
            action_type = "inform"
            rationale = "Chen Yu escalates the tide anomaly toward the deputy mayor."
        else:
            state["communications_status"] = "degraded"
            action_type = "delay"
            rationale = "The harbor warning is delayed by a communication problem."
        action = TurnAction(
            turn_id=f"{run_id}_turn_{turn_index:02d}",
            run_id=run_id,
            turn_index=turn_index,
            actor_id=persona_id,
            action_type=action_type,
            target_id=target_id,
            rationale=rationale,
            evidence_ids=evidence_ids,
            state_patch={},
        )
    elif turn_index == 3:
        can_publish = turn_index >= state["ledger_available_turn"] and _supports_communication(
            state, turn_index, persona_id, "entity_maintenance_ledger"
        )
        if can_publish:
            state["ledger_public"] = True
            state["ledger_public_turn"] = turn_index
            state["budget_exposed"] = True
            state["budget_exposed_turn"] = turn_index
            action_type = "publish"
            rationale = "Lin Lan publishes the copied ledger into the decision loop."
        else:
            action_type = "delay"
            rationale = "Lin Lan cannot surface the ledger yet and holds position."
        action = TurnAction(
            turn_id=f"{run_id}_turn_{turn_index:02d}",
            run_id=run_id,
            turn_index=turn_index,
            actor_id=persona_id,
            action_type=action_type,
            target_id="entity_maintenance_ledger",
            rationale=rationale,
            evidence_ids=evidence_ids,
            state_patch={},
        )
    elif turn_index == 4:
        if state["ledger_public"]:
            state["evacuation_requested"] = True
            target_id = "entity_east_wharf"
            rationale = "Su He requests evacuation once the engineering risk and budget diversion align."
        else:
            state["repair_request_reissued"] = True
            target_id = "entity_maintenance_ledger"
            rationale = "Su He renews the repair request while waiting for documentary proof."
        action = TurnAction(
            turn_id=f"{run_id}_turn_{turn_index:02d}",
            run_id=run_id,
            turn_index=turn_index,
            actor_id=persona_id,
            action_type="request",
            target_id=target_id,
            rationale=rationale,
            evidence_ids=evidence_ids,
            state_patch={},
        )
    elif turn_index == 5:
        if state["evacuation_requested"]:
            state["evacuation_triggered"] = True
            state["evacuation_turn"] = turn_index
            state["festival_status"] = "suspended"
            action_type = "evacuate"
            rationale = "Zhao Ke authorizes evacuation once the combined pressure is too visible to ignore."
        else:
            state["festival_status"] = "scheduled"
            action_type = "hide"
            rationale = "Zhao Ke suppresses disruption and keeps the festival plan intact."
        action = TurnAction(
            turn_id=f"{run_id}_turn_{turn_index:02d}",
            run_id=run_id,
            turn_index=turn_index,
            actor_id=persona_id,
            action_type=action_type,
            target_id="entity_sea_lantern_festival",
            rationale=rationale,
            evidence_ids=evidence_ids,
            state_patch={},
        )
    elif turn_index == 6:
        can_publish = not state["ledger_public"] and turn_index >= state["ledger_available_turn"] and _supports_communication(
            state, turn_index, persona_id, "entity_maintenance_ledger"
        )
        if can_publish:
            state["ledger_public"] = True
            state["ledger_public_turn"] = turn_index
            state["budget_exposed"] = True
            state["budget_exposed_turn"] = turn_index
            action_type = "publish"
            target_id = "entity_maintenance_ledger"
            rationale = "Lin Lan finally surfaces the copied ledger after the disruption clears."
        else:
            state["public_pressure"] = "mounting"
            action_type = "inform"
            target_id = "persona_su_he"
            rationale = "Lin Lan keeps the archive evidence circulating among trusted allies."
        action = TurnAction(
            turn_id=f"{run_id}_turn_{turn_index:02d}",
            run_id=run_id,
            turn_index=turn_index,
            actor_id=persona_id,
            action_type=action_type,
            target_id=target_id,
            rationale=rationale,
            evidence_ids=evidence_ids,
            state_patch={},
        )
    elif turn_index == 7:
        if state["budget_exposed"] and not state["evacuation_requested"]:
            state["evacuation_requested"] = True
            action_type = "request"
            target_id = "entity_east_wharf"
            rationale = "Su He renews the evacuation request once the ledger becomes public."
        else:
            action_type = "inspect"
            target_id = "entity_east_gate"
            rationale = "Su He monitors the gate while waiting for the mayor's order to take effect."
        action = TurnAction(
            turn_id=f"{run_id}_turn_{turn_index:02d}",
            run_id=run_id,
            turn_index=turn_index,
            actor_id=persona_id,
            action_type=action_type,
            target_id=target_id,
            rationale=rationale,
            evidence_ids=evidence_ids,
            state_patch={},
        )
    else:
        if state["evacuation_requested"] and not state["evacuation_triggered"]:
            state["evacuation_triggered"] = True
            state["evacuation_turn"] = turn_index
            state["festival_status"] = "suspended"
            action_type = "evacuate"
            rationale = "Zhao Ke orders evacuation at the last viable moment in this branch."
        else:
            state["command_post"] = "harbor_square"
            action_type = "move"
            rationale = "Zhao Ke repositions to manage the festival command post."
        action = TurnAction(
            turn_id=f"{run_id}_turn_{turn_index:02d}",
            run_id=run_id,
            turn_index=turn_index,
            actor_id=persona_id,
            action_type=action_type,
            target_id="entity_east_wharf",
            rationale=rationale,
            evidence_ids=evidence_ids,
            state_patch={},
        )

    action.state_patch = _state_patch(before, state)
    return action


def _simulate_loaded_scenario(
    scenario: Scenario,
    graph_path: Path,
    personas_path: Path,
    out_dir: Path,
    *,
    run_id: str | None = None,
    notes_prefix: list[str] | None = None,
) -> tuple[RunTrace, list[TurnAction]]:
    _ = read_json(graph_path)
    personas = _load_personas(personas_path)
    resolved_run_id = run_id or f"run_{scenario.scenario_id}_{scenario.seed}"
    notes = [f"Deterministic Phase 0 run for {scenario.scenario_id}.", *(notes_prefix or [])]
    state: dict[str, Any] = {
        "east_gate_status": "fractured",
        "festival_status": "scheduled",
        "risk_known_by": [],
        "budget_exposed": False,
        "budget_exposed_turn": None,
        "ledger_public": False,
        "ledger_public_turn": None,
        "ledger_available_turn": 3,
        "evacuation_requested": False,
        "evacuation_triggered": False,
        "evacuation_turn": None,
        "communications_status": "stable",
        "communications_down_until": 0,
        "blocked_contacts": [],
        "mayor_alerted": False,
        "storm_arrival_turn": scenario.turn_budget,
    }
    _apply_injections(scenario, state, notes)

    snapshots_dir = ensure_dir(out_dir / "snapshots")
    for existing in snapshots_dir.glob("*.json"):
        existing.unlink()

    actions: list[TurnAction] = []
    for turn_index in range(1, scenario.turn_budget + 1):
        persona_id = TURN_SEQUENCE[turn_index - 1]
        action = _action_for_turn(turn_index, resolved_run_id, persona_id, personas, state)
        actions.append(action)
        write_json(snapshots_dir / f"turn-{turn_index:02d}.json", {"turn_index": turn_index, "state": state})

    summary = RunTrace(
        run_id=resolved_run_id,
        scenario_id=scenario.scenario_id,
        seed=scenario.seed,
        turn_budget=scenario.turn_budget,
        executed_turns=len(actions),
        ledger_public_turn=state["ledger_public_turn"],
        budget_exposed_turn=state["budget_exposed_turn"],
        evacuation_turn=state["evacuation_turn"],
        final_state={
            "east_gate_status": state["east_gate_status"],
            "festival_status": state["festival_status"],
            "budget_exposed": state["budget_exposed"],
            "ledger_public": state["ledger_public"],
            "evacuation_triggered": state["evacuation_triggered"],
            "risk_known_by": state["risk_known_by"],
        },
        action_count=len(actions),
        action_types=[action.action_type for action in actions],
        notes=notes,
    )

    write_jsonl(out_dir / "run_trace.jsonl", actions)
    write_json(out_dir / "summary.json", summary.model_dump())
    return summary, actions


def simulate_scenario(scenario_path: Path, graph_path: Path, personas_path: Path, out_dir: Path) -> RunTrace:
    scenario = load_scenario(scenario_path)
    summary, _ = _simulate_loaded_scenario(scenario, graph_path, personas_path, out_dir)
    return summary


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
        branch_scenario = scenario.model_copy(
            update={"injections": [scenario.injections[index] for index in combo]}
        )
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


def _outcome_deltas(reference: RunTrace, candidate: RunTrace) -> dict[str, CompareOutcomeDelta]:
    reference_values = {
        "ledger_public_turn": reference.ledger_public_turn,
        "budget_exposed_turn": reference.budget_exposed_turn,
        "evacuation_turn": reference.evacuation_turn,
        **{field: reference.final_state.get(field) for field in OUTCOME_DELTA_FIELDS if field in reference.final_state},
    }
    candidate_values = {
        "ledger_public_turn": candidate.ledger_public_turn,
        "budget_exposed_turn": candidate.budget_exposed_turn,
        "evacuation_turn": candidate.evacuation_turn,
        **{field: candidate.final_state.get(field) for field in OUTCOME_DELTA_FIELDS if field in candidate.final_state},
    }
    outcome_keys = sorted(set(reference_values) | set(candidate_values))
    return {
        key: CompareOutcomeDelta(
            reference=reference_values.get(key),
            candidate=candidate_values.get(key),
            delta=_delta_value(reference_values.get(key), candidate_values.get(key)),
        )
        for key in outcome_keys
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
                outcome_deltas=_outcome_deltas(reference_branch.summary, branch.summary),
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

    branches_root = run_root / "branches"
    if branches_root.exists():
        shutil.rmtree(branches_root)
    ensure_dir(branches_root)

    branch_runs: list[BranchRunArtifacts] = []
    for plan in _branch_execution_plans(scenario):
        branch_run_dir = branches_root / plan.branch_id
        branch_notes = [
            "Branch injections: " + (", ".join(plan.injection_ids) if plan.injection_ids else "none")
        ]
        summary, actions = _simulate_loaded_scenario(
            plan.scenario,
            graph_path,
            personas_path,
            branch_run_dir,
            run_id=f"run_{scenario.scenario_id}_{scenario.seed}_{plan.branch_id}",
            notes_prefix=branch_notes,
        )
        branch_runs.append(
            BranchRunArtifacts(
                branch_id=plan.branch_id,
                label=plan.label,
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
    )
