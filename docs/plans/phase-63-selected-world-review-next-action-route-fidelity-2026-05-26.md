# Phase 63 Selected-World Review Next-Action Route Fidelity

Date: 2026-05-26

Issue: `#485` `Phase 63: add selected-world review next-action route-fidelity smoke`

Current work item: `#485` `Phase 63: add selected-world review next-action route-fidelity smoke`

This note records the tracked Phase 63 evidence slice for selected-world review
next-action route fidelity. The slice keeps the selected bounded fictional world
set fixed to:

- `fog-harbor-east-gate`
- `museum-night`
- `library-rain`

The evidence builds on
`docs/plans/phase-62-selected-world-review-evidence-actionability-2026-05-25.md`.
That Phase 62 evidence proves the selected-world review surfaces expose
read-only `review_readiness: ready` and `next_action:
select-or-generate-runtime-branch` cues. Phase 63 proves those read-only
`nextAction` cues map only to existing world-scoped follow-up paths.

This evidence note lives at
`docs/plans/phase-63-selected-world-review-next-action-route-fidelity-2026-05-26.md`.
It is reproduced by
`scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py`.
This is the tracked selected-world review next-action route fidelity evidence for `#485`.

## Route-Fidelity Signal

- read-only `nextAction` cues map only to existing world-scoped follow-up paths.
- The ready selected-world next action remains `next_action: select-or-generate-runtime-branch`.
- The route-fidelity handoff is `next_action_route: /worlds/<world_id>/perturb`.
- The route mode is `followup_route_mode: existing-world-scoped-perturb-route`.
- The follow-up route does not require an existing runtime session.
- The smoke records `mutating_runtime_api_called: false`.

## Selected Worlds

- `fog-harbor-east-gate`
  - review route: `/worlds/fog-harbor-east-gate/review?session=`
  - next-action route: `/worlds/fog-harbor-east-gate/perturb`
  - artifact root: `artifacts/demo`
  - `next_action: select-or-generate-runtime-branch`
  - `followup_route_mode: existing-world-scoped-perturb-route`
- `museum-night`
  - review route: `/worlds/museum-night/review?session=`
  - next-action route: `/worlds/museum-night/perturb`
  - artifact root: `artifacts/worlds/museum-night`
  - `next_action: select-or-generate-runtime-branch`
  - `followup_route_mode: existing-world-scoped-perturb-route`
- `library-rain`
  - review route: `/worlds/library-rain/review?session=`
  - next-action route: `/worlds/library-rain/perturb`
  - artifact root: `artifacts/worlds/library-rain`
  - `next_action: select-or-generate-runtime-branch`
  - `followup_route_mode: existing-world-scoped-perturb-route`

## Source Anchors

- Review route: `frontend/src/app/worlds/[worldId]/review/page.tsx`
- Runtime session loader: `frontend/src/app/lib/runtime-session-data.ts`
- Phase 62 review evidence actionability:
  `docs/plans/phase-62-selected-world-review-evidence-actionability-2026-05-25.md`
- Phase 63 route-fidelity smoke:
  `scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py`

## Boundary

This evidence slice does not start sessions, does not generate branches, does
not roll back sessions, does not create worlds, does not call POST/runtime APIs,
and does not call provider/model paths.

It does not change route ownership, scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.

It does not promote private-beta-wide readiness, readiness for unreviewed
worlds, future-world readiness, launch-hub delivery, Hosted GPT or BYOK
operation, storage/auth expansion, public/plugin path expansion, or runtime
mutation expansion.

## Validation Commands

Reproduce with
`python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --source-only`,
`python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --timeout 60`,
`npm run build --prefix frontend`, and the focused pytest below.

```powershell
python -m backend.app.cli eval-demo
python -m backend.app.cli eval-transfer
python -m pytest backend/tests/test_phase63_selected_world_next_action_route_fidelity.py -q
python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --source-only
python scripts/smoke_phase62_selected_world_review_actionability.py --source-only
python scripts/smoke_phase61_selected_world_review_surface_binding.py --source-only
python scripts/check_no_secrets.py
npm run build --prefix frontend
python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --timeout 60
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
./make.ps1 eval-transfer
```
