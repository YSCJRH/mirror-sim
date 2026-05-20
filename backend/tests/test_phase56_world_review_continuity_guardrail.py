from __future__ import annotations

from pathlib import Path


NOTE_PATH = Path("docs/plans/phase-56-world-review-continuity-guardrail-2026-05-20.md")
HOME_PAGE = Path("frontend/src/app/page.tsx")
PUBLIC_REVIEW_PAGE = Path("frontend/src/app/review/page.tsx")
WORLD_REVIEW_PAGE = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")
WORLD_RUNTIME_PAGE = Path("frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx")
WORLD_EXPLAIN_PAGE = Path(
    "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/explain/page.tsx"
)
WORLD_REPORT_PAGE = Path(
    "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/report/page.tsx"
)


def _read(path: Path) -> str:
    assert path.exists()
    return path.read_text(encoding="utf-8")


def _assert_in_order(source: str, markers: list[str]) -> None:
    cursor = -1
    for marker in markers:
        next_position = source.find(marker, cursor + 1)
        assert next_position > cursor, marker
        cursor = next_position


def test_world_review_route_preserves_world_session_and_node_scope() -> None:
    source = _read(WORLD_REVIEW_PAGE)

    assert "params: Promise<{ worldId: string }>" in source
    assert "searchParams?: Promise<{ session?: string; node?: string }>" in source
    assert "const { worldId } = await params;" in source
    assert "findLatestRuntimeSessionForWorld(worldId)" in source
    assert "resolvedSearchParams?.session ?? latestSession?.sessionId" in source
    assert "resolvedSearchParams?.node ?? latestSession?.activeNodeId" in source
    assert "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)" in source

    required_scoped_hrefs = [
        "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}?node=${encodeURIComponent(activeNode.node_id)}`",
        "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}/explain?node=${encodeURIComponent(activeNode.node_id)}`",
        "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}/report?node=${encodeURIComponent(activeNode.node_id)}`",
        "`/worlds/${worldId}/perturb?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(activeNode.node_id)}`",
        "`/worlds/${worldId}?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(activeNode.node_id)}`",
        '`/worlds/${worldId}/review?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}${activeNode ? `&node=${encodeURIComponent(activeNode.node_id)}` : ""}`',
    ]
    for href in required_scoped_hrefs:
        assert href in source

    forbidden_legacy_hrefs = [
        'href="/runtime',
        'href="/perturb',
        'href="/changes',
        "`/runtime/${",
        "`/perturb?session=${",
        "`/review?session=${",
    ]
    for href in forbidden_legacy_hrefs:
        assert href not in source


def test_runtime_explain_and_report_return_to_scoped_world_review() -> None:
    pages = [
        WORLD_RUNTIME_PAGE,
        WORLD_EXPLAIN_PAGE,
        WORLD_REPORT_PAGE,
    ]
    for page in pages:
        source = _read(page)

        assert "params: Promise<{ worldId: string; sessionId: string }>" in source
        assert "searchParams?: Promise<{ node?: string }>" in source
        assert "const { worldId, sessionId } = await params;" in source
        assert (
            "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, resolvedSearchParams?.node)"
            in source
        )
        assert (
            "const reviewHref = `/worlds/${worldId}/review?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;"
            in source
        )
        assert "{ href: reviewHref" in source

        forbidden_public_review_links = [
            'href="/review"',
            "`/review?session=${",
            'const reviewHref = "/review',
            "const reviewHref = `/review",
        ]
        for href in forbidden_public_review_links:
            assert href not in source


def test_world_review_keeps_dedicated_followup_section_after_review_context() -> None:
    source = _read(WORLD_REVIEW_PAGE)

    assert "This is the world-scoped advanced review surface: score first" in source
    assert "then decide whether you need runtime / explain / report" in source
    assert "If the scorecard says you need more context" in source
    assert "Generate one live branch first, then come back for advanced review" in source

    _assert_in_order(
        source,
        [
            "<ReviewRubricPanel",
            "<RuntimeReviewBrief",
            "<RuntimeLineagePanel",
            'eyebrow={locale === "zh-CN" ? "审阅入口" : "Review entrypoints"}',
            "If the scorecard says you need more context",
            "Open runtime",
            "Open explain",
            "Open report",
        ],
    )


def test_public_demo_and_world_scoped_review_surfaces_stay_distinct() -> None:
    home = _read(HOME_PAGE)
    public_review = _read(PUBLIC_REVIEW_PAGE)
    world_review = _read(WORLD_REVIEW_PAGE)

    assert 'title: "Mirror Public Demo"' in home
    assert 'href: "/review", label: "Advanced Review"' in home
    assert "loadRuntimeSessionWorkspaceForWorld" not in home
    assert "world-scoped advanced review surface" not in home

    assert 'data-review-surface="advanced-analyst-mode"' in public_review
    assert "loadAnalystReview()" in public_review
    assert "buildMainPathNavigation(locale, \"review\", featuredBranchId)" in public_review
    assert "loadRuntimeSessionWorkspaceForWorld" not in public_review

    assert "Mirror Engine / Private Beta" in world_review
    assert "loadProductWorldConfig(worldId, locale)" in world_review
    assert "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)" in world_review
    assert "loadAnalystReview" not in world_review
    assert "buildMainPathNavigation" not in world_review


def test_phase56_world_review_continuity_note_records_required_guardrails() -> None:
    note = _read(NOTE_PATH)
    required_sections = [
        "# Phase 56 World-Scoped Review Continuity Guardrail",
        "Issue: `#443` `Phase 56: add world-scoped review continuity guardrail`",
        "## Source Evidence",
        "## Guardrail",
        "## Public And Private Surface Separation",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in note

    required_phrases = [
        "`/worlds/<world_id>/review` remains the private-beta world-scoped review surface",
        "world/session/node scope is preserved in follow-up links",
        "runtime, explain, report, perturb, world, and review links stay under `/worlds/<world_id>`",
        "runtime, explain, and report routes return to `/worlds/<world_id>/review` with session and node scope",
        "`/` remains the guided public demo",
        "`/review` remains the public advanced analyst review surface",
        "top-level runtime routes are not promoted as canonical private-beta owners",
        "No frontend route ownership, backend API, scenario DSL, claim/evidence, trace, artifact, or plugin MCP contract changes are made by #443",
    ]
    for phrase in required_phrases:
        assert phrase in note


def test_phase56_world_review_continuity_keeps_non_goals_out() -> None:
    note = _read(NOTE_PATH)
    protected_sources = [
        note,
        _read(WORLD_REVIEW_PAGE),
    ]
    forbidden_phrases = [
        "launch hub is implemented",
        "launch hub owner",
        "Hosted GPT is enabled",
        "BYOK is enabled",
        "task_id is implemented",
        "async worker is implemented",
        "upload corpus is enabled",
        "billing is enabled",
        "quota is enabled",
        "plugin mutation is enabled",
        "new mutating runtime API",
    ]

    for source in protected_sources:
        for phrase in forbidden_phrases:
            assert phrase not in source
