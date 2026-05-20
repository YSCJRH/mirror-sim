from __future__ import annotations

from pathlib import Path


PHASE57_GATE_PATH = Path("docs/plans/phase-57-successor-boundary-2026-05-20.md")


def test_phase57_successor_boundary_exists_with_required_sections() -> None:
    assert PHASE57_GATE_PATH.exists()

    gate = PHASE57_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 57 Successor Boundary",
        "Issue: `#449` `Phase 57: sync repo truth after Phase 56 closeout and define successor boundary`",
        "Current state: Phase 57 is the active minimal successor-boundary queue.",
        "## Phase 56 Closeout Evidence",
        "## Phase 57 Operational Queue",
        "## Successor Boundary",
        "## Candidate-Only Guardrails",
        "## Carried Forward TODO[verify] Items",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase57_successor_boundary_records_queue_and_closed_phase56() -> None:
    assert PHASE57_GATE_PATH.exists()

    gate = PHASE57_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Phase 57 - Post-Phase-56 Repo Truth Sync and Successor Boundary",
        "`#448` `Phase 57 exit gate`",
        "`#449` `Phase 57: sync repo truth after Phase 56 closeout and define successor boundary`",
        "Status: open and blocked.",
        "Status: ready.",
        "Phase 56 is closed after PR `#447`, issue `#440`, and milestone `Phase 56 - Source-Verified Candidate Promotion and Review Continuity`.",
        "`audit-github-queue` returned `paused` with `active_milestone: null` after milestone 56 closed.",
        "`audit-github-queue` now reports `ready` for the active Phase 57 queue.",
        "No product or runtime implementation scope is opened by Phase 57 unless a later reviewed PR adds specific source-backed evidence.",
        "candidate inputs only until a reviewed PR promotes a specific source-verified signal",
        "Do not implement launch hub behavior",
        "Do not add async/task_id behavior",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage",
        "Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_phase57_boundary_docs_do_not_promote_candidate_or_runtime_scope() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE57_GATE_PATH,
    ]
    forbidden_phrases = [
        "Phase 57 implements async",
        "Phase 57 implements launch hub",
        "Phase 57 replaces `/`",
        "Phase 57 widens the public path",
        "Phase 57 adds Hosted GPT",
        "Phase 57 adds BYOK",
        "Phase 57 adds upload",
        "Phase 57 adds auth",
        "Phase 57 ratifies task_id",
        "Phase 57 changes scenario DSL",
        "Phase 57 changes claim labels",
        "Phase 57 changes report claim `evidence_ids`",
        "Phase 57 changes run trace shape",
        "Phase 57 changes compare artifact shape",
        "Phase 57 changes plugin MCP contract",
        "Phase 57 promotes private-beta readiness",
        "Phase 57 promotes untracked planning notes",
    ]

    for path in docs:
        text = path.read_text(encoding="utf-8")
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} promotes blocked Phase 57 scope: {phrase}"
