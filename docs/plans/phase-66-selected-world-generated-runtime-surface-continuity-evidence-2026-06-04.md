# Phase 66 Selected-World Generated Runtime Surface Continuity Evidence

Issue: `#503` `Phase 66: add selected-world generated runtime surface continuity smoke`

Evidence note: `docs/plans/phase-66-selected-world-generated-runtime-surface-continuity-evidence-2026-06-04.md`

Phase 66 gate: `docs/plans/phase-66-selected-world-generated-runtime-surface-continuity-gate-2026-06-04.md`

Historical baseline: `docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md`

This note records selected-world generated runtime surface continuity evidence for `fog-harbor-east-gate`, `museum-night`, and `library-rain`. The evidence reuses Phase 65 generated session/node artifacts from existing v1 CLI/session contracts and checks them against existing world-scoped runtime, explain, report, and review surfaces with temporary local artifacts only.

## Reproduction

Smoke script: `scripts/smoke_phase66_selected_world_runtime_surface_continuity.py`

Focused validation: `python -m pytest backend/tests/test_phase66_selected_world_generated_runtime_surface_continuity.py backend/tests/test_phase66_selected_world_generated_runtime_surface_continuity_gate.py -q`

Runtime surface smoke: `python scripts/smoke_phase66_selected_world_runtime_surface_continuity.py`

Phase 65 producer smoke: `python scripts/smoke_phase65_selected_world_runtime_generation.py`

Required commands:

```powershell
python -m pytest backend/tests/test_phase66_selected_world_generated_runtime_surface_continuity.py backend/tests/test_phase66_selected_world_generated_runtime_surface_continuity_gate.py -q
python scripts/smoke_phase66_selected_world_runtime_surface_continuity.py
python scripts/smoke_phase65_selected_world_runtime_generation.py
python scripts/check_no_secrets.py
npm run build --prefix frontend
.\make.ps1 test
```

The focused smoke imports the Phase 65 runtime-generation smoke, creates caller-managed or auto-cleaned temporary local artifacts, and structurally replays the existing `loadRuntimeSessionWorkspaceForWorld` contract against generated sessions. It also checks source markers proving the existing world-scoped runtime, explain, report, and review surfaces still consume the same route-derived `worldId` loader.

## Evidence

For each selected world, the smoke verifies:

- generated session and node manifests remain world-scoped
- runtime surface continuity has lineage, decision summary, compare deltas, and comparison rows
- explain surface continuity has claim drilldowns, resolved evidence chunks, and related runtime turns
- report surface continuity has node-scoped report text and parsed report blocks
- review surface continuity can locate the latest generated session through latest session lookup and link back to the runtime workspace
- Every emitted report claim keeps both `label` and `evidence_ids`.
- Every emitted report claim resolves `evidence_ids` against temporary ingest chunks.
- generated decision trace rows stay deterministic-only without provider/model execution

The smoke reports `provider_or_model_calls: false`, `async_task_or_worker_behavior: false`, `new_route_or_api_added: false`, and `route_ownership_changed: false`.

## Boundary

This evidence does not call provider/model paths, does not add async/task_id behavior or worker queues, and does not add routes or APIs.

It does not change scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.

This is selected-world generated runtime surface continuity evidence only. It does not promote broad private-beta readiness, future-world readiness, launch hub behavior, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, public/plugin path expansion, route ownership changes, runtime mutation expansion, or untracked planning notes.
