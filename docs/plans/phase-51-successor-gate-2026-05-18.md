# Phase 51 Successor Gate

Date: 2026-05-18

Final work item: `#406` `Phase 51: verify runtime readiness thresholds and world-scoped session guards`

This note records the post-Phase-50 baseline and opens the Phase 51 successor queue.
Phase 51 is a protected-core route-contract and runtime-readiness phase for the
private-beta product path. It records private-beta route ownership before any launch-hub
implementation and verifies runtime readiness and world-scoped session guards before
expanding runtime surfaces. It is not a launch-hub implementation phase.

## Phase 50 Closeout Evidence

- PR `#399` closed `#397` `Phase 50: sync repo truth after Phase 49 closeout`.
- PR `#400` closed `#398` `Phase 50: measure runtime generation duration before task_id decision`.
- PR `#402` closed `#401` `Phase 50: ratify private-beta launch hub and public-path boundary`
  and merged into `main` at merge commit `54b7053`.
- Issue `#396` `Phase 50 exit gate` is closed after the post-merge reassessment comment.
- Milestone `Phase 50 - Runtime Orchestration Measurement and Product Boundary` is closed.
- Runtime generation duration is now recorded in
  `docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md`.
  Current local deterministic measurements support: Keep synchronous generation for v1.
- Phase 50 Product Boundary Decision is recorded in
  `docs/plans/phase-50-product-boundary-2026-05-18.md`.
  The launch hub remains planning-only for now; `/` remains the guided public demo.
- The public demo and Mirror Codex plugin remain deterministic/read-only. They do not gain
  Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or mutating MCP
  behavior.

## Phase 51 Operational Queue

Phase 51 title:

```text
Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate
```

Closed GitHub objects:

- `#403` `Phase 51 exit gate`
  - Lane: `protected-core`.
  - Status: closed after the Phase 51 closeout reassessment.
- `#404` `Phase 51: sync repo truth after Phase 50 closeout`
  - Lane: `protected-core`.
  - Status: closed by PR `#407`.
  - Scope: sync tracked docs to Phase 51 after closing Phase 50.
- `#405` `Phase 51: ratify private-beta route ownership and launch-hub contract`
  - Lane: `protected-core`.
  - Status: closed by PR `#408`.
  - Scope: record the Phase 51 Private-Beta Route Ownership Contract before any launch-hub implementation.
- `#406` `Phase 51: verify runtime readiness thresholds and world-scoped session guards`
  - Lane: `protected-core`.
  - Status: closed by PR `#409`.
  - Scope: verify runtime readiness and world-scoped session guards before product-path
    runtime surfaces widen.

Phase 51 is closed after PR `#409`, issue `#403`, and milestone
`Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate`.

## Protected-Core Lane Coverage

Phase 51 work is protected-core by default when it touches private-beta route ownership,
runtime readiness, session contracts, model access, safety behavior, eval contracts, or
queue governance. The lane policy already protects:

- `.github/automation/`
- `docs/architecture/contracts.md`
- `docs/decisions/`
- `docs/plans/automation-roadmap.md`
- `docs/plans/current-state-baseline.md`
- `docs/plans/phase-`
- `backend/app/decision_kernel/`
- `backend/app/evals/`
- `backend/app/model_access/`
- `backend/app/perturbations/`
- `backend/app/safety/`
- `backend/app/sessions/`
- `backend/app/simulation/`
- `backend/app/reports/`
- `frontend/src/app/api/runtime/`
- `frontend/src/app/api/worlds/create/`
- `frontend/src/app/lib/runtime-cli.ts`

This protection is operational governance. It does not itself change scenario DSL,
perturbation payloads, session/node manifests, `decision_trace.jsonl`, compare artifacts,
public demo artifact layout, or the Mirror Codex MCP contract.

## Carried Forward TODO[verify] Items

- TODO[verify]: Codex UI tool-card evidence remains open until a clean Codex app session
  shows observable MCP tool or resource cards/traces for the Mirror Codex plugin.
- Runtime generation duration is now recorded in
  `docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md`.
  Current local deterministic measurements support: Keep synchronous generation for v1.
  TODO[verify]: rerun hosted/private-beta model measurements before introducing `task_id`,
  worker, retry, status, or cleanup semantics.
- Phase 50 Product Boundary Decision is recorded in
  `docs/plans/phase-50-product-boundary-2026-05-18.md`.
  The launch hub remains planning-only for now; `/` remains the guided public demo.
