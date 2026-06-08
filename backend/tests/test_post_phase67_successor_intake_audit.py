from __future__ import annotations

from pathlib import Path


AUDIT_PATH = Path("docs/plans/post-phase-67-successor-intake-audit-2026-06-08.md")
PHASE67_CLOSEOUT_PATH = Path(
    "docs/plans/phase-67-blueprint-calibration-minimum-loop-closeout-2026-06-08.md"
)
MINIMUM_LOOP = (
    "corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> "
    "report/claims -> eval"
)
DRIFT_STOP = (
    "Do not open Phase 68 as an execution queue until this intake audit identifies "
    "a new source-backed minimum-loop gap or protected-core contract blocker."
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_post_phase67_successor_intake_audit_exists_with_required_sections() -> None:
    audit = _read(AUDIT_PATH)
    required_sections = [
        "# Post-Phase-67 Successor Intake Audit",
        "## Current Authoritative State",
        "## Successor Intake Rule",
        "## Candidate Input Review",
        "## Candidate Source Trace",
        "## Candidate Ranking",
        "## Decision",
        "## Contract And ADR Posture",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in audit


def test_successor_intake_keeps_queue_paused_until_new_gap_is_proven() -> None:
    audit = _read(AUDIT_PATH)
    closeout = _read(PHASE67_CLOSEOUT_PATH)

    required_phrases = [
        "The current queue remains in the formal paused stop-state.",
        "`audit-github-queue` returns `paused` with `active_milestone: null`.",
        "No Phase 68 successor queue is opened by this audit.",
        DRIFT_STOP,
        "Phase 67 closeout already landed the documented compare-sourced report/claims closure through PR `#513`.",
        "after PR `#513` there is no remaining source-backed scenario/intervention/branch-comparison/eval value gap documented in Phase 67",
        f"`{MINIMUM_LOOP}`",
        "bounded-world outcome/report/eval generalization",
        "decision-trace/replay artifact contract hardening",
        "async/task_id, launch hub, legacy route migration, Hosted GPT/BYOK, provider/model paths, auth, billing, upload, and quota",
        "adjacent surface/readiness/fidelity/continuity work remains rejected as a primary successor scope",
        "untracked candidate planning notes remain candidate inputs only",
        "private-alpha launch-hub wording conflicts with the current route contract",
        "docs/plans/phase-55-candidate-plan-audit-2026-05-20.md",
        "docs/plans/phase-56-candidate-source-verification-2026-05-20.md",
        "docs/plans/private-alpha-baseline-2026-04-22.md:9",
        "docs/plans/private-alpha-baseline-2026-04-22.md:34",
        "docs/plans/private-alpha-launch-ready-2026-04-22.md",
        "docs/plans/private-beta-readiness-2026-04-23.md:24",
        "docs/plans/hybrid-linear-main-path-design-system.md",
        "docs/plans/hybrid-linear-main-path-manual-review.md",
        "docs/plans/interactive-kernel-baseline-2026-04-22.md",
        "docs/plans/interactive-perturbation-simulator-2026-04/README.md",
        "This audit only records their candidate-source trace and keeps promotion gated on a reviewed PR that cites tracked source or checked-in validation evidence.",
        "TODO[verify]: Audit current code and tests for remaining Fog Harbor-shaped outcome/report/eval assumptions before opening any successor.",
        "TODO[verify]: Audit current decision-trace/replay evidence before treating trace hardening as a protected-core blocker.",
        "No ADR or `docs/architecture/contracts.md` update is made by this audit because this diff does not change a protected-core contract.",
        "If a future audit proves a protected-core contract blocker, open a scoped protected-core contract issue",
        "`status:needs-adr` and unresolved `risk:safety` findings remain merge blockers until the needed ADR or safety review is resolved.",
        "real-world prediction",
        "real-person personas",
        "digital doubles",
        "political persuasion",
        "hidden surveillance",
        "law-enforcement scoring",
        "hiring",
        "credit",
        "medical",
        "judicial decision systems",
    ]
    forbidden_phrases = [
        "Phase 68 is active",
        "Phase 68 execution queue is open",
        "open a Phase 68 milestone now",
        "promote private-alpha launch hub as current repo truth",
        "implement interactive simulator now",
        "start Hosted GPT",
        "add BYOK",
    ]

    for phrase in required_phrases:
        assert phrase in audit, f"successor intake audit is missing evidence: {phrase}"
    for phrase in forbidden_phrases:
        assert phrase not in audit, f"successor intake audit over-promotes Phase 68: {phrase}"

    assert "No Phase 68 successor queue is opened in this closeout." in closeout
    assert "Every future successor must identify a new source-backed minimum-loop gap" in closeout


def test_current_docs_point_to_successor_intake_without_opening_phase68() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]
    required_phrases = [
        "`docs/plans/post-phase-67-successor-intake-audit-2026-06-08.md`",
        "Post-Phase-67 successor intake audit keeps the queue paused",
        "No Phase 68 successor queue is opened by this audit.",
        DRIFT_STOP,
        f"`{MINIMUM_LOOP}`",
    ]
    forbidden_phrases = [
        "Phase 68 is active",
        "Phase 68 execution queue is open",
        "milestone `Phase 68",
        "`#515` `Phase 68 exit gate`",
        "`audit-github-queue` reports `ready` for Phase 68",
    ]
    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing successor intake pointer: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} opens Phase 68 prematurely: {phrase}"
