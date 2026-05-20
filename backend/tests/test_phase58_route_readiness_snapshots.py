from __future__ import annotations

from pathlib import Path


EVIDENCE_PATH = Path("docs/plans/phase-58-route-readiness-snapshot-evidence-2026-05-20.md")
GATE_PATH = Path("docs/plans/phase-58-route-readiness-evidence-gate-2026-05-20.md")
SMOKE_PATH = Path("scripts/smoke_phase58_route_readiness_web.py")
HOME_PAGE = Path("frontend/src/app/page.tsx")
PUBLIC_REVIEW_PAGE = Path("frontend/src/app/review/page.tsx")
WORLD_HOME_PAGE = Path("frontend/src/app/worlds/[worldId]/page.tsx")
WORLD_REVIEW_PAGE = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def _assert_in_order(source: str, markers: list[str]) -> None:
    cursor = -1
    for marker in markers:
        next_position = source.find(marker, cursor + 1)
        assert next_position > cursor, marker
        cursor = next_position


def test_current_frontend_routes_support_narrow_phase58_readiness_signal() -> None:
    home = _read(HOME_PAGE)
    public_review = _read(PUBLIC_REVIEW_PAGE)
    world_home = _read(WORLD_HOME_PAGE)
    world_review = _read(WORLD_REVIEW_PAGE)

    assert 'title: "Mirror Public Demo"' in home
    assert "Deterministic-only Phase 1" in home
    assert "Replay a bounded what-if world without accounts, uploads, or model calls." in home
    assert "Runtime mutation, create-world, corpus upload, Hosted GPT, BYOK" in home
    assert "launch hub" not in home.lower()

    assert 'data-review-surface="advanced-analyst-mode"' in public_review
    assert "loadAnalystReview()" in public_review
    assert "loadRuntimeSessionWorkspaceForWorld" not in public_review
    _assert_in_order(
        public_review,
        [
            "<ReviewRubricPanel",
            'id="trace-claims"',
            'id="claims"',
            'id="reference"',
            'id="advanced-operations"',
            "<LegacyOperationsPanel",
        ],
    )

    assert "params: Promise<{ worldId: string }>" in world_home
    assert "loadProductWorldConfig(worldId, locale)" in world_home
    assert "findLatestRuntimeSessionForWorld(worldId)" in world_home
    assert "`/worlds/${worldId}`" in world_home
    assert "`/worlds/${worldId}/perturb" in world_home
    assert "`/worlds/${worldId}/review" in world_home
    assert "launch hub" not in world_home.lower()

    assert "params: Promise<{ worldId: string }>" in world_review
    assert "loadProductWorldConfig(worldId, locale)" in world_review
    assert "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)" in world_review
    assert "Mirror Engine / Private Beta" in world_review
    assert "This is the world-scoped advanced review surface" in world_review
    assert "Generate one live branch first, then come back for advanced review" in world_review
    assert "loadAnalystReview" not in world_review


def test_phase58_get_only_smoke_script_reproduces_route_readiness_set() -> None:
    smoke = _read(SMOKE_PATH)

    required_paths = [
        '"/"',
        '"/review"',
        '"/worlds/fog-harbor-east-gate"',
        '"/worlds/fog-harbor-east-gate/review"',
    ]
    for path in required_paths:
        assert path in smoke

    required_markers = [
        "Mirror Public Demo",
        "Advanced Analyst Mode",
        "Fog Harbor East Gate",
        "Mirror Engine / Private Beta",
        "world-scoped advanced review surface",
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


def test_phase58_snapshot_evidence_note_records_reproduced_signal_and_limits() -> None:
    evidence = _read(EVIDENCE_PATH)

    required_sections = [
        "# Phase 58 Route Readiness Snapshot Evidence",
        "Issue: `#455` `Phase 58: reproduce private-beta route-readiness snapshots with tracked smoke coverage`",
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
        "`python scripts/smoke_private_beta_web.py --timeout 60`",
        "`python scripts/smoke_phase58_route_readiness_web.py --timeout 60`",
        "`/` remains the guided Phase 1 public demo",
        "`/review` remains the read-only public advanced analyst surface",
        "`/worlds/<world_id>` is a private-beta candidate world home",
        "`/worlds/<world_id>/review` is the world-scoped private-beta review surface with explicit no-session limits",
        "This is narrow route-readiness evidence, not broad private-beta readiness.",
        "does not promote launch hub behavior",
        "does not add async/task_id behavior",
        "does not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion",
    ]
    for phrase in required_phrases:
        assert phrase in evidence


def test_phase58_docs_reference_tracked_snapshot_evidence_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        GATE_PATH,
        EVIDENCE_PATH,
    ]
    required_phrase = "`docs/plans/phase-58-route-readiness-snapshot-evidence-2026-05-20.md`"
    forbidden_phrases = [
        "Phase 58 promotes broad private-beta readiness",
        "Phase 58 implements launch hub",
        "Phase 58 replaces `/`",
        "Phase 58 adds Hosted GPT",
        "Phase 58 adds BYOK",
        "Phase 58 adds upload",
        "Phase 58 adds auth",
        "Phase 58 ratifies task_id",
        "Phase 58 changes scenario DSL",
        "Phase 58 changes claim labels",
        "Phase 58 changes plugin MCP contract",
    ]

    for path in docs:
        text = _read(path)
        assert required_phrase in text, f"{path} is missing the Phase 58 snapshot evidence note"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 58 scope: {phrase}"
