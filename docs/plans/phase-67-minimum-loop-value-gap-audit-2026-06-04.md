# Phase 67 Minimum-Loop Value Gap Audit

Issue: `#509` `Phase 67: audit current minimum-loop value gaps before next implementation`

Audit note: `docs/plans/phase-67-minimum-loop-value-gap-audit-2026-06-04.md`

This note is the Phase 67 minimum-loop value gap audit. It maps tracked repo truth back to the Mirror blueprint and selects the next value-bearing scenario/intervention/branch-comparison/eval value gap before any more implementation work is opened.

For Phase 67, the automation loop remains an execution mechanism, not the project north star.

## Evidence Inputs

- `mirror.md` defines the minimum product loop as `corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval` and states that a baseline plus one intervention should produce graph, persona cards, scenario validation, deterministic run trace, report + claims, and eval summary before stronger capability claims are made.
- `docs/architecture/contracts.md` states that `compare.json` is the canonical branch-relationship artifact for one scenario compare set.
- `docs/architecture/contracts.md` states that reports and claims may remain pair-scoped, but the chosen branch pair must come from compare truth.
- `docs/architecture/contracts.md` states that evals should consume `compare.json` whenever a scenario uses `branch_count > 1`.
- `docs/architecture/contracts.md` states that interactive simulator artifacts keep scenario compare artifacts separate from session compare artifacts.
- `README.md`, `docs/plans/current-state-baseline.md`, `docs/plans/phase-execution-queue.md`, and `docs/plans/automation-roadmap.md` record Phase 66 as closed and Phase 67 as the active blueprint calibration and minimum-loop value gate.

## Minimum-Loop Map

| Loop segment | Current tracked evidence | Gap assessment |
|---|---|---|
| corpus -> chunks | `data/demo/corpus/manifest.yaml` plus `backend/tests/test_pipeline.py::test_ingest_writes_documents_and_chunks` cover bounded ingest and chunk outputs. | Tracked enough for this audit; no new ingest contract is needed here. |
| chunks -> graph | `docs/architecture/contracts.md` defines graph output shape, and `backend/tests/test_pipeline.py::test_graph_and_personas_have_evidence` covers evidence-backed graph/persona output. | Tracked enough for this audit; any broader graph claim remains outside #509. |
| graph -> personas | Persona contracts require aggregate `evidence_ids` and field-level provenance; `backend/tests/test_pipeline.py::test_graph_and_personas_have_evidence` checks persona evidence IDs. | Tracked enough for this audit; Every report claim must keep both `label` and `evidence_ids`. |
| personas -> scenarios | Scenario contracts cover `scenario_id`, `world_id`, `branch_count`, and world-local injections; `backend/tests/test_pipeline.py::test_scenario_validation_and_simulation_are_deterministic` covers validation/run determinism. | Tracked enough for this audit, with stronger value coming from how branch truth is consumed. |
| scenarios -> deterministic runs | Run contracts and Phase 65/66 evidence cover deterministic selected-world runs and generated runtime artifacts through existing v1 contracts. | Tracked enough for this audit, but Phase 67 should stop adding adjacent surface evidence unless it resolves a named loop gap. |
| deterministic runs -> branch comparison | Compare contract requires durable `compare.json` when `branch_count > 1`; `backend/tests/test_pipeline.py::test_branching_scenario_writes_stable_compare_artifact` and CLI runtime tests cover compare emission. | Tracked, but strategically weak if downstream report/eval paths do not consistently anchor on compare truth. |
| branch comparison -> report/claims | The contract allows pair-scoped reports, but the chosen branch pair must come from compare truth. | Weakest current link: compare-sourced report/claims closure. |
| report/claims -> eval | Eval should consume `compare.json` for multi-branch scenarios and preserve claim/evidence integrity. | Weak if reports/claims are not proven to select branch pairs from compare truth before eval. |

## Evidence

