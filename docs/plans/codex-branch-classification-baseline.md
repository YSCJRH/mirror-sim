# Codex Branch Classification Baseline

This note records the Phase 42 protected-core classification baseline for current historical `codex/*` branches.

## Purpose

- Use the current branch inventory and active milestone state to drive branch hygiene decisions.
- Treat `main` / `origin/main` as the only long-lived coordination line.
- Separate classification in `#302` from destructive cleanup in `#303`.
- Do not treat old docs snapshots or `git branch --merged origin/main` as sufficient deletion evidence on their own.

## Decision Rules

- `keep`
  - Branch is the current active writer branch or is still explicitly required by open issue or milestone work.
- `revive`
  - Branch has unique history worth carrying forward, but future work should continue from a fresh branch off `main` after a new issue explains why `main` is insufficient.
- `delete-remote-and-local`
  - Historical execution branch with no active dependency; delete the remote ref and any same-name local twin.
- `delete-local-now`
  - Local-only or upstream-gone residue with no remaining dependency.
- `TODO[verify]`
  - Evidence is incomplete or contradictory, especially when squash-merge history makes ancestry checks unreliable.

## Evidence Notes

- Current local inventory on `codex/phase42-branch-classification`:
  - local `codex/*` branches: `33`
  - remote `origin/codex/*` branches in the current remote-tracking snapshot: `40`
  - local branches with gone upstreams: `6`
  - local branches equal to upstream: `25`
  - local branches diverged from upstream: `1`
  - local branches with no upstream: `1`
  - local `codex/*` branches that track `origin/main`: `1`
- The last successful REST pull snapshot returned no open pull requests before the GitHub CLI credential path stopped yielding a usable token.
- The last successful REST issue snapshot showed only three open issues:
  - `#295` `Phase 42 exit gate`
  - `#302` `Phase 42: classify local and remote codex branches against live GitHub state`
  - `#303` `Phase 42: apply reviewed codex branch cleanup and sync branch-hygiene docs`
- Phases 30-41 are already recorded as closed in [current-state-baseline.md](/D:/mirror/docs/plans/current-state-baseline.md:1).
- Phase 42 product issues `#296-#298` are no longer open, so the remaining open Phase 42 work is exit-gate closeout plus branch hygiene.
- The repo uses squash merges heavily, so ancestry alone is not enough to prove whether an old execution branch has already been absorbed by `main`.

## Remote Branch Classification

### `delete-remote-and-local`

These remote branches are historical execution state and should be removed in `#303` together with any same-name local twin.

- `origin/codex/phase30-checkpoint-board`
- `origin/codex/phase30-queue-sync`
- `origin/codex/phase30-response-packet`
- `origin/codex/phase31-outcome-tracker`
- `origin/codex/phase31-queue-sync`
- `origin/codex/phase31-resolution-handoff`
- `origin/codex/phase32-next-step-routing`
- `origin/codex/phase32-queue-sync`
- `origin/codex/phase32-status-board`
- `origin/codex/phase33-action-readiness`
- `origin/codex/phase33-escalation-packet`
- `origin/codex/phase33-queue-sync`
- `origin/codex/phase34-escalation-decision`
- `origin/codex/phase34-execution-kickoff`
- `origin/codex/phase34-queue-sync`
- `origin/codex/phase35-escalation-trigger`
- `origin/codex/phase35-execution-progress`
- `origin/codex/phase35-queue-sync`
- `origin/codex/phase36-escalation-dispatch`
- `origin/codex/phase36-execution-outcome`
- `origin/codex/phase36-queue-sync`
- `origin/codex/phase37-escalation-delivery`
- `origin/codex/phase37-execution-correction`
- `origin/codex/phase37-queue-sync`
- `origin/codex/phase38-escalation-confirmation`
- `origin/codex/phase38-execution-recovery`
- `origin/codex/phase38-queue-sync`
- `origin/codex/phase39-escalation-receipt`
- `origin/codex/phase39-queue-sync`
- `origin/codex/phase39-recovery-checkpoint`
- `origin/codex/phase40-escalation-acknowledgment`
- `origin/codex/phase40-queue-sync`
- `origin/codex/phase40-recovery-clearance`
- `origin/codex/phase41-escalation-closure`
- `origin/codex/phase41-queue-sync`
- `origin/codex/phase41-recovery-release`
- `origin/codex/phase42-escalation-finalization`
- `origin/codex/phase42-queue-sync`
- `origin/codex/phase42-recovery-completion`

Evidence:

- No open PR head is currently holding these refs alive in the last successful REST pull snapshot.
- The phases that created these branches are already closed or their feature issues are no longer open.
- The current active Phase 42 work is branch hygiene itself, not continued implementation on these older execution branches.

### `TODO[verify]`

