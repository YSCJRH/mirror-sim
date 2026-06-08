from __future__ import annotations

from pathlib import Path


PROOF_PATH = Path("docs/plans/post-phase-67-runtime-created-world-eval-proof-2026-06-08.md")
MINIMUM_LOOP = (
    "corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> "
    "report/claims -> eval"
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_runtime_created_world_eval_proof_exists_with_guardrails() -> None:
    proof = _read(PROOF_PATH)
    required_sections = [
        "# Post-Phase-67 Runtime-Created World Eval Proof",
        "## Scope",
        "## Source Evidence",
        "## Validation Evidence",
        "## Queue Decision",
        "## Boundaries",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in proof

    required_phrases = [
        f"`{MINIMUM_LOOP}`",
        "runtime-created bounded world can pass `eval-world`",
        "This closes only the narrow runtime-created template proof question",
        "The queue remains paused.",
        "Do not open Phase 68 from this proof.",
        "does not claim future-world readiness",
        "Do not present Mirror as a real-world prediction machine.",
        "Do not build real-person personas or digital doubles.",
        "Do not build political persuasion, hidden surveillance, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.",
    ]
    for phrase in required_phrases:
        assert phrase in proof, phrase


def test_runtime_created_world_eval_proof_is_source_backed() -> None:
    proof = _read(PROOF_PATH)
    template_service = _read(Path("backend/app/world_templates/service.py"))
    eval_service = _read(Path("backend/app/evals/service.py"))
    cli_tests = _read(Path("backend/tests/test_cli.py"))

    for phrase in [
        'default_report_scenario = "evidence_delayed"',
        '"default_report_scenario": default_report_scenario',
        'world_root / "scenarios" / f"{default_report_scenario}.yaml"',
        '"kind": "delay_document"',
    ]:
        assert phrase in template_service
        assert phrase in proof

    for phrase in [
        "def _default_redlines_path(repo_root: Path) -> Path:",
        "runtime_path = repo_root / \"evals\" / \"assertions\" / \"redlines.yaml\"",
        "Path(__file__).resolve().parents[3] / \"evals\" / \"assertions\" / \"redlines.yaml\"",
    ]:
        assert phrase in eval_service

    for phrase in [
        "test_cli_runtime_created_world_passes_eval_world",
        'main(["eval-world", "--world", world_id])',
        'eval_payload["metrics"]["tracked_outcome_fields_covered"] == 5',
        'eval_payload["metrics"]["compare_outcome_fields_covered"] == 5',
        'eval_payload["metrics"]["report_compare_sourced"] is True',
        'eval_payload["metrics"]["transfer_proof_world_local"] is True',
        'claim.get("label")',
        'claim.get("evidence_ids")',
        '"scenario_harbor_night_drill_template_matrix"',
    ]:
        assert phrase in cli_tests
        assert phrase in proof


def test_current_docs_point_to_runtime_created_world_eval_proof_without_phase68() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]
    required_phrases = [
        "`docs/plans/post-phase-67-runtime-created-world-eval-proof-2026-06-08.md`",
        "Post-Phase-67 runtime-created world eval proof keeps the queue paused",
        "runtime-created bounded world can pass `eval-world`",
        "does not claim future-world readiness",
        "Do not open Phase 68 from this proof.",
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
            assert phrase in text, f"{path} is missing runtime-created eval proof pointer: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} opens Phase 68 prematurely: {phrase}"
