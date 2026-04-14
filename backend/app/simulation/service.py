from __future__ import annotations

from pathlib import Path
from typing import Any

from backend.app.domain.models import Persona, RunTrace, Scenario, TurnAction
from backend.app.scenarios.service import load_scenario
from backend.app.utils import ensure_dir, read_json, write_json, write_jsonl


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


def _load_personas(path: Path) -> dict[str, Persona]:
    payload = read_json(path)
    return {item["persona_id"]: Persona.model_validate(item) for item in payload["personas"]}


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


def simulate_scenario(scenario_path: Path, graph_path: Path, personas_path: Path, out_dir: Path) -> RunTrace:
    _ = read_json(graph_path)
    scenario = load_scenario(scenario_path)
    personas = _load_personas(personas_path)
    run_id = f"run_{scenario.scenario_id}_{scenario.seed}"
    notes = [f"Deterministic Phase 0 run for {scenario.scenario_id}."]
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
        action = _action_for_turn(turn_index, run_id, persona_id, personas, state)
        actions.append(action)
        write_json(snapshots_dir / f"turn-{turn_index:02d}.json", {"turn_index": turn_index, "state": state})

    summary = RunTrace(
        run_id=run_id,
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
    return summary
