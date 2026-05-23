from __future__ import annotations

import json
from pathlib import Path


PHASE59_GATE_PATH = Path("docs/plans/phase-59-selected-world-route-continuity-gate-2026-05-23.md")


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase59_selected_world_route_gate_exists_with_required_sections() -> None:
    gate = _read(PHASE59_GATE_PATH)
    required_sections = [
        "# Phase 59 Selected-World Route Continuity Gate",
        "Issue: `#459` `Phase 59 exit gate`",
        "Current state: Phase 59 is active; the GitHub queue is ready.",
        "## Post-Phase-58 Baseline",
        "## Phase 59 Operational Queue",
        "## Selected-World Route Continuity Scope",
        "## Candidate Evidence Plan",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase59_selected_world_route_gate_records_queue_and_boundaries() -> None:
    gate = _read(PHASE59_GATE_PATH)
    required_phrases = [
        "Phase 58 is closed after PR `#458`.",
        "Phase 59 - Selected-World Route Continuity Evidence Gate",
        "`#459` `Phase 59 exit gate`",
        "`#460` `Phase 59: sync repo truth after Phase 58 closeout and define selected-world route gate`",
        "`#461` `Phase 59: add GET-only selected-world route smoke for Fog Harbor, Museum Night, and Library Rain`",
        "`audit-github-queue` reports `ready` for the active Phase 59 queue.",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "narrow GET-only route-readiness evidence for selected bounded fictional worlds",
        "Do not promote broad private-beta readiness.",
        "Do not implement launch hub behavior.",
        "Do not add async/task_id behavior.",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion.",
        "Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.",
        "Do not claim future-world readiness.",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_active_state_docs_record_phase59_ready_queue() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE59_GATE_PATH,
    ]
    required_phrases = [
        "Phase 59 is active",
        "Phase 59 - Selected-World Route Continuity Evidence Gate",
        "`#459` `Phase 59 exit gate`",
        "`#460` `Phase 59: sync repo truth after Phase 58 closeout and define selected-world route gate`",
        "`#461` `Phase 59: add GET-only selected-world route smoke for Fog Harbor, Museum Night, and Library Rain`",
        "`audit-github-queue` reports `ready` for the active Phase 59 queue",
        "`docs/plans/phase-59-selected-world-route-continuity-gate-2026-05-23.md`",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 59 active queue wording: {phrase}"


def test_phase59_docs_do_not_promote_blocked_scope() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE59_GATE_PATH,
    ]
    forbidden_phrases = [
        "Phase 59 implements async",
        "Phase 59 implements launch hub",
        "Phase 59 replaces `/`",
        "Phase 59 widens the public path",
        "Phase 59 adds Hosted GPT",
        "Phase 59 adds BYOK",
        "Phase 59 adds upload",
        "Phase 59 adds auth",
        "Phase 59 ratifies task_id",
        "Phase 59 changes scenario DSL",
        "Phase 59 changes claim labels",
        "Phase 59 changes report claim `evidence_ids`",
        "Phase 59 changes run trace shape",
        "Phase 59 changes compare artifact shape",
        "Phase 59 changes plugin MCP contract",
        "Phase 59 promotes broad private-beta readiness",
        "Phase 59 promotes future-world readiness",
        "Phase 59 promotes untracked planning notes",
        "Phase 59 is ready for closeout",
        "`#461` `Phase 59: add GET-only selected-world route smoke for Fog Harbor, Museum Night, and Library Rain` is closed",
        "Phase 59 is paused with no active milestone",
    ]

    for path in docs:
        text = _read(path)
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} promotes blocked Phase 59 scope: {phrase}"


def test_bootstrap_spec_records_phase59_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": "Phase 59 - Selected-World Route Continuity Evidence Gate",
        "description": (
            "Extend narrow GET-only route-readiness evidence across selected bounded fictional worlds "
            "while preserving public-demo, plugin, Hosted GPT/BYOK, launch hub, async, and runtime mutation boundaries."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:59",
        "color": "C8E6C9",
        "description": "Phase 59 selected-world route continuity evidence work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 59 exit gate",
        "Phase 59: sync repo truth after Phase 58 closeout and define selected-world route gate",
        "Phase 59: add GET-only selected-world route smoke for Fog Harbor, Museum Night, and Library Rain",
    ]:
        assert title in titles
        assert titles[title]["milestone"] == "Phase 59 - Selected-World Route Continuity Evidence Gate"
        assert "phase:59" in titles[title]["labels"]
