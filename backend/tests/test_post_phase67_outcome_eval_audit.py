from __future__ import annotations

from pathlib import Path


AUDIT_PATH = Path("docs/plans/post-phase-67-outcome-report-eval-generalization-audit-2026-06-08.md")
SUCCESSOR_INTAKE_PATH = Path("docs/plans/post-phase-67-successor-intake-audit-2026-06-08.md")
MINIMUM_LOOP = (
    "corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> "
    "report/claims -> eval"
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_outcome_report_eval_audit_exists_with_required_sections() -> None:
    audit = _read(AUDIT_PATH)
    required_sections = [
        "# Post-Phase-67 Outcome/Report/Eval Generalization Audit",
        "## Current-Code Finding",
        "## Source Evidence",
        "## Eval Evidence",
        "## Successor Decision",
        "## Remaining Boundaries",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in audit


def test_current_code_evidence_is_config_driven_for_selected_world_outcomes() -> None:
    eval_service = _read(Path("backend/app/evals/service.py"))
    report_service = _read(Path("backend/app/reports/service.py"))
    rules_service = _read(Path("backend/app/simulation/rules.py"))
    world_tests = _read(Path("backend/tests/test_worlds.py"))
    museum_rules = _read(Path("data/worlds/museum-night/config/simulation_rules.yaml"))
    library_rules = _read(Path("data/worlds/library-rain/config/simulation_rules.yaml"))
    contracts = _read(Path("docs/architecture/contracts.md"))

    eval_required = [
        "plan = load_simulation_plan(world_paths.simulation_rules_path)",
        "tracked_outcome_fields = [outcome.field for outcome in plan.tracked_outcomes]",
        "tracked_outcomes_in_run_summaries",
        "tracked_outcomes_in_compare",
        "tracked_outcomes_have_semantic_delta",
        "default_report_scenario_has_semantic_delta",
        "report_compare_sourced",
        '"transfer_proof_world_local"',
        "Transfer eval validates that the constrained deterministic pipeline can ingest, simulate, report, and evaluate this world without world-specific Python constants.",
    ]
    for phrase in eval_required:
        assert phrase in eval_service

    report_required = [
        "for outcome in plan.tracked_outcomes",
        "label=\"evidence_backed\"",
        "evidence_ids=evidence_ids",
        "Compare source: `{selection.source_path}`.",
        "Compare branch pair: `{selection.reference_branch_id}` -> `{selection.candidate_branch_id}`.",
    ]
    for phrase in report_required:
        assert phrase in report_service

    assert "tracked_outcomes: list[OutcomeDefinition]" in rules_service
    assert "world_id: museum-night" in museum_rules
    assert "checklist_public_turn" in museum_rules
    assert "safety_hold_turn" in museum_rules
    assert "opening_status" in museum_rules
    assert "world_id: library-rain" in library_rules
    assert "catalog_public_turn" in library_rules
    assert "relocation_turn" in library_rules
    assert "reading_room_status" in library_rules

    for phrase in [
        'run_world_eval("museum-night"',
        'run_world_eval("library-rain"',
        'result.metrics["tracked_outcome_fields_covered"] == 5',
        'result.metrics["compare_outcome_fields_covered"] == 5',
        'result.metrics["report_compare_sourced"] is True',
        "test_transfer_world_eval_fails_when_tracked_outcome_missing_from_runs",
        "test_transfer_world_eval_fails_when_tracked_outcomes_do_not_change",
    ]:
        assert phrase in world_tests

    cli_tests = _read(Path("backend/tests/test_cli.py"))
    for phrase in [
        'main(["create-world", "--spec", json.dumps(spec)])',
        '"start-session",',
        'assert main(["eval-world", "--world", "museum-night"]) == 0',
        'payload["metrics"]["world_count"] == 3',
        'payload["metrics"]["tracked_outcome_count"] == 18',
        'payload["metrics"]["transfer_proof_world_local"] is True',
    ]:
        assert phrase in cli_tests

    assert "This proves the pipeline has passed across three selected bounded fictional worlds; it does not claim future-world readiness." in contracts


def test_outcome_report_eval_audit_keeps_queue_paused_without_phase68() -> None:
    audit = _read(AUDIT_PATH)
    successor_intake = _read(SUCCESSOR_INTAKE_PATH)
    required_phrases = [
        "Current-code audit result: no source-backed Phase 68 blocker is proven by bounded-world outcome/report/eval generalization today.",
        "The selected-world proof is current for `fog-harbor-east-gate`, `museum-night`, and `library-rain`.",
        "The proof is config-driven over world-local `tracked_outcomes`; it is not a future-world readiness claim.",
        "Do not open Phase 68 from this audit.",
        "The current queue remains in the formal paused stop-state.",
        f"`{MINIMUM_LOOP}`",
        "TODO[verify]: Future-world readiness remains unclaimed by the current contract and would need separate source-backed evidence.",
        "TODO[verify]: Decision-trace/replay hardening remains the next candidate audit, not an implementation queue.",
        "`DEFAULT_TRANSFER_WORLD_IDS` fixed to `fog-harbor-east-gate`, `museum-night`, and `library-rain`",
        "`create-world` can materialize a runtime world and start a session for it, but it does not yet run `eval-world` on that runtime-created world",
        "If the project later needs future-world readiness, the source-backed question is narrower than this audit",
        "runtime-created bounded world can pass `eval-world` or an equivalent temporary outcome/report/eval validation",
        "That proof is not present in the current reviewed contract.",
        "python -m pytest backend/tests/test_cli.py::test_cli_create_world_writes_runtime_world_pack backend/tests/test_cli.py::test_cli_eval_world_outputs_json backend/tests/test_cli.py::test_cli_eval_transfer_outputs_json -q",
        "`status:needs-adr` and unresolved `risk:safety` findings remain merge blockers.",
        "No ADR or `docs/architecture/contracts.md` update is made by this audit because this diff does not change a protected-core contract.",
        "Do not present Mirror as a real-world prediction machine.",
        "Do not build real-person personas or digital doubles.",
        "Do not build political persuasion, hidden surveillance, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.",
    ]
    forbidden_phrases = [
        "Phase 68 is active",
        "Phase 68 execution queue is open",
        "open a Phase 68 milestone now",
        "bounded-world outcome/report/eval generalization is a proven blocker",
        "claims future-world readiness",
        "implements future-world readiness",
        "changes scenario DSL",
        "changes report claim evidence_ids",
    ]

    for phrase in required_phrases:
        assert phrase in audit, phrase
    for phrase in forbidden_phrases:
        assert phrase not in audit, phrase

    assert "TODO[verify]: Audit current code and tests for remaining Fog Harbor-shaped outcome/report/eval assumptions before opening any successor." in successor_intake


def test_current_docs_point_to_outcome_report_eval_audit_without_opening_phase68() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]
    required_phrases = [
        "`docs/plans/post-phase-67-outcome-report-eval-generalization-audit-2026-06-08.md`",
        "Post-Phase-67 outcome/report/eval generalization audit keeps the queue paused",
        "Do not open Phase 68 from this audit.",
        "selected-world proof is current for `fog-harbor-east-gate`, `museum-night`, and `library-rain`",
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
            assert phrase in text, f"{path} is missing outcome/eval audit pointer: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} opens Phase 68 prematurely: {phrase}"
