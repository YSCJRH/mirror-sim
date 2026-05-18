# Phase 51 Successor Gate

Date: 2026-05-18

Issue: `#404` `Phase 51: sync repo truth after Phase 50 closeout`

Current work item: `#404` `Phase 51: sync repo truth after Phase 50 closeout`

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

Active GitHub objects:

- `#403` `Phase 51 exit gate`
  - Lane: `protected-core`.
  - Status: blocked closeout gate for Phase 51.
- `#404` `Phase 51: sync repo truth after Phase 50 closeout`
  - Lane: `protected-core`.
  - Status: current ready work item.
  - Scope: sync tracked docs to Phase 51 after closing Phase 50.
- `#405` `Phase 51: ratify private-beta route ownership and launch-hub contract`
  - Lane: `protected-core`.
  - Status: blocked until the repo-truth sync lands.
  - Scope: record the Private-beta route contract before any launch-hub implementation.
- `#406` `Phase 51: verify runtime readiness thresholds and world-scoped session guards`
  - Lane: `protected-core`.
  - Status: blocked until the route ownership contract lands.
  - Scope: verify runtime readiness and world-scoped session guards before product-path
    runtime surfaces widen.

`python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reports `ready`
with Phase 51 as the only open milestone, `#403` as the protected blocked exit gate, and
`#404` as the current ready work item.

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
  TODO[verify]: open a reviewed route contract before replacing `/` or adding a private-beta
  launch hub route.
- TODO[verify]: verify route/session mismatch handling before expanding private-beta runtime
  surfaces. World-scoped session guards must reject or clearly fail any request whose route
  `world_id` conflicts with the session's durable world id.
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
   - Record the reviewed route contract before replacing `/` or adding a private-beta launch
     hub route.
   - Keep `/` as the guided public demo and `/worlds/<world_id>` as the private-beta
     candidate product path unless the contract explicitly changes.
   - Preserve public demo, plugin, hosted-model, and async-runtime boundaries.

3. Runtime readiness and world-scoped session guards
   - Verify hosted/private-beta runtime thresholds against Phase 50 measurement evidence.
   - Verify route/session mismatch handling and world-scoped session guards before runtime
     product surfaces widen.
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
  `#404`.
- Do not implement async workers, queues, `task_id`, retry, status, cleanup, checkpoint
  mutation/deletion, or restore semantics inside `#404`.
- Do not change scenario DSL, claim/evidence shape, run trace shape, compare artifact shape,
  public demo artifact layout, or plugin MCP tool/resource contract in `#404`.
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

For `#405`, run:

```powershell
python -m pytest backend/tests/test_phase51_successor_gate.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files <changed-files>
git diff --check
```

For `#406`, run:

```powershell
python -m pytest backend/tests/test_phase51_successor_gate.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files <changed-files>
git diff --check
```
