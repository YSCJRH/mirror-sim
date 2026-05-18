from __future__ import annotations

from pathlib import Path


NOTE_PATH = Path("docs/plans/phase-50-product-boundary-2026-05-18.md")


def test_phase50_product_boundary_note_exists_with_required_sections() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 50 Product Boundary Decision",
        "Issue: `#401`",
        "## Decision",
        "## Evidence",
        "## Public Demo Boundary",
        "## Plugin Boundary",
        "## Private-Beta Boundary",
        "## Follow-Up Gate",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in note


def test_phase50_product_boundary_note_records_public_private_plugin_boundary() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "launch hub remains planning-only for now",
        "`/` remains the guided public demo",
        "`/worlds/<world_id>` remains the private-beta candidate product path",
        "Mirror Codex plugin remains read-only",
        "does not start sessions, generate branches, upload corpus data, create worlds, enable Hosted GPT, accept BYOK, or call the OpenAI API",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota behavior to the public path or plugin path",
        "TODO[verify]: open a reviewed route contract before replacing `/` or adding a private-beta launch hub route",
    ]
    for phrase in required_phrases:
        assert phrase in note


def test_active_phase50_docs_point_to_product_boundary_work() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/phase-50-successor-gate-2026-05-18.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "`#397`" in text
        assert "`#398`" in text
        assert "`#401`" in text
        assert "launch hub remains planning-only for now" in text
        assert "Phase 50 Product Boundary Decision" in text
