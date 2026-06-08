# Post-Phase-67 Runtime-Created World Eval Proof

Date: 2026-06-08

This note follows the narrow proof question left by the Post-Phase-67 outcome/report/eval generalization audit: can a runtime-created bounded world pass `eval-world` through report compare sourcing, tracked outcome coverage, semantic compare deltas, claim `label`, and claim `evidence_ids`?

## Scope

This proof stays inside the existing minimum loop:

```text
corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval
```

The queue shorthand is `corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval`.

The result: a runtime-created bounded world can pass `eval-world` through the current deterministic pipeline.

This closes only the narrow runtime-created template proof question. It does not claim future-world readiness and does not open a successor phase.

## Source Evidence

- `backend/app/world_templates/service.py` now sets `default_report_scenario = "evidence_delayed"` and writes `"default_report_scenario": default_report_scenario`, so generated template worlds do not try to report baseline against baseline.
- `backend/app/world_templates/service.py` writes the default injected scenario at `world_root / "scenarios" / f"{default_report_scenario}.yaml"` with `"kind": "delay_document"`, `target_id: doc_user_01`, `actor_id: persona_records_lead`, and `delay_turns: 2`.
- `backend/app/evals/service.py` uses `def _default_redlines_path(repo_root: Path) -> Path:` so runtime-created worlds can use a runtime-local `evals/assertions/redlines.yaml` when present and otherwise fall back to the repo default at `Path(__file__).resolve().parents[3] / "evals" / "assertions" / "redlines.yaml"`.
- `backend/tests/test_cli.py` includes `test_cli_runtime_created_world_passes_eval_world`, calls `main(["eval-world", "--world", world_id])`, and checks `eval_payload["metrics"]["tracked_outcome_fields_covered"] == 5`, `eval_payload["metrics"]["compare_outcome_fields_covered"] == 5`, `eval_payload["metrics"]["report_compare_sourced"] is True`, and `eval_payload["metrics"]["transfer_proof_world_local"] is True`.
- `backend/tests/test_cli.py` also checks generated report claims keep `claim.get("label")` and `claim.get("evidence_ids")`, and that the runtime compare artifact is written under `"scenario_harbor_night_drill_template_matrix"`.

## Validation Evidence

The runtime-created proof is executable through the CLI test path:

- `create-world` materializes the runtime world pack under `state/worlds/<world_id>`.
- The generated pack includes baseline and `evidence_delayed` scenarios.
- `eval-world` materializes ingest, graph, personas, scenario JSON, deterministic runs, compare, report, claims, and eval summary artifacts.
- The report is sourced from the compare artifact and cites the branch pair.
- Claims retain `label` and `evidence_ids`.

## Queue Decision

The queue remains paused.

Do not open Phase 68 from this proof.

This proof removes one uncertainty from the Post-Phase-67 audit, but it does not prove a new protected-core contract blocker and does not justify a successor execution queue by itself.

## Boundaries

- This does not claim future-world readiness.
- This does not change schema, scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, public demo artifact layout, plugin MCP contract, route ownership, or artifact layout.
- Do not present Mirror as a real-world prediction machine.
- Do not build real-person personas or digital doubles.
- Do not build political persuasion, hidden surveillance, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.
- `status:needs-adr` and unresolved `risk:safety` findings remain merge blockers.

## Validation Commands

- `python -m pytest backend/tests/test_cli.py::test_cli_runtime_created_world_passes_eval_world -q`
- `python -m pytest backend/tests/test_post_phase67_runtime_created_world_eval_proof.py -q`
- `python -m pytest backend/tests/test_cli.py::test_cli_create_world_writes_runtime_world_pack backend/tests/test_cli.py::test_cli_runtime_created_world_passes_eval_world backend/tests/test_cli.py::test_cli_eval_world_outputs_json backend/tests/test_cli.py::test_cli_eval_transfer_outputs_json -q`
- `python scripts/check_no_secrets.py`
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
- `git diff --check`
