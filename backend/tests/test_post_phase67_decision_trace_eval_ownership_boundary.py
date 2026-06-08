from __future__ import annotations

from pathlib import Path


BOUNDARY_PATH = Path("docs/plans/post-phase-67-decision-trace-eval-ownership-boundary-2026-06-08.md")
REPLAY_AUDIT_PATH = Path("docs/plans/post-phase-67-decision-trace-replay-audit-2026-06-08.md")
MINIMUM_LOOP = (
    "corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> "
    "report/claims -> eval"
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_decision_trace_eval_ownership_boundary_exists_with_required_sections() -> None:
    boundary = _read(BOUNDARY_PATH)
    required_sections = [
        "# Post-Phase-67 Decision Trace Eval Ownership Boundary",
        "## Scope",
        "## Current-Code Finding",
        "## Source Evidence",
        "## Blueprint Alignment Decision",
        "## Future Trigger Conditions",
        "## Boundaries",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in boundary


def test_eval_ownership_boundary_keeps_metrics_unclaimed_without_phase68() -> None:
    boundary = _read(BOUNDARY_PATH)
    replay_audit = _read(REPLAY_AUDIT_PATH)
    contracts = _read(Path("docs/architecture/contracts.md"))
    eval_service = _read(Path("backend/app/evals/service.py"))
    decision_kernel = _read(Path("backend/app/decision_kernel/service.py"))
    pipeline_tests = _read(Path("backend/tests/test_pipeline.py"))

    required_boundary_phrases = [
        f"`{MINIMUM_LOOP}`",
        "Current-code audit result: eval-owned decision-trace replay metrics remain unclaimed today.",
        "This is not a source-backed Phase 68 blocker.",
        "Opening an implementation queue for eval-owned decision-trace replay metrics without a new source-backed blocker would be blueprint drift.",
        "Do not open Phase 68 from this boundary note.",
        "The current queue remains in the formal paused stop-state.",
        "`backend/app/evals/service.py` currently has no `decision_trace`, `replay_cache`, or `accepted_from_replay` ownership.",
        "`docs/architecture/contracts.md` does not require transfer eval summaries to include decision-trace replay metrics.",
        "kernel-level replay and runner-level same-run-directory replay remain the current proven boundary",
        "No ADR or `docs/architecture/contracts.md` update is made by this boundary note because this diff does not change a protected-core contract.",
        "`status:needs-adr` and unresolved `risk:safety` findings remain merge blockers.",
        "Do not present Mirror as a real-world prediction machine.",
        "Do not build real-person personas or digital doubles.",
        "Do not build political persuasion, hidden surveillance, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.",
    ]
    forbidden_boundary_phrases = [
        "Phase 68 is active",
        "Phase 68 execution queue is open",
        "open a Phase 68 milestone now",
        "eval-owned decision-trace replay metrics are implemented",
        "changes decision_trace.jsonl shape",
        "claims provider-backed replay readiness",
        "claims future-world readiness",
    ]
    for phrase in required_boundary_phrases:
        assert phrase in boundary, phrase
    for phrase in forbidden_boundary_phrases:
        assert phrase not in boundary, phrase

    assert "Future eval ownership for decision-trace replay metrics remains unclaimed by this audit." not in replay_audit
    assert "`docs/plans/post-phase-67-decision-trace-eval-ownership-boundary-2026-06-08.md`" in replay_audit

    for phrase in [
        "`decision_trace.jsonl` is the durable v1 decision audit artifact",
        "`replay_cache` when the selection is copied from an existing trace entry for the same",
        "`accepted_from_replay` for replay-cache reuse.",
    ]:
        assert phrase in contracts

    for phrase in ["decision_trace", "replay_cache", "accepted_from_replay"]:
        assert phrase not in eval_service

    for phrase in [
        "replay_entry = self.replay_cache.get(input_hash)",
        'provider_mode="replay_cache"',
        'validation_status="accepted_from_replay"',
    ]:
        assert phrase in decision_kernel
        assert phrase in boundary

    assert "test_simulation_replays_from_existing_decision_trace" in pipeline_tests
    assert "test_simulation_replays_from_existing_decision_trace" in boundary


def test_current_docs_point_to_eval_ownership_boundary_without_opening_phase68() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]
    required_phrases = [
        "`docs/plans/post-phase-67-decision-trace-eval-ownership-boundary-2026-06-08.md`",
        "Post-Phase-67 decision-trace eval-ownership boundary keeps the queue paused",
        "eval-owned decision-trace replay metrics remain unclaimed",
        "Do not open Phase 68 from this boundary note.",
    ]
    forbidden_phrases = [
        "Phase 68 is active",
        "Phase 68 execution queue is open",
        "`audit-github-queue` reports `ready` for Phase 68",
        "milestone `Phase 68",
    ]
    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing eval-ownership boundary pointer: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} opens Phase 68 prematurely: {phrase}"
