from __future__ import annotations

import json
from pathlib import Path


PHASE63_GATE_PATH = Path(
    "docs/plans/phase-63-selected-world-next-action-route-fidelity-gate-2026-05-25.md"
)
PHASE63_TITLE = "Phase 63 - Selected-World Review Next-Action Route-Fidelity Gate"
PHASE63_EXIT_ISSUE = "#483"
PHASE63_SYNC_ISSUE_NUMBER = "#484"
PHASE63_SMOKE_ISSUE_NUMBER = "#485"
PHASE63_SYNC_PR = "#486"
PHASE63_SMOKE_PR = "#487"
PHASE63_SYNC_ISSUE = (
    "Phase 63: sync repo truth after Phase 62 closeout and define selected-world review "
    "next-action route-fidelity gate"
)
PHASE63_SMOKE_ISSUE = "Phase 63: add selected-world review next-action route-fidelity smoke"
PHASE62_TITLE = "Phase 62 - Selected-World Review Evidence Actionability Gate"


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase63_route_fidelity_gate_exists_with_required_sections() -> None:
    gate = _read(PHASE63_GATE_PATH)
    required_sections = [
        "# Phase 63 Selected-World Review Next-Action Route-Fidelity Gate",
        f"Issue: `{PHASE63_EXIT_ISSUE}` `Phase 63 exit gate`",
        "Current state: Phase 63 is closed; Phase 62 is closed.",
        "## Post-Phase-62 Baseline",
        "## Phase 63 Closed Queue",
        "## Selected-World Next-Action Route-Fidelity Scope",
        "## Candidate Input Policy",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase63_gate_records_queue_scope_and_boundaries() -> None:
    gate = _read(PHASE63_GATE_PATH)
    required_phrases = [
        "Phase 62 is closed after PR `#482`.",
        f"milestone `{PHASE62_TITLE}` is closed",
        PHASE63_TITLE,
        f"`{PHASE63_EXIT_ISSUE}` `Phase 63 exit gate`",
        f"`{PHASE63_SYNC_ISSUE_NUMBER}` `{PHASE63_SYNC_ISSUE}`",
        f"`{PHASE63_SMOKE_ISSUE_NUMBER}` `{PHASE63_SMOKE_ISSUE}`",
        f"`{PHASE63_SYNC_ISSUE_NUMBER}` closed by PR `{PHASE63_SYNC_PR}`",
        f"`{PHASE63_SMOKE_ISSUE_NUMBER}` closed by PR `{PHASE63_SMOKE_PR}`",
        f"`{PHASE63_EXIT_ISSUE}` `Phase 63 exit gate` closed by PR `#488`",
        f"milestone `{PHASE63_TITLE}` is closed",
        "`audit-github-queue` reports `paused` with no active milestone after Phase 63 closeout",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "selected-world review next-action route fidelity",
        "read-only `nextAction` cues map only to existing world-scoped follow-up paths",
        "Phase 62 selected-world review evidence actionability is the historical baseline",
        "`docs/plans/phase-63-selected-world-review-next-action-route-fidelity-2026-05-26.md`",
        "`scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py`",
        "Phase 56 world review continuity guardrail is a source anchor",
        "untracked private-alpha, private-beta, kernel, and design-system planning notes remain candidate inputs only",
        "status:needs-adr",
        "risk:safety",
        "Do not start runtime sessions.",
        "Do not generate branches.",
        "Do not call POST/runtime APIs.",
        "Do not call provider or model paths.",
        "Do not promote broad private-beta readiness.",
        "Do not implement launch hub behavior.",
        "Do not add async/task_id behavior.",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion.",
        "Do not add or change runtime mutation behavior.",
        "Do not change route ownership, scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.",
        "Do not claim future-world readiness.",
        "Do not promote untracked planning notes as durable truth.",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_closeout_state_docs_record_phase63_queue_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE63_GATE_PATH,
    ]
    required_phrases = [
        "Phase 63 is closed",
        PHASE63_TITLE,
        f"`{PHASE63_EXIT_ISSUE}` `Phase 63 exit gate`",
        f"`{PHASE63_SYNC_ISSUE_NUMBER}` `{PHASE63_SYNC_ISSUE}`",
        f"`{PHASE63_SMOKE_ISSUE_NUMBER}` `{PHASE63_SMOKE_ISSUE}`",
        f"`{PHASE63_SYNC_ISSUE_NUMBER}` closed by PR `{PHASE63_SYNC_PR}`",
        f"`{PHASE63_SMOKE_ISSUE_NUMBER}` closed by PR `{PHASE63_SMOKE_PR}`",
        f"`{PHASE63_EXIT_ISSUE}` `Phase 63 exit gate` closed by PR `#488`",
        f"milestone `{PHASE63_TITLE}` is closed",
        "`audit-github-queue` reports `paused` with no active milestone after Phase 63 closeout",
        "`docs/plans/phase-63-selected-world-next-action-route-fidelity-gate-2026-05-25.md`",
        "`docs/plans/phase-63-selected-world-review-next-action-route-fidelity-2026-05-26.md`",
        "`scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py`",
        "selected-world review next-action route fidelity",
        "Phase 62 selected-world review evidence actionability is the historical baseline",
    ]
    forbidden_phrases = [
        "Phase 63 implements async",
        "Phase 63 implements launch hub",
        "Phase 63 replaces `/`",
        "Phase 63 widens the public path",
        "Phase 63 starts runtime sessions",
        "Phase 63 generates branches",
        "Phase 63 calls POST/runtime APIs",
        "Phase 63 adds Hosted GPT",
        "Phase 63 adds BYOK",
        "Phase 63 adds upload",
        "Phase 63 adds auth",
        "Phase 63 adds database",
        "Phase 63 adds object storage",
        "Phase 63 ratifies task_id",
        "Phase 63 is active",
        "Phase 63 active",
        "Phase 63 Active Queue",
        "Phase 63 exit gate: open / blocked",
        "`audit-github-queue` reports `ready` with active milestone",
        "`audit-github-queue` reports `ready` for the active Phase 63 milestone",
        "remaining active work item",
        "ready / current",
        "Phase 63 changes route ownership",
        "Phase 63 changes scenario DSL",
        "Phase 63 changes claim labels",
        "Phase 63 changes report claim `evidence_ids`",
        "Phase 63 changes run trace shape",
        "Phase 63 changes compare artifact shape",
        "Phase 63 changes plugin MCP contract",
        "Phase 63 changes artifact layout",
        "Phase 63 promotes broad private-beta readiness",
        "Phase 63 promotes future-world readiness",
        "Phase 63 promotes untracked planning notes",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 63 closeout wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands Phase 63 closeout scope: {phrase}"


def test_bootstrap_spec_records_phase63_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": PHASE63_TITLE,
        "description": (
            "Prove that Phase 62 read-only selected-world review next-action cues map only to "
            "existing world-scoped follow-up paths for Fog Harbor, Museum Night, and Library Rain "
            "without starting sessions, generating branches, adding mutating APIs, widening "
            "runtime/public/plugin contracts, or promoting broad readiness claims."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:63",
        "color": "C8E6C9",
        "description": "Phase 63 selected-world review next-action route-fidelity work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 63 exit gate",
        PHASE63_SYNC_ISSUE,
        PHASE63_SMOKE_ISSUE,
    ]:
        assert title in titles
        assert titles[title]["milestone"] == PHASE63_TITLE
        assert "phase:63" in titles[title]["labels"]

    assert "lane:protected-core" in titles["Phase 63 exit gate"]["labels"]
    assert "status:blocked" in titles["Phase 63 exit gate"]["labels"]

    assert "lane:protected-core" in titles[PHASE63_SYNC_ISSUE]["labels"]
    assert "risk:ci" in titles[PHASE63_SYNC_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE63_SYNC_ISSUE]["labels"]

    assert "lane:protected-core" in titles[PHASE63_SMOKE_ISSUE]["labels"]
    assert "area:frontend" in titles[PHASE63_SMOKE_ISSUE]["labels"]
    assert "risk:ci" in titles[PHASE63_SMOKE_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE63_SMOKE_ISSUE]["labels"]
