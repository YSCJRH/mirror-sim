from __future__ import annotations

import json
from pathlib import Path


PHASE66_TITLE = "Phase 66 - Selected-World Generated Runtime Surface Continuity Gate"
PHASE66_CLOSEOUT_PR = "#506"
PHASE66_EXIT_ISSUE_NUMBER = "#501"
PHASE66_SYNC_ISSUE_NUMBER = "#502"
PHASE66_SMOKE_ISSUE_NUMBER = "#503"
PHASE67_GATE_PATH = Path(
    "docs/plans/phase-67-blueprint-calibration-minimum-loop-gate-2026-06-04.md"
)
PHASE67_TITLE = "Phase 67 - Blueprint Calibration and Minimum-Loop Value Gate"
PHASE67_EXIT_ISSUE_NUMBER = "#507"
PHASE67_SYNC_ISSUE_NUMBER = "#508"
PHASE67_AUDIT_ISSUE_NUMBER = "#509"
PHASE67_SYNC_ISSUE = (
    "Phase 67: sync repo truth after Phase 66 closeout and define blueprint "
    "calibration gate"
)
PHASE67_AUDIT_ISSUE = (
    "Phase 67: audit current minimum-loop value gaps before next implementation"
)
PHASE67_COMPARE_REPORT_ISSUE = (
    "Phase 67: align report and claims generation with compare-sourced branch truth"
)
PHASE67_COMPARE_REPORT_ISSUE_NUMBER = "#511"
MINIMUM_LOOP = (
    "corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> "
    "report/claims -> eval"
)
PHASE67_READY_STATUS = (
    "`audit-github-queue` reports `ready` for the active Phase 67 milestone"
)
PHASE66_STOP_STATUS = (
    "`audit-github-queue` reports `paused` with no active milestone after Phase 66 closeout"
)
PHASE67_DRIFT_STOP = (
    "Do not open another adjacent surface/readiness/fidelity/continuity gate as "
    "the primary Phase 67 scope without a source-backed tie to "
    "scenario/intervention/branch-comparison/eval value."
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase67_gate_doc_exists_with_required_sections() -> None:
    gate = _read(PHASE67_GATE_PATH)
    required_sections = [
        "# Phase 67 Blueprint Calibration and Minimum-Loop Value Gate",
        f"Issue: `{PHASE67_EXIT_ISSUE_NUMBER}` `Phase 67 exit gate`",
        "Current state: Phase 67 is active; Phase 66 is closed.",
        "## Post-Phase-66 Baseline",
        "## Phase 67 Active Queue",
        "## Blueprint Calibration Scope",
        "## Minimum-Loop Value Target",
        "## Candidate Input Policy",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase67_gate_binds_to_mirror_blueprint_without_surface_drift() -> None:
    gate = _read(PHASE67_GATE_PATH)
    required_phrases = [
        f"Phase 66 is closed as `{PHASE66_TITLE}`",
        f"`{PHASE66_EXIT_ISSUE_NUMBER}` `Phase 66 exit gate` closed by PR `{PHASE66_CLOSEOUT_PR}`",
        PHASE66_STOP_STATUS,
        PHASE67_TITLE,
        f"milestone `{PHASE67_TITLE}` is open",
        f"`{PHASE67_EXIT_ISSUE_NUMBER}` `Phase 67 exit gate`: open / blocked",
        f"`{PHASE67_SYNC_ISSUE_NUMBER}` `{PHASE67_SYNC_ISSUE}`: closed by PR `#510`",
        f"`{PHASE67_AUDIT_ISSUE_NUMBER}` `{PHASE67_AUDIT_ISSUE}`: open / ready",
        f"`{PHASE67_COMPARE_REPORT_ISSUE_NUMBER}` `{PHASE67_COMPARE_REPORT_ISSUE}`: open / ready",
        PHASE67_COMPARE_REPORT_ISSUE,
        "`docs/plans/phase-67-minimum-loop-value-gap-audit-2026-06-04.md`",
        "compare-sourced report/claims closure",
        PHASE67_READY_STATUS,
        "Mirror is a constrained, evidence-backed, replayable what-if simulation sandbox for fictional or explicitly authorized worlds.",
        f"`{MINIMUM_LOOP}`",
        "scenario/intervention/branch-comparison/eval value",
        "Phase 2 simulation/report closure",
        "Phase 3 eval/UI/demo value",
        "the automation loop remains an execution mechanism, not the project north star",
        "minimum-loop value gap audit",
        "If the audit finds a contract gap, split a separate protected-core contract issue before changing schema, scenario DSL, claim labels, run trace shape, or artifact layout.",
        "Every report claim must keep both `label` and `evidence_ids`.",
        "Uncertainty discovered during the audit must be written as `TODO[verify]: ...`.",
        "status:needs-adr",
        "risk:safety",
        PHASE67_DRIFT_STOP,
        "selected bounded fictional or explicitly authorized worlds",
        "real-world prediction",
        "real-person personas",
        "political persuasion",
        "high-risk decision systems",
    ]
    forbidden_phrases = [
        "Phase 67 selected-world generated runtime surface continuity",
        "Phase 67 should continue selected-world generated runtime surface continuity",
        "Phase 67 should continue selected-world review readiness",
        "Phase 67 selected-world review readiness",
        "Phase 67 promotes broad private-beta readiness",
        "Phase 67 claims future-world readiness",
        "Phase 67 implements async",
        "Phase 67 ratifies task_id",
        "Phase 67 adds workers",
        "Phase 67 implements launch hub",
        "Phase 67 calls provider or model paths",
        "Phase 67 adds Hosted GPT",
        "Phase 67 adds BYOK",
        "Phase 67 adds upload",
        "Phase 67 adds auth",
        "Phase 67 changes scenario DSL",
        "Phase 67 changes claim labels",
        "Phase 67 changes report claim `evidence_ids`",
        "Phase 67 changes artifact layout",
    ]

    for phrase in required_phrases:
        assert phrase in gate, f"Phase 67 gate is missing blueprint anchor: {phrase}"
    for phrase in forbidden_phrases:
        assert phrase not in gate, f"Phase 67 gate expands blocked scope: {phrase}"


def test_active_state_docs_record_phase67_blueprint_queue() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE67_GATE_PATH,
    ]
    required_phrases = [
        f"Phase 67 is active as `{PHASE67_TITLE}`",
        f"milestone `{PHASE67_TITLE}` is open",
        f"`{PHASE67_EXIT_ISSUE_NUMBER}` `Phase 67 exit gate`: open / blocked",
        f"`{PHASE67_SYNC_ISSUE_NUMBER}` `{PHASE67_SYNC_ISSUE}`: closed by PR `#510`",
        f"`{PHASE67_AUDIT_ISSUE_NUMBER}` `{PHASE67_AUDIT_ISSUE}`: open / ready",
        f"`{PHASE67_COMPARE_REPORT_ISSUE_NUMBER}` `{PHASE67_COMPARE_REPORT_ISSUE}`: open / ready",
        PHASE67_COMPARE_REPORT_ISSUE,
        "`docs/plans/phase-67-minimum-loop-value-gap-audit-2026-06-04.md`",
        "compare-sourced report/claims closure",
        PHASE67_READY_STATUS,
        f"Phase 66 is closed as `{PHASE66_TITLE}`",
        f"`{PHASE66_EXIT_ISSUE_NUMBER}` `Phase 66 exit gate` closed by PR `{PHASE66_CLOSEOUT_PR}`",
        f"`{PHASE66_SYNC_ISSUE_NUMBER}`",
        f"`{PHASE66_SMOKE_ISSUE_NUMBER}`",
        PHASE66_STOP_STATUS,
        f"`{MINIMUM_LOOP}`",
        "scenario/intervention/branch-comparison/eval value",
        "minimum-loop value gap audit",
        PHASE67_DRIFT_STOP,
        "`docs/plans/phase-67-blueprint-calibration-minimum-loop-gate-2026-06-04.md`",
    ]
    forbidden_phrases = [
        "Phase 67 selected-world generated runtime surface continuity",
        "Phase 67 should continue selected-world generated runtime surface continuity",
        "Phase 67 should continue selected-world review readiness",
        "Phase 67 selected-world review readiness",
        "Phase 67 promotes broad private-beta readiness",
        "Phase 67 claims future-world readiness",
        "Phase 67 implements async",
        "Phase 67 ratifies task_id",
        "Phase 67 adds workers",
        "Phase 67 implements launch hub",
        "Phase 67 calls provider or model paths",
        "Phase 67 adds Hosted GPT",
        "Phase 67 adds BYOK",
        "Phase 67 adds upload",
        "Phase 67 adds auth",
        "Phase 67 changes scenario DSL",
        "Phase 67 changes claim labels",
        "Phase 67 changes report claim `evidence_ids`",
        "Phase 67 changes artifact layout",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 67 blueprint wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 67 scope: {phrase}"


def test_bootstrap_spec_records_phase67_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": PHASE67_TITLE,
        "description": (
            "Recalibrate Mirror's active queue against mirror.md by mapping current "
            "repo truth to the minimum loop from corpus through eval, identifying the "
            "next value-bearing scenario/intervention/branch-comparison/eval gap, "
            "and blocking adjacent surface/readiness gates unless they resolve a named "
            "blueprint or protected-core contract blocker."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:67",
        "color": "C8E6C9",
        "description": "Phase 67 blueprint calibration and minimum-loop value work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 67 exit gate",
        PHASE67_SYNC_ISSUE,
        PHASE67_AUDIT_ISSUE,
    ]:
        assert title in titles
        assert titles[title]["milestone"] == PHASE67_TITLE
        assert "phase:67" in titles[title]["labels"]
        assert "lane:protected-core" in titles[title]["labels"]
        assert f"`{MINIMUM_LOOP}`" in titles[title]["body"]
        assert "scenario/intervention/branch-comparison/eval value" in titles[title]["body"]
        assert "real-world prediction, real-person personas, political or high-risk decision systems" in titles[title]["body"]

    assert "status:blocked" in titles["Phase 67 exit gate"]["labels"]
    assert "status:ready" in titles[PHASE67_SYNC_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE67_AUDIT_ISSUE]["labels"]
    assert "risk:core-contract" in titles[PHASE67_SYNC_ISSUE]["labels"]
    assert "risk:core-contract" in titles[PHASE67_AUDIT_ISSUE]["labels"]
    assert "docs, bootstrap metadata, and tests" in titles[PHASE67_SYNC_ISSUE]["body"]
    assert "minimum-loop value gap audit" in titles[PHASE67_AUDIT_ISSUE]["body"]
