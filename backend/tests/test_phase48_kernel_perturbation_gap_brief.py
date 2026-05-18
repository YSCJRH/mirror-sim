from __future__ import annotations

from pathlib import Path


BRIEF_PATH = Path("docs/plans/phase-48-kernel-perturbation-gap-brief-2026-05-18.md")


def test_phase48_kernel_perturbation_gap_brief_exists_with_required_sections() -> None:
    assert BRIEF_PATH.exists()

    brief = BRIEF_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 48 Kernel Perturbation Gap Brief",
        "Issue: `#379`",
        "## Purpose",
        "## Direct Evidence",
        "## Current Contract Boundaries",
        "## Phase 49 Candidate Work Packages",
        "## Required Gates Before Implementation",
        "## Non-Goals",
        "## Open Questions",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in brief


def test_phase48_kernel_perturbation_gap_brief_keeps_boundary_language() -> None:
    assert BRIEF_PATH.exists()

    brief = BRIEF_PATH.read_text(encoding="utf-8")
    required_boundaries = [
        "planning and triage only",
        "Do not implement kernel expansion",
        "Do not add free-form natural-language perturbation as an execution contract",
        "Do not change scenario DSL, run trace, artifact layout, plugin MCP contract, or public API",
        "Every report claim must keep both `label` and `evidence_ids`",
        "TODO[verify]:",
    ]
    for boundary in required_boundaries:
        assert boundary in brief


def test_phase48_kernel_perturbation_gap_brief_lists_contract_gates() -> None:
    assert BRIEF_PATH.exists()

    brief = BRIEF_PATH.read_text(encoding="utf-8")
    required_gates = [
        "docs/architecture/contracts.md",
        "ADR",
        "ADR-0007",
        "decision_schema.yaml",
        "decision_trace.jsonl",
        "task_id",
        "eval-demo",
        "eval-transfer",
    ]
    for gate in required_gates:
        assert gate in brief
