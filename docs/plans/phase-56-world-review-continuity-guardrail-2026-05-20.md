# Phase 56 World-Scoped Review Continuity Guardrail

Issue: `#443` `Phase 56: add world-scoped review continuity guardrail`

Current state: Phase 56 remains a source-verified candidate-promotion and
review-continuity phase. This note promotes only the narrow source-backed
guardrail that the existing world-scoped review surface preserves review
continuity without becoming a launch hub or widening public-path behavior.

## Source Evidence

- `docs/architecture/contracts.md:474` records the durable route ownership
  contract. `docs/architecture/contracts.md:476` keeps `/` as the guided Phase
  1 public Fog Harbor demo, `docs/architecture/contracts.md:477` keeps
  `/review` as the advanced read-only public-demo review surface, and
  `docs/architecture/contracts.md:489` keeps `/worlds/<world_id>/review` as
  the world-scoped private-beta review surface.
- `docs/architecture/contracts.md:496` and
  `docs/architecture/contracts.md:497` keep top-level `/perturb`,
  `/runtime/<session_id>`, and child runtime routes as legacy compatibility
  surfaces, not canonical private-beta owners.
- `frontend/src/app/worlds/[worldId]/review/page.tsx:27` accepts optional
  `session` and `node` query parameters, while
  `frontend/src/app/worlds/[worldId]/review/page.tsx:109` derives `worldId`
  from the route.
- `frontend/src/app/worlds/[worldId]/review/page.tsx:117` falls back to the
  latest runtime session for the same world when no explicit session is
  provided. Lines `119` through `122` preserve route-derived world, session,
  and node scope before loading the runtime workspace.
- `frontend/src/app/worlds/[worldId]/review/page.tsx:126` through `148` build
  runtime, explain, report, perturb, world, and review links under
  `/worlds/<world_id>`, preserving world/session/node scope where relevant.
- `frontend/src/app/worlds/[worldId]/review/page.tsx:155` labels the surface as
  `Mirror Engine / Private Beta`, and lines `158` through `160` keep world,
  perturb, and review navigation bound to `worldHref`, `perturbHref`, and
  `reviewHref`.
- `frontend/src/app/worlds/[worldId]/review/page.tsx:176` states the continuity
  order: score first, then decide whether runtime, explain, or report is
  needed. Lines `287` through `320` keep the dedicated runtime, explain, and
  report follow-up entrypoint section after the scorecard, brief, and lineage
  context.
- `frontend/src/app/worlds/[worldId]/review/page.tsx:335` keeps the no-session
  state explicit: generate one live branch first, then return for review.
- `frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx:80`,
  `frontend/src/app/worlds/[worldId]/runtime/[sessionId]/explain/page.tsx:87`,
  and
  `frontend/src/app/worlds/[worldId]/runtime/[sessionId]/report/page.tsx:85`
  return runtime, explain, and report operators to
  `/worlds/<world_id>/review` with session and node scope intact.
- `frontend/src/app/page.tsx:14`, `frontend/src/app/page.tsx:32`, and
  `frontend/src/app/page.tsx:37` keep `/` as the public demo with `/review` as
  a public advanced review link.
- `frontend/src/app/review/page.tsx:102`, `frontend/src/app/review/page.tsx:107`,
  and `frontend/src/app/review/page.tsx:111` keep top-level `/review` as the
  read-only public advanced analyst surface.

## Guardrail

`/worlds/<world_id>/review` remains the private-beta world-scoped review surface.
The guardrail is source-level and test-backed:

- world/session/node scope is preserved in follow-up links;
- runtime, explain, report, perturb, world, and review links stay under `/worlds/<world_id>`;
- runtime, explain, and report routes return to `/worlds/<world_id>/review` with session and node scope;
- the dedicated follow-up section keeps review and scorecard context before
  runtime/explain/report choices, while scoped header shortcuts remain
  world/session/node-bound navigation rather than a launch hub;
- the no-session branch routes the operator to generate one world-scoped live
  branch first, then return for review;
- top-level runtime routes are not promoted as canonical private-beta owners.

## Public And Private Surface Separation

`/` remains the guided public demo. `/review` remains the public advanced analyst review surface for the public demo. `/worlds/<world_id>/review` remains the private-beta world-scoped review surface.

This work does not move the private-beta product path onto `/`, does not make
top-level `/review` a world-scoped review owner, and does not make legacy
top-level runtime routes canonical private-beta owners.

## Non-Goals

No frontend route ownership, backend API, scenario DSL, claim/evidence, trace, artifact, or plugin MCP contract changes are made by #443.

This guardrail does not implement a launch hub, Hosted GPT, BYOK, upload,
auth, billing, storage, quota, async workers, background queues, status
polling, cleanup semantics, or plugin mutation. It does not add any mutating
runtime surface.

## Validation Commands

- `python -m pytest backend/tests/test_phase56_world_review_continuity_guardrail.py -q`
- `python -m pytest backend/tests/test_phase56_world_review_continuity_guardrail.py backend/tests/test_phase56_candidate_source_verification.py backend/tests/test_phase56_successor_gate.py backend/tests/test_phase55_review_surface_guardrail.py -q`
- `python scripts/check_no_secrets.py`
- `python -m backend.app.cli classify-lane --files docs/plans/phase-56-world-review-continuity-guardrail-2026-05-20.md backend/tests/test_phase56_world_review_continuity_guardrail.py`
- `git diff --check`
- `./make.ps1 test`
- `./make.ps1 smoke`
- `./make.ps1 eval-demo`
