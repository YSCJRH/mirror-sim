from __future__ import annotations

from pathlib import Path


PHASE51_GATE_PATH = Path("docs/plans/phase-51-successor-gate-2026-05-18.md")


def test_phase51_successor_gate_exists_with_required_sections() -> None:
    assert PHASE51_GATE_PATH.exists()

    gate = PHASE51_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 51 Successor Gate",
        "Issue: `#405` `Phase 51: ratify private-beta route ownership and launch-hub contract`",
        "Current work item: `#405` `Phase 51: ratify private-beta route ownership and launch-hub contract`",
        "## Phase 50 Closeout Evidence",
        "## Phase 51 Operational Queue",
        "## Protected-Core Lane Coverage",
        "## Carried Forward TODO[verify] Items",
        "## Phase 51 Work Package Map",
        "## Blueprint Boundary",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase51_successor_gate_records_queue_and_boundaries() -> None:
    assert PHASE51_GATE_PATH.exists()

    gate = PHASE51_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate",
        "`#403` `Phase 51 exit gate`",
        "`#404` `Phase 51: sync repo truth after Phase 50 closeout`",
        "`#405` `Phase 51: ratify private-beta route ownership and launch-hub contract`",
        "`#406` `Phase 51: verify runtime readiness thresholds and world-scoped session guards`",
        "Private-beta route contract",
        "Phase 51 Private-Beta Route Ownership Contract",
        "Runtime readiness and world-scoped session guards",
        "TODO[verify]: Codex UI tool-card",
        "Runtime generation duration is now recorded",
        "Keep synchronous generation for v1",
        "Phase 50 Product Boundary Decision",
        "launch hub remains planning-only for now",
        "Every report claim must keep both `label` and `evidence_ids`",
        "Do not present Mirror as a real-world prediction machine",
        "Do not implement async workers, queues, `task_id`, retry, status, cleanup",
        "Do not recreate local Codex automations without a new explicit operator request",
        "`docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md`",
        "`docs/plans/phase-50-product-boundary-2026-05-18.md`",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_active_state_docs_point_to_phase51_queue() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-50-successor-gate-2026-05-18.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "Phase 50 - Runtime Orchestration Measurement and Product Boundary" in text
        assert "Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate" in text
        assert "`#403`" in text
        assert "`#404`" in text
        assert "`#405`" in text
        assert "`#406`" in text
        assert "private-beta route ownership" in text
        assert "world-scoped session guards" in text
