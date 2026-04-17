# Codex Branch Classification Baseline

This note records the Phase 28 protected-core classification baseline for historical `codex/*` branches.

## Purpose

- Use live GitHub and remote state as the source of truth for branch hygiene decisions.
- Do not treat docs snapshots or `git branch --merged` results as sufficient deletion evidence on their own.
- Separate classification from deletion so `#200` can apply only the reviewed `delete` set.

## Decision Rules

- `delete`
  - Branch is tied only to merged or closed work, and no open PR, open issue, active milestone step, or unresolved forensic comparison still depends on it.
- `keep`
  - Branch is still tied to open PRs, open issues, current active execution work, or an unresolved forensic comparison.
- `revive`
  - Branch should not remain as a standing historical branch, but future work may need to continue from it. A new issue must name the branch and explain why `main` is insufficient.
- `TODO[verify]`
  - Evidence is incomplete or contradictory, especially when squash merge history makes ancestry checks unreliable.

## Evidence Notes

- Live open PR heads on 2026-04-17:
  - `#197` -> `codex/phase28-queue-sync`
  - `#198` -> `codex/phase28-send-checklist`
- Open issue title/body scan found no explicit `codex/*` branch references in current open issues.
- Remote `origin/codex/*` inventory after `git fetch origin --prune` contains 8 branches.
- The repo uses squash merges heavily, so merged PR `headRefName` is more reliable than `git branch --merged origin/main` for historical cleanup decisions.

## Remote Branch Classification

| Branch | Live PR State | Live Issue / Milestone Ref | Merged PR Head Match | Docs / Runbook Ref | Classification | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `origin/codex/phase20-decision-snippets` | No open PR | No open issue ref | PR `#143` merged 2026-04-16 | No explicit live branch ref | `delete` | Remote branch is merged into `origin/main`; work already closed through merged PR history. |
| `origin/codex/phase22-apply-copy` | No open PR | No open issue ref | PR `#156` merged 2026-04-16 | No explicit live branch ref | `delete` | Remote branch is merged into `origin/main`; remote branch is stale even though the local twin still needs separate review. |
| `origin/codex/phase23-session-summary` | No open PR | No open issue ref | PR `#163` merged 2026-04-17 | No explicit live branch ref | `TODO[verify]` | Merged PR exists, but the remote branch is not an ancestor of `origin/main` and still has a distinct head commit (`7e00df6`). |
| `origin/codex/phase28-queue-sync` | Open draft PR `#197` | Active Phase 28 work | Current active work | Active queue branch | `keep` | Must remain while PR `#197` is open. |
| `origin/codex/phase28-send-checklist` | Open draft PR `#198` | Active Phase 28 work | Current active work | Active queue branch | `keep` | Must remain while PR `#198` is open. |
| `origin/codex/phase6-closeout-pause-baseline` | No open PR | No open issue ref | PR `#45` merged 2026-04-16 | No explicit live branch ref | `delete` | Remote branch is merged into `origin/main` and tied only to completed Phase 6 closeout work. |
| `origin/codex/phase7-issue-comment-packet` | No open PR | No open issue ref | PR `#51` merged 2026-04-16 | No explicit live branch ref | `delete` | Remote branch is merged into `origin/main` and tied only to completed Phase 7 work. |
| `origin/codex/phase7-queue-sync` | No open PR | No open issue ref | PR `#50` merged 2026-04-16 | No explicit live branch ref | `delete` | Remote branch is merged into `origin/main` and tied only to completed Phase 7 queue-sync work. |

## Local Exception Classification

These branches are the local exceptions that should not be swept up by a blind `gone` cleanup.

