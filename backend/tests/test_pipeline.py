from __future__ import annotations

import backend.app.evals.service as evals_service
from backend.app.world_query import inspect_world
from pathlib import Path

from backend.app.config import get_settings
from backend.app.evals.service import evaluate_runs, run_phase0_demo
from backend.app.graph.service import build_graph
from backend.app.ingest.service import ingest_manifest
from backend.app.personas.service import build_personas
from backend.app.reports.service import generate_report
from backend.app.scenarios.service import validate_scenario
from backend.app.simulation.service import simulate_scenario


def test_ingest_writes_documents_and_chunks(tmp_path: Path) -> None:
    settings = get_settings()
    documents, chunks = ingest_manifest(settings.manifest_path, tmp_path / "ingest")
    assert len(documents) == 6
    assert len(chunks) >= 12
    assert (tmp_path / "ingest" / "documents.jsonl").exists()
    assert (tmp_path / "ingest" / "chunks.jsonl").exists()


def test_graph_and_personas_have_evidence(tmp_path: Path) -> None:
    settings = get_settings()
    ingest_manifest(settings.manifest_path, tmp_path / "ingest")
    graph = build_graph(tmp_path / "ingest" / "chunks.jsonl", tmp_path / "graph")
    personas = build_personas(tmp_path / "graph" / "graph.json", tmp_path / "personas")
    assert graph["stats"]["relation_count"] >= 4
    assert graph["stats"]["event_count"] >= 4
    assert graph["events"]
    assert all(persona.evidence_ids for persona in personas)
    assert all(persona.field_provenance["public_role"] for persona in personas)
    assert all(persona.field_provenance["relationships"] for persona in personas)


def test_graph_contains_canonical_demo_ids(tmp_path: Path) -> None:
    settings = get_settings()
    ingest_manifest(settings.manifest_path, tmp_path / "ingest")
    graph = build_graph(tmp_path / "ingest" / "chunks.jsonl", tmp_path / "graph")

    entity_ids = {item["entity_id"] for item in graph["entities"]}
    relation_ids = {item["relation_id"] for item in graph["relations"]}
    event_ids = {item["event_id"] for item in graph["events"]}

    assert {
        "entity_lin_lan",
        "entity_zhao_ke",
        "entity_su_he",
        "entity_chen_yu",
        "entity_east_gate",
        "entity_maintenance_ledger",
        "entity_sea_lantern_festival",
        "entity_east_wharf",
    }.issubset(entity_ids)
    assert {
        "relation_lin_lan_controls_ledger",
        "relation_su_he_inspects_gate",
        "relation_zhao_ke_protects_festival",
        "relation_chen_yu_tracks_gate",
    }.issubset(relation_ids)
    assert {
        "event_budget_diversion",
        "event_gate_failure_risk",
        "event_dispatch_breakdown",
        "event_storm_surge_warning",
    }.issubset(event_ids)


def test_world_query_returns_evidence_backed_objects(tmp_path: Path) -> None:
    settings = get_settings()
    ingest_manifest(settings.manifest_path, tmp_path / "ingest")
    build_graph(tmp_path / "ingest" / "chunks.jsonl", tmp_path / "graph")
    build_personas(tmp_path / "graph" / "graph.json", tmp_path / "personas")
    entity = inspect_world("entity", "entity_east_gate", tmp_path / "graph" / "graph.json", tmp_path / "personas" / "personas.json")
    persona = inspect_world("persona", "persona_su_he", tmp_path / "graph" / "graph.json", tmp_path / "personas" / "personas.json")
    event = inspect_world("event", "event_gate_failure_risk", tmp_path / "graph" / "graph.json", tmp_path / "personas" / "personas.json")
    assert entity["object"]["evidence_ids"]
    assert persona["object"]["field_provenance"]["known_facts"]
    assert event["object"]["participant_entity_ids"]


