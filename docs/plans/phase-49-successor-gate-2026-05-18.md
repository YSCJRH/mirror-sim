# Phase 49 Successor Gate

Date: 2026-05-18

Issue: `#384` `Phase 49: sync repo truth and protect runtime core lanes`

Current work item: `#392` `Phase 49: ratify runtime latest-activity metadata and rollback scope`

This note records the post-Phase-48 baseline and opens the Phase 49 successor queue.
Phase 49 is a protected-core contract-hardening phase for the decision kernel,
perturbation resolver, runtime session semantics, compare emission, rollback behavior, and
transfer eval posture. It is not a public-demo or plugin expansion phase.

## Phase 48 Closeout Evidence

- PR `#382` merged into `main` at merge commit
  `3c6fd4f745cf0caf48061c2eb3a15067e096bb87`.
- PR `#382` closed `#378` `Phase 48: private beta runtime contract audit` and `#379`
  `Phase 48: kernel perturbation gap brief`.
- Earlier Phase 48 issues `#376` and `#377` were already closed by reviewed Phase 48 PRs.
- Issue `#375` `Phase 48 exit gate` is closed after the post-merge reassessment comment.
- Milestone `Phase 48 - Successor Intake and Boundary Contract Triage` is closed.
- `docs/plans/phase-48-private-beta-runtime-contract-audit-2026-05-18.md` records the
  private-beta runtime boundary audit.
- `docs/plans/phase-48-kernel-perturbation-gap-brief-2026-05-18.md` records the kernel and
  perturbation successor work packages.
- The public demo and Mirror Codex plugin remain deterministic/read-only. They do not gain
  Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or mutating MCP
  behavior.

Post-merge validation evidence:

```powershell
python scripts/check_no_secrets.py
./make.ps1 test
./make.ps1 eval-demo
./make.ps1 eval-transfer
./make.ps1 plugin-release-check
./make.ps1 public-demo-check
```

The first parallel validation attempt for `public-demo-check` collided with another
artifact-writing command under `artifacts/demo/`. The sequential rerun passed. Keep
artifact-writing checks sequential when they share the canonical demo output directory.

## Phase 49 Operational Queue

Phase 49 title:

```text
Phase 49 - Kernel, Perturbation, and Runtime Contract Hardening
```

Active GitHub objects:

- `#383` `Phase 49 exit gate`
  - Lane: `protected-core`.
  - Status: blocked closeout gate for Phase 49.
- `#384` `Phase 49: sync repo truth and protect runtime core lanes`
  - Lane: `protected-core`.
  - Status: closed by PR `#385`.
  - Scope: sync tracked docs to Phase 49 and update lane policy before Phase 49 runtime-core
    implementation PRs rely on automation.
- `#386` `Phase 49: ratify kernel trace and replay contract`
  - Lane: `protected-core`.
  - Status: closed by PR `#387`.
  - Scope: document the v1 `decision_trace.jsonl` contract and harden replay/fallback
    trace privacy tests.
- `#388` `Phase 49: ratify perturbation schema and resolver authoring contract`
  - Lane: `protected-core`.
  - Status: closed by PR `#389`.
  - Scope: promote the world-local perturbation schema and resolver authoring contract,
    including template-plus-parameters mapping and invalid payload rejection tests.
- `#390` `Phase 49: ratify runtime parent-child compare emission policy`
  - Lane: `protected-core`.
  - Status: closed by PR `#391`.
  - Scope: ratify that every successful generated runtime child node emits a session-scoped
    parent-vs-child compare artifact without changing scenario-level compare contracts.
- `#392` `Phase 49: ratify runtime latest-activity metadata and rollback scope`
  - Lane: `protected-core`.
  - Status: current ready work item.
  - Scope: ratify `last_activity_at` as the product-facing session ordering timestamp and
    preserve v1 rollback as active-pointer movement without deleting or rewriting artifacts.

`python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reports `ready`
with Phase 49 as the only open milestone, `#383` as the protected blocked exit gate, and
`#392` as the current ready work item.

## Protected-Core Lane Coverage

