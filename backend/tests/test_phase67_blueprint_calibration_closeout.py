from __future__ import annotations

from pathlib import Path


PHASE67_CLOSEOUT_PATH = Path(
    "docs/plans/phase-67-blueprint-calibration-minimum-loop-closeout-2026-06-08.md"
)
PHASE67_TITLE = "Phase 67 - Blueprint Calibration and Minimum-Loop Value Gate"
PHASE67_EXIT_ISSUE = "#507"
PHASE67_SYNC_ISSUE = "#508"
PHASE67_AUDIT_ISSUE = "#509"
PHASE67_COMPARE_REPORT_ISSUE = "#511"
PHASE67_SYNC_PR = "#510"
PHASE67_AUDIT_PR = "#512"
PHASE67_COMPARE_REPORT_PR = "#513"
PHASE67_CLOSEOUT_PR = "#514"
MINIMUM_LOOP = (
    "corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> "
    "report/claims -> eval"
)
PHASE67_STOP_STATE = (
    "`audit-github-queue` reports `paused` with no active milestone after Phase 67 closeout"
)
PHASE67_DRIFT_STOP = (
    "Do not open another adjacent surface/readiness/fidelity/continuity gate as "
    "the primary successor scope without a source-backed tie to "
    "scenario/intervention/branch-comparison/eval value."
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase67_closeout_note_exists_with_required_sections() -> None:
    closeout = _read(PHASE67_CLOSEOUT_PATH)
    required_sections = [
        "# Phase 67 Blueprint Calibration and Minimum-Loop Value Closeout",
        f"Issue: `{PHASE67_EXIT_ISSUE}` `Phase 67 exit gate`",
        "## Closeout Decision",
        "## Landed Work",
        "## Minimum-Loop Outcome",
        "## Stop-State And Successor Decision",
        "## Pre-Merge Evidence Boundary",
        "## Contract And ADR Posture",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in closeout


def test_phase67_closeout_records_reviewed_stop_state_without_surface_drift() -> None:
    closeout = _read(PHASE67_CLOSEOUT_PATH)
    required_phrases = [
        f"Phase 67 is closed as `{PHASE67_TITLE}`",
        f"Phase 67 closeout decision is recorded by PR `{PHASE67_CLOSEOUT_PR}`",
        f"`{PHASE67_EXIT_ISSUE}` `Phase 67 exit gate` closed by PR `{PHASE67_CLOSEOUT_PR}`",
        f"`{PHASE67_SYNC_ISSUE}` `Phase 67: sync repo truth after Phase 66 closeout and define blueprint calibration gate` closed by PR `{PHASE67_SYNC_PR}`",
        f"`{PHASE67_AUDIT_ISSUE}` `Phase 67: audit current minimum-loop value gaps before next implementation` closed by PR `{PHASE67_AUDIT_PR}`",
        f"`{PHASE67_COMPARE_REPORT_ISSUE}` `Phase 67: align report and claims generation with compare-sourced branch truth` closed by PR `{PHASE67_COMPARE_REPORT_PR}`",
        PHASE67_STOP_STATE,
        "Post-merge stop-state:",
        "Pre-Merge Evidence Boundary",
        "Before PR `#514` merges and the Phase 67 milestone is closed",
        "this closeout PR records the required post-merge verification target",
        f"`{MINIMUM_LOOP}`",
        "minimum-loop value gap audit",
        "compare-sourced report/claims closure",
        "report/claims generation now selects the reference and candidate branch pair from canonical `compare.json` truth",
        "claim `label` and `evidence_ids` integrity is preserved",
        "No Phase 68 successor queue is opened in this closeout.",
        "The reviewed stop-state is intentional",
        "ordinary implementation issue",
        "No ADR or contract update is required",
        "Every future successor must identify a new source-backed minimum-loop gap or protected-core contract blocker before opening.",
        PHASE67_DRIFT_STOP,
        "the automation loop remains an execution mechanism, not the project north star",
        "selected bounded fictional or explicitly authorized worlds",
        "real-world prediction",
        "real-person personas",
        "political or high-risk decision systems",
    ]
    forbidden_phrases = [
        "Phase 67 selected-world generated runtime surface continuity",
        "Phase 67 should continue selected-world review readiness",
        "Phase 67 promotes broad private-beta readiness",
        "Phase 67 claims future-world readiness",
        "Phase 67 implements async",
        "Phase 67 ratifies task_id",
        "Phase 67 adds workers",
        "Phase 67 implements launch hub",
        "Phase 67 calls provider or model paths",
        "Phase 67 changes scenario DSL",
        "Phase 67 changes claim labels",
        "Phase 67 changes report claim `evidence_ids`",
        "Phase 67 changes artifact layout",
    ]

    for phrase in required_phrases:
        assert phrase in closeout, f"closeout note is missing Phase 67 closeout evidence: {phrase}"
    for phrase in forbidden_phrases:
        assert phrase not in closeout, f"closeout note expands blocked Phase 67 scope: {phrase}"


def test_current_docs_record_phase67_closed_reviewed_stop_state() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]
    required_phrases = [
        f"Phase 67 is closed as `{PHASE67_TITLE}`",
        f"Phase 67 closeout decision is recorded by PR `{PHASE67_CLOSEOUT_PR}`",
        f"milestone `{PHASE67_TITLE}` is closed",
        f"`{PHASE67_EXIT_ISSUE}` `Phase 67 exit gate` closed by PR `{PHASE67_CLOSEOUT_PR}`",
        f"`{PHASE67_SYNC_ISSUE}` closed by PR `{PHASE67_SYNC_PR}`",
        f"`{PHASE67_AUDIT_ISSUE}` closed by PR `{PHASE67_AUDIT_PR}`",
        f"`{PHASE67_COMPARE_REPORT_ISSUE}` closed by PR `{PHASE67_COMPARE_REPORT_PR}`",
        PHASE67_STOP_STATE,
        "Post-merge stop-state:",
        "Pre-Merge Evidence Boundary",
        "`docs/plans/phase-67-blueprint-calibration-minimum-loop-closeout-2026-06-08.md`",
        "`docs/plans/phase-67-minimum-loop-value-gap-audit-2026-06-04.md`",
        "compare-sourced report/claims closure",
        f"`{MINIMUM_LOOP}`",
        "scenario/intervention/branch-comparison/eval value",
        "No Phase 68 successor queue is opened in this closeout.",
        "Every future successor must identify a new source-backed minimum-loop gap or protected-core contract blocker before opening.",
        PHASE67_DRIFT_STOP,
    ]
    forbidden_phrases = [
        f"Phase 67 is active as `{PHASE67_TITLE}`",
        f"milestone `{PHASE67_TITLE}` is open",
        f"`{PHASE67_EXIT_ISSUE}` `Phase 67 exit gate`: open / blocked",
        f"`{PHASE67_AUDIT_ISSUE}` `Phase 67: audit current minimum-loop value gaps before next implementation`: open / ready",
        f"`{PHASE67_COMPARE_REPORT_ISSUE}` `Phase 67: align report and claims generation with compare-sourced branch truth`: open / ready",
        "`audit-github-queue` reports `ready` for the active Phase 67 milestone",
        "## Phase 67 Active Queue",
        "active Phase 67 blueprint calibration and minimum-loop value gate",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 67 closeout wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} still records Phase 67 as active: {phrase}"
