from __future__ import annotations

import json
from pathlib import Path


PHASE58_GATE_PATH = Path("docs/plans/phase-58-route-readiness-evidence-gate-2026-05-20.md")


def test_phase58_route_readiness_gate_exists_with_required_sections() -> None:
    assert PHASE58_GATE_PATH.exists()

    gate = PHASE58_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 58 Route Readiness Evidence Gate",
        "Issue: `#454` `Phase 58: sync repo truth after PR #452 and define route-readiness evidence gate`",
        "Current state: Phase 58 is active; the queue has one open milestone and ready work items.",
        "## Post-Phase-57 Baseline",
        "## Phase 58 Operational Queue",
        "## Route-Readiness Evidence Gate Scope",
        "## Candidate Inputs",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase58_route_readiness_gate_records_queue_and_boundaries() -> None:
    assert PHASE58_GATE_PATH.exists()

    gate = PHASE58_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "PR `#452` merged the subagent-reviewed auto-merge policy baseline.",
        "Phase 57 is closed after PR `#451`.",
        "Phase 58 - Private-Beta Route Readiness Evidence Gate",
        "`#453` `Phase 58 exit gate`",
        "`#454` `Phase 58: sync repo truth after PR #452 and define route-readiness evidence gate`",
        "`#455` `Phase 58: reproduce private-beta route-readiness snapshots with tracked smoke coverage`",
        "Status: open and blocked until all Phase 58 work merges and post-merge validation passes.",
        "Status: open and ready.",
        "`audit-github-queue` reports `ready` for the active Phase 58 queue.",
        "reproduce the deferred private-beta route-readiness candidate snapshots with tracked tests or checked-in verification artifacts",
        "Promote only narrow source-verified route-readiness evidence, or record blockers.",
        "Do not promote broad private-beta readiness.",
        "Do not implement launch hub behavior.",
        "Do not add async/task_id behavior.",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion.",
        "Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_active_state_docs_record_phase58_active_queue() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE58_GATE_PATH,
    ]
    required_phrases = [
        "Phase 58 is active",
        "Phase 58 - Private-Beta Route Readiness Evidence Gate",
        "`#453` `Phase 58 exit gate`",
        "`#454` `Phase 58: sync repo truth after PR #452 and define route-readiness evidence gate`",
        "`#455` `Phase 58: reproduce private-beta route-readiness snapshots with tracked smoke coverage`",
        "`audit-github-queue` reports `ready` for the active Phase 58 queue",
        "`docs/plans/phase-58-route-readiness-evidence-gate-2026-05-20.md`",
    ]

    for path in docs:
        text = path.read_text(encoding="utf-8")
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 58 active queue wording: {phrase}"


def test_phase58_docs_do_not_promote_blocked_scope() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE58_GATE_PATH,
    ]
    forbidden_phrases = [
        "Phase 58 implements async",
        "Phase 58 implements launch hub",
        "Phase 58 replaces `/`",
        "Phase 58 widens the public path",
        "Phase 58 adds Hosted GPT",
        "Phase 58 adds BYOK",
        "Phase 58 adds upload",
        "Phase 58 adds auth",
        "Phase 58 ratifies task_id",
        "Phase 58 changes scenario DSL",
        "Phase 58 changes claim labels",
        "Phase 58 changes report claim `evidence_ids`",
        "Phase 58 changes run trace shape",
        "Phase 58 changes compare artifact shape",
        "Phase 58 changes plugin MCP contract",
        "Phase 58 promotes broad private-beta readiness",
        "Phase 58 promotes untracked planning notes",
    ]

    for path in docs:
        text = path.read_text(encoding="utf-8")
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} promotes blocked Phase 58 scope: {phrase}"


def test_bootstrap_spec_records_phase58_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": "Phase 58 - Private-Beta Route Readiness Evidence Gate",
        "description": (
            "Reproduce narrow private-beta route-readiness candidate evidence with tracked validation "
            "while preserving public-demo, plugin, Hosted GPT/BYOK, launch hub, async, and runtime mutation boundaries."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:58",
        "color": "C8E6C9",
        "description": "Phase 58 private-beta route readiness evidence gate work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 58 exit gate",
        "Phase 58: sync repo truth after PR #452 and define route-readiness evidence gate",
        "Phase 58: reproduce private-beta route-readiness snapshots with tracked smoke coverage",
    ]:
        assert title in titles
        assert titles[title]["milestone"] == "Phase 58 - Private-Beta Route Readiness Evidence Gate"
        assert "phase:58" in titles[title]["labels"]
