from __future__ import annotations

import json
from pathlib import Path


AUDIT_PATH = Path("docs/plans/phase-67-minimum-loop-value-gap-audit-2026-06-04.md")
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
PHASE67_CLOSEOUT_PR = "#514"
PHASE67_AUDIT_PR = "#512"
PHASE67_COMPARE_REPORT_PR = "#513"
MINIMUM_LOOP = (
    "corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> "
    "report/claims -> eval"
)
STOP_STATUS = "`audit-github-queue` reports `paused` with no active milestone after Phase 67 closeout"
DRIFT_STOP = (
    "Do not open another adjacent surface/readiness/fidelity/continuity gate as "
    "the primary Phase 67 scope without a source-backed tie to "
    "scenario/intervention/branch-comparison/eval value."
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_minimum_loop_value_gap_audit_note_exists_with_required_sections() -> None:
    audit = _read(AUDIT_PATH)
    required_sections = [
        "# Phase 67 Minimum-Loop Value Gap Audit",
        f"Issue: `{PHASE67_AUDIT_ISSUE_NUMBER}` `{PHASE67_AUDIT_ISSUE}`",
        "Audit note: `docs/plans/phase-67-minimum-loop-value-gap-audit-2026-06-04.md`",
        "## Evidence Inputs",
        "## Minimum-Loop Map",
        "## Evidence",
        "## Inference",
        "## Open Questions And TODO[verify]",
        "## Recommended Next Action",
        "## Contract And ADR Posture",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in audit


def test_minimum_loop_value_gap_audit_stays_blueprint_and_compare_value_oriented() -> None:
    audit = _read(AUDIT_PATH)
    required_phrases = [
        "minimum-loop value gap audit",
        f"`{MINIMUM_LOOP}`",
        "scenario/intervention/branch-comparison/eval value",
        "the automation loop remains an execution mechanism, not the project north star",
        "Every report claim must keep both `label` and `evidence_ids`.",
        "This audit should not change contracts.",
        "TODO[verify]:",
        f"`{PHASE67_COMPARE_REPORT_ISSUE_NUMBER}` `{PHASE67_COMPARE_REPORT_ISSUE}`",
        PHASE67_COMPARE_REPORT_ISSUE,
        "compare-sourced report/claims closure",
        "`docs/architecture/contracts.md` states that `compare.json` is the canonical branch-relationship artifact",
        "reports and claims may remain pair-scoped, but the chosen branch pair must come from compare truth",
        "ordinary implementation issue",
        "protected-core contract issue",
        "ADR-backed contract change",
        DRIFT_STOP,
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
        assert phrase in audit, f"audit note is missing blueprint anchor: {phrase}"
    for phrase in forbidden_phrases:
        assert phrase not in audit, f"audit note expands blocked Phase 67 scope: {phrase}"


def test_active_docs_record_phase67_audit_and_next_value_item() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE67_GATE_PATH,
    ]
    required_phrases = [
        f"Phase 67 closeout decision is recorded by PR `{PHASE67_CLOSEOUT_PR}`",
        "Post-merge stop-state:",
        "Pre-Merge Evidence Boundary",
        f"Phase 67 is closed as `{PHASE67_TITLE}`",
        f"`{PHASE67_EXIT_ISSUE_NUMBER}` `Phase 67 exit gate` closed by PR `{PHASE67_CLOSEOUT_PR}`",
        f"`{PHASE67_SYNC_ISSUE_NUMBER}` closed by PR `#510`",
        f"`{PHASE67_AUDIT_ISSUE_NUMBER}` closed by PR `{PHASE67_AUDIT_PR}`",
        f"`{PHASE67_COMPARE_REPORT_ISSUE_NUMBER}` closed by PR `{PHASE67_COMPARE_REPORT_PR}`",
        PHASE67_COMPARE_REPORT_ISSUE,
        "`docs/plans/phase-67-minimum-loop-value-gap-audit-2026-06-04.md`",
        "`docs/plans/phase-67-blueprint-calibration-minimum-loop-closeout-2026-06-08.md`",
        "compare-sourced report/claims closure",
        f"`{MINIMUM_LOOP}`",
        "scenario/intervention/branch-comparison/eval value",
        STOP_STATUS,
        "No Phase 68 successor queue is opened in this closeout.",
        "Before PR `#514` merges and the Phase 67 milestone is closed",
        "this closeout PR records the required post-merge verification target",
    ]
    forbidden_phrases = [
        f"Phase 67 is active as `{PHASE67_TITLE}`",
        f"`{PHASE67_EXIT_ISSUE_NUMBER}` `Phase 67 exit gate`: open / blocked",
        f"`{PHASE67_AUDIT_ISSUE_NUMBER}` `{PHASE67_AUDIT_ISSUE}`: open / ready",
        f"`{PHASE67_COMPARE_REPORT_ISSUE_NUMBER}` `{PHASE67_COMPARE_REPORT_ISSUE}`: open / ready",
        "`audit-github-queue` reports `ready` for the active Phase 67 milestone",
    ]
    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 67 audit wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} still records Phase 67 as active: {phrase}"


def test_bootstrap_spec_records_phase67_compare_report_follow_up() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))
    titles = {issue["title"]: issue for issue in spec["issues"]}

    assert PHASE67_COMPARE_REPORT_ISSUE in titles
    issue = titles[PHASE67_COMPARE_REPORT_ISSUE]
    assert issue["milestone"] == PHASE67_TITLE
    assert "phase:67" in issue["labels"]
    assert "area:backend" in issue["labels"]
    assert "area:docs-evals" in issue["labels"]
    assert "risk:core-contract" in issue["labels"]
    assert "lane:protected-core" in issue["labels"]
    assert "status:ready" in issue["labels"]
    assert "compare-sourced report/claims closure" in issue["body"]
    assert f"`{MINIMUM_LOOP}`" in issue["body"]
    assert "Every report claim must keep both `label` and `evidence_ids`." in issue["body"]
    assert "This follow-up should not change contracts by default." in issue["body"]
    assert "TODO[verify]:" in issue["body"]
