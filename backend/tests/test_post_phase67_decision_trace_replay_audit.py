from __future__ import annotations

from pathlib import Path


AUDIT_PATH = Path("docs/plans/post-phase-67-decision-trace-replay-audit-2026-06-08.md")
MINIMUM_LOOP = (
    "corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> "
    "report/claims -> eval"
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_decision_trace_replay_audit_exists_with_required_sections() -> None:
    audit = _read(AUDIT_PATH)
    required_sections = [
        "# Post-Phase-67 Decision Trace Replay Audit",
        "## Current-Code Finding",
        "## Source Evidence",
        "## Validation Evidence",
        "## Successor Decision",
        "## Boundaries",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in audit


def test_decision_trace_replay_audit_is_source_backed_without_phase68() -> None:
    audit = _read(AUDIT_PATH)
    contracts = _read(Path("docs/architecture/contracts.md"))
    decision_kernel = _read(Path("backend/app/decision_kernel/service.py"))
    pipeline_tests = _read(Path("backend/tests/test_pipeline.py"))
    kernel_tests = _read(Path("backend/tests/test_decision_kernel.py"))

    required_audit_phrases = [
        f"`{MINIMUM_LOOP}`",
        "Current-code audit result: no source-backed Phase 68 blocker is proven by decision-trace/replay hardening today.",
        "The decision-trace replay proof is current for kernel-level replay and runner-level same-run-directory replay.",
        "Do not open Phase 68 from this audit.",
        "The current queue remains in the formal paused stop-state.",
        "does not change `decision_trace.jsonl` shape",
        "No ADR or `docs/architecture/contracts.md` update is made by this audit because this diff does not change a protected-core contract.",
        "TODO[verify]: Future eval ownership for decision-trace replay metrics remains unclaimed by this audit.",
        "`status:needs-adr` and unresolved `risk:safety` findings remain merge blockers.",
        "Do not present Mirror as a real-world prediction machine.",
        "Do not build real-person personas or digital doubles.",
        "Do not build political persuasion, hidden surveillance, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.",
    ]
    forbidden_audit_phrases = [
        "Phase 68 is active",
        "Phase 68 execution queue is open",
        "open a Phase 68 milestone now",
        "changes decision_trace.jsonl shape",
        "claims provider-backed replay readiness",
        "implements eval-owned decision-trace replay metrics",
    ]
    for phrase in required_audit_phrases:
        assert phrase in audit, phrase
    for phrase in forbidden_audit_phrases:
        assert phrase not in audit, phrase

    for phrase in [
        "`decision_trace.jsonl` is the durable v1 decision audit artifact",
        "`replay_cache` when the selection is copied from an existing trace entry for the same",
        "`accepted_from_replay` for replay-cache reuse.",
        "Decision traces are append-only audit history for a concrete run/node artifact.",
    ]:
        assert phrase in contracts
        assert phrase in audit

    for phrase in [
        "replay_entry = self.replay_cache.get(input_hash)",
        'provider_mode="replay_cache"',
        'validation_status="accepted_from_replay"',
        "_append_trace(self.decision_trace_path, entry)",
    ]:
        assert phrase in decision_kernel
        assert phrase in audit

    for phrase in [
        "test_decision_kernel_replay_uses_cached_choice_without_provider_call",
        'replay["provider_mode"] == "replay_cache"',
        'replay["validation_status"] == "accepted_from_replay"',
    ]:
        assert phrase in kernel_tests
        assert phrase in audit

    for phrase in [
        "test_simulation_replays_from_existing_decision_trace",
        'row["provider_mode"] == "replay_cache"',
        'row["validation_status"] == "accepted_from_replay"',
        'row["input_hash"]',
    ]:
        assert phrase in pipeline_tests
        assert phrase in audit


def test_current_docs_point_to_decision_trace_replay_audit_without_opening_phase68() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]
    required_phrases = [
        "`docs/plans/post-phase-67-decision-trace-replay-audit-2026-06-08.md`",
        "Post-Phase-67 decision-trace replay audit keeps the queue paused",
        "kernel-level replay and runner-level same-run-directory replay",
        "Do not open Phase 68 from this audit.",
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
            assert phrase in text, f"{path} is missing decision trace replay audit pointer: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} opens Phase 68 prematurely: {phrase}"
