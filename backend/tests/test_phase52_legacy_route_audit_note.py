from __future__ import annotations

from pathlib import Path


NOTE_PATH = Path("docs/plans/phase-52-legacy-runtime-route-audit-2026-05-18.md")


def test_phase52_legacy_route_audit_note_exists_with_required_sections() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 52 Legacy Top-Level Runtime Route Audit",
        "Issue: `#412`",
        "## Decision",
        "## Evidence",
        "## Route Inventory",
        "## Legacy Route Posture",
        "## Follow-Up Gate",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in note


def test_phase52_legacy_route_audit_records_route_posture() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "`/perturb` remains a Fog Harbor-defaulted legacy compatibility surface",
        "`/runtime/<session_id>` remains a Fog Harbor-defaulted legacy compatibility surface",
        "`/runtime/<session_id>/explain` remains a Fog Harbor-defaulted legacy compatibility surface",
        "`/runtime/<session_id>/report` remains a Fog Harbor-defaulted legacy compatibility surface",
        "`/worlds/<world_id>/perturb` remains the canonical private-beta operator route",
        "`/worlds/<world_id>/runtime/<session_id>` remains the canonical world-scoped runtime workspace",
        "Do not redirect, delete, or promote legacy top-level runtime routes in `#412`",
        "Do not present legacy top-level runtime routes as the private-beta main path",
        "No public demo, plugin, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or async contract is widened",
        "Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape",
        "TODO[verify]: open a separate migration work item before redirecting or deleting any legacy top-level runtime route",
    ]
    for phrase in required_phrases:
        assert phrase in note


def test_architecture_contract_records_phase52_legacy_route_posture() -> None:
    contract = Path("docs/architecture/contracts.md").read_text(encoding="utf-8")

    required_phrases = [
        "Top-level `/perturb`, `/runtime/<session_id>`, and child runtime routes remain Fog Harbor-defaulted legacy compatibility surfaces.",
        "They must not be promoted or linked as canonical private-beta route owners.",
        "`/worlds/<world_id>/perturb` remains the canonical private-beta operator route.",
        "`/worlds/<world_id>/runtime/<session_id>` remains the canonical world-scoped runtime workspace.",
        "TODO[verify]: open a separate migration work item before redirecting or deleting any legacy top-level runtime route.",
    ]
    for phrase in required_phrases:
        assert phrase in contract


def test_tracked_frontend_route_tree_contains_legacy_and_world_scoped_runtime_routes() -> None:
    route_files = [
        Path("frontend/src/app/perturb/page.tsx"),
        Path("frontend/src/app/runtime/[sessionId]/page.tsx"),
        Path("frontend/src/app/runtime/[sessionId]/explain/page.tsx"),
        Path("frontend/src/app/runtime/[sessionId]/report/page.tsx"),
        Path("frontend/src/app/worlds/[worldId]/perturb/page.tsx"),
        Path("frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx"),
        Path("frontend/src/app/worlds/[worldId]/runtime/[sessionId]/explain/page.tsx"),
        Path("frontend/src/app/worlds/[worldId]/runtime/[sessionId]/report/page.tsx"),
    ]

    for path in route_files:
        assert path.exists(), path.as_posix()

    legacy_perturb = Path("frontend/src/app/perturb/page.tsx").read_text(encoding="utf-8")
    legacy_runtime = Path("frontend/src/app/runtime/[sessionId]/page.tsx").read_text(
        encoding="utf-8"
    )
    legacy_explain = Path("frontend/src/app/runtime/[sessionId]/explain/page.tsx").read_text(
        encoding="utf-8"
    )
    legacy_report = Path("frontend/src/app/runtime/[sessionId]/report/page.tsx").read_text(
        encoding="utf-8"
    )
    world_runtime = Path("frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx").read_text(
        encoding="utf-8"
    )
    world_explain = Path(
        "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/explain/page.tsx"
    ).read_text(encoding="utf-8")
    world_report = Path(
        "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/report/page.tsx"
    ).read_text(encoding="utf-8")

    assert "loadRuntimeSessionWorkspace(" in legacy_perturb
    assert "loadRuntimeSessionWorkspace(" in legacy_runtime
    assert "loadRuntimeSessionWorkspace(" in legacy_explain
    assert "loadRuntimeSessionWorkspace(" in legacy_report
    assert "loadRuntimeSessionWorkspaceForWorld(worldId" in world_runtime
    assert "loadRuntimeSessionWorkspaceForWorld(worldId" in world_explain
    assert "loadRuntimeSessionWorkspaceForWorld(worldId" in world_report
