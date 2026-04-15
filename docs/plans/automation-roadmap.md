# Mirror Automation Roadmap

## Objective

Turn Mirror into a long-running, repo-native automation loop that uses GitHub as the task source of truth, Codex as the execution plane, CI/eval as gates, and phase audits as the stop condition.

## Current State

Day 0 bootstrap is complete as of 2026-04-15.

- The bootstrap baseline has been merged into `main`.
- GitHub milestones, labels, and phase issues exist.
- `main` is protected by required Linux and Windows quality gates.
- Repository auto-merge is enabled for safe-lane use.

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
  - pause automation when Phase 3 is complete

## Guardrails

- Protected-core files are defined in `.github/automation/lane-policy.json`.
- Path hits under that policy force `lane:protected-core`.
- Protected-core PRs may be automated, but they must not auto-merge.
- Any open `status:needs-adr` or `risk:safety` label blocks auto-merge.

## TODO[verify]

- TODO[verify]: Codex cron automations should target worktrees, not the current dirty `main` checkout.