- `origin/codex/phase23-session-summary`

Evidence:

- The older baseline already flagged this branch as non-ancestor and risky to clean blindly.
- The local twin still diverges from the remote-tracking ref, so it remains the one remote exception that still needs explicit forensic review before deletion.

### `keep`

- none

### `revive`

- none

## Local Branch Classification

### `keep`

- `codex/phase42-branch-classification`

Evidence:

- This is the current dedicated writer branch for `#302`.
- It tracks `origin/main`, not a same-name historical execution branch, and should remain in place until classification work is complete.

### `delete-remote-and-local`

- `codex/phase33-action-readiness`
- `codex/phase33-escalation-packet`
- `codex/phase34-escalation-decision`
- `codex/phase34-execution-kickoff`
- `codex/phase35-escalation-trigger`
- `codex/phase35-execution-progress`
- `codex/phase36-escalation-dispatch`
- `codex/phase36-execution-outcome`
- `codex/phase37-escalation-delivery`
- `codex/phase37-execution-correction`
- `codex/phase38-escalation-confirmation`
- `codex/phase38-execution-recovery`
- `codex/phase39-escalation-receipt`
- `codex/phase39-queue-sync`
- `codex/phase39-recovery-checkpoint`
- `codex/phase40-escalation-acknowledgment`
- `codex/phase40-queue-sync`
- `codex/phase40-recovery-clearance`
- `codex/phase41-escalation-closure`
- `codex/phase41-queue-sync`
- `codex/phase41-recovery-release`
- `codex/phase42-escalation-finalization`
- `codex/phase42-queue-sync`
- `codex/phase42-recovery-completion`

Evidence:

- These branches are equal to current same-name remote refs and correspond to historical execution slices, not active queue work.
- They should be deleted together with the remote refs in `#303`, after the current branch-hygiene writer branch is no longer using one of them as a checkout.

### `delete-local-now`

- `codex/phase28-branch-cleanup`
- `codex/phase28-delivery-script`
- `codex/phase28-delivery-script-clean`
- `codex/phase28-send-checklist`
- `codex/phase29-queue-sync`

Evidence:

- Their upstreams are already gone or absent.
- Their feature subjects already appear in current repo truth:
  - destination-specific delivery script
  - final send checklist
  - reviewed codex branch cleanup
  - Phase 29 queue sync
- No open issue or open PR currently depends on these local residues.

### `TODO[verify]`

- `codex/phase1-queue-sync`
- `codex/phase22-apply-copy`
- `codex/phase23-session-summary`

Evidence:

- `codex/phase1-queue-sync` still carries a unique closed-but-unmerged historical commit.
- `codex/phase22-apply-copy` still carries a unique local head even though the current repo already contains apply-and-copy behavior.
- `codex/phase23-session-summary` remains the one explicit local/remote divergence pair and should not be deleted without a dedicated replay check.

### `revive`

- none

## Reviewed Apply Set For #303

- Keep the current writer branch:
  - `codex/phase42-branch-classification`
- Delete remote plus same-name local historical execution branches:
  - all `delete-remote-and-local` entries above
- Delete local-only historical residues immediately once `#303` begins:
  - all `delete-local-now` entries above
- Preserve explicit exceptions until a dedicated follow-up resolves them:
  - all `TODO[verify]` entries above

## Commands Used

```powershell
git status -sb
git branch -vv
git branch -r --list origin/codex/*
git branch -r --merged origin/main --list origin/codex/*
git branch -r --no-merged origin/main --list origin/codex/*
git for-each-ref --format="%(refname:short)|%(upstream:short)|%(upstream:trackshort)|%(objectname:short)|%(subject)" refs/heads
git log --oneline origin/main..codex/phase1-queue-sync
git log --oneline origin/main..codex/phase22-apply-copy
git log --oneline origin/main..codex/phase23-session-summary
git log --oneline origin/main..codex/phase28-branch-cleanup
git log --oneline origin/main..codex/phase28-delivery-script
git log --oneline origin/main..codex/phase28-delivery-script-clean
git log --oneline origin/main..codex/phase28-send-checklist
git log --oneline origin/main..codex/phase29-queue-sync
git show --stat --oneline --summary c62f86d
git show --stat --oneline --summary 66ed805
rg -n "destination-specific delivery script|final send checklist|apply reviewed codex branch cleanup|preset apply-and-copy actions|session summary strip" README.md docs frontend backend .github
gh auth status
gh api "repos/YSCJRH/mirror-sim/pulls?state=open&per_page=100"
gh api "repos/YSCJRH/mirror-sim/issues?state=open&per_page=100"
```

## TODO[verify]

- Re-run authenticated REST pull and issue audits immediately before `#303` deletion work, in case a new PR or issue dependency appears after this classification snapshot.
