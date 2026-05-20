from __future__ import annotations

from pathlib import Path


PHASE54_GATE_PATH = Path("docs/plans/phase-54-successor-gate-2026-05-19.md")


def test_phase54_successor_gate_exists_with_required_sections() -> None:
    assert PHASE54_GATE_PATH.exists()

    gate = PHASE54_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 54 Successor Gate",
        "Issue: `#427` `Phase 54: sync repo truth after Phase 53 closeout and define runtime gate`",
        "Current state: Phase 54 is closed; no active successor milestone is open.",
        "## Phase 53 Closeout Evidence",
        "## Phase 54 Operational Queue",
        "## Phase 54 Closeout Evidence",
        "## Runtime-Orchestration Scope",
        "## Protected-Core Lane Coverage",
        "## Carried Forward TODO[verify] Items",
        "## Phase 54 Work Package Map",
        "## Blueprint Boundary",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase54_successor_gate_records_queue_and_boundaries() -> None:
    assert PHASE54_GATE_PATH.exists()

    gate = PHASE54_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Phase 54 - Runtime Orchestration Measurement and Async Contract Decision Gate",
        "`#426` `Phase 54 exit gate`",
        "`#427` `Phase 54: sync repo truth after Phase 53 closeout and define runtime gate`",
        "`#428` `Phase 54: refresh runtime measurement and decide async contract boundary`",
        "Status: closed after post-merge validation.",
        "Status: closed by PR `#429`.",
        "Status: closed by PR `#430`.",
        "formal paused stop-state",
        "Phase 53 is closed after PR `#424`, issue `#418`, and milestone `Phase 53 - Transfer Generalization and Third-World Readiness`",
        "runtime measurement",
        "async contract decision",
        "ADR-0006",
        "V1 does not introduce task queues or a separate `task_id` contract",
        "`docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md`",
        "refresh local deterministic runtime measurement evidence",
        "hosted/private-beta measurement verification as TODO[verify]",
        "Keep synchronous generation for v1",
        "Defer async task contract ratification",
        "did not implement async workers, task queues, `task_id`, heartbeat, retry, cleanup",
        "Do not replace `/` or widen the public path",
        "Do not implement a launch hub",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage",
        "route-derived `worldId` or an equivalent reviewed scope guard",
        "public demo, plugin, Hosted GPT/BYOK, launch hub, async, and runtime mutation boundaries",
        "`docs/plans/phase-54-successor-gate-2026-05-19.md`",
        "`python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reports `paused`",
    ]
    for phrase in required_phrases:
        assert phrase in gate

    stale_phrases = [
        "refresh hosted/private-beta runtime measurement evidence",
        "Refresh hosted/private-beta runtime measurement evidence",
    ]
    for phrase in stale_phrases:
        assert phrase not in gate


def test_active_state_docs_preserve_phase54_closeout_history() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "Phase 54 - Runtime Orchestration Measurement and Async Contract Decision Gate" in text
        assert "`#426`" in text
        assert "`#427`" in text
        assert "`#428`" in text
        assert "Phase 54 Successor Gate" in text
        assert "`docs/plans/phase-54-successor-gate-2026-05-19.md`" in text
        assert "`docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md`" in text
        assert "Phase 54: refresh runtime measurement and decide async contract boundary" in text
        assert "closed by PR `#430`" in text
        assert "formal paused stop-state" in text
        assert "`audit-github-queue` reports `paused`" in text or "reported `paused`" in text
        assert "runtime measurement" in text
        assert "async contract decision" in text
        assert "public demo, plugin, Hosted GPT/BYOK, launch hub, async" in text


def test_active_state_docs_do_not_treat_phase54_as_active() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-54-successor-gate-2026-05-19.md"),
    ]
    stale_current_phrases = [
        "Phase 54 is the active successor queue",
        "Phase 54 is active after opening milestone",
        "Phase 54 exit gate: open and blocked",
        "`#426` remains the blocked exit gate",
        "`audit-github-queue` reports `ready` for the Phase 54 runtime-orchestration successor queue",
        "Exactly one open milestone exists with a protected blocked exit gate and ready work items",
        "active Phase 54 queue",
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        for phrase in stale_current_phrases:
            assert phrase not in text, f"{path} still treats Phase 54 as active: {phrase}"
