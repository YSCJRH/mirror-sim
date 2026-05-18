from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def test_frontend_runtime_locator_uses_last_activity_with_created_at_fallback() -> None:
    source = (REPO_ROOT / "frontend/src/app/lib/runtime-session-data.ts").read_text(encoding="utf-8")

    assert "last_activity_at?: string | null;" in source
    assert "lastActivityAt: session.last_activity_at ?? session.created_at" in source
    assert "new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime()" in source


def test_world_cards_sort_by_latest_activity_not_creation_time() -> None:
    source = (REPO_ROOT / "frontend/src/app/lib/world-product-data.ts").read_text(encoding="utf-8")

    assert "lastActivityAt: latestSession.lastActivityAt" in source
    assert "left.latestSession.lastActivityAt" in source
    assert "right.latestSession.lastActivityAt" in source
