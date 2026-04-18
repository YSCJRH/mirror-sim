# Codex Branch Classification Baseline

This note records the merged Phase 42 branch-hygiene baseline and the Phase 43 `#308` closeout result for the remaining historical `codex/*` exceptions.

## Purpose

- Use the live branch inventory, issue state, and merged PR history to drive branch hygiene decisions.
- Treat `main` / `origin/main` as the only long-lived coordination line.
- Keep old execution branches only when an open issue, PR, or explicit forensic need still depends on them.
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

- Current local inventory on `codex/phase43-branch-exceptions` before applying the final delete set:
  - local `codex/*` branches: `5`
  - local remote-tracking `origin/codex/*` refs: `3`
  - local branches with gone upstreams: `2`
  - local branches diverged from upstream: `1`
  - local branches with no upstream: `1`
- The current authenticated REST pull snapshot shows no open pull requests.
- The current authenticated REST issue snapshot shows only two open Phase 43 issues:
  - `#306` `Phase 43 exit gate`
  - `#308` `Phase 43: resolve remaining codex branch TODO exceptions`
- Authenticated REST branch lookup shows only one live historical remote branch:
  - `origin/codex/phase23-session-summary`
- Authenticated REST lookup returns `404` for:
  - `origin/codex/phase42-branch-cleanup-apply`
  - `origin/codex/phase43-queue-bootstrap`
- Patch-id evidence closes the two frontend exceptions:
  - local `4d4c150` and main commit `9bc3b73` share patch-id `458686e21e0d387d2a885d04e34e07a0ecff1654`
  - local `cef67d1`, remote `7e00df6`, and main commit `56335a5` share patch-id `a322431a5cd51cbb0a1242c526aec25d410ff5a5`
- `7e00df6` is tied to merged PR `#163` (`[codex] Add preset session summary strip`).
- `e33989a` has no associated PR and only touched queue-truth docs that have since been superseded repeatedly on `main`.
- The repo uses squash merges heavily, so ancestry alone is not enough to prove whether an old execution branch has already been absorbed by `main`.

## Apply Result

- No live historical `origin/codex/*` exception remains after deleting `origin/codex/phase23-session-summary`.
- Stale local remote-tracking refs for `origin/codex/phase42-branch-cleanup-apply` and `origin/codex/phase43-queue-bootstrap` should be pruned locally because they no longer exist on GitHub.
- Local historical residue is reduced to the current active writer branch only:
  - `codex/phase43-branch-exceptions`
- `#302`, `#303`, and `#307` are already closed.
- `#308` is the Phase 43 closeout vehicle for applying the final exception deletes and syncing the docs to the resolved branch inventory.

## Remote Branch Classification

### `delete-remote-and-local`

- `origin/codex/phase23-session-summary`

Evidence:

- The live remote branch still points to `7e00df6`, which is the PR head for merged PR `#163`.
- The local diverged twin `cef67d1` has the same patch-id as both the remote head `7e00df6` and merged main commit `56335a5`.
- No open issue, PR, or runbook step still depends on this branch.

### `keep`

- none

### `revive`

- none

### `TODO[verify]`

- none

## Local Branch Classification

### `keep`

- `codex/phase43-branch-exceptions`

Evidence:

- This is the current dedicated writer branch for `#308`.
- It is the only local execution branch still needed for active Phase 43 work.

### `delete-remote-and-local`

- `codex/phase23-session-summary`

Evidence:

- Its unique local head `cef67d1` is patch-equivalent to the merged main change and the remaining remote head.
- The same-name remote branch is a merged historical residue with no open dependency.

### `delete-local-now`

- `codex/phase1-queue-sync`
- `codex/phase22-apply-copy`
- `codex/phase43-queue-bootstrap`

Evidence:

- `codex/phase1-queue-sync` has no upstream, no associated PR, and only carries an outdated queue-doc snapshot that has been superseded many times on `main`.
- `codex/phase22-apply-copy` has no upstream, and its unique local commit `4d4c150` is patch-equivalent to main commit `9bc3b73`; main history already records the feature through merge PR `#156`.
- `codex/phase43-queue-bootstrap` merged through PR `#309`; its upstream branch has already been removed and the local branch is now only merged residue.

### `revive`

- none

### `TODO[verify]`

- none

## Reviewed Apply Set For #308

- Delete the final live historical remote exception:
  - `origin/codex/phase23-session-summary`
- Delete the corresponding local same-name residue:
  - `codex/phase23-session-summary`
- Delete local-only or upstream-gone historical residue:
  - `codex/phase1-queue-sync`
  - `codex/phase22-apply-copy`
  - `codex/phase43-queue-bootstrap`
- Prune stale local remote-tracking refs:
  - `origin/codex/phase42-branch-cleanup-apply`
  - `origin/codex/phase43-queue-bootstrap`
- Preserve the current active writer branch:
  - `codex/phase43-branch-exceptions`

## Commands Used

```powershell
git status -sb
git branch -vv
git for-each-ref --format="%(refname:short)|%(upstream:short)|%(upstream:trackshort)|%(objectname:short)|%(subject)" refs/heads
git branch -r --list origin/codex/*
git log --oneline main..codex/phase1-queue-sync
git log --oneline main..codex/phase22-apply-copy
git log --oneline main..codex/phase23-session-summary
git log --oneline codex/phase23-session-summary..main
git log --oneline origin/codex/phase23-session-summary..codex/phase23-session-summary
git log --oneline codex/phase23-session-summary..origin/codex/phase23-session-summary
git show --stat --oneline --summary e33989a
git show --stat --oneline --summary 4d4c150
git show --stat --oneline --summary cef67d1
git show --stat --oneline --summary 7e00df6
git show 4d4c150 --format= --patch | git patch-id --stable
git show 9bc3b73 --format= --patch | git patch-id --stable
git show cef67d1 --format= --patch | git patch-id --stable
git show 7e00df6 --format= --patch | git patch-id --stable
git show 56335a5 --format= --patch | git patch-id --stable
git log --oneline --grep="apply-and-copy" main
git log --oneline --grep="session summary strip" main
gh api "repos/YSCJRH/mirror-sim/pulls?state=open&per_page=100"
gh api "repos/YSCJRH/mirror-sim/issues?state=open&per_page=100"
gh api repos/YSCJRH/mirror-sim/branches/codex/phase23-session-summary
gh api repos/YSCJRH/mirror-sim/branches/codex/phase42-branch-cleanup-apply
gh api repos/YSCJRH/mirror-sim/branches/codex/phase43-queue-bootstrap
gh api -H "Accept: application/vnd.github+json" repos/YSCJRH/mirror-sim/commits/e33989a/pulls
gh api -H "Accept: application/vnd.github+json" repos/YSCJRH/mirror-sim/commits/4d4c150/pulls
gh api -H "Accept: application/vnd.github+json" repos/YSCJRH/mirror-sim/commits/7e00df6/pulls
gh api -H "Accept: application/vnd.github+json" repos/YSCJRH/mirror-sim/commits/cef67d1/pulls
```

## TODO[verify]

- none
