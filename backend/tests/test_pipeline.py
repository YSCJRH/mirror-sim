from __future__ import annotations

from pathlib import Path

from backend.app.config import get_settings
from backend.app.evals.service import run_phase0_demo
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
    assert all(persona.evidence_ids for persona in personas)


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
