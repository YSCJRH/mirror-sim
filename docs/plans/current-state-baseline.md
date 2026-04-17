# Current State Baseline

This note is the current Phase 26 active-queue baseline.

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
  - `gh api repos/YSCJRH/mirror-sim/milestones/6`
    - milestone `Phase 6 - Automation Activation and Queue Hygiene` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/40`
    - Phase 6 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/7`
    - milestone `Phase 7 - Operator Handoff and Review Delivery` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/46`
    - Phase 7 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/8`
    - milestone `Phase 8 - Closeout Delivery and Pickup Routing` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/53`
    - Phase 8 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/9`
    - milestone `Phase 9 - Review Delivery Polish and Completeness` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/60`
    - Phase 9 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/10`
    - milestone `Phase 10 - Guided Delivery and Quick Export` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/67`
    - Phase 10 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/11`
    - milestone `Phase 11 - Export Presets and Delivery Shortcuts` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/74`
    - Phase 11 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/12`
    - milestone `Phase 12 - Delivery Preset Refinement and Comparison Flow` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/81`
    - Phase 12 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/13`
    - milestone `Phase 13 - Guided Export Payload Review` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/88`
    - Phase 13 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/14`
    - milestone `Phase 14 - Export Delta and Copy Confidence` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/95`
    - Phase 14 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/15`
    - milestone `Phase 15 - Override Rationale and Delivery Confidence` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/102`
    - Phase 15 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/16`
    - milestone `Phase 16 - Export Bundle Composition and Handoff Packaging` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/109`
    - Phase 16 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/17`
    - milestone `Phase 17 - Final Bundle Delivery and Handoff Manifest` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/116`
    - Phase 17 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/18`
    - milestone `Phase 18 - Bundle Variants and Receiver Guidance` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/123`
    - Phase 18 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/19`
    - milestone `Phase 19 - Receiver Roles and Follow-Through Routing` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/130`
    - Phase 19 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/20`
    - milestone `Phase 20 - Role-Specific Bundle Layout and Decision Templates` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/137`
    - Phase 20 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/21`
    - milestone `Phase 21 - Role Presets and Response Packaging` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/144`
    - Phase 21 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/22`
    - milestone `Phase 22 - Preset Workflow and Packed Responses` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/151`
    - Phase 22 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/23`
    - milestone `Phase 23 - Preset Sessions and Response Kits` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/158`
    - Phase 23 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/24`
    - milestone `Phase 24 - Session Handoff and Route Comparison` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/165`
    - Phase 24 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/25`
    - milestone `Phase 25 - Handoff Delivery and Packet Variants` is `closed`
  - `gh api repos/YSCJRH/mirror-sim/issues/172`
    - Phase 25 exit issue is `closed`
  - `gh api repos/YSCJRH/mirror-sim/milestones/26`
    - milestone `Phase 26 - Packet Delivery Prep and Sender Notes` is `open`
  - `gh api "repos/YSCJRH/mirror-sim/issues?state=open&milestone=26"`
    - Phase 26 queue is initialized through issues `#179-#182`
  - `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
    - successor queue currently reports `ready` because Phase 26 has one blocked protected-core exit gate and multiple ready work items

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
- The workbench now also supports claim -> evidence drill-down, baseline/intervention trace review, reviewer scorecards, shareable review packet export, issue-comment handoff copy, operator decision briefs, exit-gate closeout packets, lane-aware pickup routing, export destination guidance, delivery-readiness warnings, destination-aware recommendations, packet coverage previews, delivery presets, preset comparison cards, carry-forward chips, quick-export shortcuts, payload previews, tradeoff-guidance cards, diff highlights, copy-preflight checklists, override-rationale cues, copy-sidecar summaries, composed handoff-bundle previews, destination-specific attachment-order guidance, recipient-facing cover sheets, one-step final bundle copies with package manifests, compact-versus-full bundle variants, receiver follow-through cues, receiver-role modes, routing-strip follow-through guidance, role-specific bundle emphasis, decision-template snippets, role preset cards, response-packaging shortcuts, apply-and-copy preset actions, grouped response-pack export, active preset session summary strips, route-filtered response kit choosers, route-kit comparison cards, preset session handoff packets, send-readiness cue strips, and compact-versus-full handoff packet variants without introducing backend API expansion.
- The current repository state is in an active Phase 26 successor queue, not a closed Phase 25 baseline.

## Next Entry Point

- Phase 26 is the active milestone and the current delivery-prep slice is tracked by issues `#179-#182`.
- New implementation work should attach to the existing Phase 26 queue until its exit gate is closed, instead of opening a parallel successor milestone.
- Protected-core changes still require explicit review even when safe-lane automation is available.
- `docs/plans/long-running-loop-runbook.md` is the operational handoff note for authenticated queue audit, worktree pickup, and post-merge checkpointing.
- The local queue heartbeat remains active as `mirror-queue-heartbeat` and should continue reporting the paused/ready state of the live queue.
