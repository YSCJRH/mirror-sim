# Phase 59 Selected-World Route Evidence

Issue: `#461` `Phase 59: add GET-only selected-world route smoke for Fog Harbor, Museum Night, and Library Rain`

Validation observed: 2026-05-23 Asia/Shanghai

This note records the narrow Phase 59 selected-world route continuity reproduction. It promotes only tracked GET-only route-readiness evidence for selected bounded fictional worlds. This is narrow GET-only route-readiness evidence for selected bounded fictional worlds, not broad private-beta readiness.

This note lives in `docs/plans/phase-59-selected-world-route-evidence-2026-05-23.md`.

## Reproduced Evidence

- `npm run build --prefix frontend` passed on 2026-05-23 Asia/Shanghai.
  - The Next.js route table included `/`, `/review`, `/worlds/[worldId]`, and `/worlds/[worldId]/review`.
- `python scripts/smoke_phase59_selected_world_routes_web.py --timeout 60` is the tracked GET-only selected-world route smoke added for this issue.
  - The command passed on 2026-05-23 Asia/Shanghai.
  - Page statuses were 200 for `/`, `/review`, `/worlds/fog-harbor-east-gate?session=`, `/worlds/fog-harbor-east-gate/review?session=`, `/worlds/museum-night?session=`, `/worlds/museum-night/review?session=`, `/worlds/library-rain?session=`, and `/worlds/library-rain/review?session=`.
  - It checks only route availability and route-ownership body markers.
  - It does not start sessions, generate branches, roll back sessions, create worlds, call model/provider paths, or post to runtime APIs.

## Route Smoke Coverage

The Phase 59 GET-only smoke covers this exact narrow route set:

| Route | Expected ownership signal |
| --- | --- |
| `/` | `/` remains the guided Phase 1 public demo and includes `Mirror Public Demo` plus `Deterministic-only Phase 1`. |
| `/review` | `/review` remains the read-only public advanced analyst surface and includes `Advanced Analyst Mode`. |
| `/worlds/<world_id>?session=` | `/worlds/<world_id>?session=` forces the private-beta candidate world home into no-session route-ownership markers for the selected bounded fictional world. |
| `/worlds/<world_id>/review?session=` | `/worlds/<world_id>/review?session=` forces the world-scoped private-beta review surface into explicit no-session limits. |

Selected world ids:

- `fog-harbor-east-gate`
- `museum-night`
- `library-rain`

## Source Anchors

- `docs/plans/phase-59-selected-world-route-continuity-gate-2026-05-23.md` defines the Phase 59 selected-world route continuity evidence gate.
- `docs/plans/phase-58-route-readiness-snapshot-evidence-2026-05-20.md` records the Phase 58 Fog Harbor route-readiness evidence that Phase 59 extends to selected transfer worlds.
- `docs/plans/phase-53-third-world-transfer-evidence-2026-05-19.md` records `library-rain` as the third bounded fictional world evidence slice.
- `frontend/src/app/worlds/[worldId]/page.tsx` loads `loadProductWorldConfig(worldId, locale)` and keeps world, perturb, and review links under `/worlds/<world_id>`. The smoke uses `?session=` to keep the home page in deterministic no-session route-ownership markers.
- `frontend/src/app/worlds/[worldId]/review/page.tsx` loads `loadProductWorldConfig(worldId, locale)` and `loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)` only when a session is available. The smoke uses `?session=` to exercise the review no-session branch deterministically; that branch says to generate one live branch first, then return for review.
- `data/demo/config/product.json`, `data/worlds/museum-night/config/product.json`, and `data/worlds/library-rain/config/product.json` provide the selected world product metadata used by the route pages.

## Boundary Limits

- This does not promote broad private-beta readiness.
- This does not promote future-world readiness.
- This does not promote launch hub behavior.
- This does not replace `/`.
- This does not add a multi-world selector UI.
- This does not make `/review` the private-beta main path.
- This does not add async/task_id behavior.
- This does not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion.
- This does not add any new mutating runtime API.
- This does not claim runtime generation proven by route smoke.
- This does not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.
- This does not promote untracked planning notes as durable truth.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase59_selected_world_route_readiness.py -q
python -m pytest backend/tests/test_phase59_selected_world_route_gate.py backend/tests/test_phase59_selected_world_route_readiness.py backend/tests/test_phase58_route_readiness_snapshots.py -q
python scripts/check_no_secrets.py
npm run build --prefix frontend
python scripts/smoke_phase59_selected_world_routes_web.py --timeout 60
python -m backend.app.cli classify-lane --files README.md docs/plans/automation-roadmap.md docs/plans/current-state-baseline.md docs/plans/phase-execution-queue.md docs/plans/phase-59-selected-world-route-continuity-gate-2026-05-23.md docs/plans/phase-59-selected-world-route-evidence-2026-05-23.md backend/tests/test_phase59_selected_world_route_readiness.py scripts/smoke_phase59_selected_world_routes_web.py
git diff --check
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
./make.ps1 eval-transfer
```
