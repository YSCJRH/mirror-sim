# Phase 48 Successor Gate

Date: 2026-05-17

This note defines the public baseline for Phase 48 after the Phase 47 boundary-readiness
closeout. Phase 48 is an intake and triage phase: it reconciles repo truth, validates the
public/private/plugin boundary evidence, audits private-beta runtime contract language, and
turns kernel and perturbation notes into explicit candidate work for a later phase.

## Current Direct Evidence

- The latest published release remains `v0.1.0`.
- Phase 47 completed through PRs `#370` through `#374`.
- Milestone `Phase 47 - Boundary Readiness and Successor Hygiene` is closed.
- Issue `#365` `Phase 47 exit gate` is closed after PR `#374`.
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reports `ready`
  with `Phase 48 - Successor Intake and Boundary Contract Triage` as the active milestone.
- Milestone `Phase 48 - Successor Intake and Boundary Contract Triage` is open.
- Issue `#375` `Phase 48 exit gate` is open, blocked, and protected-core.
- Issue `#376` is the initial repo-truth sync work item for this baseline update.
- Issue `#377` records the Phase 48 public/private/plugin boundary acceptance pass.
- Issues `#378` through `#379` are open ready Phase 48 follow-up work items.
- Local untracked planning files under `docs/plans/...` remain candidate inputs only until a
  reviewed PR intentionally promotes selected facts.

## Blueprint Boundary

Phase 48 must stay aligned with `mirror.md`:

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

Phase 48 title:

```text
Phase 48 - Successor Intake and Boundary Contract Triage
```

Phase 48 goal:

```text
Reconcile repository truth after Phase 47, verify public/private/plugin boundary evidence,
audit private-beta runtime contracts, and convert kernel/perturbation follow-up material
into explicit candidate work without expanding the public path or plugin contract.
```

Phase 48 is deliberately not a runtime expansion phase. It should produce evidence,
classification, and successor recommendations before implementation work changes core
contracts.

## Work Item Mapping

- `#375` `Phase 48 exit gate`
  - Lane: `protected-core`.
  - Role: blocked closeout gate for this phase.
- `#376` `Phase 48: sync repo truth after Phase 47 closeout`
  - Lane: `auto-safe`.
  - Scope: update tracked docs so they agree on Phase 47 closed and Phase 48 active.
  - Expected disposition: closes with the PR that introduces this Phase 48 baseline.
- `#377` `Phase 48: public private plugin boundary acceptance`
  - Lane: `protected-core`.
  - Scope: verify the public demo, private route boundary, and Mirror Codex plugin evidence
    without changing the public API or plugin contract.
  - Disposition: recorded by `docs/plans/phase-48-boundary-acceptance-2026-05-17.md` and
    expected to close with the PR that introduces that report.
- `#378` `Phase 48: private beta runtime contract audit`
  - Lane: `protected-core`.
  - Scope: reconcile private-beta runtime docs, route language, provider-secret handling,
    and acceptance criteria before any new runtime implementation.
- `#379` `Phase 48: kernel perturbation gap brief`
  - Lane: `protected-core`.
  - Scope: convert kernel and perturbation follow-ups into explicit Phase 49 candidate work.

## Non-Goals

- Do not change `compare.json`, claim/evidence shape, scenario DSL, run trace shape, public
  demo artifact layout, or plugin MCP tool/resource contract during Phase 48 intake work.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota
  behavior on the public path or plugin path.
- Do not add mutating Mirror Codex MCP tools.
- Do not promote local untracked planning files as durable truth without a reviewed PR.
- Do not implement full interactive kernel or perturbation runtime expansion in Phase 48
  unless a separate protected contract review explicitly approves the boundary.

## Local Plan File Hygiene

The current local worktree may contain untracked planning files under `docs/plans/`. Treat
them as candidate inputs only until a PR intentionally promotes selected facts.

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

For the `#376` repo-truth sync PR, run:

```powershell
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/plans/automation-roadmap.md docs/plans/current-state-baseline.md docs/plans/phase-47-successor-gate-2026-05-16.md docs/plans/phase-48-successor-gate-2026-05-17.md docs/plans/phase-execution-queue.md
git diff --check
```

For later Phase 48 implementation PRs, add the issue-specific checks:

```powershell
./make.ps1 public-demo-check
./make.ps1 plugin-release-check
python -m pytest backend/tests/test_cli.py -k "create_world or safety"
python -m pytest backend/tests/test_decision_kernel.py backend/tests/test_cli.py -k "start_session or generate_branch or rollback_session"
./make.ps1 eval-demo
./make.ps1 eval-transfer
```

Run `npm run build --prefix frontend` only for Phase 48 work that touches frontend code.

## Open Items

- TODO[verify]: Codex UI tool-card evidence remains open until a clean Codex app session
  shows observable MCP tool or resource cards/traces for the Mirror Codex plugin.
- TODO[verify]: Private-beta runtime route and provider-secret claims must be reconciled
  against tracked code and docs before candidate planning files become durable truth.
- TODO[verify]: Kernel and perturbation follow-up work should be converted into Phase 49
  candidate issues before any core runtime contract expansion.
