# Phase 65 Selected-World Runtime Generation Evidence

Issue: `#497` `Phase 65: add selected-world deterministic runtime generation smoke`

Evidence note: `docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md`

Phase 65 gate: `docs/plans/phase-65-selected-world-deterministic-runtime-generation-gate-2026-06-01.md`

Historical baseline: `docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md`

This note records selected-world deterministic runtime generation evidence for `fog-harbor-east-gate`, `museum-night`, and `library-rain`. The evidence uses existing v1 CLI/session contracts and temporary local artifacts only.

## Reproduction

Smoke script: `scripts/smoke_phase65_selected_world_runtime_generation.py`

Focused validation: `python -m pytest backend/tests/test_phase65_selected_world_runtime_generation.py backend/tests/test_phase65_selected_world_runtime_generation_gate.py -q`

Runtime smoke: `python scripts/smoke_phase65_selected_world_runtime_generation.py`

Required commands:

```powershell
python -m pytest backend/tests/test_phase65_selected_world_runtime_generation.py backend/tests/test_phase65_selected_world_runtime_generation_gate.py -q
python scripts/smoke_phase65_selected_world_runtime_generation.py
python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --source-only
python scripts/smoke_phase64_selected_world_perturb_followup_readiness.py --source-only
python scripts/check_no_secrets.py
./make.ps1 test
./make.ps1 eval-demo
./make.ps1 eval-transfer
```

The focused smoke builds temporary graph and persona inputs for each selected world, then calls the existing `start-session` and `generate-branch` CLI contracts with `deterministic_only` session configuration. It deletes its default temporary local artifacts after validation unless a caller passes an explicit artifact parent for inspection.

## Evidence

For each selected world, the smoke verifies:

- session and generated node world IDs remain world-scoped
- one generated branch is created from `node_root`
- mismatch rejection is exercised with the existing `--world` guard
- compare, report, claims, resolution, and decision trace artifacts are present
- Every emitted report claim keeps both `label` and `evidence_ids`.
- Every emitted report claim uses an allowed claim label and non-empty `evidence_ids` that resolve to the temporary ingest chunks.
- generated decision trace rows do not record provider/model execution

The smoke reports `provider_or_model_calls: false`, `async_task_or_worker_behavior: false`, and `new_route_or_api_added: false`.

## Boundary

This evidence does not call provider/model paths, does not add async/task_id behavior or worker queues, and does not add routes or APIs.

It does not change scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.

This is selected-world deterministic runtime generation evidence only. It does not promote broad private-beta readiness, future-world readiness, launch hub behavior, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, public/plugin path expansion, route ownership changes, runtime mutation expansion, or untracked planning notes.
