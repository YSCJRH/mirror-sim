from __future__ import annotations

from pathlib import Path


EVIDENCE_PATH = Path("docs/plans/phase-59-selected-world-route-evidence-2026-05-23.md")
GATE_PATH = Path("docs/plans/phase-59-selected-world-route-continuity-gate-2026-05-23.md")
SMOKE_PATH = Path("scripts/smoke_phase59_selected_world_routes_web.py")
PHASE58_SMOKE_PATH = Path("scripts/smoke_phase58_route_readiness_web.py")
WORLD_HOME_PAGE = Path("frontend/src/app/worlds/[worldId]/page.tsx")
WORLD_REVIEW_PAGE = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")


SELECTED_WORLD_IDS = [
    "fog-harbor-east-gate",
    "museum-night",
    "library-rain",
]


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase59_smoke_is_separate_get_only_selected_world_route_matrix() -> None:
    smoke = _read(SMOKE_PATH)
    phase58_smoke = _read(PHASE58_SMOKE_PATH)

    assert "Phase 59" in smoke
    assert "selected-world route continuity" in smoke
    assert "phase59_selected_world_routes_get_only" in smoke
    assert "phase58_route_readiness_get_only" in phase58_smoke

    required_paths = ['"/"', '"/review"']
    for world_id in SELECTED_WORLD_IDS:
        required_paths.extend([f'"/worlds/{world_id}?session="', f'"/worlds/{world_id}/review?session="'])

    for route in required_paths:
        assert route in smoke

    required_markers = [
        "Mirror Public Demo",
        "Advanced Analyst Mode",
        "Fog Harbor East Gate",
        "Museum Night",
        "Library Rain",
        "Mirror Engine / Private Beta",
        "Generate one live branch first",
    ]
    for marker in required_markers:
        assert marker in smoke

    forbidden_terms = [
        "start-session",
        "generate-branch",
        "rollback-session",
        "worlds/create",
        'method="POST"',
        "task_id",
        "async worker",
        "Hosted GPT is enabled",
        "BYOK is enabled",
    ]
    for term in forbidden_terms:
        assert term not in smoke


def test_current_frontend_supports_selected_world_routes_without_static_world_whitelist() -> None:
    world_home = _read(WORLD_HOME_PAGE)
    world_review = _read(WORLD_REVIEW_PAGE)

    assert "params: Promise<{ worldId: string }>" in world_home
    assert "loadProductWorldConfig(worldId, locale)" in world_home
    assert "findLatestRuntimeSessionForWorld(worldId)" in world_home
    assert "`/worlds/${worldId}`" in world_home
    assert "`/worlds/${worldId}/review" in world_home
    assert "launch hub" not in world_home.lower()

    assert "params: Promise<{ worldId: string }>" in world_review
    assert "loadProductWorldConfig(worldId, locale)" in world_review
    assert "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)" in world_review
    assert "Mirror Engine / Private Beta" in world_review
    assert "This is the world-scoped advanced review surface" in world_review
    assert "Generate one live branch first, then come back for advanced review" in world_review


def test_phase59_selected_world_route_evidence_note_records_reproduced_signal_and_limits() -> None:
    evidence = _read(EVIDENCE_PATH)

    required_sections = [
        "# Phase 59 Selected-World Route Evidence",
        "Issue: `#461` `Phase 59: add GET-only selected-world route smoke for Fog Harbor, Museum Night, and Library Rain`",
        "## Reproduced Evidence",
        "## Route Smoke Coverage",
        "## Source Anchors",
        "## Boundary Limits",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in evidence

    required_phrases = [
        "`npm run build --prefix frontend`",
        "`python scripts/smoke_phase59_selected_world_routes_web.py --timeout 60`",
        "`/` remains the guided Phase 1 public demo",
        "`/review` remains the read-only public advanced analyst surface",
        "`/worlds/<world_id>?session=` forces the private-beta candidate world home into no-session route-ownership markers",
        "`/worlds/<world_id>/review?session=` forces the world-scoped private-beta review surface into explicit no-session limits",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "This is narrow GET-only route-readiness evidence for selected bounded fictional worlds, not broad private-beta readiness.",
        "does not promote future-world readiness",
        "does not add async/task_id behavior",
        "does not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion",
    ]
    for phrase in required_phrases:
        assert phrase in evidence


def test_phase59_docs_reference_tracked_route_evidence_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        GATE_PATH,
        EVIDENCE_PATH,
    ]
    required_phrase = "`docs/plans/phase-59-selected-world-route-evidence-2026-05-23.md`"
    forbidden_phrases = [
        "Phase 59 promotes broad private-beta readiness",
        "Phase 59 promotes future-world readiness",
        "Phase 59 implements launch hub",
        "Phase 59 replaces `/`",
        "Phase 59 adds Hosted GPT",
        "Phase 59 adds BYOK",
        "Phase 59 adds upload",
        "Phase 59 adds auth",
        "Phase 59 ratifies task_id",
        "Phase 59 changes scenario DSL",
        "Phase 59 changes claim labels",
        "Phase 59 changes plugin MCP contract",
        "Phase 59 claims runtime generation proven by route smoke",
    ]

    for path in docs:
        text = _read(path)
        assert required_phrase in text, f"{path} is missing the Phase 59 route evidence note"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 59 scope: {phrase}"
