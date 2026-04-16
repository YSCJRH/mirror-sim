# Current State Baseline

This note is the current post-Phase-5 paused baseline.

## Snapshot

- Local quality baseline:
  - `./make.ps1 smoke`
  - `./make.ps1 test`
  - `./make.ps1 eval-demo`
  - `python -m backend.app.cli audit-phase phase1`
  - `python -m backend.app.cli audit-phase phase2`
  - `python -m backend.app.cli audit-phase phase3`
- GitHub source-of-truth baseline:
  - `gh api repos/YSCJRH/mirror-sim`
    - `default_branch`: `main`
    - `license`: `MIT`
  - `gh api repos/YSCJRH/mirror-sim/issues/4`
    - Phase 3 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/3`
    - milestone `Phase 3 - Eval/UI/Demo` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/4`
    - milestone `Phase 4 - Review Workflow and Ops Hardening` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/26`
    - Phase 4 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/5`
    - milestone `Phase 5 - Review Sign-off and Evidence Packaging` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/31`
    - Phase 5 exit issue is `closed`
  - `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
    - successor queue should now report `paused` because no open milestone is available for pickup yet

## Trusted Source Of Truth

- GitHub issue and milestone state remain the operational source of truth for current and future work.
- Local phase audits remain the contract-aligned source of truth for whether the current repo state is runnable and reviewable.
- `audit-github-queue` is the executable local rule for whether builder automation should remain `paused` or can resume against the successor queue.
- `backlog/sprint-01.md` is historical seed material only and should not be used as the live queue.
- Remote `origin/codex/*` branches are historical and superseded by `main`.
- Delete a historical remote branch once it is tied only to merged or closed work and no open issue, PR, or runbook step still references it.
- Keep a historical remote branch only when an open issue or unresolved forensic comparison explicitly names it.
- Revive a historical remote branch only by opening a new issue that states why `main` is insufficient.

## Current Main Capabilities

- The backend can ingest corpus documents, build a graph, build personas, validate scenarios, simulate deterministic runs, generate reports, inspect world objects, and run evals.
- The frontend workbench renders report, claims, eval summary, rubric, corpus, graph, and scenario artifacts directly from the repo artifact tree.
- The workbench now also supports claim -> evidence drill-down, baseline/intervention trace review, reviewer scorecards, and shareable review packet export without introducing backend API expansion.
- The current repository state is a paused post-Phase-5 baseline, not an active successor queue.

## Next Entry Point

- No execution milestone is currently open for pickup.
- The next implementation work must begin by opening a fresh successor milestone and its blocked protected-core exit gate before any new ready issues are introduced.
- Protected-core changes still require explicit review even when safe-lane automation is available.
- `docs/plans/long-running-loop-runbook.md` is the operational handoff note for authenticated queue audit, worktree pickup, and post-merge checkpointing.
