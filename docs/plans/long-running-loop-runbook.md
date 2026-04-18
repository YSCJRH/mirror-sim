# Long-Running Loop Runbook

This runbook defines the manual, worktree-based pickup and handoff flow for consuming the live GitHub queue without relying on oral convention.

## Preconditions

- Run the loop from an authenticated `gh` context with access to `YSCJRH/mirror-sim`.
- Use `main` only as the clean coordination checkout.
- Treat GitHub milestone and issue state as the operational source of truth.
- Treat local phase audits and `audit-github-queue` as the executable go/no-go checks.

## Pickup Order

1. Run `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`.
2. Confirm the queue reports `ready` and identifies exactly one active milestone.
3. Read the open issues under that active milestone.
4. Pick the earliest open `status:ready` issue in that milestone.
5. Confirm whether the issue is `lane:auto-safe` or `lane:protected-core` before writing code.

If `audit-github-queue` reports `paused`, stop and do not invent new work outside the active milestone.

Interpret `paused` in one of two ways:

- If one active milestone still exists but has no `status:ready` issue, treat the queue as waiting for explicit preparation or closeout inside that same milestone.
- If no open milestone exists, treat the repo as being in the intentional released stop-state; do not reopen work until an approved successor milestone is defined.

## Worktree Rules

- Create one dedicated worktree per issue.
- Name the worktree `wt/<phase>-<topic>`.
- Allow only one writer worktree to own a given issue at a time.
- Keep docs-only or evaluation-only parallel work in separate worktrees or threads; do not use multiple writers against the same protected-core surface.
- After a merge, return to the clean coordination checkout before picking the next issue.

## PR And Merge Paths

`lane:auto-safe`
- Open a PR once checks are ready.
- Allow auto-merge only when required checks are green and no blocking labels are present.
- Re-run local smoke, test, and eval checks if the change touched the workbench or demo artifact readers.

`lane:protected-core`
- Open a PR with explicit protected-core framing.
- Do not auto-merge.
- Require an explicit review pass on queue governance, templates, contracts, or operating docs before merge.
- Re-run local phase audits in addition to smoke, test, and eval checks when the change touches queue governance, CI, or runbook logic.

## Post-Merge Checkpoint

Immediately after each merge:

1. Run `./make.ps1 smoke`
2. Run `./make.ps1 test`
3. Run `./make.ps1 eval-demo`
4. Run `python -m backend.app.cli audit-phase phase1`
5. Run `python -m backend.app.cli audit-phase phase2`
6. Run `python -m backend.app.cli audit-phase phase3`
7. Run authenticated `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
8. Confirm the merged issue is closed or otherwise updated in GitHub.

If the queue becomes `fail`, stop pickup and repair the milestone, exit gate, or label structure before continuing.

If the queue becomes `paused` because no open milestone remains after a formal closeout, treat that as a successful stop-state rather than a queue defect.

## Branch Hygiene

- Treat `origin/codex/*` branches as temporary execution state by default; once a branch is no longer tied to open work, it should become historical and be reconciled against `main`.
- Delete a historical branch once it is tied only to merged or closed work and no open issue, PR, or runbook step still references it.
- Keep a historical branch only when an open issue or unresolved forensic comparison explicitly depends on it.
- Revive a historical branch only through a new issue that names the branch and explains why `main` is insufficient.

This runbook does not create local automation cards, background schedulers, daemon processes, or worktree wrapper scripts. It documents the stable manual loop that future local automation must follow.
