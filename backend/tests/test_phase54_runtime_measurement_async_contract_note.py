from __future__ import annotations

from pathlib import Path


NOTE_PATH = Path("docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md")


def test_phase54_runtime_measurement_decision_note_exists_with_required_sections() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 54 Runtime Measurement and Async Contract Decision",
        "Issue: `#428`",
        "## Measurement Scope",
        "## Command Path",
        "## Observed Evidence",
        "## Limits",
        "## Decision",
        "## Allowed Claims",
        "## Blocked Claims",
        "## Async Contract Criteria",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in note


def test_phase54_runtime_measurement_decision_records_evidence_and_boundary() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "`docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md`",
        "`docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md`",
        "`docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md`",
        "ADR-0006",
        "V1 does not introduce task queues or a separate `task_id` contract",
        "sample count: 3",
        "deterministic_only",
        "`generate-branch` average: 1381.9 ms",
        "`start-session + generate-branch` average: 2521.8 ms",
        "This is still local deterministic evidence, not a hosted/private-beta model measurement",
        "Keep synchronous generation for v1",
        "Defer async task contract ratification",
        "No new async worker, task queue, `task_id`, heartbeat, retry, status, cleanup, checkpoint mutation/deletion, restore, or background job API is ratified by this note",
        "TODO[verify]: rerun hosted/private-beta model measurements before ratifying async worker semantics.",
    ]
    for phrase in required_phrases:
        assert phrase in note


def test_phase54_active_docs_point_to_runtime_measurement_decision_note() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-54-successor-gate-2026-05-19.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "`#428`" in text
        assert "Phase 54 Runtime Measurement and Async Contract Decision" in text
        assert "`docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md`" in text
        assert "Keep synchronous generation for v1" in text
        assert "Defer async task contract ratification" in text
        assert "public demo, plugin, Hosted GPT/BYOK, launch hub, async, and runtime mutation boundaries remain unchanged" in text


def test_phase54_decision_does_not_claim_async_task_contract_is_implemented() -> None:
    docs = [
        NOTE_PATH,
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-54-successor-gate-2026-05-19.md"),
    ]
    banned_phrases = [
        "async workers are implemented",
        "task queues are implemented",
        "`task_id` contract is ratified",
        "background job API is implemented",
        "Hosted GPT/BYOK is enabled",
    ]

    for path in docs:
        text = path.read_text(encoding="utf-8")
        for phrase in banned_phrases:
            assert phrase not in text, f"{path} claims an out-of-scope async/runtime expansion: {phrase}"
