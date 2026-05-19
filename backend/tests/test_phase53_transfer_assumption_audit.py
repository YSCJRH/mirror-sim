from __future__ import annotations

from pathlib import Path

from backend.app.evals.service import DEFAULT_TRANSFER_WORLD_IDS
from backend.app.worlds import CANONICAL_DEMO_WORLD_ID


AUDIT_NOTE = Path("docs/plans/phase-53-transfer-assumption-audit-2026-05-19.md")


def test_phase53_transfer_assumption_audit_records_supported_and_blocked_claims() -> None:
    text = AUDIT_NOTE.read_text(encoding="utf-8")

    required_phrases = [
        "# Phase 53 Transfer Assumption Audit",
        "Issue: `#420` `Phase 53: audit transfer assumptions and third-world readiness constraints`",
        "Audit slice: `#420` `Phase 53: audit transfer assumptions and third-world readiness constraints`",
        "Current follow-up: `#421` `Phase 53: add bounded third-world transfer readiness evidence`",
        "## Supported Claims",
        "At `#420` completion, Mirror had a two-world transfer proof across `fog-harbor-east-gate` and `museum-night`.",
        "`eval-transfer` proves Mirror is not single-world-only.",
        "## Blocked Claims",
        "Do not claim broad transfer readiness beyond the reviewed transfer world set.",
        "Do not claim future-world readiness from `#421`'s `library-rain` evidence.",
        "Do not claim every future world will work without additional contracts.",
        "## #421 Update",
        "`library-rain`",
        "## Third-World Readiness Criteria",
        "original, fictional, or explicitly authorized",
        "world-local `config/simulation_rules.yaml`",
        "Every report claim must keep both `label` and `evidence_ids`.",
        "pass `python -m backend.app.cli eval-world --world <world_id>`",
    ]

    for phrase in required_phrases:
        assert phrase in text


def test_transfer_assumption_audit_stays_aligned_with_eval_transfer_defaults() -> None:
    assert DEFAULT_TRANSFER_WORLD_IDS == [CANONICAL_DEMO_WORLD_ID, "museum-night", "library-rain"]

    text = AUDIT_NOTE.read_text(encoding="utf-8")
    for world_id in DEFAULT_TRANSFER_WORLD_IDS:
        assert f"`{world_id}`" in text
    assert "DEFAULT_TRANSFER_WORLD_IDS" in text
    assert "two-world proof" in text
    assert "three selected bounded worlds" in text
    assert "third-world readiness" in text


def test_transfer_assumption_audit_avoids_unbounded_readiness_phrasing() -> None:
    text = AUDIT_NOTE.read_text(encoding="utf-8")
    forbidden_phrases = [
        "Mirror is transfer-ready",
        "generalizes to future worlds",
        "works for every world",
        "open-world generality",
        "real-person persona readiness",
        "The existing proof supports saying that Mirror can run",
    ]

    for phrase in forbidden_phrases:
        assert phrase not in text


def test_transfer_assumption_audit_preserves_protected_contract_boundaries() -> None:
    text = AUDIT_NOTE.read_text(encoding="utf-8")
    required_boundaries = [
        "scenario DSL",
        "claim labels",
        "run trace shape",
        "compare artifact shape",
        "session/node manifest shape",
        "public demo artifact layout",
        "plugin MCP contract",
        "public/private routes",
        "async runtime",
        "runtime mutation",
    ]

    for boundary in required_boundaries:
        assert boundary in text


def test_active_docs_point_to_current_phase53_assumption_audit() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-53-successor-gate-2026-05-19.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]
    stale_phrases = [
        "`#420` `Phase 53: audit transfer assumptions and third-world readiness constraints` is blocked until `#419` closes.",
        "Status: blocked until `#419` closes.",
        "`#420`/`#421` blocked",
        "`#421` `Phase 53: add bounded third-world transfer readiness evidence` is blocked until `#420` closes.",
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "docs/plans/phase-53-transfer-assumption-audit-2026-05-19.md" in text
        assert "`#420` `Phase 53: audit transfer assumptions and third-world readiness constraints`" in text
        assert "closed by PR `#423`" in text
        assert "`#421` `Phase 53: add bounded third-world transfer readiness evidence`" in text
        assert "current ready" in text or "Status: current ready work item." in text
        for phrase in stale_phrases:
            assert phrase not in text, f"{path} still treats #420 as blocked: {phrase}"
