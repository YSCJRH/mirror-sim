# Mirror Automation Roadmap

## Objective

Turn Mirror into a long-running, repo-native automation loop that uses GitHub as the task source of truth, Codex as the execution plane, CI/eval as gates, and phase audits as the stop condition.

## Current State

Day 0 bootstrap is complete, Phase 5 closeout is complete, and Phase 6 is now the active queue-resumption track.

- GitHub milestones, labels, and phase issues exist.
- `main` is protected by the required Linux and Windows quality gates.
- Repository auto-merge is enabled for safe-lane use.
- Phase 1 and Phase 2 gates are closed.
- Phase 3 is closed locally and in GitHub.
- Phase 3 exit issue `#4` is closed and milestone `Phase 3 - Eval/UI/Demo` is closed.
- Phase 4 is closed locally and in GitHub.
- Phase 4 exit issue `#26` is closed and milestone `Phase 4 - Review Workflow and Ops Hardening` is closed.
- Phase 5 is closed locally and in GitHub.
- Phase 5 exit issue `#31` is closed and milestone `Phase 5 - Review Sign-off and Evidence Packaging` is closed.
- The Phase 5 queue was completed through issues `#31-#35`.
- Phase 6 is the active successor queue.
- milestone `Phase 6 - Automation Activation and Queue Hygiene` is open.
- The Phase 6 queue is initialized through issues `#40-#43`.
- Builder state should continue to be derived from `audit-github-queue`, not from doc-only convention.
- The worktree pickup and handoff sequence is documented in `docs/plans/long-running-loop-runbook.md`.

## Day 0 Bootstrap

Before builder automation is allowed to write code or auto-merge:

1. Clean or snapshot the current worktree into a baseline PR.
2. Bootstrap labels, milestones, and phase issues from `.github/automation/bootstrap-spec.json`.
3. Upgrade CI from Phase 0 smoke/test only to the long-running quality gate.
4. Confirm the protected-core lane policy in `.github/automation/lane-policy.json`.
5. Start Codex automations only after the baseline issue is no longer blocked.

## Local Commands

- `python scripts/bootstrap_github.py --repo YSCJRH/mirror-sim`
  - dry-run the GitHub bootstrap plan
- `python scripts/bootstrap_github.py --repo YSCJRH/mirror-sim --apply`
  - create missing milestones, labels, and bootstrap issues
- `python -m backend.app.cli classify-lane --files README.md backend/app/cli.py`
  - classify a change set into `lane:auto-safe` or `lane:protected-core`
- `python -m backend.app.cli audit-phase phase1`
  - run the Phase 1 local exit audit
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
  - report whether the successor GitHub queue is `paused`, `ready`, or structurally invalid

## Execution Roles

- `mirror-orchestrator`
  - daily triage
  - metadata repair
  - task splitting
  - protected-core detection
- `mirror-builder`
  - one writer at a time
  - one issue at a time
  - push PRs into safe or protected lanes
- `mirror-evaluator`
  - re-run tests, smoke, eval-demo
  - summarize artifacts and failures
- `mirror-phase-auditor`
  - run local phase audits
  - compare against milestone state
  - keep automation paused when no valid successor queue is open

## Guardrails

- Protected-core files are defined in `.github/automation/lane-policy.json`.
- Path hits under that policy force `lane:protected-core`.
- Protected-core PRs may be automated, but they must not auto-merge.
- Any open `status:needs-adr` or `risk:safety` label blocks auto-merge.
- Long-running execution must run from isolated worktrees rather than the current `main` checkout.
- Queue pickup order, one-writer ownership, and branch hygiene should follow `docs/plans/long-running-loop-runbook.md`.
- When the active milestone exists and the queue reports `ready`, the builder may resume against that milestone only.
