# Phase 64 Selected-World Perturb Follow-Up Readiness

Issue: `#491` `Phase 64: add selected-world perturb follow-up readiness smoke`

Current state: Phase 64 remains active; `#490` is closed by PR `#492`; `#489` remains the blocked exit gate.

Evidence note: `docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md`

This note records the selected-world perturb follow-up readiness evidence for `fog-harbor-east-gate`, `museum-night`, and `library-rain`. It does not change runtime behavior or widen any public, plugin, async, provider, or mutation contract.

## Input Baseline

- Phase 63 selected-world review next-action route fidelity: `docs/plans/phase-63-selected-world-review-next-action-route-fidelity-2026-05-26.md`
- Phase 64 gate: `docs/plans/phase-64-selected-world-perturb-followup-readiness-gate-2026-05-26.md`
- Perturb route source: `frontend/src/app/worlds/[worldId]/perturb/page.tsx`
- Preset composer source: `frontend/src/app/components/preset-perturbation-composer.tsx`
- Smoke script: `scripts/smoke_phase64_selected_world_perturb_followup_readiness.py`

## Evidence

The source-only smoke verifies from tracked sources that Phase 63 `nextAction` targets remain `/worlds/<world_id>/perturb` for all selected worlds, and that each follow-up surface is configured without requiring an existing session. The optional GET-only smoke verifies live route reachability after the frontend build exists.

For each selected world, the smoke loads the world-local `config/product.json`, reads the world-local `config/decision_schema.yaml`, and resolves every product `perturbation_options[*].runtime` payload through the existing perturbation resolver. This verifies:

- world-local perturbation presets are present for the selected world;
- decision schema defaults remain `provider: openai_compatible` and `model: ""`;
- every preset maps to a schema-backed perturbation kind, target, actor, timing token, and parameter set;
- the validation path records `validation_mutating_runtime_api_called: false`;
- validation does not start sessions during validation;
- validation does not generate branches during validation;
- validation does not call POST/runtime APIs during validation;
- validation does not call provider/model paths.

## Selected Worlds

- `fog-harbor-east-gate`
  - route: `/worlds/fog-harbor-east-gate/perturb`
  - product config: `data/demo/config/product.json`
  - decision schema: `data/demo/config/decision_schema.yaml`
- `museum-night`
  - route: `/worlds/museum-night/perturb`
  - product config: `data/worlds/museum-night/config/product.json`
  - decision schema: `data/worlds/museum-night/config/decision_schema.yaml`
- `library-rain`
  - route: `/worlds/library-rain/perturb`
  - product config: `data/worlds/library-rain/config/product.json`
  - decision schema: `data/worlds/library-rain/config/decision_schema.yaml`

## Reproduction

Required commands include `python scripts/smoke_phase64_selected_world_perturb_followup_readiness.py --source-only`, `python scripts/smoke_phase64_selected_world_perturb_followup_readiness.py --timeout 60`, `python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --source-only`, and `npm run build --prefix frontend`.

```powershell
python -m pytest backend/tests/test_phase64_selected_world_perturb_followup_readiness.py -q
python scripts/smoke_phase64_selected_world_perturb_followup_readiness.py --source-only
python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --source-only
npm run build --prefix frontend
```

Optional GET-only route smoke after the frontend build exists:

```powershell
python scripts/smoke_phase64_selected_world_perturb_followup_readiness.py --timeout 60
```

## Boundary

This evidence does not start sessions, generate branches, call POST/runtime APIs, call provider/model paths, or change perturbation payload schema, decision schema, runtime/session/node manifests, or route ownership contracts.

It does not change perturbation payload schema, decision schema, runtime/session/node manifests, or route ownership contracts.

It does not promote broad private-beta readiness, future-world readiness, launch hub behavior, async/task_id behavior, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, public/plugin path expansion, scenario DSL changes, claim label changes, report claim `evidence_ids` changes, run trace shape changes, compare artifact shape changes, public demo artifact layout changes, or plugin MCP contract changes.
