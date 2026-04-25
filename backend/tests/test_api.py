from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.config import Settings, get_settings
from backend.app.evals.service import run_phase0_demo
import backend.app.main as main_module
from backend.app.main import app


def test_healthz_endpoint() -> None:
    client = TestClient(app)
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "mirror-engine", "version": "0.1.0"}


def test_demo_report_endpoint_reflects_artifact_state(tmp_path: Path, monkeypatch) -> None:
    settings = get_settings()
    run_phase0_demo(settings=settings, artifacts_root=tmp_path / "demo")
    patched_settings = Settings(
        repo_root=settings.repo_root,
        world_id=settings.world_id,
        data_root=settings.data_root,
        artifacts_root=tmp_path / "demo",
        manifest_path=settings.manifest_path,
        world_model_path=settings.world_model_path,
        decision_schema_path=settings.decision_schema_path,
        simulation_rules_path=settings.simulation_rules_path,
        scenario_dir=settings.scenario_dir,
        baseline_scenario_path=settings.baseline_scenario_path,
        intervention_scenario_path=settings.intervention_scenario_path,
        expectations_path=settings.expectations_path,
        redlines_path=settings.redlines_path,
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: patched_settings)

    client = TestClient(app)
    response = client.get("/demo/report")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["artifact_id"] == "demo.report"
    assert "report_path" not in payload
    assert "content" in payload

    ready_response = client.get("/readyz")
    assert ready_response.status_code == 200
    ready_payload = ready_response.json()
    assert ready_payload["status"] == "ready"
    assert all("id" in artifact and "status" in artifact for artifact in ready_payload["artifacts"])

    manifest_response = client.get("/public-demo/manifest")
    assert manifest_response.status_code == 200
    manifest_payload = manifest_response.json()
    assert manifest_payload["mode"] == "deterministic-only"
    assert {artifact["id"] for artifact in manifest_payload["artifacts"]} >= {
        "demo.report",
        "demo.claims",
        "demo.eval_summary",
        "demo.compare",
        "demo.documents",
        "demo.chunks",
        "demo.graph",
        "demo.rubric",
    }

    eval_response = client.get("/public-demo/artifacts/demo.eval_summary")
    assert eval_response.status_code == 200
    assert "artifact_paths" not in eval_response.text

    compare_response = client.get("/public-demo/artifacts/demo.compare")
    assert compare_response.status_code == 200
    assert "summary_path" not in compare_response.text
    assert "trace_path" not in compare_response.text
    assert "snapshot_dir" not in compare_response.text

    documents_response = client.get("/public-demo/artifacts/demo.documents")
    assert documents_response.status_code == 200
    assert "source_path" not in documents_response.text

    missing_response = client.get("/public-demo/artifacts/not-allowlisted")
    assert missing_response.status_code == 404

    rubric_response = client.get("/public-demo/artifacts/demo.rubric")
    assert rubric_response.status_code == 200
    assert rubric_response.json()["kind"] == "text"


def test_readyz_returns_503_when_demo_artifacts_missing(tmp_path: Path, monkeypatch) -> None:
    settings = get_settings()
    patched_settings = Settings(
        repo_root=settings.repo_root,
        world_id=settings.world_id,
        data_root=settings.data_root,
        artifacts_root=tmp_path / "missing-demo",
        manifest_path=settings.manifest_path,
        world_model_path=settings.world_model_path,
        decision_schema_path=settings.decision_schema_path,
        simulation_rules_path=settings.simulation_rules_path,
        scenario_dir=settings.scenario_dir,
        baseline_scenario_path=settings.baseline_scenario_path,
        intervention_scenario_path=settings.intervention_scenario_path,
        expectations_path=settings.expectations_path,
        redlines_path=settings.redlines_path,
    )
    monkeypatch.setattr(main_module, "get_settings", lambda: patched_settings)

    client = TestClient(app)
    response = client.get("/readyz")
    assert response.status_code == 503
    payload = response.json()
    assert payload["status"] == "degraded"
    assert any(artifact["status"] == "missing" for artifact in payload["artifacts"])
