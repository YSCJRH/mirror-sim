# Phase 47 Successor Gate

Date: 2026-05-16

This note defines the public baseline for reopening Mirror after the post-Phase-46
`v0.1.0` stop-state. The original gate proposal did not approve Phase 47 by itself; the
GitHub queue was opened after review and completed through the closeout gate.

## Current Direct Evidence

- At authoring time, local `main` was aligned with `origin/main` before this successor-gate
  branch was created.
- The latest published release remains `v0.1.0`.
- During Phase 47 closeout, `python -m backend.app.cli audit-github-queue --repo
  YSCJRH/mirror-sim` reported `paused` after the Phase 47 work items closed and before
  Phase 48 was opened.
- At Phase 47 authoring time, `docs/plans/current-state-baseline.md` recorded the
  intentional post-Phase-46 stop-state.
- `README.md` defines the Phase 1 public demo as read-only, anonymous, and
  deterministic-only.
- `plugins/mirror-codex` defines a read-only, local-first Codex plugin for the deterministic
  public demo.
- GitHub issue `#365` was the protected Phase 47 exit gate and is closed after PR `#374`.
- GitHub issues `#366` through `#369` are closed Phase 47 work items.
- The current successor queue is superseded by the Phase 48 gate note at
  `docs/plans/phase-48-successor-gate-2026-05-17.md`.

## Blueprint Boundary

Any approved successor must stay aligned with `mirror.md`:

- Mirror is a constrained, evidence-backed, replayable what-if sandbox for fictional or
  explicitly authorized worlds.
- Mirror is not a real-world prediction machine.
- Mirror must not build real-person personas, real-person digital twins, political
  persuasion systems, law-enforcement scoring, hiring, credit, medical, judicial, or other
  high-risk decision systems.
- Claims must preserve both `label` and `evidence_ids`.
- Durable contract changes require updates to `docs/architecture/contracts.md` and an ADR
  when the contract is long-lived.

## Successor Decision

Recommended immediate successor shape:

- contract-safe
- boundary-first
- reviewable in small PRs
- focused on proving the private-beta candidate can stay separated from the public demo and
  plugin surfaces

Recommended Phase 47 title:

> Phase 47 - Boundary Readiness and Successor Hygiene

Recommended Phase 47 goal:

> Establish a clean, auditable successor queue that preserves the public demo and plugin
> safety boundary while preparing private-beta runtime and product work for later contract
> decisions.

This is deliberately narrower than a kernel contract phase. Runtime kernel expansion,
interactive perturbation contract work, and model-provider behavior should not be mixed into
the first successor hygiene PR.

## Entry Criteria

Builder automation was eligible to resume only while Phase 47 had one open successor
milestone, one blocked exit gate, at least one ready work item, and `audit-github-queue`
reported `ready`. That condition no longer holds after `#366` through `#369` closed.

The historical criteria were:

- Exactly one successor milestone is approved and open in GitHub.
- One blocked exit-gate issue exists in that milestone.
- At least one ready implementation issue exists in that milestone.
- The first implementation issue is explicitly classified as `contract-safe` or
  `protected-core`.
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reports `ready`.

## Executed First Milestone

Milestone:

```text
Phase 47 - Boundary Readiness and Successor Hygiene
```

Exit gate issue:

```text
Phase 47 exit gate
```

Executed work items:

1. `Phase 47: sync repo truth to successor queue`
   - Scope: update tracked baseline docs only.
   - Lane: `contract-safe`.
   - Closed by PR `#370` after `current-state-baseline`, `phase-execution-queue`, and
     README agreed on the successor posture.

2. `Phase 47: public/private/plugin boundary regression`
   - Scope: verify public demo, private-beta routes, and Mirror Codex plugin boundaries.
   - Lane: `protected-core`.
   - Closed by PR `#371` after public demo checks, plugin release checks, and secret scans
     passed without changing public API, plugin MCP contract, scenario DSL, claim labels, run
     trace shape, or artifact layout.

3. `Phase 47: runtime world safety preflight`
   - Scope: harden create-world safety checks before unsafe user-authored content is written.
   - Lane: `protected-core`.
   - Closed by PR `#372` after real-person, digital-twin, political persuasion,
     real-world prediction, and high-risk decision examples were rejected in English and
     Chinese without leaving unsafe partial world state.

