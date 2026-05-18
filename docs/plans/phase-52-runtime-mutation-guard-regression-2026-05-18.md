# Phase 52 Runtime Mutation Guard Regression Baseline

Date: 2026-05-18

Issue: `#413` `Phase 52: strengthen runtime mutation guard regression baseline`

## Decision

`#413` strengthens the regression baseline for existing runtime mutation guard behavior. It does not add a new mutation surface and does not change runtime semantics.

Public-demo mutation routes stay disabled when `MIRROR_PUBLIC_DEMO_MODE=1` and `MIRROR_ALLOW_ANONYMOUS_RUNS` is not `1`. `/api/runtime/start-session`, `/api/runtime/generate-branch`, `/api/runtime/rollback-session`, and `/api/worlds/create` remain private-beta mutation APIs.

Product and web-wrapper mutation calls must pass route-derived `worldId` or an equivalent reviewed scope guard. Direct local CLI calls may omit `--world` for compatibility when the operator provides an explicit artifacts root, but backend session services must reject expected-world mismatches before branch generation or rollback whenever an expected world is supplied.

No new mutating runtime API is added in `#413`.

## Existing Guard Inventory

- `frontend/src/app/api/runtime/start-session/route.ts`, `frontend/src/app/api/runtime/generate-branch/route.ts`, `frontend/src/app/api/runtime/rollback-session/route.ts`, and `frontend/src/app/api/worlds/create/route.ts` import `publicDemoMutationsDisabled()` and return `403` before invoking CLI wrappers.
- Runtime session mutation API routes require `worldId` in the request body before calling `startRuntimeSession`, `generateRuntimeBranch`, or `rollbackRuntimeSession`.
- `frontend/src/app/components/preset-perturbation-composer.tsx` sends route-derived `worldId` to start-session and generate-branch requests.
- `frontend/src/app/components/minimal-home-shell.tsx` sends route-derived `worldId` to generate-branch and rollback-session requests.
- `RuntimeSessionActions` sends `worldId` with rollback requests, and world-scoped runtime pages pass route-derived `worldId` into that component.
- `frontend/src/app/lib/runtime-cli.ts` passes `--world` to start-session, generate-branch, and rollback-session CLI calls.
- `backend/tests/test_cli.py` tracks expected-world mismatch rejection for branch generation and rollback, plus expected-world forwarding from the CLI.
- `scripts/smoke_public_demo_web.py` keeps live public-demo `403` coverage for start-session, generate-branch, rollback-session, and create-world.

## Regression Locks

- Static frontend tests lock the four mutation API route files to public-demo blocking before CLI invocation.
- Static frontend tests lock runtime session mutation APIs to require and pass `worldId`.
- Static frontend tests lock product/web-wrapper mutation calls to carry route-derived `worldId`.
- Static frontend tests lock runtime CLI wrappers to pass `--world` for session start, branch generation, and rollback.
- Backend CLI tests continue to lock expected-world mismatch rejection before branch generation or rollback.
- Backend CLI tests lock expected-world forwarding for branch generation and rollback commands.
- Static tests keep the public-demo smoke script's live `403` mutation endpoint coverage visible.
- The durable contract now requires a reviewed public-demo and world/session scope guard before any future mutating runtime API can be implemented.

## Follow-Up Gate

- TODO[verify]: require a reviewed scope guard before adding any new mutating runtime API.
- TODO[verify]: require route-derived `worldId` or an equivalent reviewed scope guard before adding any new product/web-wrapper mutation path.
- TODO[verify]: rerun hosted/private-beta model measurements before introducing async task semantics.
- TODO[verify]: open a separate migration work item before redirecting or deleting any legacy top-level runtime route.

## Non-Goals

- Do not implement a launch hub in `#413`.
- Do not replace `/` or widen the public path.
- Do not change public demo behavior.
- Do not change Mirror Codex plugin MCP tools or resources.
- Do not add mutating Mirror Codex MCP tools.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota behavior to the public path or plugin path.
- Do not implement async workers, queues, `task_id`, retry, status, cleanup, checkpoint mutation/deletion, or restore semantics.
- Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.
- Do not build real-person personas, digital doubles, political persuasion, law-enforcement, hiring, credit, medical, or judicial decision systems.
- Do not present Mirror as real-world prediction or package simulation output as certain real-world conclusions.

No public demo, plugin, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or async contract is widened.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase52_runtime_guard_regression_note.py backend/tests/test_phase52_successor_gate.py backend/tests/test_phase52_legacy_route_audit_note.py backend/tests/test_phase51_runtime_guard_note.py backend/tests/test_frontend_runtime_error_redaction.py::test_runtime_composer_generate_request_includes_world_id backend/tests/test_frontend_runtime_error_redaction.py::test_minimal_home_runtime_mutations_include_world_id backend/tests/test_frontend_runtime_error_redaction.py::test_runtime_cli_passes_expected_world_to_mutating_session_commands backend/tests/test_cli.py::test_generate_branch_rejects_expected_world_mismatch backend/tests/test_cli.py::test_rollback_session_rejects_expected_world_mismatch backend/tests/test_cli.py::test_cli_generate_branch_passes_expected_world_guard backend/tests/test_cli.py::test_cli_rollback_session_passes_expected_world_guard -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/architecture/contracts.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-51-successor-gate-2026-05-18.md docs/plans/phase-52-successor-gate-2026-05-18.md docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md backend/tests/test_phase52_runtime_guard_regression_note.py backend/tests/test_phase52_successor_gate.py backend/tests/test_cli.py
git diff --check
./make.ps1 test
./make.ps1 eval-demo
```
