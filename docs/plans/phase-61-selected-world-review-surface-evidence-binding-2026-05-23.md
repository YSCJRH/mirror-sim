# Phase 61 Selected-World Review Surface Evidence Binding

Date: 2026-05-23

Issue: `#473` `Phase 61: add selected-world review surface evidence binding smoke`

Current work item: `#473` `Phase 61: add selected-world review surface evidence binding smoke`

This note records the tracked Phase 61 evidence slice for selected-world review
surface evidence binding. The slice keeps the selected bounded fictional world set
fixed to:

- `fog-harbor-east-gate`
- `museum-night`
- `library-rain`

The evidence builds on
`docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md`.
This evidence note lives at
`docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md`.
Phase 60 proves the selected artifact roots, eval summaries, report claim labels,
`evidence_ids`, and chunk resolution. Phase 61 adds a visible read-only binding
signal on `/worlds/<world_id>/review` and a focused smoke script:
`scripts/smoke_phase61_selected_world_review_surface_binding.py`.

## Binding Signal

- selected-world review surfaces bind to stable route `worldId` values.
- Selected-world review surfaces bind to stable route `worldId` values.
- Review pages load artifact roots validated by Phase 60.
- The review surface now displays the repo-relative artifact root, eval status,
  report claim count, and evidence resolution status even when no runtime session
  exists for the selected world.
- The frontend loader reads:
  - `eval/summary.json`
  - `report/claims.json`
  - `ingest/chunks.jsonl`
- Report claims keep both `label` and `evidence_ids`.
- report claims keep both `label` and `evidence_ids`.
- Evidence ids resolve against selected-world chunks.

## Selected Worlds

- `fog-harbor-east-gate`
  - route: `/worlds/fog-harbor-east-gate/review?session=`
  - artifact root: `artifacts/demo`
  - eval summary: `artifacts/demo/eval/summary.json`
  - eval status: `pass`
  - report claims: `3`
  - `claim_evidence_resolves: true`
- `museum-night`
  - route: `/worlds/museum-night/review?session=`
  - artifact root: `artifacts/worlds/museum-night`
  - eval summary: `artifacts/worlds/museum-night/eval/summary.json`
  - eval status: `pass`
  - report claims: `3`
  - `claim_evidence_resolves: true`
- `library-rain`
  - route: `/worlds/library-rain/review?session=`
  - artifact root: `artifacts/worlds/library-rain`
  - eval summary: `artifacts/worlds/library-rain/eval/summary.json`
  - eval status: `pass`
  - report claims: `3`
  - `claim_evidence_resolves: true`

## Source Anchors

- Review route: `frontend/src/app/worlds/[worldId]/review/page.tsx`
- Evidence loader: `frontend/src/app/lib/selected-world-review-evidence.ts`
- Runtime workspace loader: `frontend/src/app/lib/runtime-session-data.ts`
- Phase 60 artifact integrity smoke:
  `scripts/smoke_phase60_selected_world_artifact_integrity.py`
- Phase 61 review surface binding smoke:
  `scripts/smoke_phase61_selected_world_review_surface_binding.py`

## Boundary

This evidence slice does not start sessions, does not generate branches, does not
roll back sessions, does not create worlds, and does not call provider/model
paths.

It does not call provider/model paths.

It does not change scenario DSL, claim labels, run trace shape, compare artifact
shape, session/node manifest shape, public demo artifact layout, or plugin MCP
contract.

It does not change scenario DSL, claim labels, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.

It does not promote private-beta-wide readiness, readiness for unreviewed worlds,
launch-hub delivery, Hosted GPT or BYOK operation, storage/auth expansion, or
runtime mutation expansion.

## Validation Commands

Reproduce with `python scripts/smoke_phase61_selected_world_review_surface_binding.py --source-only`,
`python scripts/smoke_phase61_selected_world_review_surface_binding.py --timeout 60`,
`npm run build --prefix frontend`, and the focused pytest below.

```powershell
python scripts/smoke_phase61_selected_world_review_surface_binding.py --source-only
python -m pytest backend/tests/test_phase61_selected_world_review_surface_binding.py -q
python scripts/check_no_secrets.py
npm run build --prefix frontend
python scripts/smoke_phase61_selected_world_review_surface_binding.py --timeout 60
./make.ps1 eval-transfer
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
```
