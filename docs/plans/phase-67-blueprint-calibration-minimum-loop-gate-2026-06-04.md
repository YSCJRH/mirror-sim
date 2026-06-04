# Phase 67 Blueprint Calibration and Minimum-Loop Value Gate

Issue: `#507` `Phase 67 exit gate`

Current state: Phase 67 is active; Phase 66 is closed.

This note records the successor boundary for `Phase 67 - Blueprint Calibration and Minimum-Loop Value Gate`. Phase 67 is active as `Phase 67 - Blueprint Calibration and Minimum-Loop Value Gate`; milestone `Phase 67 - Blueprint Calibration and Minimum-Loop Value Gate` is open; `#507` `Phase 67 exit gate`: open / blocked; `#508` `Phase 67: sync repo truth after Phase 66 closeout and define blueprint calibration gate`: open / ready; `#509` `Phase 67: audit current minimum-loop value gaps before next implementation`: open / ready. `audit-github-queue` reports `ready` for the active Phase 67 milestone. Gate path: `docs/plans/phase-67-blueprint-calibration-minimum-loop-gate-2026-06-04.md`.

## Post-Phase-66 Baseline

Phase 66 is closed as `Phase 66 - Selected-World Generated Runtime Surface Continuity Gate`. `#501` `Phase 66 exit gate` closed by PR `#506`; `#502` closed by PR `#504`; `#503` closed by PR `#505`. `audit-github-queue` reports `paused` with no active milestone after Phase 66 closeout.

Phase 66 completed the selected-world route/review/runtime surface continuity evidence chain. Further adjacent continuity/readiness/fidelity gates are stopped unless they resolve a named blocker from `mirror.md`'s minimum loop, Phase 2 simulation/report closure, Phase 3 eval/UI/demo value, or a documented protected-core contract gap.

## Phase 67 Active Queue

Phase 67 title:

```text
Phase 67 - Blueprint Calibration and Minimum-Loop Value Gate
```

- Phase 67 is active as `Phase 67 - Blueprint Calibration and Minimum-Loop Value Gate`.
- milestone `Phase 67 - Blueprint Calibration and Minimum-Loop Value Gate` is open.
- `#507` `Phase 67 exit gate`: open / blocked.
- `#508` `Phase 67: sync repo truth after Phase 66 closeout and define blueprint calibration gate`: open / ready.
- `#509` `Phase 67: audit current minimum-loop value gaps before next implementation`: open / ready.
- `audit-github-queue` reports `ready` for the active Phase 67 milestone.

## Blueprint Calibration Scope

Mirror is a constrained, evidence-backed, replayable what-if simulation sandbox for fictional or explicitly authorized worlds.

Phase 67 must recalibrate the queue against `mirror.md` before any more evidence surface is promoted. The active question is not whether another UI, handoff, route, or continuity proof can be added; it is which missing or weak mainline capability most improves scenario/intervention/branch-comparison/eval value.

For Phase 67, the automation loop remains an execution mechanism, not the project north star.

Phase 67 should produce a minimum-loop value gap audit and use it to choose the next implementation item.

Do not open another adjacent surface/readiness/fidelity/continuity gate as the primary Phase 67 scope without a source-backed tie to scenario/intervention/branch-comparison/eval value.

## Minimum-Loop Value Target

The minimum loop is:

```text
corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval
```

The queue shorthand is `corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval`.

The Phase 67 audit should map current repo truth to that loop, name the next value-bearing gap, and explain whether the gap belongs in Phase 2 simulation/report closure, Phase 3 eval/UI/demo value, or a separate protected-core contract item.

If the audit finds a contract gap, split a separate protected-core contract issue before changing schema, scenario DSL, claim labels, run trace shape, or artifact layout.

Every report claim must keep both `label` and `evidence_ids`. Uncertainty discovered during the audit must be written as `TODO[verify]: ...`.

## Candidate Input Policy

- `mirror.md` is the blueprint source for intent, non-goals, architecture, phase direction, and minimum-loop value.
- `README.md`, `docs/plans/current-state-baseline.md`, `docs/plans/phase-execution-queue.md`, and `docs/plans/automation-roadmap.md` are tracked repo truth.
- `docs/architecture/contracts.md` and ADRs are the contract boundary when a long-lived core contract change is needed.
- Untracked planning notes remain candidate inputs only until a tracked issue or PR promotes source-backed claims.
- Selected bounded fictional or explicitly authorized worlds remain eligible evidence sources when they are tied to the minimum loop; selected bounded fictional or explicitly authorized worlds remain the safety boundary.

## Non-Goals

- Do not present Mirror as a real-world prediction machine or package simulation output as certain real-world conclusions.
- Do not build real-person personas, digital doubles, political persuasion, hidden surveillance, or high-risk decision systems.
- Do not add routes or APIs as part of this successor-boundary PR.
- Do not add async/task_id behavior, worker queues, launch hub behavior, provider/model calls, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, public/plugin path expansion, or runtime mutation expansion.
- Do not change schema, scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, plugin MCP contract, or artifact layout in this gate.
- Do not promote broad private-beta readiness, future-world readiness, or untracked planning notes as durable truth.
- `status:needs-adr` and unresolved `risk:safety` findings remain merge blockers.

## Validation Commands

- `python -m pytest backend/tests/test_phase67_blueprint_calibration_gate.py -q`
- `python -m pytest backend/tests/test_phase66_selected_world_generated_runtime_surface_continuity_gate.py backend/tests/test_phase67_blueprint_calibration_gate.py -q`
- `python scripts/check_no_secrets.py`
- `python scripts/bootstrap_github.py --repo YSCJRH/mirror-sim`
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
- `git diff --check`
- `./make.ps1 test`
