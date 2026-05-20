from __future__ import annotations

from pathlib import Path


PHASE56_GATE_PATH = Path("docs/plans/phase-56-successor-gate-2026-05-20.md")


def test_phase56_successor_gate_exists_with_required_sections() -> None:
    assert PHASE56_GATE_PATH.exists()

    gate = PHASE56_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 56 Successor Gate",
        "Issue: `#441` `Phase 56: sync repo truth after Phase 55 closeout and define source-verified gate`",
        "Current state: Phase 56 is in closeout; the active milestone has no ready work items.",
        "## Phase 55 Closeout Evidence",
        "## Phase 56 Operational Queue",
        "## Phase 56 Closeout Evidence",
        "## Source-Verified Candidate Promotion Scope",
        "## Candidate Input Rules",
        "## Protected-Core Lane Coverage",
        "## Carried Forward TODO[verify] Items",
        "## Phase 56 Work Package Map",
        "## Blueprint Boundary",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase56_successor_gate_records_queue_and_boundaries() -> None:
    assert PHASE56_GATE_PATH.exists()

    gate = PHASE56_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Phase 56 - Source-Verified Candidate Promotion and Review Continuity",
        "`#440` `Phase 56 exit gate`",
        "`#441` `Phase 56: sync repo truth after Phase 55 closeout and define source-verified gate`",
        "`#442` `Phase 56: source-verify candidate planning signals against current frontend`",
        "`#443` `Phase 56: add world-scoped review continuity guardrail`",
        "Status: pending close by this closeout PR after post-merge validation.",
        "Status: closed by PR `#444`.",
        "Status: closed by PR `#445`.",
        "Status: closed by PR `#446`.",
        "`paused` because the active milestone has no ready work items",
        "source-verified candidate-promotion and review-continuity phase",
        "candidate inputs only until a reviewed PR promotes a specific source-verified signal",
        "Do not import April/private-beta/kernel/design-system planning notes wholesale",
        "Do not add any new mutating runtime API in Phase 56",
        "`/` remains the guided public demo",
        "`/review` remains an advanced read-only public-demo review surface",
        "`/worlds/<world_id>/review` remains the world-scoped private-beta review surface",
        "Keep synchronous generation for v1",
        "deferred async task contract ratification",
        "Do not implement async workers",
        "Do not implement a launch hub",
        "Do not replace `/` or widen the public path",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage",
        "public demo, plugin, Hosted GPT/BYOK, launch hub, async implementation, and runtime mutation boundaries unchanged",
        "`docs/plans/phase-56-successor-gate-2026-05-20.md`",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_active_state_docs_record_phase56_closeout_queue() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "Phase 56 - Source-Verified Candidate Promotion and Review Continuity" in text
        assert "`#440`" in text
        assert "`#441`" in text
        assert "`#442`" in text
        assert "`#443`" in text
        assert "Phase 56 Successor Gate" in text
        assert "`docs/plans/phase-56-successor-gate-2026-05-20.md`" in text
        assert "`audit-github-queue` reports `paused`" in text
        assert "Phase 55 is closed after PR `#438`" in text
        assert "Keep synchronous generation for v1. Defer async task contract ratification." in text
        assert "candidate inputs only" in text
        assert "source-verified" in text
        assert "Phase 56 is in closeout after PR `#446`" in text
        assert "`#440` is pending close by this closeout PR" in text
        assert "`#441` closed by PR `#444`" in text
        assert "`#442` closed by PR `#445`" in text
        assert "`#443` closed by PR `#446`" in text


def test_active_state_docs_do_not_treat_phase56_as_active_or_expanded() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE56_GATE_PATH,
    ]
    stale_or_expanded_phrases = [
        "Phase 56 is active",
        "Phase 56 exit gate: open and blocked",
        "`#440` `Phase 56 exit gate` is open and blocked",
        "`#440` is the blocked exit gate",
        "`#441`, `#442`, and `#443` are ready work items",
        "`#441` `Phase 56: sync repo truth after Phase 55 closeout and define source-verified gate` is ready",
        "`#442` `Phase 56: source-verify candidate planning signals against current frontend` is ready",
        "`#443` `Phase 56: add world-scoped review continuity guardrail` is ready",
        "`audit-github-queue` reports `ready` for the active Phase 56 queue",
        "`audit-github-queue` reports `ready` with `#440` as the blocked exit gate",
        "Phase 56 closeout is complete",
        "Phase 56 closeout complete",
        "Phase 56 closeout is completed",
        "completed Phase 56 successor queue",
        "completed Phase 56 source-verified candidate-promotion successor queue",
        "completed Phase 56 Successor Gate",
        "Phase 56 Closed Queue",
        "active Phase 56 source-verified candidate-promotion successor queue",
        "active Phase 56 successor queue",
        "active successor milestone is `Phase 56 - Source-Verified Candidate Promotion and Review Continuity`",
        "Phase 56 is closed after PR `#446`",
        "no active successor milestone remains",
        "no active successor milestone is open",
        "milestone `Phase 56 - Source-Verified Candidate Promotion and Review Continuity` is closed",
        "Phase 56 exit gate: closed",
        "`#440` `Phase 56 exit gate` is closed",
        "Phase 56 implements async",
        "Phase 56 implements a launch hub",
        "Phase 56 replaces `/`",
        "Phase 56 widens the public path",
        "Phase 56 adds Hosted GPT",
        "Phase 56 adds BYOK",
        "Phase 56 adds upload",
        "Phase 56 adds auth",
        "Phase 56 ratifies task_id",
        "Phase 56 changes scenario DSL",
        "Phase 56 changes claim labels",
        "Phase 56 changes report claim `evidence_ids`",
        "Phase 56 changes run trace shape",
        "Phase 56 changes compare artifact shape",
        "Phase 56 changes plugin MCP contract",
        "No active successor milestone is open after Phase 55 closeout",
        "Do not add new mutating runtime APIs without route-derived",
        "before adding any new mutating runtime API",
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        for phrase in stale_or_expanded_phrases:
            assert phrase not in text, f"{path} has stale or expanded Phase 56 wording: {phrase}"
