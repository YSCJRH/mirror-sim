from __future__ import annotations

from pathlib import Path


PHASE55_GATE_PATH = Path("docs/plans/phase-55-successor-gate-2026-05-20.md")


def test_phase55_successor_gate_exists_with_required_sections() -> None:
    assert PHASE55_GATE_PATH.exists()

    gate = PHASE55_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 55 Successor Gate",
        "Issue: `#433` `Phase 55: sync repo truth after Phase 54 closeout and define main-path gate`",
        "Current state: Phase 55 is the active successor queue",
        "## Phase 54 Closeout Evidence",
        "## Phase 55 Operational Queue",
        "## Analysis-First Main-Path Scope",
        "## Candidate Planning Input Rules",
        "## Protected-Core Lane Coverage",
        "## Carried Forward TODO[verify] Items",
        "## Phase 55 Work Package Map",
        "## Blueprint Boundary",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase55_successor_gate_records_queue_and_boundaries() -> None:
    assert PHASE55_GATE_PATH.exists()

    gate = PHASE55_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Phase 55 - Analysis-First Main Path and Review Surface Guardrails",
        "`#432` `Phase 55 exit gate`",
        "`#433` `Phase 55: sync repo truth after Phase 54 closeout and define main-path gate`",
        "`#434` `Phase 55: audit candidate product-reframe plans and freeze contract-safe scope`",
        "`#435` `Phase 55: add analysis-first review-surface regression guardrail`",
        "`ready` with exactly one open milestone",
        "analysis-first main-path and review-surface guardrail phase",
        "candidate inputs only until a PR intentionally promotes",
        "Candidate notes that claim `/` is already a launch hub",
        "Hosted GPT/BYOK",
        "Keep synchronous generation for v1",
        "deferred async task contract ratification",
        "Do not implement async workers",
        "Do not implement a launch hub",
        "Do not replace `/` or widen the public path",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage",
        "public demo, plugin, Hosted GPT/BYOK, launch hub, async implementation, and runtime mutation boundaries unchanged",
        "`docs/plans/phase-55-successor-gate-2026-05-20.md`",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_active_state_docs_record_phase55_active_queue() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "Phase 55 - Analysis-First Main Path and Review Surface Guardrails" in text
        assert "`#432`" in text
        assert "`#433`" in text
        assert "`#434`" in text
        assert "`#435`" in text
        assert "Phase 55 Successor Gate" in text
        assert "`docs/plans/phase-55-successor-gate-2026-05-20.md`" in text
        assert "`audit-github-queue` reports `ready`" in text
        assert "Phase 54 is closed after PR `#430`" in text
        assert "Keep synchronous generation for v1. Defer async task contract ratification." in text
        assert "untracked" in text
        assert "candidate inputs" in text


def test_active_state_docs_do_not_treat_phase55_as_closed_or_expanded() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE55_GATE_PATH,
    ]
    stale_or_expanded_phrases = [
        "Phase 55 is closed",
        "Phase 55 exit gate: closed",
        "Phase 55 milestone is closed",
        "Phase 55 implements async",
        "Phase 55 implements a launch hub",
        "Phase 55 adds Hosted GPT",
        "Phase 55 adds BYOK",
        "Phase 55 changes the public path",
        "No active successor milestone is open after Phase 54 closeout",
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        for phrase in stale_or_expanded_phrases:
            assert phrase not in text, f"{path} has stale or expanded Phase 55 wording: {phrase}"
