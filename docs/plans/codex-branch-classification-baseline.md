# Codex Branch Classification Baseline

This note records the Phase 42 protected-core classification baseline and the reviewed apply result for historical `codex/*` branches.

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

- Current local inventory on `codex/phase42-branch-cleanup-apply` after the reviewed delete set:
  - local `codex/*` branches: `4`
  - remote `origin/codex/*` branches in the current remote-tracking snapshot: `1`
  - local branches with gone upstreams: `2`
  - local branches equal to upstream: `0`
  - local branches diverged from upstream: `1`
  - local branches with no upstream: `1`
  - local `codex/*` branches that track `origin/main`: `0`
- The current authenticated REST pull snapshot shows no open pull requests.
- The current authenticated REST issue snapshot shows only two open issues:
  - `#295` `Phase 42 exit gate`
  - `#303` `Phase 42: apply reviewed codex branch cleanup and sync branch-hygiene docs`
- Phases 30-41 are already recorded as closed in [current-state-baseline.md](/D:/mirror/docs/plans/current-state-baseline.md:1).
- Phase 42 product issues `#296-#298` are no longer open, `#302` has merged through PR `#304`, and the remaining open Phase 42 work is exit-gate closeout plus reviewed branch-hygiene apply.
- The reviewed remote delete set has already been applied; the only remaining historical remote exception is `origin/codex/phase23-session-summary`.
- The repo uses squash merges heavily, so ancestry alone is not enough to prove whether an old execution branch has already been absorbed by `main`.

## Apply Result

- Remote historical `origin/codex/*` branches have been reduced to a single explicit `TODO[verify]` exception:
  - `origin/codex/phase23-session-summary`
- Local `codex/*` branches now retain only:
  - `codex/phase42-branch-cleanup-apply`
  - `codex/phase1-queue-sync`
  - `codex/phase22-apply-copy`
  - `codex/phase23-session-summary`
- `#302` is complete and closed through PR `#304`.
- `#303` is now the active apply/closeout issue for any remaining doc sync and exception handling.

## Remote Branch Classification

### `delete-remote-and-local`

These remote branches were reviewed in `#302` and have now been deleted in `#303`.

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
- `origin/codex/phase39-escalation-receipt`
- `origin/codex/phase39-recovery-checkpoint`
- `origin/codex/phase40-escalation-acknowledgment`
- `origin/codex/phase40-recovery-clearance`
- `origin/codex/phase41-escalation-closure`
- `origin/codex/phase41-recovery-release`
- `origin/codex/phase42-escalation-finalization`
- `origin/codex/phase42-recovery-completion`

Evidence:

- No open PR head was holding these refs alive in the current authenticated REST pull snapshot.
- The phases that created these branches were already closed or their feature issues were no longer open.
- The delete set has now been applied.

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

- `codex/phase42-branch-cleanup-apply`

Evidence:

- This is the current dedicated writer branch for `#303`.
- It is the only active local execution branch still needed for the apply/closeout slice.

### `delete-remote-and-local`

- applied

Evidence:

- The same-name historical execution branches in this set were deleted locally after the reviewed remote delete set was applied.

### `delete-local-now`

- applied

Evidence:

- The reviewed local-only and upstream-gone residues in this set have now been deleted.

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

- Applied remote plus same-name local historical execution delete set
- Applied local-only historical residue delete set
- Preserved explicit exceptions for dedicated follow-up:
  - `origin/codex/phase23-session-summary`
  - `codex/phase1-queue-sync`
  - `codex/phase22-apply-copy`
  - `codex/phase23-session-summary`
- Preserved the current active writer branch:
  - `codex/phase42-branch-cleanup-apply`

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
git push origin --delete codex/phase33-action-readiness codex/phase33-escalation-packet codex/phase34-escalation-decision codex/phase34-execution-kickoff codex/phase35-escalation-trigger codex/phase35-execution-progress codex/phase36-escalation-dispatch codex/phase36-execution-outcome codex/phase37-escalation-delivery codex/phase37-execution-correction codex/phase38-escalation-confirmation codex/phase38-execution-recovery codex/phase39-escalation-receipt codex/phase39-recovery-checkpoint codex/phase40-escalation-acknowledgment codex/phase40-recovery-clearance codex/phase41-escalation-closure codex/phase41-recovery-release codex/phase42-escalation-finalization codex/phase42-recovery-completion
git branch -D codex/phase28-branch-cleanup codex/phase28-delivery-script codex/phase28-delivery-script-clean codex/phase28-send-checklist codex/phase29-queue-sync codex/phase33-action-readiness codex/phase33-escalation-packet codex/phase34-escalation-decision codex/phase34-execution-kickoff codex/phase35-escalation-trigger codex/phase35-execution-progress codex/phase36-escalation-dispatch codex/phase36-execution-outcome codex/phase37-escalation-delivery codex/phase37-execution-correction codex/phase38-escalation-confirmation codex/phase38-execution-recovery codex/phase39-escalation-receipt codex/phase39-queue-sync codex/phase39-recovery-checkpoint codex/phase40-escalation-acknowledgment codex/phase40-queue-sync codex/phase40-recovery-clearance codex/phase41-escalation-closure codex/phase41-queue-sync codex/phase41-recovery-release codex/phase42-escalation-finalization codex/phase42-queue-sync codex/phase42-recovery-completion
git branch -r -d origin/codex/phase42-branch-classification
```

## TODO[verify]

- Re-run authenticated REST pull and issue audits immediately before closing `#303`, in case a new PR or issue dependency appears while the apply branch is still open.
