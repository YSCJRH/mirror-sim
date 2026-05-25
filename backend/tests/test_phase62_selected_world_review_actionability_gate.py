from __future__ import annotations

import json
from pathlib import Path


PHASE62_GATE_PATH = Path(
    "docs/plans/phase-62-selected-world-review-evidence-actionability-gate-2026-05-25.md"
)
PHASE62_TITLE = "Phase 62 - Selected-World Review Evidence Actionability Gate"
PHASE62_EXIT_ISSUE = "#477"
PHASE62_SYNC_ISSUE_NUMBER = "#478"
PHASE62_SMOKE_ISSUE_NUMBER = "#479"
PHASE62_SYNC_ISSUE = (
    "Phase 62: sync repo truth after Phase 61 closeout and define review evidence actionability gate"
)
PHASE62_SMOKE_ISSUE = "Phase 62: add selected-world review evidence actionability smoke"


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase62_selected_world_review_actionability_gate_exists_with_required_sections() -> None:
    gate = _read(PHASE62_GATE_PATH)
    required_sections = [
        "# Phase 62 Selected-World Review Evidence Actionability Gate",
        f"Issue: `{PHASE62_EXIT_ISSUE}` `Phase 62 exit gate`",
        "Current state: Phase 62 is active; Phase 61 is closed.",
        "## Post-Phase-61 Baseline",
        "## Phase 62 Active Queue",
        "## Selected-World Review Evidence Actionability Scope",
        "## Candidate Input Policy",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase62_gate_records_queue_scope_and_boundaries() -> None:
    gate = _read(PHASE62_GATE_PATH)
    required_phrases = [
        "Phase 61 is closed after PR `#476`.",
        PHASE62_TITLE,
        f"`{PHASE62_EXIT_ISSUE}` `Phase 62 exit gate`",
        f"`{PHASE62_SYNC_ISSUE_NUMBER}` `{PHASE62_SYNC_ISSUE}`",
        f"`{PHASE62_SMOKE_ISSUE_NUMBER}` `{PHASE62_SMOKE_ISSUE}`",
        f"`{PHASE62_SYNC_ISSUE}`",
        f"`{PHASE62_SMOKE_ISSUE}`",
        "`audit-github-queue` reports `ready` with active milestone `Phase 62 - Selected-World Review Evidence Actionability Gate`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "selected-world review evidence actionability",
        "read-only review readiness and next-action signals",
        "Phase 61 selected-world review surface evidence binding is the historical baseline",
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


def test_active_state_docs_record_phase62_queue_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE62_GATE_PATH,
    ]
    required_phrases = [
        "Phase 62 is active",
        PHASE62_TITLE,
        f"`{PHASE62_EXIT_ISSUE}` `Phase 62 exit gate`",
        f"`{PHASE62_SYNC_ISSUE_NUMBER}` `{PHASE62_SYNC_ISSUE}`",
        f"`{PHASE62_SMOKE_ISSUE_NUMBER}` `{PHASE62_SMOKE_ISSUE}`",
        f"`{PHASE62_SYNC_ISSUE}`",
        f"`{PHASE62_SMOKE_ISSUE}`",
        "`docs/plans/phase-62-selected-world-review-evidence-actionability-gate-2026-05-25.md`",
        "selected-world review evidence actionability",
        "Phase 61 selected-world review surface evidence binding is the historical baseline",
        "`audit-github-queue` reports `ready` with active milestone",
    ]
    forbidden_phrases = [
        "Phase 62 implements async",
        "Phase 62 implements launch hub",
        "Phase 62 replaces `/`",
        "Phase 62 widens the public path",
        "Phase 62 adds Hosted GPT",
        "Phase 62 adds BYOK",
        "Phase 62 adds upload",
        "Phase 62 adds auth",
        "Phase 62 adds database",
        "Phase 62 adds object storage",
        "Phase 62 ratifies task_id",
        "Phase 62 changes scenario DSL",
        "Phase 62 changes claim labels",
        "Phase 62 changes report claim `evidence_ids`",
        "Phase 62 changes run trace shape",
        "Phase 62 changes compare artifact shape",
        "Phase 62 changes plugin MCP contract",
        "Phase 62 changes artifact layout",
        "Phase 62 promotes broad private-beta readiness",
        "Phase 62 promotes future-world readiness",
        "Phase 62 promotes untracked planning notes",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 62 active queue wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 62 scope: {phrase}"


def test_bootstrap_spec_records_phase62_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": PHASE62_TITLE,
        "description": (
            "Make selected bounded-world review surfaces more actionable by turning existing artifact, "
            "eval, claim, and evidence binding into read-only review readiness and next-action signals "
            "while preserving public demo, plugin, async, Hosted GPT/BYOK, launch hub, runtime mutation, "
            "storage/auth, and contract boundaries."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:62",
        "color": "C8E6C9",
        "description": "Phase 62 selected-world review evidence actionability work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 62 exit gate",
        PHASE62_SYNC_ISSUE,
        PHASE62_SMOKE_ISSUE,
    ]:
        assert title in titles
        assert titles[title]["milestone"] == PHASE62_TITLE
        assert "phase:62" in titles[title]["labels"]

    assert "lane:protected-core" in titles["Phase 62 exit gate"]["labels"]
    assert "status:blocked" in titles["Phase 62 exit gate"]["labels"]

    assert "lane:protected-core" in titles[PHASE62_SYNC_ISSUE]["labels"]
    assert "risk:ci" in titles[PHASE62_SYNC_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE62_SYNC_ISSUE]["labels"]

    assert "lane:protected-core" in titles[PHASE62_SMOKE_ISSUE]["labels"]
    assert "area:frontend" in titles[PHASE62_SMOKE_ISSUE]["labels"]
    assert "risk:ci" in titles[PHASE62_SMOKE_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE62_SMOKE_ISSUE]["labels"]
