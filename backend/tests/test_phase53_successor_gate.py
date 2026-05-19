from __future__ import annotations

from pathlib import Path


PHASE53_GATE_PATH = Path("docs/plans/phase-53-successor-gate-2026-05-19.md")


def test_phase53_successor_gate_exists_with_required_sections() -> None:
    assert PHASE53_GATE_PATH.exists()

    gate = PHASE53_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 53 Successor Gate",
        "Issue: `#419` `Phase 53: sync repo truth after Phase 52 closeout and define transfer gate`",
        "Current state: Phase 53 is closed; no active successor milestone is open.",
        "## Phase 52 Closeout Evidence",
        "## Phase 53 Operational Queue",
        "## Phase 53 Closeout Evidence",
        "## Transfer-Generalization Scope",
        "## Protected-Core Lane Coverage",
        "## Carried Forward TODO[verify] Items",
        "## Phase 53 Work Package Map",
        "## Blueprint Boundary",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase53_successor_gate_records_queue_and_boundaries() -> None:
    assert PHASE53_GATE_PATH.exists()

    gate = PHASE53_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Phase 53 - Transfer Generalization and Third-World Readiness",
        "`#418` `Phase 53 exit gate`",
        "`#419` `Phase 53: sync repo truth after Phase 52 closeout and define transfer gate`",
        "`#420` `Phase 53: audit transfer assumptions and third-world readiness constraints`",
        "`#421` `Phase 53: add bounded third-world transfer readiness evidence`",
        "Status: closed after post-merge validation.",
        "Status: closed by PR `#422`.",
        "Status: closed by PR `#423`.",
        "Status: closed by PR `#424`.",
        "formal paused stop-state",
        "`world_count: 3`",
        "`transfer_proof_world_local: true`",
        "Phase 52 is closed after PR `#416`, issue `#410`, and milestone `Phase 52 - Legacy Route Containment and Runtime Scope Audit`",
        "bounded transfer generalization",
        "third-world readiness",
        "`library-rain`",
        "`docs/plans/phase-53-third-world-transfer-evidence-2026-05-19.md`",
        "Do not claim transfer generalization beyond the evidence that has actually passed",
        "Do not use real-world data, real-person personas, or digital doubles",
        "Do not implement a launch hub",
        "Do not implement async workers, queues, `task_id`, retry, status, cleanup",
        "Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape",
        "public demo, plugin, Hosted GPT/BYOK, launch hub, async, and runtime mutation boundaries",
        "Every report claim must keep both `label` and `evidence_ids`",
        "`docs/plans/phase-49-transfer-assumption-inventory-2026-05-18.md`",
        "`docs/plans/phase-52-successor-gate-2026-05-18.md`",
        "`docs/plans/phase-53-successor-gate-2026-05-19.md`",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_active_state_docs_point_to_phase53_queue() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "Phase 53 - Transfer Generalization and Third-World Readiness" in text
        assert "`#418`" in text
        assert "`#419`" in text
        assert "`#420`" in text
        assert "`#421`" in text
        assert "Phase 53 Successor Gate" in text
        assert "`docs/plans/phase-53-successor-gate-2026-05-19.md`" in text
        assert "Phase 53: audit transfer assumptions and third-world readiness constraints" in text
        assert "Phase 53: add bounded third-world transfer readiness evidence" in text
        assert "closed by PR `#424`" in text
        assert "formal paused stop-state" in text
        assert "`library-rain`" in text
        assert "bounded transfer generalization" in text
        assert "third-world readiness" in text
        assert "public demo, plugin, Hosted GPT/BYOK, launch hub, async" in text


def test_active_state_docs_do_not_treat_phase52_pause_as_current() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]
    stale_current_phrases = [
        "Phase 53 is the active approved successor queue",
        "Phase 53 is the active",
        "current ready Phase 53",
        "current ready work item",
        "Phase 53 exit gate: open and blocked",
        "`audit-github-queue` reports `ready` with `#418` as the blocked exit gate",
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        for phrase in stale_current_phrases:
            assert phrase not in text, f"{path} still treats Phase 53 as active: {phrase}"
