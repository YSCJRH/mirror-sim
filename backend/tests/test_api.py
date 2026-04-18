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
    assert response.json() == {"status": "ok", "phase": "phase-0"}


def test_demo_report_endpoint_reflects_artifact_state(tmp_path: Path, monkeypatch) -> None:
    settings = get_settings()
    run_phase0_demo(settings=settings, artifacts_root=tmp_path / "demo")
    patched_settings = Settings(
        repo_root=settings.repo_root,
        data_root=settings.data_root,
        artifacts_root=tmp_path / "demo",
        manifest_path=settings.manifest_path,
        world_model_path=settings.world_model_path,
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
    assert payload["report_path"].endswith("report.md")