- Phase 51 Private-Beta Route Ownership Contract is recorded in
  `docs/plans/phase-51-private-beta-route-contract-2026-05-18.md`.
  The private-beta launch hub remains planning-only; `/` and `/review` stay public-demo
  surfaces, while `/worlds/<world_id>` remains the private-beta candidate product path.
  TODO[verify]: if a launch hub becomes an implementation target, open a new reviewed work
  item that names its route, access mode, public-demo interaction, and deployment posture.
- TODO[verify]: verify the tracked frontend route tree before treating any private-beta path
  beyond the documented `/worlds/...` candidate routes as durable route ownership.
- Phase 51 Runtime Readiness and World-Scoped Guard Verification is recorded in
  `docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md`.
  Composer and minimal-home runtime mutations now pass route-derived `worldId`, CLI mutations pass `--world`,
  backend session services reject expected-world mismatches, and world-scoped workspace
  loading rejects mismatched session/node `world_id` or node `session_id` values.
  TODO[verify]: require the same route-derived world guard review before adding any new
  world-scoped runtime mutation surface.
- Latest-session versus latest-activity semantics are ratified as `last_activity_at`
  ordering with `created_at` fallback; TODO[verify]: re-open contract review before adding
  other activity sources or changing failed-operation activity behavior.
- The first `decision_trace.jsonl` v1 field set is ratified in
  `docs/architecture/contracts.md`; TODO[verify]: re-open contract review before adding new
  trace fields, changing validation status values, or widening provider output persistence.
- Kernel boundary action-type validation is ratified in
  `docs/decisions/ADR-0007-rule-bounded-llm-kernel.md` and
  `docs/architecture/contracts.md`; TODO[verify]: re-open contract review before accepting
  any caller-supplied action outside a world-local `allowed_action_types` list.
- Every successful generated non-root runtime node emits a session-scoped parent-vs-child
  compare output; TODO[verify]: re-open contract review before making runtime compare
  emission optional or changing reference-branch selection away from the immediate parent.
- Checkpoint rollback remains deferred; v1 rollback only moves `active_node_id`.
  TODO[verify]: re-open contract review before adding deletion, mutation, retry, or restore
  semantics beyond pointer movement.
- Fog Harbor-shaped report and eval assumptions are inventoried in
  `docs/plans/phase-49-transfer-assumption-inventory-2026-05-18.md`; TODO[verify]:
  re-open contract review before removing legacy `RunTrace` fields or claiming transfer
  beyond the two-world proof.

## Phase 51 Work Package Map

1. Repo-truth sync after Phase 50 closeout
   - Record Phase 50 closure, Phase 51 queue objects, validation, and carried-forward
     boundaries across README and active planning docs.
   - Keep local Mirror-specific automations revoked unless the operator explicitly asks to
     recreate them.

2. Private-beta route ownership contract
   - Record the reviewed route contract in
     `docs/plans/phase-51-private-beta-route-contract-2026-05-18.md`.
   - Promote the durable route boundary into `docs/architecture/contracts.md` and
     `docs/decisions/ADR-0011-private-beta-route-ownership.md`.
   - Keep `/` as the guided public demo and `/worlds/<world_id>` as the private-beta
     candidate product path unless the contract explicitly changes.
   - Private-beta route contract: keep the private-beta launch hub planning-only in Phase 51.
   - Preserve public demo, plugin, hosted-model, and async-runtime boundaries.

3. Runtime readiness and world-scoped session guards
   - Record the guard verification note in
     `docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md`.
   - Verify hosted/private-beta runtime thresholds against Phase 50 measurement evidence.
   - Verify route/session mismatch handling and world-scoped session guards before runtime
     product surfaces widen.
   - Require route-derived `worldId` in private-beta composer generation and CLI-backed
     session mutations.
   - Reject world/session manifest mismatches while loading world-scoped runtime workspaces.
   - Preserve synchronous v1 unless an ADR approves async task semantics.

## Blueprint Boundary

Phase 51 must stay aligned with `mirror.md` and `AGENTS.md`:

- Mirror is a constrained, evidence-backed, replayable what-if sandbox for fictional or
  explicitly authorized worlds.
- Do not present Mirror as a real-world prediction machine.
- Do not build real-person personas or digital doubles.
- Do not build political persuasion, law-enforcement scoring, hiring, credit, medical, or
  judicial decision systems.
- Every report claim must keep both `label` and `evidence_ids`.
- Durable contract changes require `docs/architecture/contracts.md` updates and an ADR when
  the contract is long-lived.

## Non-Goals

- Do not implement a private-beta launch hub, move `/`, or widen the public path inside
  `#406`.
- Do not implement async workers, queues, `task_id`, retry, status, cleanup, checkpoint
  mutation/deletion, or restore semantics inside `#406`.
