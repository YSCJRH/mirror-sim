# Phase 52 Successor Gate

Date: 2026-05-18

Issue: `#411` `Phase 52: sync repo truth after Phase 51 closeout and define successor gate`

Current work item: `#411` `Phase 52: sync repo truth after Phase 51 closeout and define successor gate`

This note records the post-Phase-51 baseline and opens the Phase 52 successor queue.
Phase 52 is a protected-core route-containment and runtime-scope audit phase. It syncs
repo truth after the Phase 51 closeout, audits legacy top-level runtime routes, and
strengthens runtime mutation guard regression coverage. It is not a launch-hub,
public-path, plugin, async-runtime, or schema-expansion phase.

This gate is recorded at `docs/plans/phase-52-successor-gate-2026-05-18.md`.

## Phase 51 Closeout Evidence

Phase 51 is closed after PR `#409`, issue `#403`, and milestone `Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate`.

- PR `#407` closed `#404` `Phase 51: sync repo truth after Phase 50 closeout`.
- PR `#408` closed `#405` `Phase 51: ratify private-beta route ownership and launch-hub contract`.
- PR `#409` closed `#406` `Phase 51: verify runtime readiness thresholds and world-scoped session guards`.
- Issue `#403` `Phase 51 exit gate` is closed after post-merge validation on `main`.
- Milestone `Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate` is closed.
- Phase 51 Private-Beta Route Ownership Contract is recorded in
  `docs/plans/phase-51-private-beta-route-contract-2026-05-18.md`.
- Phase 51 Runtime Readiness and World-Scoped Guard Verification is recorded in
  `docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md`.
- Queue audit reached the formal paused stop-state after Phase 51 closed, then returned
  `ready` once Phase 52 was opened with one blocked exit gate and one ready work item.

## Phase 52 Operational Queue

Phase 52 title:

```text
Phase 52 - Legacy Route Containment and Runtime Scope Audit
```

Active GitHub objects:

- `#410` `Phase 52 exit gate`
  - Lane: `protected-core`.
  - Status: blocked closeout gate for Phase 52.
- `#411` `Phase 52: sync repo truth after Phase 51 closeout and define successor gate`
  - Lane: `protected-core`.
  - Status: current ready work item.
  - Scope: sync tracked docs to Phase 52 after closing Phase 51.
- `#412` `Phase 52: audit legacy top-level runtime routes and preserve boundary contract`
  - Lane: `protected-core`.
  - Status: blocked until the repo-truth sync lands.
  - Scope: audit legacy top-level runtime routes before presenting any route as the
    private-beta main path.
- `#413` `Phase 52: strengthen runtime mutation guard regression baseline`
  - Lane: `protected-core`.
  - Status: blocked until the legacy route audit lands.
  - Scope: strengthen regression coverage for runtime mutation guard boundaries.

`python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reports `ready`
with Phase 52 as the only open milestone, `#410` as the protected blocked exit gate, and
`#411` as the current ready work item.

## Protected-Core Lane Coverage

Phase 52 work is protected-core by default when it touches route ownership, runtime guard
boundaries, session contracts, safety behavior, eval contracts, or queue governance. The
lane policy already protects:

- `docs/architecture/contracts.md`
- `docs/decisions/`
- `docs/plans/automation-roadmap.md`
- `docs/plans/current-state-baseline.md`
- `docs/plans/phase-`
- `backend/app/sessions/`
- `frontend/src/app/api/runtime/`
- `frontend/src/app/lib/runtime-cli.ts`

This protection is operational governance. It does not itself change scenario DSL,
perturbation payloads, session/node manifests, `decision_trace.jsonl`, compare artifacts,
public demo artifact layout, or the Mirror Codex MCP contract.

## Carried Forward TODO[verify] Items

- TODO[verify]: Codex UI tool-card evidence remains open until a clean Codex app session
  shows observable MCP tool or resource cards/traces for the Mirror Codex plugin.
- Runtime generation duration is recorded in
  `docs/plans/phase-50-runtime-generation-duration-measurement-2026-05-18.md`.
  Keep synchronous generation for v1.
  TODO[verify]: rerun hosted/private-beta model measurements before introducing async task semantics.
- Phase 51 Route Ownership keeps `/` and `/review` as public-demo surfaces and
  `/worlds/<world_id>` as the private-beta candidate product path.
- Phase 51 Runtime Readiness and World-Scoped Guard Verification keeps route-derived
  `worldId` guards for private-beta mutation paths.
- TODO[verify]: decide whether legacy top-level runtime routes should remain
  compatibility surfaces, redirect, deprecate, or receive a separate durable contract.
- TODO[verify]: require route-derived `worldId` or an equivalent reviewed scope guard
  before adding any new mutating runtime API.
- Do not recreate local Codex automations without a new explicit operator request.

## Phase 52 Work Package Map

1. Repo-truth sync after Phase 51 closeout
   - Record Phase 51 closure, Phase 52 queue objects, validation, and carried-forward
     boundaries across README and active planning docs.
   - Keep local Mirror-specific automations revoked unless the operator explicitly asks to
     recreate them.

2. Legacy top-level runtime route audit
   - Inventory legacy top-level runtime routes.
   - Decide whether `/perturb`, `/runtime/<session_id>`, and child routes remain
     compatibility surfaces, should redirect, or need a later deprecation contract.
   - Preserve public demo, plugin, private-beta, and async-runtime boundaries.

3. Runtime mutation guard regression baseline
   - Strengthen coverage that product/web-wrapper mutation calls pass route-derived
     `worldId` or an equivalent reviewed scope guard.
   - Preserve public-demo blocking and backend expected-world mismatch rejection.

## Blueprint Boundary

Phase 52 must stay aligned with `mirror.md` and `AGENTS.md`:

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

- Do not implement a launch hub in Phase 52.
- Do not replace `/` or widen the public path.
- Do not change public demo behavior.
- Do not change Mirror Codex plugin MCP tools or resources.
- Do not add mutating Mirror Codex MCP tools.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota
  behavior to the public path or plugin path.
- Do not implement async workers, queues, `task_id`, retry, status, cleanup, checkpoint
  mutation/deletion, or restore semantics.
- Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape,
  compare artifact shape, session/node manifest shape, public demo artifact layout, or
  plugin MCP contract.
- Do not promote local untracked April/private-beta planning files as durable truth without
  a reviewed PR.
- Do not recreate local Codex automations without a new explicit operator request.

## Validation Commands

For `#411`, run:

```powershell
python -m pytest backend/tests/test_phase52_successor_gate.py backend/tests/test_phase51_successor_gate.py backend/tests/test_phase51_runtime_guard_note.py backend/tests/test_automation.py::test_classify_paths_marks_phase_queue_docs_protected -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-51-successor-gate-2026-05-18.md docs/plans/phase-52-successor-gate-2026-05-18.md backend/tests/test_phase51_successor_gate.py backend/tests/test_phase52_successor_gate.py backend/tests/test_automation.py
git diff --check
./make.ps1 test
./make.ps1 eval-demo
```