Phase 49 work is protected-core by default because it can affect durable runtime contracts.
The lane policy must treat these paths as protected before implementation work begins:

- `backend/app/decision_kernel/`
- `backend/app/perturbations/`
- `backend/app/sessions/`
- `backend/app/model_access/`
- `backend/app/safety/`
- `frontend/src/app/api/runtime/`
- `frontend/src/app/api/worlds/create/`
- `frontend/src/app/lib/runtime-cli.ts`

This protection is operational governance. It does not itself change scenario DSL,
perturbation payloads, session/node manifests, `decision_trace.jsonl`, compare artifacts,
public demo artifact layout, or the Mirror Codex MCP contract.

## Carried Forward TODO[verify] Items

- TODO[verify]: Codex UI tool-card evidence remains open until a clean Codex app session
  shows observable MCP tool or resource cards/traces for the Mirror Codex plugin.
- Latest-session versus latest-activity semantics are now ratified as `last_activity_at`
  ordering with `created_at` fallback; TODO[verify]: re-open contract review before adding
  other activity sources or changing failed-operation activity behavior.
- The first `decision_trace.jsonl` v1 field set is now ratified in
  `docs/architecture/contracts.md`; TODO[verify]: re-open contract review before adding new
  trace fields, changing validation status values, or widening provider output persistence.
- Kernel boundary action-type validation is now ratified in
  `docs/decisions/ADR-0007-rule-bounded-llm-kernel.md` and
  `docs/architecture/contracts.md`; TODO[verify]: re-open contract review before accepting
  any caller-supplied action outside a world-local `allowed_action_types` list.
- Every successful generated non-root runtime node now emits a session-scoped parent-vs-child
  compare output; TODO[verify]: re-open contract review before making runtime compare
  emission optional or changing reference-branch selection away from the immediate parent.
- Checkpoint rollback remains deferred; v1 rollback only moves `active_node_id`.
  TODO[verify]: re-open contract review before adding deletion, mutation, retry, or restore
  semantics beyond pointer movement.
- TODO[verify]: Identify which Fog Harbor-shaped report and eval assumptions still block a
  stronger `museum-night` transfer proof.
- TODO[verify]: Define what measured generation duration would justify `task_id` and worker
  semantics instead of keeping the CLI-first synchronous contract.

## Phase 49 Work Package Map

1. Kernel trace and replay contract
   - Freeze durable `decision_trace.jsonl` fields, replay-cache behavior, provider fallback
     wording, and validation statuses.
   - Keep model calls inside the legal-action selection boundary.

2. Perturbation schema and resolver contract
   - Promote world-local `decision_schema.yaml` into a stable authoring contract.
   - Define template-plus-parameters before any free-form authoring path.

3. Branch generation and compare emission policy
   - Ratify that every successful generated non-root runtime node emits parent-vs-child
     `compare.json`.
   - Preserve the existing public `compare.json` contract while extending session-scoped
     artifacts only through review.

4. Rollback, checkpoint, and latest-activity semantics
   - Keep v1 rollback as `active_node_id` pointer movement until a new contract says
     otherwise.
   - Ratify `last_activity_at` as the runtime metadata used to order product session
     affordances, with fallback for older manifests that only have `created_at`.

5. Fog Harbor de-specialization and transfer evals
   - Remove or document remaining Fog Harbor-shaped assumptions before claiming broader
     transfer strength.
   - Extend transfer assertions from `museum-night` before adding another world.

6. Runtime orchestration decision
   - Keep synchronous CLI/API mirroring unless measured generation time requires async work.
   - If async is justified, ratify `task_id`, worker ownership, retry, status, and cleanup
     semantics in an ADR before implementation.

## Blueprint Boundary

Phase 49 must stay aligned with `mirror.md` and `AGENTS.md`:

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

- Do not change scenario DSL, claim/evidence shape, run trace shape, public demo artifact
  layout, or plugin MCP tool/resource contract in the Phase 49 queue-sync issue.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota
  behavior to the public path or plugin path.
