# Phase 51 Private-Beta Route Ownership Contract

Date: 2026-05-18

Issue: `#405` `Phase 51: ratify private-beta route ownership and launch-hub contract`

## Decision

The private-beta launch hub remains planning-only in Phase 51.

`/` remains the guided Phase 1 public Fog Harbor demo. `/review` remains the advanced
read-only public-demo review surface. The private-beta candidate product path remains
world-scoped under `/worlds/<world_id>` and its child routes when public-demo flags are
disabled in local or explicitly authorized private-beta environments.

No route implementation changes land in `#405`. World-scoped navigation may label `/` as
the public demo to match the route owner, but this does not add a launch hub or move any
private-beta capability. A future launch hub must not replace `/` or move private-beta
capabilities into the public path without a new reviewed work item that explicitly updates
the route contract, deployment posture, and public-demo interaction model.

## Evidence

- `README.md` documents `/` and `/review` as public read-only endpoints, then lists
  private-beta candidate entrypoints separately under `/worlds/<world_id>`.
- `docs/plans/phase-50-product-boundary-2026-05-18.md` records that the launch hub remains
  planning-only for now and that `/worlds/<world_id>` remains the private-beta candidate
  product path.
- `docs/architecture/contracts.md` states that Phase 1 public demo mode does not start
  sessions, generate branches, upload corpus data, create worlds, enable Hosted GPT, accept
  BYOK, or call the OpenAI API.
- `docs/deploy/render-public-demo.md` records that `/` loads the guided public demo,
  `/review` loads the advanced read-only review surface, and runtime mutation endpoints
  return `403` in public demo mode.
- `docs/deploy/mirror-codex-plugin.md` records that the Mirror Codex plugin is read-only and
  must not upload data, call model providers, create worlds, mutate runtime state, or read
  arbitrary filesystem paths.
- `docs/architecture/contracts.md` now records the durable public/private route ownership
  contract, and `docs/decisions/ADR-0011-private-beta-route-ownership.md` records the
  architectural decision not to move `/` into a launch hub in this phase.
- Current frontend route files already separate public demo routes from world-scoped
  private-beta candidate routes:
  - `frontend/src/app/page.tsx`
  - `frontend/src/app/review/page.tsx`
  - `frontend/src/app/worlds/new/page.tsx`
  - `frontend/src/app/worlds/[worldId]/page.tsx`
  - `frontend/src/app/worlds/[worldId]/perturb/page.tsx`
  - `frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx`
  - `frontend/src/app/worlds/[worldId]/runtime/[sessionId]/explain/page.tsx`
  - `frontend/src/app/worlds/[worldId]/runtime/[sessionId]/report/page.tsx`
  - `frontend/src/app/worlds/[worldId]/review/page.tsx`

## Route Ownership Table

| Route | Owner | Contract |
| --- | --- | --- |
| `/` | Phase 1 public demo | `/` remains the guided Phase 1 public Fog Harbor demo. It serves precomputed demo artifacts and must not expose private-beta runtime mutation. |
| `/review` | Phase 1 public demo | `/review` remains the advanced read-only public-demo review surface for the same precomputed artifacts. |
| `/api/health` | Public readiness surface | Health stays public and minimal. It must not expose local filesystem paths, provider configuration, or private-beta state. |
| `/api/ready` | Public readiness surface | Readiness stays public-demo aware and must surface degraded readiness without leaking arbitrary paths. |
| `/api/public-demo/manifest` | Public demo artifact API | Manifest stays allowlisted and logical-artifact based. |
| `/api/public-demo/artifacts/<id>` | Public demo artifact API | Artifact reads stay allowlisted and logical-artifact based. |
| `/worlds/<world_id>` | Private-beta candidate product path | `/worlds/<world_id>` remains the private-beta candidate world home. |
| `/worlds/new` | Private-beta candidate product path | `/worlds/new` remains a private-beta candidate creation route and must stay disabled in public demo mode. |
| `/worlds/<world_id>/perturb` | Private-beta candidate product path | `/worlds/<world_id>/perturb` remains the main private-beta operator path. |
| `/worlds/<world_id>/runtime/<session_id>` | Private-beta candidate product path | `/worlds/<world_id>/runtime/<session_id>` remains the world-scoped runtime workspace. |
| `/worlds/<world_id>/runtime/<session_id>/explain` | Private-beta candidate product path | `/worlds/<world_id>/runtime/<session_id>/explain` remains the world-scoped explain workspace. |
| `/worlds/<world_id>/runtime/<session_id>/report` | Private-beta candidate product path | `/worlds/<world_id>/runtime/<session_id>/report` remains the world-scoped report workspace. |
| `/worlds/<world_id>/review` | Private-beta candidate product path | `/worlds/<world_id>/review` remains the world-scoped private-beta review surface. |
| `/api/runtime/start-session` | Private-beta mutation API | Runtime mutation must stay disabled in public demo mode and must remain world-scoped. |
| `/api/runtime/generate-branch` | Private-beta mutation API | Runtime mutation must stay disabled in public demo mode and must remain world-scoped. |
| `/api/runtime/rollback-session` | Private-beta mutation API | Runtime mutation must stay disabled in public demo mode and must remain session-scoped. |
| `/api/worlds/create` | Private-beta mutation API | World creation must stay disabled in public demo mode. |
| `/changes/<branch_id>` | Public demo support route | Legacy public-demo support route for deterministic artifact inspection; it must stay artifact-backed and read-only. |
| `/explain/<branch_id>` | Public demo support route | Legacy public-demo support route for deterministic artifact explanation; it must stay artifact-backed and read-only. |
| `/perturb` | Legacy compatibility route | Legacy route retained for compatibility/reference only; it is not the canonical private-beta route owner. |
| `/runtime/<session_id>` and child routes | Legacy compatibility route | Legacy runtime routes remain Fog Harbor-defaulted compatibility surfaces until separately deprecated, redirected, or brought under a reviewed route contract. |

