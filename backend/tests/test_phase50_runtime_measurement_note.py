from __future__ import annotations

from pathlib import Path


NOTE_PATH = Path("docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md")


def test_phase50_runtime_measurement_note_exists_with_required_sections() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 50 Runtime Generation Duration Measurement",
        "Issue: `#398`",
        "## Measurement Scope",
        "## Command Path",
        "## Environment",
        "## Sample Set",
        "## Observed Durations",
        "## Limits",
        "## Protected-Core Decision",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in note


def test_phase50_runtime_measurement_note_records_required_evidence() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "deterministic_only",
        "sample count: 5",
        "start-session",
        "generate-branch",
        "frontend/src/app/api/runtime/generate-branch/route.ts",
        "backend/app/sessions/service.py",
        "ADR-0006",
        "V1 does not introduce task queues or a separate `task_id` contract",
        "Keep synchronous generation for v1",
        "Do not implement async workers, queues, `task_id`, retry, status, or cleanup",
        "TODO[verify]: rerun measurement with hosted/private-beta model access before ratifying async worker semantics",
    ]
    for phrase in required_phrases:
        assert phrase in note
