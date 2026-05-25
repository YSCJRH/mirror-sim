# Phase 62 Selected-World Review Evidence Actionability

Date: 2026-05-25

Issue: `#479` `Phase 62: add selected-world review evidence actionability smoke`

Current work item: `#479` `Phase 62: add selected-world review evidence actionability smoke`

This note records the tracked Phase 62 evidence slice for selected-world review
evidence actionability. The slice keeps the selected bounded fictional world set
fixed to:

- `fog-harbor-east-gate`
- `museum-night`
- `library-rain`

The evidence builds on
`docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md`.
This evidence note lives at
`docs/plans/phase-62-selected-world-review-evidence-actionability-2026-05-25.md`.
Phase 61 proves that selected-world review surfaces bind to stable route
`worldId` values, artifact roots, eval summaries, report claim labels,
`evidence_ids`, and chunk resolution. Phase 62 turns those existing signals into
read-only review readiness and next-action signals on `/worlds/<world_id>/review`
and a focused smoke script:
`scripts/smoke_phase62_selected_world_review_actionability.py`.

## Actionability Signal

- selected-world review surfaces expose read-only review readiness and next-action signals.
- readiness is derived from artifact root, eval status, report claim count, claim labels, `evidence_ids`, and evidence chunk resolution.
- The frontend loader derives `reviewReadiness`, `nextAction`, `nextActionReason`, and `readinessSignals` from the existing evidence binding fields.
- The review surface renders a read-only `Review readiness` panel with the `Next action` cue.
- The ready selected-world state is `review_readiness: ready`.
- The ready selected-world next action is `next_action: select-or-generate-runtime-branch`.

## Selected Worlds

- `fog-harbor-east-gate`
  - route: `/worlds/fog-harbor-east-gate/review?session=`
  - artifact root: `artifacts/demo`
  - eval status: `pass`
  - `review_readiness: ready`
  - `next_action: select-or-generate-runtime-branch`
- `museum-night`
  - route: `/worlds/museum-night/review?session=`
  - artifact root: `artifacts/worlds/museum-night`
  - eval status: `pass`
  - `review_readiness: ready`
  - `next_action: select-or-generate-runtime-branch`
- `library-rain`
  - route: `/worlds/library-rain/review?session=`
  - artifact root: `artifacts/worlds/library-rain`
  - eval status: `pass`
  - `review_readiness: ready`
  - `next_action: select-or-generate-runtime-branch`

## Source Anchors

- Review route: `frontend/src/app/worlds/[worldId]/review/page.tsx`
- Evidence loader: `frontend/src/app/lib/selected-world-review-evidence.ts`
- Phase 61 review surface binding evidence:
  `docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md`
- Phase 62 review evidence actionability smoke:
  `scripts/smoke_phase62_selected_world_review_actionability.py`

## Boundary

This evidence slice does not start sessions, does not generate branches, does not
roll back sessions, does not create worlds, and does not call provider/model paths.

It does not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.

It does not promote private-beta-wide readiness, readiness for unreviewed worlds,
launch-hub delivery, Hosted GPT or BYOK operation, storage/auth expansion, or
runtime mutation expansion.

## Validation Commands

Reproduce with `python scripts/smoke_phase62_selected_world_review_actionability.py --source-only`,
`python scripts/smoke_phase62_selected_world_review_actionability.py --timeout 60`,
`npm run build --prefix frontend`, and the focused pytest below.

```powershell
python scripts/smoke_phase62_selected_world_review_actionability.py --source-only
python scripts/smoke_phase61_selected_world_review_surface_binding.py --source-only
python -m pytest backend/tests/test_phase62_selected_world_review_evidence_actionability.py -q
python scripts/check_no_secrets.py
npm run build --prefix frontend
python scripts/smoke_phase62_selected_world_review_actionability.py --timeout 60
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
./make.ps1 eval-transfer
```
