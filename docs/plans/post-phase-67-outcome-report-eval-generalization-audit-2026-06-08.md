# Post-Phase-67 Outcome/Report/Eval Generalization Audit

Date: 2026-06-08

This audit closes the first `TODO[verify]` from the Post-Phase-67 successor intake audit: audit current code and tests for remaining Fog Harbor-shaped outcome/report/eval assumptions before opening any successor.

## Current-Code Finding

Current-code audit result: no source-backed Phase 68 blocker is proven by bounded-world outcome/report/eval generalization today.

The selected-world proof is current for `fog-harbor-east-gate`, `museum-night`, and `library-rain`.

The proof is config-driven over world-local `tracked_outcomes`; it is not a future-world readiness claim.

The current queue remains in the formal paused stop-state.

The minimum loop remains:

```text
corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval
```

The queue shorthand is `corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval`.

## Source Evidence

- `backend/app/simulation/rules.py` defines `SimulationPlan.tracked_outcomes` as a list of `OutcomeDefinition`, so outcome fields are loaded from each world's simulation rules instead of a Fog Harbor-only constant.
- `backend/app/reports/service.py` builds claims by iterating `plan.tracked_outcomes`, selects changed outcomes from baseline and candidate summaries, writes `Compare source` and `Compare branch pair`, and validates claim payloads before writing `claims.json`.
- `backend/app/reports/service.py` keeps report claim integrity by emitting `label="evidence_backed"` and non-empty `evidence_ids` gathered from linked baseline and candidate actions.
- `backend/app/evals/service.py` loads `plan = load_simulation_plan(world_paths.simulation_rules_path)`, derives `tracked_outcome_fields` from that plan, and checks run summaries, compare deltas, semantic deltas, default-report semantic deltas, report compare sourcing, claim labels, claim evidence, evidence resolution, and redlines.
- `data/worlds/museum-night/config/simulation_rules.yaml` uses Museum Night outcome fields such as `checklist_public_turn`, `safety_hold_turn`, `opening_status`, `safety_hold_triggered`, and `risk_known_by`.
- `data/worlds/library-rain/config/simulation_rules.yaml` uses Library Rain outcome fields such as `catalog_public_turn`, `relocation_turn`, `reading_room_status`, `relocation_triggered`, and `risk_known_by`.
- `docs/architecture/contracts.md` says Fog Harbor keeps existing behavior through world-local rules instead of runner hardcoding.

## Eval Evidence

- `backend/tests/test_worlds.py` asserts the default transfer set is `fog-harbor-east-gate`, `museum-night`, and `library-rain`.
- `backend/tests/test_worlds.py` asserts `run_world_eval("museum-night")` and `run_world_eval("library-rain")` pass with all five tracked outcome fields covered in run summaries and compare artifacts.
- `backend/tests/test_worlds.py` asserts both selected transfer worlds have at least one changed tracked outcome, a default-report changed tracked outcome, `report_compare_sourced is True`, and `transfer_proof_world_local is True`.
- `backend/tests/test_worlds.py` includes negative coverage: transfer eval fails when tracked outcomes are removed from run summaries and fails when compare deltas are flattened to no semantic outcome change.
- `backend/tests/test_pipeline.py` asserts report generation selects the branch pair from canonical `compare.json`, writes the compare source, and keeps every claim labeled with evidence IDs.
- `backend/app/evals/service.py` keeps `DEFAULT_TRANSFER_WORLD_IDS` fixed to `fog-harbor-east-gate`, `museum-night`, and `library-rain`; `run_transfer_eval()` defaults to that reviewed set.
- `backend/tests/test_cli.py` verifies `create-world` can materialize a runtime world and start a session for it, but it does not yet run `eval-world` on that runtime-created world in the same proof.
- `backend/tests/test_cli.py` verifies `eval-transfer` returns `world_count == 3`, `tracked_outcome_count == 18`, and `transfer_proof_world_local is True`, matching the reviewed selected-world contract scope.
- Fresh local baseline for this audit: `python -m pytest backend/tests/test_worlds.py backend/tests/test_pipeline.py::test_report_selects_branch_pair_from_compare_artifact -q` returned `8 passed`.

## Successor Decision

Do not open Phase 68 from this audit.

This audit does not prove that bounded-world outcome/report/eval generalization is a current blocker. It proves the opposite narrower claim: the current selected-world outcome/report/eval evidence is strong enough that this candidate cannot be used by itself to open a successor queue.

No Phase 68 successor queue is opened by this audit.

The next candidate, if work continues, should be a current-code audit of decision-trace/replay hardening. That audit must prove a protected-core contract blocker before any implementation queue is opened.

TODO[verify]: Decision-trace/replay hardening remains the next candidate audit, not an implementation queue.

If the project later needs future-world readiness, the source-backed question is narrower than this audit: prove whether a runtime-created bounded world can pass `eval-world` or an equivalent temporary outcome/report/eval validation with `report_compare_sourced`, tracked outcome coverage, semantic compare deltas, claim `label`, and claim `evidence_ids`. That proof is not present in the current reviewed contract.

## Remaining Boundaries

TODO[verify]: Future-world readiness remains unclaimed by the current contract and would need separate source-backed evidence.

`docs/architecture/contracts.md` still states that the current default reviewed set is `fog-harbor-east-gate`, `museum-night`, and `library-rain`; this proves the pipeline has passed across three selected bounded fictional worlds and does not claim future-world readiness.

No ADR or `docs/architecture/contracts.md` update is made by this audit because this diff does not change a protected-core contract.

If a future audit proves a protected-core contract blocker, open a scoped protected-core contract issue, update `docs/architecture/contracts.md`, and add an ADR when the contract change is long-lived.

`status:needs-adr` and unresolved `risk:safety` findings remain merge blockers.

## Non-Goals

- Do not present Mirror as a real-world prediction machine.
- Do not build real-person personas or digital doubles.
- Do not build political persuasion, hidden surveillance, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.
- Do not open Phase 68 from this audit.
- Do not claim future-world readiness.
- Do not change schema, scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, plugin MCP contract, route ownership, or artifact layout.
- Keep Hosted GPT, BYOK, upload, auth, billing, quota behavior, provider/model calls, and launch-hub behavior out of this audit's implementation scope.

## Validation Commands

- `python -m pytest backend/tests/test_post_phase67_outcome_eval_audit.py -q`
- `python -m pytest backend/tests/test_post_phase67_outcome_eval_audit.py backend/tests/test_post_phase67_successor_intake_audit.py backend/tests/test_phase67_blueprint_calibration_closeout.py backend/tests/test_worlds.py backend/tests/test_pipeline.py::test_report_selects_branch_pair_from_compare_artifact -q`
- `python -m pytest backend/tests/test_cli.py::test_cli_create_world_writes_runtime_world_pack backend/tests/test_cli.py::test_cli_eval_world_outputs_json backend/tests/test_cli.py::test_cli_eval_transfer_outputs_json -q`
- `python scripts/check_no_secrets.py`
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
- `git diff --check`
