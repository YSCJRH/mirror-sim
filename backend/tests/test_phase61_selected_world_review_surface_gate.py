from __future__ import annotations

import json
from pathlib import Path


PHASE61_GATE_PATH = Path(
    "docs/plans/phase-61-selected-world-review-surface-evidence-binding-gate-2026-05-23.md"
)
PHASE61_TITLE = "Phase 61 - Selected-World Review Surface Evidence Binding Gate"
PHASE61_EXIT_ISSUE = "#471"
PHASE61_SYNC_ISSUE_NUMBER = "#472"
PHASE61_SMOKE_ISSUE_NUMBER = "#473"
PHASE61_SYNC_ISSUE = (
    "Phase 61: sync repo truth after Phase 60 closeout and define review surface evidence gate"
)
PHASE61_SMOKE_ISSUE = "Phase 61: add selected-world review surface evidence binding smoke"


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase61_selected_world_review_surface_gate_exists_with_required_sections() -> None:
    gate = _read(PHASE61_GATE_PATH)
    required_sections = [
        "# Phase 61 Selected-World Review Surface Evidence Binding Gate",
        f"Issue: `{PHASE61_EXIT_ISSUE}` `Phase 61 exit gate`",
        "Current state: Phase 61 is closed; Phase 60 is closed.",
        "## Post-Phase-60 Baseline",
        "## Phase 61 Closed Queue",
        "## Selected-World Review Surface Evidence Binding Scope",
        "## Candidate Input Policy",
        "## Non-Goals",
        "## Validation Commands",
        f"`{PHASE61_EXIT_ISSUE}` `Phase 61 exit gate`",
    ]
    for section in required_sections:
        assert section in gate


def test_phase61_gate_records_queue_scope_and_boundaries() -> None:
    gate = _read(PHASE61_GATE_PATH)
    required_phrases = [
        "Phase 60 is closed after PR `#470`.",
        PHASE61_TITLE,
        "`Phase 61 exit gate` closed by the Phase 61 closeout PR",
        f"`{PHASE61_EXIT_ISSUE}` `Phase 61 exit gate`",
        f"`{PHASE61_SYNC_ISSUE_NUMBER}` `{PHASE61_SYNC_ISSUE}`",
        f"`{PHASE61_SMOKE_ISSUE_NUMBER}` `{PHASE61_SMOKE_ISSUE}`",
        f"`{PHASE61_SYNC_ISSUE}`",
        f"`{PHASE61_SMOKE_ISSUE}`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "selected-world review surface evidence binding",
        "Phase 60 selected-world review artifact integrity evidence is the historical baseline",
        "untracked private-alpha, private-beta, kernel, and design-system planning notes remain candidate inputs only",
        "status:needs-adr",
        "risk:safety",
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


def test_closed_state_docs_record_phase61_queue_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE61_GATE_PATH,
    ]
    required_phrases = [
        "Phase 61 is closed",
        PHASE61_TITLE,
        "`Phase 61 exit gate` closed by the Phase 61 closeout PR",
        f"`{PHASE61_SYNC_ISSUE_NUMBER}` `{PHASE61_SYNC_ISSUE}`",
        f"`{PHASE61_SMOKE_ISSUE_NUMBER}` `{PHASE61_SMOKE_ISSUE}`",
        f"`{PHASE61_SYNC_ISSUE}`",
        f"`{PHASE61_SMOKE_ISSUE}`",
        "`docs/plans/phase-61-selected-world-review-surface-evidence-binding-gate-2026-05-23.md`",
        "selected-world review surface evidence binding",
        "Phase 60 selected-world review artifact integrity evidence remains historical baseline",
        "`audit-github-queue` reports `paused` with no active milestone",
    ]
    forbidden_phrases = [
        "Phase 61 implements async",
        "Phase 61 implements launch hub",
        "Phase 61 replaces `/`",
        "Phase 61 widens the public path",
        "Phase 61 adds Hosted GPT",
        "Phase 61 adds BYOK",
        "Phase 61 adds upload",
        "Phase 61 adds auth",
        "Phase 61 adds database",
        "Phase 61 adds object storage",
        "Phase 61 ratifies task_id",
        "Phase 61 changes scenario DSL",
        "Phase 61 changes claim labels",
        "Phase 61 changes report claim `evidence_ids`",
        "Phase 61 changes run trace shape",
        "Phase 61 changes compare artifact shape",
        "Phase 61 changes plugin MCP contract",
        "Phase 61 changes artifact layout",
        "Phase 61 promotes broad private-beta readiness",
        "Phase 61 promotes future-world readiness",
        "Phase 61 promotes untracked planning notes",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 61 active queue wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 61 scope: {phrase}"


def test_bootstrap_spec_records_phase61_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": PHASE61_TITLE,
        "description": (
            "Bind selected bounded-world review surfaces to tracked artifact and evidence signals "
            "without widening private-beta, launch hub, async, Hosted GPT/BYOK, runtime mutation, "
            "public/plugin, storage, auth, or contract boundaries."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:61",
        "color": "C8E6C9",
        "description": "Phase 61 selected-world review surface evidence binding work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 61 exit gate",
        PHASE61_SYNC_ISSUE,
        PHASE61_SMOKE_ISSUE,
    ]:
        assert title in titles
        assert titles[title]["milestone"] == PHASE61_TITLE
        assert "phase:61" in titles[title]["labels"]

    assert "lane:protected-core" in titles["Phase 61 exit gate"]["labels"]
    assert "status:blocked" in titles["Phase 61 exit gate"]["labels"]

    assert "lane:protected-core" in titles[PHASE61_SYNC_ISSUE]["labels"]
    assert "risk:ci" in titles[PHASE61_SYNC_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE61_SYNC_ISSUE]["labels"]

    assert "lane:protected-core" in titles[PHASE61_SMOKE_ISSUE]["labels"]
    assert "area:frontend" in titles[PHASE61_SMOKE_ISSUE]["labels"]
    assert "risk:ci" in titles[PHASE61_SMOKE_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE61_SMOKE_ISSUE]["labels"]