- Do not change scenario DSL, claim/evidence shape, run trace shape, compare artifact shape,
  public demo artifact layout, or plugin MCP tool/resource contract in `#406`.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota
  behavior to the public path or plugin path.
- Do not add mutating Mirror Codex MCP tools.
- Do not promote local untracked April/private-beta planning files as durable truth without a
  reviewed PR.
- Do not recreate local Codex automations without a new explicit operator request.

## Validation Commands

For `#404`, run:

```powershell
python -m pytest backend/tests/test_phase51_successor_gate.py backend/tests/test_phase50_successor_gate.py backend/tests/test_phase50_product_boundary_note.py backend/tests/test_automation.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-50-successor-gate-2026-05-18.md docs/plans/phase-51-successor-gate-2026-05-18.md backend/tests/test_phase50_successor_gate.py backend/tests/test_phase51_successor_gate.py backend/tests/test_automation.py
git diff --check
./make.ps1 test
./make.ps1 eval-demo
```

## Post-Phase 51 Closeout

Phase 51 is closed after PR `#409`, issue `#403`, and milestone `Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate`.

Phase 52 is closed after PR `#416`, issue `#410`, and milestone
`Phase 52 - Legacy Route Containment and Runtime Scope Audit`; `audit-github-queue`
reports the formal paused stop-state with no active milestone:

- Milestone: `Phase 52 - Legacy Route Containment and Runtime Scope Audit`.
- `#410` `Phase 52 exit gate` is closed after post-merge validation on `main`.
- `#411` `Phase 52: sync repo truth after Phase 51 closeout and define successor gate`
  is closed by PR `#414`.
- `#412` `Phase 52: audit legacy top-level runtime routes and preserve boundary contract`
  is closed by PR `#415`.
- `#413` `Phase 52: strengthen runtime mutation guard regression baseline` is closed by PR `#416`.

Phase 52 kept legacy top-level runtime routes and runtime mutation guard regression as
protected-core follow-up surfaces. It does not widen public/plugin/async contracts, implement
a launch hub, replace `/`, or change session/node/report/claim/trace/compare artifact
contracts.

The completed Phase 52 successor-gate baseline lives in
`docs/plans/phase-52-successor-gate-2026-05-18.md`, and the Phase 52 Legacy Top-Level Runtime Route Audit note lives in
`docs/plans/phase-52-legacy-runtime-route-audit-2026-05-18.md`. The Phase 52 Runtime Mutation Guard Regression Baseline note lives in
`docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md`.

For `#405`, run:

```powershell
python -m pytest backend/tests/test_phase51_route_contract_note.py backend/tests/test_phase51_successor_gate.py backend/tests/test_phase50_product_boundary_note.py backend/tests/test_automation.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/architecture/contracts.md docs/decisions/ADR-0011-private-beta-route-ownership.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-51-successor-gate-2026-05-18.md docs/plans/phase-51-private-beta-route-contract-2026-05-18.md backend/tests/test_phase51_route_contract_note.py backend/tests/test_phase51_successor_gate.py
git diff --check
./make.ps1 eval-demo
```

For `#406`, run:

```powershell
python -m pytest backend/tests/test_phase51_runtime_guard_note.py backend/tests/test_frontend_runtime_error_redaction.py::test_runtime_composer_generate_request_includes_world_id backend/tests/test_frontend_runtime_error_redaction.py::test_minimal_home_runtime_mutations_include_world_id backend/tests/test_frontend_runtime_error_redaction.py::test_runtime_cli_passes_expected_world_to_mutating_session_commands backend/tests/test_frontend_runtime_error_redaction.py::test_runtime_workspace_loader_rejects_route_session_world_mismatch backend/tests/test_cli.py::test_generate_branch_rejects_expected_world_mismatch backend/tests/test_cli.py::test_rollback_session_rejects_expected_world_mismatch backend/tests/test_cli.py::test_cli_generate_branch_passes_expected_world_guard backend/tests/test_phase51_successor_gate.py backend/tests/test_phase51_route_contract_note.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/architecture/contracts.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-51-successor-gate-2026-05-18.md docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md backend/app/cli.py backend/app/sessions/service.py backend/tests/test_cli.py backend/tests/test_frontend_runtime_error_redaction.py backend/tests/test_phase51_runtime_guard_note.py backend/tests/test_phase51_route_contract_note.py backend/tests/test_phase51_successor_gate.py frontend/src/app/components/minimal-home-shell.tsx frontend/src/app/components/preset-perturbation-composer.tsx frontend/src/app/lib/runtime-cli.ts frontend/src/app/lib/runtime-session-data.ts
git diff --check
npm run build --prefix frontend
./make.ps1 test
./make.ps1 eval-demo
```
