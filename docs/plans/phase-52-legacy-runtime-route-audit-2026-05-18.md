# Phase 52 Legacy Top-Level Runtime Route Audit

Date: 2026-05-18

Issue: `#412` `Phase 52: audit legacy top-level runtime routes and preserve boundary contract`

## Decision

Legacy top-level runtime routes stay contained as compatibility surfaces in `#412`.

`/perturb` remains a Fog Harbor-defaulted legacy compatibility surface. `/runtime/<session_id>` remains a Fog Harbor-defaulted legacy compatibility surface. `/runtime/<session_id>/explain` remains a Fog Harbor-defaulted legacy compatibility surface. `/runtime/<session_id>/report` remains a Fog Harbor-defaulted legacy compatibility surface.

`/worlds/<world_id>/perturb` remains the canonical private-beta operator route. `/worlds/<world_id>/runtime/<session_id>` remains the canonical world-scoped runtime workspace, with its `/explain` and `/report` children kept under the same world-scoped route owner.

Do not redirect, delete, or promote legacy top-level runtime routes in `#412`. Do not present legacy top-level runtime routes as the private-beta main path.

## Evidence

- `frontend/src/app/README.md` records world-scoped routes as private-beta product routes and lists top-level runtime routes under legacy/demo routes kept for reference.
- `frontend/src/app/lib/runtime-session-data.ts` keeps `loadRuntimeSessionWorkspace()` defaulted to `fog-harbor-east-gate`, while `loadRuntimeSessionWorkspaceForWorld(worldId, ...)` is the world-scoped loader.
- `frontend/src/app/perturb/page.tsx` and `frontend/src/app/runtime/[sessionId]/page.tsx` still render tracked top-level compatibility pages instead of redirecting.
- `frontend/src/app/worlds/[worldId]/perturb/page.tsx` and `frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx` remain the tracked world-scoped private-beta candidate routes.
- `docs/plans/phase-51-private-beta-route-contract-2026-05-18.md` and `docs/decisions/ADR-0011-private-beta-route-ownership.md` already keep `/` and `/review` public-demo-owned while placing private-beta ownership under `/worlds/<world_id>`.
- `docs/architecture/contracts.md` records public-demo mode as read-only and blocks public demo session start, branch generation, world creation, Hosted GPT, BYOK, uploads, and provider calls.

## Route Inventory

| Route | Current posture | Owner |
| --- | --- | --- |
| `/perturb` | Fog Harbor-defaulted legacy compatibility route | Legacy compatibility, not private-beta owner |
| `/runtime/<session_id>` | Fog Harbor-defaulted legacy compatibility route | Legacy compatibility, not private-beta owner |
| `/runtime/<session_id>/explain` | Fog Harbor-defaulted legacy compatibility route | Legacy compatibility, not private-beta owner |
| `/runtime/<session_id>/report` | Fog Harbor-defaulted legacy compatibility route | Legacy compatibility, not private-beta owner |
| `/worlds/<world_id>/perturb` | Canonical private-beta operator route | World-scoped private-beta candidate product path |
| `/worlds/<world_id>/runtime/<session_id>` | Canonical world-scoped runtime workspace | World-scoped private-beta candidate product path |
| `/worlds/<world_id>/runtime/<session_id>/explain` | World-scoped explain workspace | World-scoped private-beta candidate product path |
| `/worlds/<world_id>/runtime/<session_id>/report` | World-scoped report workspace | World-scoped private-beta candidate product path |

## Legacy Route Posture

The legacy top-level runtime route posture is containment, not migration.

- Keep the legacy top-level runtime routes tracked and explicit.
- Keep them out of private-beta main-path documentation and navigation claims.
- Treat their Fog Harbor defaulting as compatibility behavior, not as a multi-world contract.
- Preserve the Phase 51 route ownership decision that private-beta product ownership is world-scoped.
- Keep public-demo mutation blocking and private-beta route-derived `worldId` guards as separate contracts.

No public demo, plugin, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or async contract is widened.

## Follow-Up Gate

- TODO[verify]: open a separate migration work item before redirecting or deleting any legacy top-level runtime route.
- TODO[verify]: decide separately whether public-demo support links should keep, hide, or relabel `/perturb` before a private-beta launch surface is implemented.
- TODO[verify]: keep route-derived `worldId` or an equivalent reviewed guard before adding any new mutating runtime API.

## Non-Goals

- Do not implement a launch hub in `#412`.
- Do not replace `/` or widen the public path.
- Do not change public demo behavior.
- Do not change Mirror Codex plugin MCP tools or resources.
- Do not add mutating Mirror Codex MCP tools.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota behavior to the public path or plugin path.
- Do not implement async workers, queues, `task_id`, retry, status, cleanup, checkpoint mutation/deletion, or restore semantics.
- Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.
- Do not build real-person personas, digital doubles, political persuasion, law-enforcement, hiring, credit, medical, or judicial decision systems.
- Do not present Mirror as real-world prediction or package simulation output as certain real-world conclusions.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase52_legacy_route_audit_note.py backend/tests/test_phase52_successor_gate.py backend/tests/test_phase51_route_contract_note.py backend/tests/test_phase51_runtime_guard_note.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/architecture/contracts.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-51-successor-gate-2026-05-18.md docs/plans/phase-52-successor-gate-2026-05-18.md docs/plans/phase-52-legacy-runtime-route-audit-2026-05-18.md backend/tests/test_phase52_legacy_route_audit_note.py backend/tests/test_phase52_successor_gate.py
git diff --check
./make.ps1 test
./make.ps1 eval-demo
```
