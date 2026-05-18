# Phase 50 Product Boundary Decision

Date: 2026-05-18

Issue: `#401` `Phase 50: ratify private-beta launch hub and public-path boundary`

## Decision

The private-beta launch hub remains planning-only for now.

`/` remains the guided Phase 1 public Fog Harbor demo. `/review` remains the advanced
read-only review surface. The current private-beta candidate product path remains
world-scoped under `/worlds/<world_id>` and related runtime routes when public-demo flags are
disabled in local or explicitly authorized private-beta environments. Do not replace `/`, add
a private-beta launch hub route, or move private-beta capabilities into the public path
without a separate reviewed route contract.

This chooses the conservative Phase 50 option: keep the launch hub as a planning concept
until a later PR explicitly ratifies route ownership, access mode, public-demo interaction,
and deployment posture.

## Evidence

- `README.md` documents `/` as the guided public demo and lists private-beta candidate
  entrypoints separately under `/worlds/<world_id>`.
- `docs/deploy/render-public-demo.md` states that `/` loads the guided public demo and that
  runtime mutation endpoints return `403` in public demo mode.
- `docs/architecture/contracts.md` states that Phase 1 public demo mode does not start
  sessions, generate branches, upload corpus data, create worlds, enable Hosted GPT, accept
  BYOK, or call the OpenAI API.
- `docs/deploy/mirror-codex-plugin.md` states that the Mirror Codex plugin is for read-only
  inspection of the deterministic public demo and must not upload data, call model
  providers, create worlds, mutate runtime state, or require private configuration.
- The current frontend route layout already has world-scoped private-beta candidate routes
  such as `/worlds/<world_id>`, `/worlds/new`, `/worlds/<world_id>/perturb`,
  `/worlds/<world_id>/runtime/<session_id>`, `/worlds/<world_id>/runtime/<session_id>/explain`,
  `/worlds/<world_id>/runtime/<session_id>/report`, and `/worlds/<world_id>/review`.

## Public Demo Boundary

`/` remains the guided public demo, and `/review` remains the advanced read-only review
surface.

The public demo remains read-only, anonymous, deterministic-only, and artifact-backed. It
does not start sessions, generate branches, upload corpus data, create worlds, enable Hosted GPT, accept BYOK, or call the OpenAI API.

Public demo mode must keep runtime mutation endpoints disabled. Public API responses must not
expose absolute repository paths, runtime paths, provider secrets, or arbitrary path lookup
results.

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
request-scoped and must not be persisted into session, node, report, claims, or decision-trace
artifacts.

The private-beta launch hub remains planning-only for now because the route ownership,
deployment posture, and public-demo interaction are not yet ratified.

## Follow-Up Gate

- TODO[verify]: open a reviewed route contract before replacing `/` or adding a private-beta launch hub route.
- TODO[verify]: if the launch hub becomes an implementation target, decide whether it lives
  behind a separate route, an authenticated/private deployment flag, or another explicit
  product boundary.
- TODO[verify]: keep untracked April/private-beta planning notes as candidate inputs only
  until a PR intentionally promotes them.

## Non-Goals

- Do not implement a new launch hub route or change `/` in `#401`.
- Do not change public demo behavior.
- Do not change Mirror Codex plugin MCP tools or resources.
- Do not add mutating Mirror Codex MCP tools.
- Do not implement async workers, queues, `task_id`, retry, status, cleanup, checkpoint
  mutation/deletion, or restore semantics.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota behavior to the public path or plugin path.
- Do not change session or node manifest shape.
- Do not change compare artifact shape.
- Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, or
  public demo artifact layout or plugin MCP contract.
- Do not build real-person personas, digital doubles, political persuasion, law-enforcement,
  hiring, credit, medical, or judicial decision systems.
- Do not present Mirror as real-world prediction or package simulation output as certain
  real-world conclusions.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase50_product_boundary_note.py backend/tests/test_phase50_successor_gate.py backend/tests/test_automation.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/plans/current-state-baseline.md docs/plans/phase-execution-queue.md docs/plans/phase-50-successor-gate-2026-05-18.md docs/plans/phase-50-product-boundary-2026-05-18.md backend/tests/test_phase50_product_boundary_note.py backend/tests/test_phase50_successor_gate.py
git diff --check
./make.ps1 eval-demo
```
