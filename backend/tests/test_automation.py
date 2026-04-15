from __future__ import annotations

from pathlib import Path

from backend.app.automation.service import classify_paths, run_phase_audit
from backend.app.config import get_settings
from backend.app.evals.service import run_phase0_demo


def test_classify_paths_marks_protected_core_changes() -> None:
    decision = classify_paths(["backend/app/simulation/service.py", "README.md"])
    assert decision.lane == "lane:protected-core"
    assert "risk:core-contract" in decision.labels
    assert "backend/app/simulation/service.py" in decision.protected_hits


def test_classify_paths_marks_safe_lane_changes() -> None:
    decision = classify_paths(["README.md", ".github/pull_request_template.md"])
    assert decision.lane == "lane:auto-safe"
    assert decision.protected_hits == []


def test_phase1_and_phase2_audit_pass_with_demo_artifacts(tmp_path: Path) -> None:
    settings = get_settings()
    run_phase0_demo(settings=settings, artifacts_root=tmp_path / "demo")
    phase1 = run_phase_audit("phase1", settings=settings, artifacts_root=tmp_path / "demo")
    phase2 = run_phase_audit("phase2", settings=settings, artifacts_root=tmp_path / "demo")
    assert phase1.status == "pass"
    assert phase2.status == "pass"


def test_phase3_audit_passes_with_current_workbench_contract(tmp_path: Path) -> None:
    settings = get_settings()
    run_phase0_demo(settings=settings, artifacts_root=tmp_path / "demo")
    phase3 = run_phase_audit("phase3", settings=settings, artifacts_root=tmp_path / "demo")
    assert phase3.status == "pass"
