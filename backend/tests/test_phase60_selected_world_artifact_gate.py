from __future__ import annotations

import json
from pathlib import Path


PHASE60_GATE_PATH = Path(
    "docs/plans/phase-60-selected-world-artifact-integrity-gate-2026-05-23.md"
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase60_selected_world_artifact_gate_exists_with_required_sections() -> None:
    gate = _read(PHASE60_GATE_PATH)
    required_sections = [
        "# Phase 60 Selected-World Review Artifact Integrity Gate",
        "Issue: `#465` `Phase 60 exit gate`",
        "Current state: Phase 60 is closed; no active milestone is open.",
        "## Post-Phase-59 Baseline",
        "## Phase 60 Closed Queue",
        "## Selected-World Review Artifact Integrity Scope",
        "## Reproduced Evidence Outcome",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase60_gate_records_active_queue_and_boundaries() -> None:
    gate = _read(PHASE60_GATE_PATH)
    required_phrases = [
        "Phase 59 is closed after PR `#464`.",
        "Phase 60 - Selected-World Review Artifact Integrity Gate",
        "`#465` `Phase 60 exit gate`",
        "`#465` closed by PR `#470`.",
        "`#466` `Phase 60: sync repo truth after Phase 59 closeout and define artifact integrity gate`",
        "`#467` `Phase 60: add selected-world review artifact integrity smoke`",
        "`#466` closed by PR `#468`.",
        "`#467` closed by PR `#469`.",
        "`audit-github-queue` reports `paused` with no active milestone.",
        "milestone `Phase 60 - Selected-World Review Artifact Integrity Gate` is closed",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "narrow selected-world review artifact integrity evidence",
        "`scripts/smoke_phase60_selected_world_artifact_integrity.py`",
        "`docs/plans/phase-60-selected-world-artifact-integrity-gate-2026-05-23.md`",
        "`docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md`",
        "Do not promote broad private-beta readiness.",
        "Do not implement launch hub behavior.",
        "Do not add async/task_id behavior.",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion.",
        "Do not add or change runtime mutation behavior.",
        "Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.",
        "Do not claim future-world readiness.",
        "Do not promote untracked planning notes as durable truth.",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_closed_state_docs_record_phase60_paused_queue() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE60_GATE_PATH,
    ]
    required_phrases = [
        "Phase 60 is closed",
        "Phase 60 - Selected-World Review Artifact Integrity Gate",
        "milestone `Phase 60 - Selected-World Review Artifact Integrity Gate` is closed",
        "`#465` `Phase 60 exit gate`",
        "`#465` closed by PR `#470`",
        "`#466` `Phase 60: sync repo truth after Phase 59 closeout and define artifact integrity gate`",
        "`#466` closed by PR `#468`",
        "`#467` `Phase 60: add selected-world review artifact integrity smoke`",
        "`#467` closed by PR `#469`",
        "`audit-github-queue` reports `paused` with no active milestone",
        "`docs/plans/phase-60-selected-world-artifact-integrity-gate-2026-05-23.md`",
        "`docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md`",
        "`scripts/smoke_phase60_selected_world_artifact_integrity.py`",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 60 closed queue wording: {phrase}"


def test_phase60_docs_do_not_promote_blocked_scope() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE60_GATE_PATH,
    ]
    forbidden_phrases = [
        "Phase 60 implements async",
        "Phase 60 implements launch hub",
        "Phase 60 replaces `/`",
        "Phase 60 widens the public path",
        "Phase 60 adds Hosted GPT",
        "Phase 60 adds BYOK",
        "Phase 60 adds upload",
        "Phase 60 adds auth",
        "Phase 60 adds database",
        "Phase 60 adds object storage",
        "Phase 60 ratifies task_id",
        "Phase 60 changes scenario DSL",
        "Phase 60 changes claim labels",
        "Phase 60 changes report claim `evidence_ids`",
        "Phase 60 changes run trace shape",
        "Phase 60 changes compare artifact shape",
        "Phase 60 changes plugin MCP contract",
        "Phase 60 changes artifact layout",
        "Phase 60 promotes broad private-beta readiness",
        "Phase 60 promotes future-world readiness",
        "Phase 60 promotes untracked planning notes",
        "Phase 60 is active",
        "`audit-github-queue` reports `ready` for the active Phase 60 queue",
        "`#466` `Phase 60: sync repo truth after Phase 59 closeout and define artifact integrity gate` is ready",
        "`#467` `Phase 60: add selected-world review artifact integrity smoke` is ready",
    ]

    for path in docs:
        text = _read(path)
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} promotes blocked Phase 60 scope: {phrase}"


def test_bootstrap_spec_records_phase60_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": "Phase 60 - Selected-World Review Artifact Integrity Gate",
        "description": (
            "Verify selected bounded-world review artifact and evidence integrity without widening "
            "private-beta, launch hub, async, Hosted GPT/BYOK, runtime mutation, public/plugin, "
            "storage, auth, or contract boundaries."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:60",
        "color": "C8E6C9",
        "description": "Phase 60 selected-world review artifact integrity work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 60 exit gate",
        "Phase 60: sync repo truth after Phase 59 closeout and define artifact integrity gate",
        "Phase 60: add selected-world review artifact integrity smoke",
    ]:
        assert title in titles
        assert titles[title]["milestone"] == "Phase 60 - Selected-World Review Artifact Integrity Gate"
        assert "phase:60" in titles[title]["labels"]
