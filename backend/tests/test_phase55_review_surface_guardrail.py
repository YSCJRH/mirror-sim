from __future__ import annotations

from pathlib import Path


HOME_PAGE = Path("frontend/src/app/page.tsx")
REVIEW_PAGE = Path("frontend/src/app/review/page.tsx")
LEGACY_PANEL = Path("frontend/src/app/components/legacy-operations-panel.tsx")
NAVIGATION = Path("frontend/src/app/lib/main-path-navigation.ts")

MAIN_PATH_STORY = 'data-main-path-story="world>baseline>perturbation>change>explain"'


def _read(path: Path) -> str:
    assert path.exists()
    return path.read_text(encoding="utf-8")


def _assert_in_order(source: str, markers: list[str]) -> None:
    cursor = -1
    for marker in markers:
        next_position = source.find(marker, cursor + 1)
        assert next_position > cursor, marker
        cursor = next_position


def test_public_demo_declares_analysis_first_product_story() -> None:
    source = _read(HOME_PAGE)

    assert MAIN_PATH_STORY in source
    assert "ReviewScorecard" not in source
    assert "LegacyOperationsPanel" not in source
    assert "advanced-operations" not in source


def test_review_surface_keeps_analyst_mode_after_main_analysis_path() -> None:
    source = _read(REVIEW_PAGE)

    assert MAIN_PATH_STORY in source
    assert 'data-review-surface="advanced-analyst-mode"' in source
    assert "Advanced Analyst Mode" in source

    _assert_in_order(
        source,
        [
            "<ReviewRubricPanel",
            'id="trace-claims"',
            'id="claims"',
            'id="reference"',
            'id="advanced-operations"',
            "<LegacyOperationsPanel",
        ],
    )

    assert "The default bilingual path stays in the scorecard, trace, claims, and reference sections above." in source
    assert "Open the legacy tools only when the main path is not enough for your judgment." in source


def test_legacy_scorecard_remains_lazy_compatibility_surface() -> None:
    source = _read(LEGACY_PANEL)

    assert 'data-legacy-review-surface="deferred-compatibility"' in source
    assert "Loading legacy compatibility tools" in source
    assert "const [shouldRenderScorecard, setShouldRenderScorecard] = useState(false);" in source
    assert "if ((event.currentTarget as HTMLDetailsElement).open)" in source

    _assert_in_order(
        source,
        [
            "const ReviewScorecard = dynamic(",
            "const [shouldRenderScorecard, setShouldRenderScorecard] = useState(false);",
            "shouldRenderScorecard ?",
            "<ReviewScorecard",
        ],
    )


def test_main_path_navigation_keeps_review_after_explain() -> None:
    source = _read(NAVIGATION)

    _assert_in_order(
        source,
        [
            'href: "/"',
            'href: "/perturb"',
            "withSimulationSession(`/changes/${branchId}`",
            "withSimulationSession(`/explain/${branchId}`",
            'href: "/review"',
        ],
    )
