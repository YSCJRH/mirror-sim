# Phase 58 Route Readiness Snapshot Evidence

Issue: `#455` `Phase 58: reproduce private-beta route-readiness snapshots with tracked smoke coverage`

Validation observed: 2026-05-21 Asia/Shanghai

This note records the narrow Phase 58 route-readiness reproduction. It promotes only the source-verified, tracked evidence that the current frontend build exposes the expected public-demo and world-scoped private-beta route surfaces for the canonical Fog Harbor world. This is narrow route-readiness evidence, not broad private-beta readiness.

This note lives in `docs/plans/phase-58-route-readiness-snapshot-evidence-2026-05-20.md`.

## Reproduced Evidence

- `npm run build --prefix frontend` passed on 2026-05-21 Asia/Shanghai.
  - The Next.js route table included `/`, `/review`, `/worlds/[worldId]`, `/worlds/[worldId]/review`, `/worlds/[worldId]/runtime/[sessionId]`, `/worlds/[worldId]/runtime/[sessionId]/explain`, and `/worlds/[worldId]/runtime/[sessionId]/report`.
- `python scripts/smoke_private_beta_web.py --timeout 60` passed on 2026-05-21 Asia/Shanghai.
  - The smoke used the existing deterministic-only private-beta path for `fog-harbor-east-gate`.
  - It generated a run-specific session id and a run-specific child node id.
  - It rolled the active node back to `node_root`.
  - Page statuses were 200 for `/`, `/worlds/new`, `/worlds/fog-harbor-east-gate`, `/worlds/fog-harbor-east-gate/perturb`, `/worlds/fog-harbor-east-gate/runtime`, `/worlds/fog-harbor-east-gate/runtime/explain`, `/worlds/fog-harbor-east-gate/runtime/report`, and `/worlds/fog-harbor-east-gate/review`.
- `python scripts/smoke_phase58_route_readiness_web.py --timeout 60` is the tracked GET-only route-readiness smoke added for this issue.
  - The command passed on 2026-05-21 Asia/Shanghai.
  - Page statuses were 200 for `/`, `/review`, `/worlds/fog-harbor-east-gate`, and `/worlds/fog-harbor-east-gate/review`.
  - It checks only route availability and route-ownership body markers.
  - It does not start sessions, generate branches, roll back sessions, create worlds, or post to runtime APIs.

## Route Smoke Coverage

The Phase 58 GET-only smoke covers this exact narrow route set:

| Route | Expected ownership signal |
| --- | --- |
| `/` | `/` remains the guided Phase 1 public demo and includes `Mirror Public Demo` plus `Deterministic-only Phase 1`. |
| `/review` | `/review` remains the read-only public advanced analyst surface and includes `Advanced Analyst Mode`. |
| `/worlds/<world_id>` | `/worlds/<world_id>` is a private-beta candidate world home for the bounded Fog Harbor world. |
| `/worlds/<world_id>/review` | `/worlds/<world_id>/review` is the world-scoped private-beta review surface with explicit no-session limits. |

## Source Anchors

- `frontend/src/app/page.tsx` keeps `/` as the guided public demo and reserves runtime mutation, create-world, corpus upload, Hosted GPT, BYOK, auth, payment, database storage, and quota systems for later phases.
- `frontend/src/app/review/page.tsx` keeps `/review` as `data-review-surface="advanced-analyst-mode"` and orders the review path as scorecard, trace/claims, claims, reference, then advanced operations.
- `frontend/src/app/worlds/[worldId]/page.tsx` loads `loadProductWorldConfig(worldId, locale)` and keeps world, perturb, and review links under `/worlds/<world_id>`.
- `frontend/src/app/worlds/[worldId]/review/page.tsx` loads `loadProductWorldConfig(worldId, locale)` and `loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)` only when a session is available. The no-session branch says to generate one live branch first, then return for review.
- `docs/plans/phase-56-candidate-source-verification-2026-05-20.md` remains the source-verified candidate signal filter.
- `docs/plans/phase-58-route-readiness-evidence-gate-2026-05-20.md` remains the Phase 58 gate.

## Boundary Limits

- This does not promote broad private-beta readiness.
- This does not promote launch hub behavior.
- This does not replace `/`.
- This does not make `/review` the private-beta main path.
- This does not add async/task_id behavior.
- This does not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion.
- This does not add any new mutating runtime API.
- This does not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.
- This does not promote untracked April/private-beta/kernel/design-system planning notes as durable truth.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase58_route_readiness_snapshots.py -q
python -m pytest backend/tests/test_phase58_route_readiness_gate.py backend/tests/test_phase58_route_readiness_snapshots.py backend/tests/test_phase56_candidate_source_verification.py backend/tests/test_phase56_world_review_continuity_guardrail.py backend/tests/test_phase52_runtime_guard_regression_note.py -q
python scripts/check_no_secrets.py
npm run build --prefix frontend
python scripts/smoke_private_beta_web.py --timeout 60
python scripts/smoke_phase58_route_readiness_web.py --timeout 60
python -m backend.app.cli classify-lane --files README.md docs/plans/automation-roadmap.md docs/plans/current-state-baseline.md docs/plans/phase-execution-queue.md docs/plans/phase-58-route-readiness-evidence-gate-2026-05-20.md docs/plans/phase-58-route-readiness-snapshot-evidence-2026-05-20.md backend/tests/test_phase58_route_readiness_snapshots.py scripts/smoke_phase58_route_readiness_web.py
git diff --check
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
```
