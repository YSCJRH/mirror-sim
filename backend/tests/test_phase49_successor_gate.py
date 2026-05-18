from __future__ import annotations

from pathlib import Path


PHASE49_GATE_PATH = Path("docs/plans/phase-49-successor-gate-2026-05-18.md")


def test_phase49_successor_gate_exists_with_required_sections() -> None:
    assert PHASE49_GATE_PATH.exists()

    gate = PHASE49_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 49 Successor Gate",
        "Issue: `#384` `Phase 49: sync repo truth and protect runtime core lanes`",
        "## Phase 48 Closeout Evidence",
        "## Phase 49 Operational Queue",
        "## Protected-Core Lane Coverage",
        "## Carried Forward TODO[verify] Items",
        "## Phase 49 Work Package Map",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase49_successor_gate_records_work_packages_and_boundaries() -> None:
    assert PHASE49_GATE_PATH.exists()

    gate = PHASE49_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Phase 49 - Kernel, Perturbation, and Runtime Contract Hardening",
        "`#383` `Phase 49 exit gate`",
        "`#384` `Phase 49: sync repo truth and protect runtime core lanes`",
        "`#386` `Phase 49: ratify kernel trace and replay contract`",
        "Kernel trace and replay contract",
        "Perturbation schema and resolver contract",
        "Branch generation and compare emission policy",
        "Rollback, checkpoint, and latest-activity semantics",
        "Fog Harbor de-specialization and transfer evals",
        "Runtime orchestration decision",
        "Every report claim must keep both `label` and `evidence_ids`",
        "Do not present Mirror as a real-world prediction machine",
        "Do not build real-person personas or digital doubles",
        "TODO[verify]: Codex UI tool-card",
        "TODO[verify]: Latest-session versus latest-activity",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_active_state_docs_point_to_phase49_queue() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-48-successor-gate-2026-05-17.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "Phase 48" in text
        assert "Phase 49 - Kernel, Perturbation, and Runtime Contract Hardening" in text
        assert "`#383`" in text
        assert "`#384`" in text
        assert "`#386`" in text