- Do not add mutating Mirror Codex MCP tools.
- Do not promote local untracked April/private-beta planning files as durable truth without a
  reviewed PR.
- Do not implement free-form natural-language perturbation execution, async worker,
  checkpoint mutation/deletion semantics, transfer expansion, or frontend compare UI inside
  `#392`; `#392` only ratifies latest-activity metadata and pointer-only rollback scope.

## Validation Commands

For `#384`, run:

```powershell
python -m pytest backend/tests/test_phase49_successor_gate.py backend/tests/test_automation.py -q
python -m backend.app.cli classify-lane --files backend/app/decision_kernel/service.py backend/app/perturbations/service.py backend/app/sessions/service.py backend/app/model_access/service.py backend/app/safety/service.py frontend/src/app/api/runtime/start-session/route.ts frontend/src/app/api/runtime/generate-branch/route.ts frontend/src/app/api/runtime/rollback-session/route.ts frontend/src/app/api/worlds/create/route.ts frontend/src/app/lib/runtime-cli.ts
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```

For `#386`, run:

```powershell
python -m pytest backend/tests/test_decision_kernel.py -q
python -m pytest backend/tests/test_cli.py -k "generate_branch or decision_trace" -q
python -m backend.app.cli classify-lane --files docs/architecture/contracts.md docs/decisions/ADR-0007-rule-bounded-llm-kernel.md backend/app/decision_kernel/service.py backend/tests/test_decision_kernel.py backend/tests/test_cli.py docs/plans/phase-49-successor-gate-2026-05-18.md
python scripts/check_no_secrets.py
git diff --check
```

For `#388`, run:

```powershell
python -m pytest backend/tests/test_decision_kernel.py -q
python -m pytest backend/tests/test_cli.py -k "generate_branch or perturbation" -q
python -m pytest backend/tests/test_phase49_successor_gate.py backend/tests/test_automation.py -q
python -m backend.app.cli classify-lane --files docs/architecture/contracts.md docs/decisions/ADR-0006-interactive-simulator-runtime-v1.md backend/app/perturbations/service.py backend/tests/test_decision_kernel.py backend/tests/test_cli.py docs/plans/phase-49-successor-gate-2026-05-18.md README.md docs/plans/current-state-baseline.md docs/plans/phase-execution-queue.md
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```

For `#390`, run:

```powershell
python -m pytest backend/tests/test_cli.py -k "generate_branch or compare" -q
python -m pytest backend/tests/test_phase49_successor_gate.py backend/tests/test_automation.py -q
python -m backend.app.cli classify-lane --files docs/architecture/contracts.md docs/decisions/ADR-0006-interactive-simulator-runtime-v1.md backend/app/sessions/service.py backend/tests/test_cli.py docs/plans/phase-49-successor-gate-2026-05-18.md README.md docs/plans/current-state-baseline.md docs/plans/phase-execution-queue.md
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```

For `#392`, run:

```powershell
python -m pytest backend/tests/test_cli.py -k "start_session or generate_branch or rollback_session" -q
python -m pytest backend/tests/test_frontend_runtime_activity.py -q
python -m pytest backend/tests/test_phase49_successor_gate.py backend/tests/test_automation.py -q
python -m backend.app.cli classify-lane --files docs/architecture/contracts.md docs/decisions/ADR-0006-interactive-simulator-runtime-v1.md backend/app/domain/models.py backend/app/sessions/service.py backend/tests/test_cli.py backend/tests/test_frontend_runtime_activity.py frontend/src/app/lib/runtime-session-data.ts frontend/src/app/lib/world-product-data.ts docs/plans/phase-49-successor-gate-2026-05-18.md README.md docs/plans/current-state-baseline.md docs/plans/phase-execution-queue.md
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```

For later Phase 49 implementation PRs, add the issue-specific checks:

```powershell
python -m pytest backend/tests/test_decision_kernel.py
python -m pytest backend/tests/test_cli.py -k "start_session or generate_branch or rollback_session"
./make.ps1 eval-demo
./make.ps1 eval-transfer
./make.ps1 public-demo-check
./make.ps1 plugin-release-check
```
