from __future__ import annotations

from pathlib import Path

from backend.app.decision_kernel import DecisionKernel
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
