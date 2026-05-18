# Phase 50 Runtime Generation Duration Measurement

Date: 2026-05-18

Issue: `#398` `Phase 50: measure runtime generation duration before task_id decision`

## Measurement Scope

This note measures the current synchronous runtime branch-generation path before any
`task_id`, worker, retry, status, or cleanup contract is introduced.

The measured path uses the accepted v1 interactive simulator contract:

- `start-session`
- `generate-branch`
- session-scoped node, run, report, claims, resolution, and compare artifacts

The sample intentionally uses `deterministic_only` so the result measures the current local
Mirror runtime path without hosted model latency, external network latency, API key handling,
or quota side effects.

## Command Path

Frontend product path:

- `frontend/src/app/api/runtime/generate-branch/route.ts` validates the request, keeps public
  demo mutation blocking in place, checks provider-specific access, and awaits
  `generateRuntimeBranch(...)`.
- `frontend/src/app/lib/runtime-cli.ts` calls `python -m backend.app.cli generate-branch`
  with the world artifacts root and request-scoped runtime environment values.
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
  --session <session_id> `
  --from node_root `
  --perturbation '{"kind":"delay_document","target_id":"doc_ledger_copy","timing":"before_publication","summary":"Delay the copied ledger before it reaches the public decision loop.","parameters":{"actor_id":"entity_lin_lan","delay_turns":2,"cause":"courier_interruption"}}' `
  --artifacts-root <temp-sample-root>
```

## Environment

- Local date/time: 2026-05-18 13:12:23 +08:00.
- Local shell: Windows PowerShell from the Codex desktop workspace.
- Python: 3.11.2.
- Repo baseline before this note: `main` at `9ac55a9`.
- Temporary artifacts: Windows user temp directory, one isolated sample root per run.
- Generated measurement artifacts were not committed.

Latest baseline CI duration evidence from PR `#399`:

| Check | Result | Duration |
| --- | --- | ---: |
| `classify-lane` | pass | 7s |
| `linux-quality-gate` | pass | 1m1s |
| `linux-quality-gate` | pass | 1m0s |
| `windows-quality-gate` | pass | 1m40s |
| `windows-quality-gate` | pass | 2m15s |

## Sample Set

sample count: 5

All samples used:

- world: `fog-harbor-east-gate`
- scenario: `scenario_baseline`
- provider: `deterministic_only`
- parent node: `node_root`
- perturbation kind: `delay_document`
- target: `doc_ledger_copy`
- timing: `before_publication`

Each sample created a fresh session and then generated exactly one child branch from the root
checkpoint. Because root-node run artifacts are lazily materialized, these fresh
`generate-branch` samples include root baseline materialization plus child generation,
parent-vs-child compare emission, resolution writing, and report/claims generation.

The temporary artifacts roots did not pre-seed graph/persona artifacts, so the service used
the canonical Fog Harbor graph/persona fallback under `data/demo` while writing generated
session artifacts into each sample root.

## Observed Durations

| Sample | Session | Child node | `start-session` | `generate-branch` | Total |
| ---: | --- | --- | ---: | ---: | ---: |
| 1 | `session_fog_harbor_east_gate_scenario_baseline_2829f639` | `node_delay_document_bff51d7b` | 1035.6 ms | 1309.1 ms | 2344.7 ms |
| 2 | `session_fog_harbor_east_gate_scenario_baseline_9882f7cb` | `node_delay_document_473251ef` | 1006.1 ms | 1207.1 ms | 2213.1 ms |
| 3 | `session_fog_harbor_east_gate_scenario_baseline_65ac9fd6` | `node_delay_document_40e4ac61` | 979.2 ms | 1231.8 ms | 2211.0 ms |
| 4 | `session_fog_harbor_east_gate_scenario_baseline_9ea2c02d` | `node_delay_document_47802436` | 965.0 ms | 1169.0 ms | 2134.0 ms |
| 5 | `session_fog_harbor_east_gate_scenario_baseline_b1cc6845` | `node_delay_document_0faeb57c` | 981.5 ms | 1173.6 ms | 2155.1 ms |

Summary:

- `generate-branch` min: 1169.0 ms.
- `generate-branch` max: 1309.1 ms.
- `generate-branch` average: 1218.1 ms.
- `start-session + generate-branch` average: 2211.6 ms.

## Limits

- This is a local deterministic measurement, not a hosted/private-beta model measurement.
- The sample does not include browser rendering, a deployed Next.js server, reverse proxy
  behavior, production filesystem latency, or concurrent requests.
- The sample does not measure BYO OpenAI-compatible latency or hosted OpenAI latency.
- The sample does not establish a product timeout budget. No accepted Phase 50 contract
  currently defines the duration threshold that would require async orchestration.
- The sample count is small and is intended to decide whether current evidence justifies
  widening the v1 contract, not to publish a service-level objective.
- TODO[verify]: rerun measurement with hosted/private-beta model access before ratifying async worker semantics.

## Protected-Core Decision

Keep synchronous generation for v1.

The current evidence does not justify adding `task_id`, queue, worker, retry, status, or
cleanup semantics to the v1 runtime contract. The measured deterministic path completes a
fresh root-to-child generation in about 1.2 seconds on the local CLI path, including lazy
root baseline materialization, and the existing ADR-0006 contract already says:
"V1 does not introduce task queues or a separate `task_id` contract".

If future private-beta or hosted-model measurements show request durations that exceed a
ratified product threshold, or if product requirements need progress reporting,
cancellation, retry ownership, durable status lookup, or cleanup guarantees, open a dedicated
ADR before implementation. That ADR must define `task_id`, worker ownership, retry behavior,
status payloads, artifact cleanup, and rollback/checkpoint interaction as one protected-core
contract change.

## Non-Goals

- Do not implement async workers, queues, `task_id`, retry, status, or cleanup in `#398`.
- Do not change session or node manifest shape.
- Do not change compare artifact shape.
- Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, or
  public demo artifact layout.
- Do not expand public demo, plugin, hosted-model, BYOK, upload, auth, billing, database,
  object storage, or quota behavior.
- Do not commit generated measurement artifacts.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase50_runtime_measurement_note.py backend/tests/test_phase50_successor_gate.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli classify-lane --files docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md docs/plans/phase-50-successor-gate-2026-05-18.md backend/tests/test_phase50_runtime_measurement_note.py backend/tests/test_phase50_successor_gate.py
python -m pytest backend/tests/test_cli.py -k "start_session or generate_branch" -q
./make.ps1 eval-demo
```
