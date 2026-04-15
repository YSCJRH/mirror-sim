# Current State Baseline

This note is the handoff baseline for the current `main` branch after the Phase 3 closeout.

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
    - `open_issues_count`: `0`
  - `gh api repos/YSCJRH/mirror-sim/issues/4`
    - Phase 3 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/3`
    - milestone `Phase 3 - Eval/UI/Demo` is `closed`

## Trusted Source Of Truth

- GitHub issue and milestone state remain the operational source of truth for current and future work.
- Local phase audits remain the contract-aligned source of truth for whether the current repo state is runnable and reviewable.
- `backlog/sprint-01.md` is historical seed material only and should not be used as the live queue.
- Remote `origin/codex/*` branches should be treated as historical and superseded by `main` unless a future issue explicitly revives one.

## Current Main Capabilities

- The backend can ingest corpus documents, build a graph, build personas, validate scenarios, simulate deterministic runs, generate reports, inspect world objects, and run evals.
- The frontend workbench shell renders report, claims, eval summary, rubric, corpus, graph, and scenario artifacts directly from the repo artifact tree.
- The current repository state is post-Phase-3 closeout, not an active Phase 3 implementation queue.

## Next Entry Point

- No Phase 4 or successor milestone is open yet.
- New implementation work should start by opening a fresh GitHub issue and milestone, then updating `docs/plans/phase-execution-queue.md` to match that new queue.
- Protected-core changes still require explicit review even when safe-lane automation is available.
- TODO[verify]: delete or archive the superseded remote `codex/*` branches during the next repository cleanup window.
