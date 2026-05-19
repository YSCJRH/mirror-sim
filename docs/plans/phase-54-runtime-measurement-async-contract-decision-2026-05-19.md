# Phase 54 Runtime Measurement and Async Contract Decision

Date: 2026-05-19

Issue: `#428` `Phase 54: refresh runtime measurement and decide async contract boundary`

## Measurement Scope

This note refreshes Mirror's runtime-orchestration evidence before any asynchronous
`task_id`, worker, heartbeat, retry, status, or cleanup contract is ratified.

The measured path stays inside the accepted v1 interactive simulator contract:

- `start-session`
- `generate-branch`
- session-scoped node, run, report, claims, resolution, and compare artifacts

The refreshed sample uses `deterministic_only` to measure the current local Mirror
runtime path without hosted model latency, external network latency, API key handling,
quota effects, browser rendering, or deployed Next.js server behavior.

This is still local deterministic evidence, not a hosted/private-beta model measurement.

## Command Path

Frontend product path:

- `frontend/src/app/api/runtime/generate-branch/route.ts` validates the request, keeps public
  demo mutation blocking in place, checks provider-specific access, and awaits
  `generateRuntimeBranch(...)`.
- `frontend/src/app/lib/runtime-cli.ts` calls `python -m backend.app.cli generate-branch`
  with the route-derived world id, artifacts root, and request-scoped runtime environment
  values.
- `backend/app/cli.py` dispatches to `backend/app/sessions/service.py`.
- `backend/app/sessions/service.py` resolves the perturbation, materializes parent and child
  run artifacts, emits parent-vs-child compare output, writes report/claims/resolution
  artifacts, updates `active_node_id`, and updates `last_activity_at`.

Measured command pattern:

```powershell
python -m backend.app.cli start-session `
  --world fog-harbor-east-gate `
  --scenario scenario_baseline `
  --decision-provider deterministic_only `
  --artifacts-root <temp-sample-root>

python -m backend.app.cli generate-branch `
  --world fog-harbor-east-gate `
  --session <session_id> `
  --from node_root `
  --perturbation '{"kind":"delay_document","target_id":"doc_ledger_copy","timing":"before_publication","summary":"Delay the copied ledger before it reaches the public decision loop.","parameters":{"actor_id":"entity_lin_lan","delay_turns":2,"cause":"courier_interruption"}}' `
  --artifacts-root <temp-sample-root>
```

Generated measurement artifacts were written to a Windows user temp directory and were not
committed.

## Observed Evidence

Prior accepted evidence:

- `docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md` recorded
  five local `deterministic_only` samples.
- Phase 50 observed `generate-branch` average: 1218.1 ms.
- Phase 50 observed `start-session + generate-branch` average: 2211.6 ms.
- `docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md` kept synchronous generation
  for v1 and recorded route-derived `worldId` mutation guards.
- `docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md` preserved the
  runtime mutation guard regression baseline without widening public/plugin/async contracts.

Phase 54 refreshed local sample:

sample count: 3

All samples used:

- world: `fog-harbor-east-gate`
- scenario: `scenario_baseline`
- provider: `deterministic_only`
- parent node: `node_root`
- perturbation kind: `delay_document`
- target: `doc_ledger_copy`
- timing: `before_publication`

| Sample | Session | `start-session` | `generate-branch` | Total |
| ---: | --- | ---: | ---: | ---: |
| 1 | `session_fog_harbor_east_gate_scenario_baseline_fda0e6d9` | 1138.3 ms | 1396.1 ms | 2534.4 ms |
| 2 | `session_fog_harbor_east_gate_scenario_baseline_6817c3ec` | 1145.4 ms | 1378.2 ms | 2523.5 ms |
| 3 | `session_fog_harbor_east_gate_scenario_baseline_fc3c3962` | 1136.0 ms | 1371.5 ms | 2507.5 ms |

Summary:

- `generate-branch` min: 1371.5 ms.
- `generate-branch` max: 1396.1 ms.
- `generate-branch` average: 1381.9 ms.
- `start-session + generate-branch` average: 2521.8 ms.

## Limits

- This is a local deterministic measurement, not a hosted/private-beta model measurement.
- The sample does not include hosted OpenAI latency, OpenAI-compatible BYOK latency,
  deployment filesystem latency, reverse proxy behavior, browser rendering, or concurrent
  requests.
- The sample does not establish a product timeout budget or service-level objective.
- The sample count is small and is intended to decide whether current evidence justifies
  widening the v1 contract, not to publish a latency guarantee.
- TODO[verify]: rerun hosted/private-beta model measurements before ratifying async worker semantics.

## Decision

Keep synchronous generation for v1.

Defer async task contract ratification.

ADR-0006 and `docs/architecture/contracts.md` remain the active runtime contract boundary:
V1 does not introduce task queues or a separate `task_id` contract.

The refreshed evidence is consistent with Phase 50's local deterministic measurement and
does not justify widening Mirror's v1 runtime contract.
No new async worker, task queue, `task_id`, heartbeat, retry, status, cleanup, checkpoint mutation/deletion, restore, or background job API is ratified by this note.

Because this decision does not ratify a new long-lived async/task contract, this phase does
not update `docs/architecture/contracts.md` and does not add a new ADR. A future ADR remains
required before implementing async runtime orchestration.

## Allowed Claims

- Mirror has refreshed local deterministic runtime generation evidence for Phase 54.
- Local deterministic `generate-branch` remains roughly in the same order of magnitude as
  the prior Phase 50 sample.
- Current evidence supports keeping synchronous v1 generation.
- Hosted/private-beta runtime duration is still unverified.
- Public demo, plugin, Hosted GPT/BYOK, launch hub, async, and runtime mutation boundaries remain unchanged.

## Blocked Claims

- Do not claim Mirror has hosted/private-beta latency evidence from this note.
- Do not claim a product timeout budget or service-level objective has been ratified.
- Do not claim async workers, task queues, `task_id`, heartbeat, retry, status, cleanup,
  checkpoint mutation/deletion, restore, or background job APIs are implemented or approved.
- Do not claim public demo, plugin, Hosted GPT/BYOK, launch hub, upload, auth, billing,
  database, object storage, or quota behavior has been widened.

## Async Contract Criteria

Open a new protected-core ADR before any async runtime implementation if future evidence or
product requirements require one or more of these properties:

- request durations exceed a named product threshold in hosted/private-beta measurement
- progress reporting is required
- cancellation semantics are required
- retry ownership or retry limits are required
- durable status lookup is required
- cleanup behavior is required
- worker ownership, heartbeat, or lease behavior is required
- rollback/checkpoint interaction changes are required

That ADR must define `task_id`, status payloads, worker ownership, retry behavior, cleanup
behavior, artifact ownership, and rollback/checkpoint interaction as one reviewed
protected-core contract change.

## Non-Goals

- Do not implement async workers, task queues, `task_id`, heartbeat, retry, status, cleanup,
  checkpoint mutation/deletion, restore semantics, or background job APIs in `#428`.
- Do not change session or node manifest shape.
- Do not change compare artifact shape.
- Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, or
  public demo artifact layout.
- Do not expand public demo, plugin, hosted-model, BYOK, upload, auth, billing, database,
  object storage, or quota behavior.
- Do not commit generated measurement artifacts.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase54_runtime_measurement_async_contract_note.py backend/tests/test_phase54_successor_gate.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-54-successor-gate-2026-05-19.md docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md backend/tests/test_phase54_successor_gate.py backend/tests/test_phase54_runtime_measurement_async_contract_note.py
git diff --check
./make.ps1 test
./make.ps1 eval-demo
./make.ps1 eval-transfer
```