## Launch Hub Contract

The private-beta launch hub remains planning-only in Phase 51.

A future launch hub may be considered only as a reviewed product-path entry point that helps
authorized operators choose an existing bounded world or move into the existing
`/worlds/<world_id>` path. It may not be implemented as an implicit replacement for `/`, and
it may not blur the public demo, private-beta, or plugin boundaries.

A future launch hub must not replace `/`. It must not start sessions, generate branches, create worlds, upload corpora, enable Hosted GPT, accept BYOK, or call model providers from the public path. If a later implementation needs any of those capabilities, that later work must first update the route contract and the relevant deployment/access-control contract.

## Public Demo Boundary

The public demo remains read-only, anonymous, deterministic-only, and artifact-backed.

`/` and `/review` stay public-demo surfaces. Public demo mode must keep runtime mutation
endpoints disabled. Public API responses must not expose absolute repository paths, runtime
paths, provider secrets, arbitrary path lookup results, or private-beta state.

## Plugin Boundary

Mirror Codex plugin remains read-only.

The plugin remains scoped to deterministic public-demo inspection. It must not gain mutating
MCP tools, runtime mutation, Hosted GPT, BYOK, uploads, auth, billing, database, object
storage, quota behavior, provider calls, or filesystem-path disclosure without a separate
reviewed plugin contract.

## Private-Beta Boundary

`/worlds/<world_id>` remains the private-beta candidate product path.

Private-beta runtime behavior may continue to use explicitly configured local or authorized
deployment settings. Hosted private-beta model access remains server-side only, beta-gated,
quota-limited, and disabled by default. Browser-submitted BYO credentials remain
request-scoped and must not be persisted into session, node, report, claims, or
decision-trace artifacts.

## Follow-Up Gate

- TODO[verify]: verify the tracked frontend route tree before treating any private-beta path
  beyond the documented `/worlds/...` candidate routes as durable route ownership.
- TODO[verify]: if a launch hub becomes an implementation target, open a new reviewed work item
  that names its route, access mode, public-demo interaction, and deployment posture.
- TODO[verify]: verify route/session mismatch handling in `#406` before expanding
  private-beta runtime surfaces.
- TODO[verify]: verify that private-beta composer requests pass route-derived `worldId`
  through every world-scoped mutation before treating runtime generation as route-safe.
- TODO[verify]: rerun hosted/private-beta model measurements before introducing `task_id`,
  worker, retry, status, or cleanup semantics.
- TODO[verify]: keep untracked April/private-beta planning notes as candidate inputs only
  until a PR intentionally promotes them.

## Non-Goals

- Do not implement a launch hub route in `#405`.
- Do not replace `/` or widen the public path.
- Do not change public demo behavior.
- Do not change Mirror Codex plugin MCP tools or resources.
- Do not add mutating Mirror Codex MCP tools.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota behavior to the public path or plugin path.
- Do not implement async workers, queues, `task_id`, retry, status, or cleanup semantics.
- Do not change session or node manifest shape.
- Do not change compare artifact shape.
- Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape,
  public demo artifact layout, or plugin MCP contract.
- Do not build real-person personas, digital doubles, political persuasion, law-enforcement,
  hiring, credit, medical, or judicial decision systems.
- Do not present Mirror as real-world prediction or package simulation output as certain
  real-world conclusions.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase51_route_contract_note.py backend/tests/test_phase51_successor_gate.py backend/tests/test_phase50_product_boundary_note.py backend/tests/test_automation.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/architecture/contracts.md docs/decisions/ADR-0011-private-beta-route-ownership.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-51-successor-gate-2026-05-18.md docs/plans/phase-51-private-beta-route-contract-2026-05-18.md backend/tests/test_phase51_route_contract_note.py backend/tests/test_phase51_successor_gate.py
git diff --check
./make.ps1 eval-demo
```
