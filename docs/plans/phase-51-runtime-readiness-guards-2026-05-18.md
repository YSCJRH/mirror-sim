# Phase 51 Runtime Readiness and World-Scoped Guard Verification

Date: 2026-05-18

Issue: `#406` `Phase 51: verify runtime readiness thresholds and world-scoped session guards`

## Decision

Keep synchronous generation for v1.

Phase 51 verifies the runtime readiness evidence and closes the world-scoped guard gaps
identified after the route ownership contract. `task_id`, worker, retry, status, and cleanup semantics remain out of scope until a future reviewed ADR ratifies the product
threshold, queue lifecycle, status payload, retry rules, cleanup behavior, and artifact
contract changes.

The private-beta runtime path remains world-scoped under `/worlds/<world_id>`. This work
does not create a launch hub, move `/`, widen public demo routes, widen plugin behavior, or
change session/node/report/claim/trace/compare artifact schemas.

## Evidence

- `docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md` recorded five
  local deterministic samples: `generate-branch` average `1218.1 ms`, minimum `1169.0 ms`,
  maximum `1309.1 ms`; start-session plus generate average `2211.6 ms`.
- Phase 50 explicitly did not ratify a product timeout threshold or async work contract.
- `docs/plans/phase-51-private-beta-route-contract-2026-05-18.md` records `/worlds/<world_id>`
  as the private-beta candidate product path and leaves the private-beta launch hub
  planning-only.
- `docs/architecture/contracts.md` records that v1 runtime generation does not introduce task
  queues or a separate `task_id` contract.
- Read-only review found three concrete guard gaps: composer branch generation omitted
  route-derived `worldId`; CLI-backed session mutations lacked an expected-world guard; and
  world-scoped workspace loading did not compare durable manifests with route params.

## Guard Fixes

- The private-beta composer now sends route-derived `worldId` to `/api/runtime/generate-branch`.
- Minimal home runtime generation and rollback requests now include route-derived `worldId`.
- The runtime CLI wrappers now pass `--world` to mutating session commands.
- The backend session services reject expected-world mismatches before generating a child branch
  or moving a rollback pointer.
- The world-scoped workspace loading now rejects session or node manifests whose `world_id` conflicts with the route `worldId`.
- The world-scoped workspace loading now rejects node manifests whose `session_id` conflicts with the route `sessionId`.
- The lineage node manifests must also match the route `worldId` and `sessionId`.
- Direct local CLI calls may omit `--world` for compatibility when the operator provides an explicit artifacts root.
- Product and web-wrapper mutation calls must pass `--world`; when `--world` is provided, backend services must reject mismatches before branch generation or rollback.

These guards fail closed before widening runtime surfaces. They preserve existing public-demo,
plugin, hosted-model, BYOK, artifact, and session-shape contracts.

## Runtime Readiness Threshold

The current measurement evidence supports synchronous v1 generation for local deterministic
private-beta use. It does not justify a background worker, retry queue, `task_id`, status API,
cleanup process, or new artifact lifecycle.

TODO[verify]: rerun hosted/private-beta model measurements before introducing async task semantics. That future review must name the threshold, hosted/BYOK deployment posture,
operator-visible status model, failure model, retry limits, cleanup behavior, and any schema
or artifact changes before implementation.

## Follow-Up Gate

- TODO[verify]: decide whether legacy top-level `/runtime/<session_id>` routes should be
  deprecated, redirected, or formally re-contracted before presenting them as a private-beta
  main path.
- TODO[verify]: if new mutating runtime APIs are added, require route-derived `worldId` or an
  equivalent reviewed scope guard before the API can mutate session state.
- TODO[verify]: rerun hosted/private-beta model measurements before introducing async task semantics.

## Non-Goals

- Do not implement a launch hub route in `#406`.
- Do not replace `/` or widen the public path.
- Do not change public demo behavior.
- Do not change Mirror Codex plugin MCP tools or resources.
- Do not add mutating Mirror Codex MCP tools.
- No public demo, plugin, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or async contract is widened.
- Do not implement async workers, queues, `task_id`, retry, status, cleanup, checkpoint
  mutation/deletion, or restore semantics.
- Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape,
  compare artifact shape, public demo artifact layout, or plugin MCP contract.
- Do not build real-person personas, digital doubles, political persuasion, law-enforcement,
  hiring, credit, medical, or judicial decision systems.
- Do not present Mirror as real-world prediction or package simulation output as certain
  real-world conclusions.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase51_runtime_guard_note.py backend/tests/test_frontend_runtime_error_redaction.py::test_runtime_composer_generate_request_includes_world_id backend/tests/test_frontend_runtime_error_redaction.py::test_minimal_home_runtime_mutations_include_world_id backend/tests/test_frontend_runtime_error_redaction.py::test_runtime_cli_passes_expected_world_to_mutating_session_commands backend/tests/test_frontend_runtime_error_redaction.py::test_runtime_workspace_loader_rejects_route_session_world_mismatch backend/tests/test_cli.py::test_generate_branch_rejects_expected_world_mismatch backend/tests/test_cli.py::test_rollback_session_rejects_expected_world_mismatch backend/tests/test_cli.py::test_cli_generate_branch_passes_expected_world_guard -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/architecture/contracts.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-51-successor-gate-2026-05-18.md docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md backend/app/cli.py backend/app/sessions/service.py backend/tests/test_cli.py backend/tests/test_frontend_runtime_error_redaction.py backend/tests/test_phase51_runtime_guard_note.py frontend/src/app/components/minimal-home-shell.tsx frontend/src/app/components/preset-perturbation-composer.tsx frontend/src/app/lib/runtime-cli.ts frontend/src/app/lib/runtime-session-data.ts
git diff --check
npm run build --prefix frontend
./make.ps1 test
./make.ps1 eval-demo
```
