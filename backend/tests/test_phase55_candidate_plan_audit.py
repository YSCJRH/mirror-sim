from __future__ import annotations

from pathlib import Path


AUDIT_PATH = Path("docs/plans/phase-55-candidate-plan-audit-2026-05-20.md")


def test_phase55_candidate_plan_audit_exists_with_required_sections() -> None:
    assert AUDIT_PATH.exists()

    audit = AUDIT_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 55 Candidate Plan Audit",
        "Issue: `#434` `Phase 55: audit candidate product-reframe plans and freeze contract-safe scope`",
        "## Durable Boundary Inputs",
        "docs/architecture/contracts.md",
        "## Candidate Classification",
        "## Phase 55 Safe Inputs",
        "## Deferred Or Blocked Inputs",
        "## Analysis-First Main-Path Scope",
        "## Non-Goals",
        "## TODO[verify]",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in audit


def test_phase55_candidate_plan_audit_classifies_all_candidate_inputs() -> None:
    assert AUDIT_PATH.exists()

    audit = AUDIT_PATH.read_text(encoding="utf-8")
    required_inputs = [
        "docs/plans/takeover-audit-2026-04/README.md",
        "docs/plans/takeover-audit-2026-04/01-baseline-reconfirm.md",
        "docs/plans/takeover-audit-2026-04/02-project-governance-brief.md",
        "docs/plans/takeover-audit-2026-04/03-frontend-ia-diagnosis.md",
        "docs/plans/takeover-audit-2026-04/04-frontend-modularity-and-figma-seed.md",
        "docs/plans/takeover-audit-2026-04/05-successor-decision-brief.md",
        "docs/plans/branch-analysis-product-reframe-2026-04/README.md",
        "docs/plans/hybrid-linear-main-path-design-system.md",
        "docs/plans/hybrid-linear-main-path-manual-review.md",
        "docs/plans/interactive-perturbation-simulator-2026-04/README.md",
        "docs/plans/interactive-kernel-baseline-2026-04-22.md",
        "docs/plans/private-alpha-baseline-2026-04-22.md",
        "docs/plans/private-alpha-launch-ready-2026-04-22.md",
        "docs/plans/private-alpha-runbook-2026-04-22.md",
        "docs/plans/private-alpha-zh-manual-review-2026-04-22.md",
        "docs/plans/private-beta-readiness-2026-04-23.md",
    ]
    for candidate in required_inputs:
        assert candidate in audit

    required_classifications = [
        "safe-input",
        "candidate-only",
        "superseded",
        "contract-blocked",
        "contract-candidate and deferred",
    ]
    for classification in required_classifications:
        assert classification in audit


def test_phase55_candidate_plan_audit_preserves_boundaries() -> None:
    assert AUDIT_PATH.exists()

    audit = AUDIT_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "public demo, plugin, Hosted GPT/BYOK, launch hub, async, or runtime mutation boundaries",
        "`/` remains the guided public demo",
        "`/review` remains an advanced review surface, not a launch hub",
        "`/worlds/<world_id>` remains the private-beta candidate product path",
        "Keep synchronous generation for v1. Defer async task contract ratification.",
        "Hosted/private-beta model latency is still TODO[verify]",
        "Candidate planning notes are not durable truth",
        "Do not promote the untracked candidate planning notes as durable truth",
        "Do not change `docs/architecture/contracts.md`; this audit does not ratify a new contract.",
    ]
    for phrase in required_phrases:
        assert phrase in audit


def test_phase55_candidate_plan_audit_blocks_contract_expansion() -> None:
    assert AUDIT_PATH.exists()

    audit = AUDIT_PATH.read_text(encoding="utf-8")
    blocked_phrases = [
        "launch hub implementation or replacement of `/`",
        "public-path widening",
        "plugin MCP mutation or Hosted GPT/BYOK support",
        "Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota",
        "async workers, `task_id`, worker queue, heartbeat, retry, status, cleanup",
        "branch-generation entrypoint contract changes",
        "perturbation payload contract changes",
        "rollback/checkpoint/branch-history semantics",
        "scenario DSL, claim label, report claim `evidence_ids`, run trace, compare artifact",
        "multi-world selector UI",
        "full redesign of the legacy export/handoff surface",
    ]
    for phrase in blocked_phrases:
        assert phrase in audit

    disallowed_approval_phrases = [
        "Phase 55 approves launch hub",
        "Phase 55 ratifies Hosted GPT",
        "Phase 55 ratifies BYOK",
        "Phase 55 ratifies async",
        "Phase 55 ratifies rollback",
        "Phase 55 changes `docs/architecture/contracts.md`",
    ]
    for phrase in disallowed_approval_phrases:
        assert phrase not in audit
