from __future__ import annotations

from pathlib import Path


NOTE_PATH = Path("docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md")


def test_phase51_runtime_guard_note_exists_with_required_sections() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 51 Runtime Readiness and World-Scoped Guard Verification",
        "Issue: `#406`",
        "## Decision",
        "## Evidence",
        "## Guard Fixes",
        "## Runtime Readiness Threshold",
        "## Follow-Up Gate",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in note


def test_phase51_runtime_guard_note_records_guard_contract_and_boundaries() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Keep synchronous generation for v1",
        "`task_id`, worker, retry, status, and cleanup semantics remain out of scope",
        "The private-beta composer now sends route-derived `worldId` to `/api/runtime/generate-branch`",
        "Minimal home runtime generation and rollback requests now include route-derived `worldId`",
        "runtime CLI wrappers now pass `--world` to mutating session commands",
        "backend session services reject expected-world mismatches",
        "world-scoped workspace loading now rejects session or node manifests whose `world_id` conflicts with the route `worldId`",
        "world-scoped workspace loading now rejects node manifests whose `session_id` conflicts with the route `sessionId`",
        "lineage node manifests must also match the route `worldId` and `sessionId`",
        "Direct local CLI calls may omit `--world` for compatibility when the operator provides an explicit artifacts root",
        "Product and web-wrapper mutation calls must pass `--world`",
        "`docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md`",
        "No public demo, plugin, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or async contract is widened",
        "TODO[verify]: rerun hosted/private-beta model measurements before introducing async task semantics",
    ]
    for phrase in required_phrases:
        assert phrase in note


def test_active_phase51_docs_point_to_runtime_guard_work() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/phase-51-successor-gate-2026-05-18.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "`#406`" in text
        assert "Phase 51 Runtime Readiness and World-Scoped Guard Verification" in text
        assert "`docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md`" in text


def test_runtime_guard_contract_records_route_derived_world_id_requirement() -> None:
    contract = Path("docs/architecture/contracts.md").read_text(encoding="utf-8")

    required_phrases = [
        "Private-beta composer requests must pass route-derived `worldId`",
        "World-scoped runtime workspace loading must reject session or node manifests whose `world_id` conflicts with the route `worldId`",
        "World-scoped runtime workspace loading must reject node manifests whose `session_id` conflicts with the route `sessionId`",
        "Lineage node manifests must also match the route `worldId` and `sessionId` before the workspace can render.",
        "Direct local CLI calls may omit `--world` for compatibility when the operator provides an explicit artifacts root.",
        "Product and web-wrapper mutation calls must pass `--world`; when `--world` is provided, backend services must reject mismatches before branch generation or rollback.",
    ]
    for phrase in required_phrases:
        assert phrase in contract
