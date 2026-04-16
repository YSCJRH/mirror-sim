from __future__ import annotations

from pathlib import Path

from backend.app.automation.service import audit_github_queue, classify_paths, run_phase_audit
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


def test_classify_paths_marks_bootstrap_and_automation_changes_protected() -> None:
    decision = classify_paths(
        [
            ".github/automation/bootstrap-spec.json",
            ".github/ISSUE_TEMPLATE/work-item.yml",
            "backend/app/automation/service.py",
            "scripts/bootstrap_github.py",
        ]
    )
    assert decision.lane == "lane:protected-core"
    assert sorted(decision.protected_hits) == [
        ".github/ISSUE_TEMPLATE/work-item.yml",
        ".github/automation/bootstrap-spec.json",
        "backend/app/automation/service.py",
        "scripts/bootstrap_github.py",
    ]


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


def test_audit_github_queue_pauses_without_open_milestone(monkeypatch) -> None:
    def fake_gh_json(args: list[str], *, repo_root=None):
        assert "milestones?state=open" in args[1]
        return []

    monkeypatch.setattr("backend.app.automation.service._gh_json", fake_gh_json)
    audit = audit_github_queue("YSCJRH/mirror-sim")
    assert audit.status == "paused"
    assert audit.active_milestone is None


def test_audit_github_queue_ready_with_single_milestone_and_ready_issue(monkeypatch) -> None:
    milestone_number = 5
    milestone_title = "Current Active Queue"
    exit_gate_title = "Current exit gate"
    ready_title = "Current ready work item"

    def fake_gh_json(args: list[str], *, repo_root=None):
        if "milestones?state=open" in args[1]:
            return [{"number": milestone_number, "title": milestone_title}]
        if f"issues?state=open&milestone={milestone_number}" in args[1]:
            return [
                {
                    "title": exit_gate_title,
                    "labels": [
                        {"name": "lane:protected-core"},
                        {"name": "status:blocked"},
                    ],
                },
                {
                    "title": ready_title,
                    "labels": [
                        {"name": "status:ready"},
                        {"name": "lane:auto-safe"},
                    ],
                },
            ]
        raise AssertionError(f"unexpected gh args: {args}")

    monkeypatch.setattr("backend.app.automation.service._gh_json", fake_gh_json)
    audit = audit_github_queue("YSCJRH/mirror-sim")
    assert audit.status == "ready"
    assert audit.active_milestone == milestone_title


def test_audit_github_queue_fails_with_multiple_open_milestones(monkeypatch) -> None:
    def fake_gh_json(args: list[str], *, repo_root=None):
        assert "milestones?state=open" in args[1]
        return [
            {"number": 4, "title": "Active Queue A"},
            {"number": 5, "title": "Active Queue B"},
        ]

    monkeypatch.setattr("backend.app.automation.service._gh_json", fake_gh_json)
    audit = audit_github_queue("YSCJRH/mirror-sim")
    assert audit.status == "fail"
