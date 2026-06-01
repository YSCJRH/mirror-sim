# Phase 65 Selected-World Deterministic Runtime Generation Evidence Gate

Issue: `#495` `Phase 65 exit gate`

Current state: Phase 65 is active; Phase 64 is closed.

This note records the active Phase 65 gate for selected-world deterministic runtime generation evidence. This gate lives in `docs/plans/phase-65-selected-world-deterministic-runtime-generation-gate-2026-06-01.md`. Phase 64 selected-world perturb follow-up readiness is the historical baseline. Phase 65 may only verify that the selected fictional worlds can each create one world-scoped runtime session and one generated branch through existing v1 CLI/session contracts using temporary local artifacts.

## Post-Phase-64 Baseline

- Phase 64 is closed after PR `#494`.
- `#489` `Phase 64 exit gate` closed by PR `#494`.
- `#490` `Phase 64: sync repo truth after Phase 63 closeout and define selected-world perturb follow-up gate` closed by PR `#492`.
- `#491` `Phase 64: add selected-world perturb follow-up readiness smoke` closed by PR `#493`.
- The milestone `Phase 64 - Selected-World Perturb Follow-Up Readiness Gate` is closed.
- `audit-github-queue` reports `paused` with no active milestone after Phase 64 closeout.
- The Phase 64 perturb follow-up readiness evidence lives in `docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md`.
- The Phase 64 perturb follow-up readiness smoke is `scripts/smoke_phase64_selected_world_perturb_followup_readiness.py`.

## Phase 65 Active Queue

Phase 65 title:

```text
Phase 65 - Selected-World Deterministic Runtime Generation Evidence Gate
```

- `#495` `Phase 65 exit gate`
  - Status: blocked until the sync and deterministic runtime generation smoke work items land, validation passes, read-only subagent review reports no blockers, and the milestone can return to a released stop-state or reviewed successor queue.
- `#496` `Phase 65: sync repo truth after Phase 64 closeout and define selected-world runtime-generation evidence gate`
  - Status: `#496` is handled by this Phase 65 sync PR.
  - Scope: sync tracked docs, bootstrap metadata, and tests to the active Phase 65 gate.
- `#497` `Phase 65: add selected-world deterministic runtime generation smoke`
  - Status: ready; this #497 smoke PR records the selected-world deterministic runtime generation evidence.
  - Scope: add tracked selected-world deterministic runtime generation smoke for existing v1 CLI/session contracts.
  - Evidence target: `docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md`.
  - Reproduction script: `scripts/smoke_phase65_selected_world_runtime_generation.py`.
- `audit-github-queue` reports `ready` for the active Phase 65 milestone.

## Selected-World Deterministic Runtime Generation Scope

Selected worlds:

- `fog-harbor-east-gate`
- `museum-night`
- `library-rain`

Phase 65 covers selected-world deterministic runtime generation evidence only. It may verify, with temporary local artifacts, that existing `start-session` and `generate-branch` entrypoints create one world-scoped runtime session and one generated branch per selected world through existing v1 CLI/session contracts. The gate should preserve route-derived `worldId` guards, keep generation deterministic/local, and record blockers instead of changing contracts if one selected world cannot generate under current data and code.

## Candidate Input Policy

untracked private-alpha, private-beta, kernel, and design-system planning notes remain candidate inputs only. They must not be promoted as durable truth unless a reviewed PR promotes a specific source-verified signal.

The stale launch-hub and broad private-beta wording in untracked candidate notes remains raw input, not project truth. `status:needs-adr` and unresolved `risk:safety` remain merge blockers until the needed ADR or safety review is resolved.

## Non-Goals

- Do not add routes or APIs.
- Do not change scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.
- Do not add async/task_id behavior or worker queues.
- Do not implement launch hub behavior.
- Do not call provider or model paths.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion.
- Do not change route ownership.
- Do not change runtime mutation behavior.
- Do not promote broad private-beta readiness.
- Do not claim future-world readiness.
- Do not promote untracked planning notes as durable truth.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase65_selected_world_runtime_generation_gate.py -q
python scripts/check_no_secrets.py
python scripts/bootstrap_github.py --repo YSCJRH/mirror-sim
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
.\make.ps1 smoke
.\make.ps1 test
```
