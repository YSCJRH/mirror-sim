# Phase Execution Queue

This note records the current post-Day-0 execution status for Mirror after the Phase 7 queue resumption.

## Current Gate State

- Phase 1 exit gate: closed
- Phase 2 exit gate: closed
- Phase 3 exit gate: closed
- Phase 4 exit gate: closed
- Phase 5 exit gate: closed
- Phase 6 exit gate: closed
- Phase 7 exit gate: open

Local phase audits currently report:

- `phase1`: pass
- `phase2`: pass
- `phase3`: pass

## Closeout Snapshot

- `#17` browser workbench entrypoint
  - implemented
  - merged via PR `#20`
- `#18` report, claims, eval summary, and rubric panels
  - implemented
  - merged via PR `#21`
- `#19` corpus, graph, and scenario artifact browser
  - implemented
  - merged via PR `#22`
- docs sync
  - merged via PR `#23`
- Phase 4 repo/workbench hardening
  - merged via PR `#30`
- Phase 3 exit issue `#4`
  - closed
- milestone `Phase 3 - Eval/UI/Demo`
  - closed
- Phase 4 exit issue `#26`
  - closed
- milestone `Phase 4 - Review Workflow and Ops Hardening`
  - closed
- Phase 5 exit issue `#31`
  - closed
- milestone `Phase 5 - Review Sign-off and Evidence Packaging`
  - closed
- Phase 6 exit issue `#40`
  - closed
- milestone `Phase 6 - Automation Activation and Queue Hygiene`
  - closed
- GitHub remote state
  - no open pull requests remain after the Phase 7 queue kickoff

## Current Queue

- milestone `Phase 7 - Operator Handoff and Review Delivery` is open.
- `#46` `Phase 7 exit gate`
  - open
  - blocked until the Phase 7 operator handoff and review delivery slice is complete
- The current Phase 7 execution slice is tracked through:
  - `#47` `Phase 7: sync bootstrap spec and docs to the active handoff queue`
  - `#48` `Phase 7: add issue-comment-ready review packet sections in the workbench`
  - `#49` `Phase 7: add decision brief and next-action handoff panel in the workbench`
- The completed Phase 6 slice was tracked through:
  - `#41` `Phase 6: sync bootstrap spec and docs to the active automation queue`
  - `#42` `Phase 6: define and activate local Codex queue heartbeat against the worktree runbook`
  - `#43` `Phase 6: classify and clean superseded remote codex branches`
- The completed Phase 5 slice was tracked through:
  - `#32` `Phase 5: decouple successor bootstrap from hardcoded phase templates and sync queue docs`
  - `#33` `Phase 5: add reviewer scorecard and sign-off worksheet in the workbench`
  - `#34` `Phase 5: add shareable review packet export from claims, timeline, and rubric`
  - `#35` `Phase 5: codify worktree-based orchestrator pickup and handoff runbook`
- GitHub remains the operational source of truth for the queue.
- `backlog/sprint-01.md` remains a historical seed backlog only.
- Successor queue health should be checked with `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`.
- Worktree pickup and handoff should follow `docs/plans/long-running-loop-runbook.md`.

## Automation Guidance

- Builder should prefer the earliest unfinished open milestone once a valid queue exists.
- Closed exit-gate issues and milestones should remain archived history, not be reused as active work trackers.
- Safe-lane PRs may auto-merge once checks are green and no blocking labels are present.
- Protected-core changes still require explicit review and must not auto-merge.
- Long-running execution should assign exactly one writer worktree per issue.
- When `audit-github-queue` reports `ready`, consume only the currently active milestone and do not parallel-open another execution queue.

## Historical Branch Status

- The visible `origin/codex/*` branches correspond to closed or merged work.
- Treat those branches as historical and superseded by `main`, not as an active queue.
- Delete a historical branch when it is tied only to closed or merged work and no open issue, PR, or runbook step references it.
- Keep a historical branch only when an open issue or unresolved forensic comparison explicitly depends on it.
- Revive a historical branch only through a new issue that names the branch and explains why `main` is insufficient.