| Branch | Upstream Shape | Live PR / PR History | Classification | Evidence |
| --- | --- | --- | --- | --- |
| `codex/phase28-queue-sync` | Tracks open remote branch | Open draft PR `#197` | `keep` | Current active Phase 28 protected-core work. |
| `codex/phase28-send-checklist` | Tracks open remote branch | Open draft PR `#198` | `keep` | Current active Phase 28 frontend work. |
| `codex/phase1-queue-sync` | Upstream gone | PR `#12` closed, not merged | `TODO[verify]` | Local branch still has a unique historical commit (`e33989a`) tied to a closed-but-unmerged branch of work. |
| `codex/phase22-apply-copy` | Local and remote twins diverged | PR `#156` merged | `TODO[verify]` | Local branch still has a unique local head (`4d4c150`) even though the remote branch is a delete candidate. |
| `codex/phase23-session-summary` | Local and remote twins diverged | PR `#163` merged | `TODO[verify]` | Local branch has a distinct head (`cef67d1`) and the remote twin is also not an ancestor of `origin/main`. |
| `codex/phase20-decision-templates` | Tracks `origin/main` instead of a same-name remote work branch | No active PR | `delete` | No unique commits relative to `origin/main`; this is a naming residue rather than a live work branch. |

## Counts And Drift

- Local `codex/*` branches observed: `69`
- Local `codex/*` branches with upstream `: gone`: `60`
- Local `codex/*` branches not ancestors of `origin/main`: `25`
- Of those 25 local non-ancestor branches:
  - `22` already correspond to merged PRs
  - `2` are current open PR branches
  - `1` is a closed-but-unmerged historical branch (`codex/phase1-queue-sync`)
- Documentation drift still exists:
  - `docs/plans/phase-execution-queue.md` currently says no remote `origin/codex/*` branches remain after Phase 6 cleanup, but live remote state still contains 8 such branches.

## Reviewed Apply Set For #200

- Remote `delete` set
  - `origin/codex/phase20-decision-snippets`
  - `origin/codex/phase22-apply-copy`
  - `origin/codex/phase6-closeout-pause-baseline`
  - `origin/codex/phase7-issue-comment-packet`
  - `origin/codex/phase7-queue-sync`
- Remote `keep` set
  - `origin/codex/phase28-queue-sync`
  - `origin/codex/phase28-send-checklist`
- Remote `TODO[verify]` set
  - `origin/codex/phase23-session-summary`
- Local `TODO[verify]` set
  - `codex/phase1-queue-sync`
  - `codex/phase22-apply-copy`
  - `codex/phase23-session-summary`
- Local `delete` candidate after remote cleanup
  - `codex/phase20-decision-templates`

## Commands Used

```powershell
git fetch origin --prune
git branch -vv
git branch -r --list origin/codex/*
git branch -r --merged origin/main --list origin/codex/*
git branch -r --no-merged origin/main --list origin/codex/*
gh pr list --repo YSCJRH/mirror-sim --state open --limit 50 --json number,title,headRefName,isDraft,url
gh pr list --repo YSCJRH/mirror-sim --state all --head codex/phase20-decision-snippets --json number,title,state,mergedAt,closedAt,url
gh pr list --repo YSCJRH/mirror-sim --state all --head codex/phase22-apply-copy --json number,title,state,mergedAt,closedAt,url
gh pr list --repo YSCJRH/mirror-sim --state all --head codex/phase23-session-summary --json number,title,state,mergedAt,closedAt,url
gh pr list --repo YSCJRH/mirror-sim --state all --head codex/phase6-closeout-pause-baseline --json number,title,state,mergedAt,closedAt,url
gh pr list --repo YSCJRH/mirror-sim --state all --head codex/phase7-queue-sync --json number,title,state,mergedAt,closedAt,url
gh pr list --repo YSCJRH/mirror-sim --state all --head codex/phase7-issue-comment-packet --json number,title,state,mergedAt,closedAt,url
git log --oneline origin/main..origin/codex/phase23-session-summary
git log --oneline origin/main..codex/phase23-session-summary
git log --oneline origin/main..codex/phase22-apply-copy
git log --oneline origin/main..codex/phase1-queue-sync
git log --oneline origin/main..codex/phase20-decision-templates
git rev-list --left-right --count codex/phase23-session-summary...origin/codex/phase23-session-summary
```