- Mirror's blueprint centers a small, evidence-backed world that can run a baseline plus intervention and emit a diff report, claims, and eval summary.
- The current repo already has bounded fictional worlds and tracked selected-world continuity evidence.
- The compare contract is already durable. It names `compare.json` as branch truth and explicitly routes report/eval ownership through that truth.
- The report/claims contract is evidence-sensitive. Every report claim must keep both `label` and `evidence_ids`.
- Current report generation is not yet proven compare-sourced: `backend/app/reports/service.py` generates claims from run summaries passed as `baseline_dir` and candidate run directories, while `backend/app/evals/service.py` and `backend/app/sessions/service.py` write compare artifacts separately before invoking report generation.
- The Phase 67 queue guard already says: Do not open another adjacent surface/readiness/fidelity/continuity gate as the primary Phase 67 scope without a source-backed tie to scenario/intervention/branch-comparison/eval value.

## Inference

The most valuable next step is not another readiness, route, or surface proof. The weakest current link is compare-sourced report/claims closure: proving that report and claim generation choose branch pairs from the canonical compare artifact and keep claim labels plus `evidence_ids` intact before eval consumes the result.

This keeps the next PR inside the existing minimum loop, ties directly to scenario/intervention/branch-comparison/eval value, and avoids premature schema, route, provider, or public/private-beta expansion.

Phase 65 and Phase 66 evidence are relevant inputs, but their primary proof area is selected-world runtime generation and generated artifact continuity. They do not by themselves prove compare-sourced report/claims selection.

## Open Questions And TODO[verify]

- TODO[verify]: The audit does not yet prove that report generation consistently selects branch pairs from `compare.json` across selected bounded worlds and runtime-generated compare artifacts.
- TODO[verify]: The follow-up should verify whether existing eval coverage already consumes compare truth strongly enough for `branch_count > 1`, or whether it only validates indirectly through run summaries.
- TODO[verify]: If implementation needs new claim fields, new compare fields, scenario DSL changes, run trace shape changes, or artifact-layout changes, split a protected-core contract issue before implementation.

## Recommended Next Action

Recommended next issue: `#511` `Phase 67: align report and claims generation with compare-sourced branch truth`.

Recommendation: open an ordinary implementation issue for compare-sourced report/claims closure because the existing contract already states that reports and claims may remain pair-scoped, but the chosen branch pair must come from compare truth. The implementation should add focused tests that generate or load a compare artifact, route report/claims generation through the canonical branch pair, preserve `label` and `evidence_ids`, and verify eval can consume the resulting compare-backed report path.

This is a protected-core lane work item because it touches report/eval core behavior, but it is not an ADR-backed contract change by default.

## Contract And ADR Posture

This audit should not change contracts.

Recommended classification:

- ordinary implementation issue: use this when the follow-up only aligns report/claims generation and eval assertions with existing `compare.json` truth.
- protected-core contract issue: use this only if the implementation must change schema, scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare shape, session/node manifests, public demo artifact layout, plugin MCP contract, or artifact layout.
- ADR-backed contract change: use this only if the required contract change is long-lived and changes a durable architecture boundary.

## Non-Goals

- Do not present Mirror as a real-world prediction machine or package simulation output as certain real-world conclusions.
- Do not build real-person personas, digital doubles, political persuasion, hidden surveillance, or high-risk decision systems.
- Do not add routes, APIs, schemas, async/task_id behavior, worker queues, launch hub behavior, provider/model calls, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, public/plugin path expansion, route ownership changes, runtime mutation expansion, broad private-beta readiness, future-world readiness, or untracked planning-note promotion.
- Do not change schema, scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, plugin MCP contract, or artifact layout in this audit.
- `status:needs-adr` and unresolved `risk:safety` findings remain merge blockers.

## Validation Commands

- `python -m pytest backend/tests/test_phase67_minimum_loop_value_gap_audit.py -q`
- `python -m pytest backend/tests/test_phase67_blueprint_calibration_gate.py backend/tests/test_phase67_minimum_loop_value_gap_audit.py -q`
- `python scripts/check_no_secrets.py`
- `python scripts/bootstrap_github.py --repo YSCJRH/mirror-sim`
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
- `git diff --check`
- `./make.ps1 smoke`
- `./make.ps1 test`
