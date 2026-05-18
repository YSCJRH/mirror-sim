# Phase 50 Successor Gate

Date: 2026-05-18

Issue: `#397` `Phase 50: sync repo truth after Phase 49 closeout`

Current work item: `#397` `Phase 50: sync repo truth after Phase 49 closeout`

This note records the post-Phase-49 baseline and opens the Phase 50 successor queue.
Phase 50 is a protected-core measurement and boundary phase for runtime orchestration.
It decides, from evidence, whether Mirror v1 keeps the synchronous CLI-backed generation
contract or opens a dedicated ADR for `task_id`, worker, retry, status, and cleanup
semantics. It is not an async-worker implementation phase.

## Phase 49 Closeout Evidence

- PR `#395` merged into `main` at merge commit
  `dc7c2e7f5d83b897237e02e806294558c0ba87b5`.
- PR `#395` closed `#394` `Phase 49: strengthen transfer eval outcome coverage`.
- Earlier Phase 49 issues were closed by reviewed Phase 49 PRs:
  - `#384` closed by PR `#385`.
  - `#386` closed by PR `#387`.
  - `#388` closed by PR `#389`.
  - `#390` closed by PR `#391`.
  - `#392` closed by PR `#393`.
- Issue `#383` `Phase 49 exit gate` is closed after the post-merge reassessment comment.
- Milestone `Phase 49 - Kernel, Perturbation, and Runtime Contract Hardening` is closed.
- `docs/plans/phase-49-transfer-assumption-inventory-2026-05-18.md` records the transfer
  assumption inventory promoted by `#394`.
- The public demo and Mirror Codex plugin remain deterministic/read-only. They do not gain
  Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or mutating MCP
  behavior.

Post-merge validation evidence for the final Phase 49 PR:

```powershell
python -m pytest backend/tests/test_worlds.py -q
python -m pytest backend/tests/test_cli.py -k "eval_world or eval_transfer" -q
python -m pytest backend/tests/test_phase49_successor_gate.py backend/tests/test_automation.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files .github/automation/lane-policy.json backend/app/evals/service.py backend/tests/test_worlds.py backend/tests/test_cli.py backend/tests/test_phase49_successor_gate.py backend/tests/test_automation.py docs/plans/phase-49-transfer-assumption-inventory-2026-05-18.md docs/plans/phase-49-successor-gate-2026-05-18.md README.md docs/plans/current-state-baseline.md docs/plans/phase-execution-queue.md
git diff --check
./make.ps1 test
./make.ps1 eval-demo
./make.ps1 eval-transfer
./make.ps1 public-demo-check
./make.ps1 plugin-check
```

CI for PR `#395` passed `classify-lane`, Linux quality gate, and Windows quality gate.

## Phase 50 Operational Queue

Phase 50 title:

```text
Phase 50 - Runtime Orchestration Measurement and Product Boundary
```

Active GitHub objects:

- `#396` `Phase 50 exit gate`
  - Lane: `protected-core`.
  - Status: blocked closeout gate for Phase 50.
- `#397` `Phase 50: sync repo truth after Phase 49 closeout`
  - Lane: `protected-core`.
  - Status: current ready work item.
  - Scope: sync tracked docs to Phase 50 after closing Phase 49.
- `#398` `Phase 50: measure runtime generation duration before task_id decision`
  - Lane: `protected-core`.
  - Status: blocked until `#397` lands.
  - Scope: measure the current runtime branch-generation path and decide whether to keep
    synchronous v1 generation or open a dedicated async-orchestration ADR.

`python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reports `ready`
with Phase 50 as the only open milestone, `#396` as the protected blocked exit gate, and
`#397` as the current ready work item.

## Protected-Core Lane Coverage

Phase 50 work is protected-core by default when it touches runtime orchestration,
session contracts, model access, safety behavior, eval contracts, or queue governance.
The lane policy already protects:

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
- Runtime generation duration is now recorded in
  `docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md`.
  Current local deterministic measurements support: Keep synchronous generation for v1.
  TODO[verify]: rerun hosted/private-beta model measurements before introducing `task_id`,
  worker, retry, status, or cleanup semantics.
- TODO[verify]: Decide whether a future private-beta launch hub should conditionally replace
  `/`, live at a separate route, or remain a planning-only concept.

## Phase 50 Work Package Map

1. Repo-truth sync after Phase 49 closeout
   - Record Phase 49 closure, Phase 50 queue objects, validation, and carried-forward
     boundaries across README and active planning docs.
   - Keep local Mirror-specific automations revoked unless the operator explicitly asks to
     recreate them.

2. Runtime orchestration measurement
   - Measured current synchronous branch generation through the CLI-backed runtime path.
   - Recorded environment, sample count, command path, observed durations, and limitations in
     `docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md`.
   - Decision: Keep synchronous generation for v1; open a dedicated ADR before implementing
     async orchestration.

3. Product boundary follow-up
   - Keep private-beta route and launch-hub language explicit.
   - Do not move public demo, plugin, or hosted-model behavior without a separate reviewed
     contract decision.

## Blueprint Boundary

Phase 50 must stay aligned with `mirror.md` and `AGENTS.md`:

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

- Do not implement async workers, queues, `task_id`, retry, status, cleanup, checkpoint
  mutation/deletion, or restore semantics inside `#397`.
- Do not change scenario DSL, claim/evidence shape, run trace shape, compare artifact shape,
  public demo artifact layout, or plugin MCP tool/resource contract in `#397`.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota
  behavior to the public path or plugin path.
- Do not add mutating Mirror Codex MCP tools.
- Do not promote local untracked April/private-beta planning files as durable truth without a
  reviewed PR.
- Do not recreate local Codex automations without a new explicit operator request.

## Validation Commands

For `#397`, run:

```powershell
python -m pytest backend/tests/test_phase49_successor_gate.py backend/tests/test_phase50_successor_gate.py backend/tests/test_automation.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files .github/automation/lane-policy.json README.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-49-successor-gate-2026-05-18.md docs/plans/phase-50-successor-gate-2026-05-18.md backend/tests/test_phase49_successor_gate.py backend/tests/test_phase50_successor_gate.py backend/tests/test_automation.py
git diff --check
./make.ps1 test
```

For `#398`, run:

```powershell
python scripts/check_no_secrets.py
python -m backend.app.cli classify-lane --files docs/architecture/contracts.md docs/decisions/ADR-0006-interactive-simulator-runtime-v1.md backend/app/sessions/service.py frontend/src/app/api/runtime/generate-branch/route.ts
python -m pytest backend/tests/test_cli.py -k "start_session or generate_branch" -q
./make.ps1 eval-demo
```
