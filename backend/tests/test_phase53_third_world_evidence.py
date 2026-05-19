from __future__ import annotations

from pathlib import Path


EVIDENCE_NOTE = Path("docs/plans/phase-53-third-world-transfer-evidence-2026-05-19.md")


def test_phase53_third_world_evidence_note_records_library_rain() -> None:
    text = EVIDENCE_NOTE.read_text(encoding="utf-8")
    required_phrases = [
        "# Phase 53 Third-World Transfer Evidence",
        "Issue: `#421` `Phase 53: add bounded third-world transfer readiness evidence`",
        "Current work item: `#421` `Phase 53: add bounded third-world transfer readiness evidence`",
        "`library-rain`",
        "original fictional bounded world",
        "`DEFAULT_TRANSFER_WORLD_IDS`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "`world_count: 3`",
        "`tracked_outcome_count: 18`",
        "`transfer_proof_world_local: true`",
        "Every report claim must keep both `label` and `evidence_ids`.",
        "does not change scenario DSL, claim labels, run trace shape, compare artifact shape",
    ]

    for phrase in required_phrases:
        assert phrase in text


def test_active_docs_point_to_phase53_third_world_evidence() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-53-successor-gate-2026-05-19.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "docs/plans/phase-53-third-world-transfer-evidence-2026-05-19.md" in text
        assert "`#421` `Phase 53: add bounded third-world transfer readiness evidence`" in text
        assert "`library-rain`" in text
        assert "closed by PR `#424`" in text
        assert "formal paused stop-state" in text


def test_phase53_third_world_contract_and_adr_record_reviewed_world_set() -> None:
    contract = Path("docs/architecture/contracts.md").read_text(encoding="utf-8")
    adr = Path("docs/decisions/ADR-0012-third-world-transfer-evidence.md").read_text(
        encoding="utf-8"
    )

    required_contract_phrases = [
        "`python -m backend.app.cli eval-transfer` runs the reviewed transfer-world proof",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "three selected bounded fictional worlds",
        "does not claim future-world readiness",
    ]
    required_adr_phrases = [
        "# ADR-0012: Third-World Transfer Evidence",
        "- Accepted",
        "`library-rain`",
        "original fictional bounded world",
        "`DEFAULT_TRANSFER_WORLD_IDS`",
        "`docs/plans/phase-53-third-world-transfer-evidence-2026-05-19.md`",
        "does not change scenario DSL, claim labels, run trace shape, compare artifact shape",
        "does not claim future-world readiness",
    ]

    for phrase in required_contract_phrases:
        assert phrase in contract
    for phrase in required_adr_phrases:
        assert phrase in adr
