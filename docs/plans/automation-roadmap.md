# Mirror Automation Roadmap

## Objective

Turn Mirror into a long-running, repo-native automation loop that uses GitHub as the task source of truth, Codex as the execution plane, CI/eval as gates, and phase audits as the stop condition.

## Current State

Day 0 bootstrap is complete, Phase 5 closeout is complete, Phase 6 closeout is complete, Phase 7 closeout is complete, Phase 8 closeout is complete, Phase 9 closeout is complete, Phase 10 closeout is complete, Phase 11 closeout is complete, Phase 12 closeout is complete, and Phase 13 is now the active export-review track.

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
- Phase 6 is closed locally and in GitHub.
- Phase 6 exit issue `#40` is closed and milestone `Phase 6 - Automation Activation and Queue Hygiene` is closed.
- The Phase 6 queue was completed through issues `#40-#43`.
- Phase 7 is closed locally and in GitHub.
- Phase 7 exit issue `#46` is closed and milestone `Phase 7 - Operator Handoff and Review Delivery` is closed.
- The Phase 7 queue was completed through issues `#46-#49`.
- Phase 8 is closed locally and in GitHub.
- Phase 8 exit issue `#53` is closed and milestone `Phase 8 - Closeout Delivery and Pickup Routing` is closed.
- The Phase 8 queue was completed through issues `#53-#56`.
- Phase 9 is closed locally and in GitHub.
- Phase 9 exit issue `#60` is closed and milestone `Phase 9 - Review Delivery Polish and Completeness` is closed.
- The Phase 9 queue was completed through issues `#60-#63`.
- Phase 10 is closed locally and in GitHub.
- Phase 10 exit issue `#67` is closed and milestone `Phase 10 - Guided Delivery and Quick Export` is closed.
- The Phase 10 queue was completed through issues `#67-#70`.
- Phase 11 is closed locally and in GitHub.
- Phase 11 exit issue `#74` is closed and milestone `Phase 11 - Export Presets and Delivery Shortcuts` is closed.
- The Phase 11 queue was completed through issues `#74-#77`.
- Phase 12 is closed locally and in GitHub.
- Phase 12 exit issue `#81` is closed and milestone `Phase 12 - Delivery Preset Refinement and Comparison Flow` is closed.
- The Phase 12 queue was completed through issues `#81-#84`.
- Phase 13 is the active successor queue.
- milestone `Phase 13 - Guided Export Payload Review` is open.
- The Phase 13 queue is initialized through issues `#88-#91`.
- Builder state should continue to be derived from `audit-github-queue`, not from doc-only convention.
- The worktree pickup and handoff sequence is documented in `docs/plans/long-running-loop-runbook.md`.
- The local Codex queue heartbeat remains active as `mirror-queue-heartbeat`.

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