4. `Phase 47: main-path product containment`
   - Scope: keep the default operator path centered on compare, evidence, and eval.
   - Lane: `contract-safe` unless it changes durable artifacts, routes, or contracts.
   - Closed by PR `#373` after packet-heavy compatibility surfaces remained secondary and the
     main review path stayed analysis-first.

Current GitHub mapping:

- `#365` `Phase 47 exit gate` closed by PR `#374`.
- `#366` `Phase 47: sync repo truth to successor queue` closed by PR `#370`.
- `#367` `Phase 47: public/private/plugin boundary regression` closed by PR `#371`.
- `#368` `Phase 47: runtime world safety preflight` closed by PR `#372`.
- `#369` `Phase 47: main-path product containment` closed by PR `#373`.

## Closeout Validation

- `./make.ps1 public-demo-check` passed during the boundary-regression work.
- `./make.ps1 plugin-release-check` passed during the boundary-regression work.
- `python -m pytest backend/tests -q` passed after the runtime-world safety preflight.
- `python scripts/check_no_secrets.py` passed during closeout.
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reported
  `paused` after the Phase 47 implementation work items closed and before Phase 48 opened.
- `git diff --check` passed during closeout.

## Deferred Work

Defer these until a separate contract decision:

- changes to `compare.json`
- changes to claim/evidence shape
- changes to scenario DSL
- changes to run trace shape
- changes to public demo artifact layout
- new Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota behavior
  on the public path or plugin path
- new mutating Mirror Codex MCP tools
- full interactive kernel contract expansion

## Local Plan File Hygiene

The current local worktree may contain untracked planning files under `docs/plans/`. Treat
them as candidate inputs only until a PR intentionally promotes them.

| Local path | Disposition |
| --- | --- |
| `docs/plans/branch-analysis-product-reframe-2026-04/` | Candidate successor input. Do not treat as source of truth until promoted. |
| `docs/plans/hybrid-linear-main-path-design-system.md` | Design reference only. Do not promote without a frontend/design-system PR. |
| `docs/plans/hybrid-linear-main-path-manual-review.md` | Design reference only. Do not promote without a frontend/design-system PR. |
| `docs/plans/interactive-kernel-baseline-2026-04-22.md` | Protected-core candidate. Defer until a kernel contract phase is approved. |
| `docs/plans/interactive-perturbation-simulator-2026-04/` | Protected-core candidate. Defer until a kernel contract phase is approved. |
| `docs/plans/private-alpha-baseline-2026-04-22.md` | Historical candidate. Do not use as current stage language. |
| `docs/plans/private-alpha-launch-ready-2026-04-22.md` | Historical candidate. Do not use as current stage language. |
| `docs/plans/private-alpha-runbook-2026-04-22.md` | Historical candidate. Do not use as current stage language. |
| `docs/plans/private-alpha-zh-manual-review-2026-04-22.md` | Historical candidate. Do not use as current stage language. |
| `docs/plans/private-beta-readiness-2026-04-23.md` | Private-beta candidate input. Requires reconciliation before it becomes public source of truth. |
| `docs/plans/takeover-audit-2026-04/` | Candidate governance input. Promote only selected, reviewed facts. |

## Validation Gate

Before merging any successor-gate PR, run:

```powershell
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```

For implementation PRs after the queue opens, also run the relevant checks:

```powershell
./make.ps1 public-demo-check
./make.ps1 plugin-release-check
npm run build --prefix frontend
python -m pytest backend/tests/test_cli.py -k "create_world or safety"
python -m pytest backend/tests/test_decision_kernel.py backend/tests/test_cli.py -k "start_session or generate_branch or rollback_session"
./make.ps1 eval-demo
./make.ps1 eval-transfer
```

Only run frontend and runtime checks when those surfaces are touched.

## Open Items

- TODO[verify]: Reconcile the untracked private-beta readiness note before citing it as a
  public source of truth.
- TODO[verify]: Keep the Mirror Codex interactive UI tool-card acceptance item open until a
  clean Codex app session records visible MCP tool or resource evidence.
