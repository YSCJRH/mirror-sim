from __future__ import annotations

from pathlib import Path


PHASE50_GATE_PATH = Path("docs/plans/phase-50-successor-gate-2026-05-18.md")


def test_phase50_successor_gate_exists_with_required_sections() -> None:
    assert PHASE50_GATE_PATH.exists()

    gate = PHASE50_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 50 Successor Gate",
        "Issue: `#397` `Phase 50: sync repo truth after Phase 49 closeout`",
        "## Phase 49 Closeout Evidence",
        "## Phase 50 Operational Queue",
        "## Protected-Core Lane Coverage",
        "## Carried Forward TODO[verify] Items",
        "## Phase 50 Work Package Map",
        "## Blueprint Boundary",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase50_successor_gate_records_queue_and_boundaries() -> None:
    assert PHASE50_GATE_PATH.exists()

    gate = PHASE50_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Phase 50 - Runtime Orchestration Measurement and Product Boundary",
        "`#396` `Phase 50 exit gate`",
        "`#397` `Phase 50: sync repo truth after Phase 49 closeout`",
        "`#398` `Phase 50: measure runtime generation duration before task_id decision`",
        "Runtime orchestration measurement",
        "Product boundary follow-up",
        "TODO[verify]: Codex UI tool-card",
        "TODO[verify]: Measure runtime generation duration before introducing `task_id`",
        "Every report claim must keep both `label` and `evidence_ids`",
        "Do not present Mirror as a real-world prediction machine",
        "Do not implement async workers, queues, `task_id`, retry, status, cleanup",
        "Do not recreate local Codex automations without a new explicit operator request",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_active_state_docs_point_to_phase50_queue() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-48-successor-gate-2026-05-17.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "Phase 49" in text
        assert "Phase 50 - Runtime Orchestration Measurement and Product Boundary" in text
        assert "`#396`" in text
        assert "`#397`" in text
        assert "`#398`" in text
        assert "task_id" in text