def test_scenario_validation_and_simulation_are_deterministic(tmp_path: Path) -> None:
    settings = get_settings()
    ingest_manifest(settings.manifest_path, tmp_path / "ingest")
    build_graph(tmp_path / "ingest" / "chunks.jsonl", tmp_path / "graph")
    build_personas(tmp_path / "graph" / "graph.json", tmp_path / "personas")
    scenario = validate_scenario(settings.intervention_scenario_path, tmp_path / "scenario" / "reporter_detained.json")
    first = simulate_scenario(
        settings.intervention_scenario_path,
        tmp_path / "graph" / "graph.json",
        tmp_path / "personas" / "personas.json",
        tmp_path / "run1",
    )
    second = simulate_scenario(
        settings.intervention_scenario_path,
        tmp_path / "graph" / "graph.json",
        tmp_path / "personas" / "personas.json",
        tmp_path / "run2",
    )
    assert scenario.scenario_id == "scenario_reporter_detained"
    assert first.model_dump() == second.model_dump()


def test_report_contains_labeled_claims(tmp_path: Path) -> None:
    settings = get_settings()
    ingest_manifest(settings.manifest_path, tmp_path / "ingest")
    build_graph(tmp_path / "ingest" / "chunks.jsonl", tmp_path / "graph")
    build_personas(tmp_path / "graph" / "graph.json", tmp_path / "personas")
    simulate_scenario(
        settings.baseline_scenario_path,
        tmp_path / "graph" / "graph.json",
        tmp_path / "personas" / "personas.json",
        tmp_path / "run" / "baseline",
    )
    simulate_scenario(
        settings.intervention_scenario_path,
        tmp_path / "graph" / "graph.json",
        tmp_path / "personas" / "personas.json",
        tmp_path / "run" / "reporter_detained",
    )
    claims = generate_report(tmp_path / "run" / "reporter_detained", tmp_path / "report", baseline_dir=tmp_path / "run" / "baseline")
    assert len(claims) == 3
    assert all(claim.label for claim in claims)
    assert all(claim.evidence_ids for claim in claims)


def test_eval_demo_passes(tmp_path: Path) -> None:
    settings = get_settings()
    result = run_phase0_demo(settings=settings, artifacts_root=tmp_path / "demo")
    assert result.status == "pass"
    assert result.metrics["scenario_count"] == 4
    assert result.metrics["event_count"] >= 4
    assert result.metrics["reporter_detained_evacuation_turn"] > result.metrics["baseline_evacuation_turn"]
    assert result.metrics["harbor_comms_failure_evacuation_turn"] > result.metrics["baseline_evacuation_turn"]
    assert result.metrics["mayor_signal_blocked_evacuation_turn"] == result.metrics["baseline_evacuation_turn"]


def test_eval_demo_writes_canonical_scenario_matrix(tmp_path: Path) -> None:
    settings = get_settings()
    artifacts_root = tmp_path / "demo"
    run_phase0_demo(settings=settings, artifacts_root=artifacts_root)

    for stem in ("baseline", "reporter_detained", "harbor_comms_failure", "mayor_signal_blocked"):
        assert (artifacts_root / "scenario" / f"{stem}.json").exists()
        assert (artifacts_root / "run" / stem / "summary.json").exists()
        assert (artifacts_root / "run" / stem / "run_trace.jsonl").exists()


def test_eval_redlines_cover_query_outputs(tmp_path: Path, monkeypatch) -> None:
    settings = get_settings()
    artifacts_root = tmp_path / "demo"
    baseline = run_phase0_demo(settings=settings, artifacts_root=artifacts_root)
    assert baseline.status == "pass"

    original_inspect_world = evals_service.inspect_world

    def patched_inspect_world(kind: str, object_id: str, graph_path: Path, personas_path: Path) -> dict:
        payload = original_inspect_world(kind, object_id, graph_path, personas_path)
        if kind == "persona":
            payload["object"]["unsafe_note"] = "This system proves the real world will comply."
        return payload

    monkeypatch.setattr(evals_service, "inspect_world", patched_inspect_world)
    result = evaluate_runs(
        settings.expectations_path,
        artifacts_root,
        artifacts_root / "eval-redline-query",
        settings.redlines_path,
    )
    assert result.status == "fail"
    assert any("redlines[query_persona_su_he]" in failure for failure in result.failures)
