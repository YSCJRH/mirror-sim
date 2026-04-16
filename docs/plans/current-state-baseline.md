# Current State Baseline

This note is the current successor-queue baseline after the Phase 4 kickoff.

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
    - milestone `Phase 4 - Review Workflow and Ops Hardening` is `open`
  - `gh api "repos/YSCJRH/mirror-sim/issues?state=open&milestone=4"`
    - Phase 4 queue is initialized through issues `#26-#29`
  - `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
    - successor queue reports `ready` while open ready work items remain under the active milestone, and `paused` once only the blocked exit gate remains

## Trusted Source Of Truth

- GitHub issue and milestone state remain the operational source of truth for current and future work.
- Local phase audits remain the contract-aligned source of truth for whether the current repo state is runnable and reviewable.
- `audit-github-queue` is the executable local rule for whether builder automation should remain `paused` or can resume against the successor queue.
- `backlog/sprint-01.md` is historical seed material only and should not be used as the live queue.
- Remote `origin/codex/*` branches should be treated as historical and superseded by `main` unless a future issue explicitly revives one.

## Current Main Capabilities

- The backend can ingest corpus documents, build a graph, build personas, validate scenarios, simulate deterministic runs, generate reports, inspect world objects, and run evals.
- The frontend workbench renders report, claims, eval summary, rubric, corpus, graph, and scenario artifacts directly from the repo artifact tree.
- The workbench now also supports claim -> evidence drill-down and baseline/intervention trace review without introducing backend API expansion.
- The current repository state is in an active Phase 4 successor queue, not a post-Phase-3 idle handoff.

## Next Entry Point

- Phase 4 is the active milestone and the first execution slice is tracked by issues `#26-#29`.
- New implementation work should attach to the existing Phase 4 queue until its exit gate is closed, instead of opening a parallel successor milestone.
- Protected-core changes still require explicit review even when safe-lane automation is available.
- TODO[verify]: delete or archive the superseded remote `codex/*` branches during the next repository cleanup window.
