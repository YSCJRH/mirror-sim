# Phase 48 Kernel Perturbation Gap Brief

Date: 2026-05-18

Issue: `#379` `Phase 48: kernel perturbation gap brief`

## Purpose

Convert interactive kernel and perturbation follow-up gaps into Phase 49 candidate work with
required contracts, evals, and safety gates. This issue is planning and triage only. It does
not implement kernel expansion, change the public demo, or widen the plugin MCP contract.

## Direct Evidence

- `gh issue view 379 --repo YSCJRH/mirror-sim` reports issue `#379` open, ready, in
  milestone `Phase 48 - Successor Intake and Boundary Contract Triage`.
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reports `ready`
  with Phase 48 as the active milestone and `#375` as the protected exit gate.
- `docs/decisions/ADR-0006-interactive-simulator-runtime-v1.md` is accepted and freezes the
  v1 session runtime shape:
  - CLI-first entrypoints are `start-session`, `inspect-session`, `generate-branch`, and
    `rollback-session`.
  - `session_id` and `node_id` are stable IDs.
  - rollback changes only `active_node_id`; it does not delete nodes or rewrite artifacts.
  - task queues, `task_id`, worker semantics, and heartbeats are explicitly deferred.
- `docs/architecture/contracts.md` defines the current protected runtime boundaries:
  - `decision_schema.yaml` is the source of truth for perturbation validation.
  - every perturbation payload must resolve through the world-local decision schema before
    execution.
  - the interactive layer must not weaken compare truth, scenario validation, run
    determinism, claim labels, or `evidence_ids`.
  - V1 does not introduce a separate `task_id` contract.
- `docs/decisions/ADR-0007-rule-bounded-llm-kernel.md` is accepted and freezes the rule-
  bounded model boundary:
  - the model may choose only among legal actions produced by world rules.
  - invalid proposals, unavailable models, and exhausted retries must fall back
    deterministically.
  - evals need to cover invalid proposal rejection, fallback activation, replay correctness,
    and multi-world decision-schema compliance.
- `backend/app/perturbations/service.py` implements a narrow world-aware resolver that
  validates perturbation kind, target source, actor source, timing, and typed parameters.
- `backend/app/decision_kernel/service.py` implements a rule-bounded decision kernel that
  records `decision_trace.jsonl`, replays cached decisions by input hash, optionally asks a
  configured model to choose among legal actions, and falls back deterministically.
- `backend/app/sessions/service.py` materializes generated runtime nodes with run, compare,
  report, claims, resolution, and decision trace references under a session namespace.
- `backend/tests/test_decision_kernel.py` covers world-local perturbation resolution for Fog
  Harbor and museum-night plus cached decision replay.
- `backend/tests/test_cli.py` covers session start, branch generation, rollback, generated
  node claims, resolution, and decision trace paths.
- `docs/plans/interactive-kernel-baseline-2026-04-22.md` and
  `docs/plans/interactive-perturbation-simulator-2026-04/README.md` are candidate inputs.
  They describe the desired interactive product direction, but they are not durable source of
  truth until selected facts are promoted through review.

## Current Contract Boundaries

- Phase 48 remains intake and triage. Do not implement kernel expansion in this issue.
- Do not add free-form natural-language perturbation as an execution contract.
- Do not change scenario DSL, run trace, artifact layout, plugin MCP contract, or public API
  in this issue.
- Do not present Mirror as a real-world prediction machine or expand it into real-person
  personas, political persuasion, law-enforcement scoring, hiring, credit, medical, judicial,
  or other high-risk decision workflows.
- Every report claim must keep both `label` and `evidence_ids`.
- `compare.json` remains the durable contract for pre-authored scenario comparison sets.
  Interactive runtime compare artifacts stay session-scoped and must not replace the public
  demo compare contract without a later contract review.
- `rollback-session` remains pointer movement through `active_node_id`; destructive rollback
  or artifact rewriting is out of scope.
- Any long-lived change to perturbation payload shape, decision trace shape, session/node
  manifest fields, compare emission rules, or task orchestration requires
  `docs/architecture/contracts.md` updates and an ADR.

## Gap Summary

- Perturbation resolution is real but narrow. It supports world-local schemas and typed
  parameter validation, but it has not been promoted into a broader authoring contract for
  editable templates, admissibility UX, or multi-world parameter catalogs.
- The decision kernel is implemented for the current runtime, but the trace is still a young
  contract. Phase 49 should decide which `decision_trace.jsonl` fields are durable and which
  are implementation detail before adding richer provider behavior, and should add the
  ADR-0007 fallback/rejection tests that are not yet covered directly.
- Branch generation emits useful node artifacts, but parent-child compare emission policy is
  still not a clear product contract for every runtime path.
- Rollback is correctly narrow as pointer movement. Checkpoint-level rollback and latest
  activity semantics remain undecided and should not be inferred from current `created_at`
  sorting.
- The second world proves transfer viability, but outcomes, report framing, and evals still
  carry Fog Harbor-shaped assumptions in places.
- Web-triggered runtime generation is still synchronous. If generation becomes long-running,
  `task_id` and worker semantics need a dedicated ADR before implementation.

## Phase 49 Candidate Work Packages

1. Kernel trace and replay contract
   - Freeze durable `decision_trace.jsonl` fields, replay-cache behavior, provider fallback
     wording, and validation statuses.
   - Keep model calls inside the legal-action selection boundary.
   - Add regression coverage for deterministic replay, invalid model output fallback, and
     trace privacy.

2. Perturbation schema and resolver contract
   - Promote the world-local `decision_schema.yaml` role into a stable authoring contract.
   - Define template-plus-parameters as the first editable path before any free-form authoring.
   - Add schema tests for required parameters, optional parameters, actor/target source
     mismatches, and transfer-world parity.

3. Branch generation and compare emission policy
   - Decide whether every generated node must emit parent-vs-child `compare.json` or whether
     compare emission can remain conditional.
   - Define which compare fields are required for runtime nodes versus pre-authored scenario
     matrices.
   - Preserve the existing public `compare.json` contract while extending session-scoped
     artifacts.

4. Rollback, checkpoint, and latest-activity semantics
   - Keep v1 rollback as `active_node_id` pointer movement.
   - Decide whether checkpoint rollback exists in Phase 49 or remains deferred.
   - Decide whether world/product surfaces sort by latest session creation or latest runtime
     activity, and define the field that carries that behavior.

5. Fog Harbor de-specialization and transfer evals
   - Identify remaining Fog Harbor-shaped outcome, report, and eval assumptions.
   - Extend transfer checks with museum-night before adding another world.
   - Keep every new world fictional or explicitly authorized.

6. Runtime orchestration decision
   - Keep synchronous CLI/API mirroring unless measured generation time requires an async path.
   - If async generation is needed, ratify `task_id`, status states, worker ownership, retry
     policy, and cleanup behavior in a dedicated ADR.

## Required Gates Before Implementation

- Contract gate:
  - update `docs/architecture/contracts.md` for any accepted change to perturbation payloads,
    `decision_schema.yaml`, session/node manifests, compare emission, `decision_trace.jsonl`,
    rollback/checkpoint behavior, or `task_id`.
  - add an ADR for any long-lived kernel, perturbation, or orchestration contract.
- Test gate:
  - `python -m pytest backend/tests/test_decision_kernel.py`
  - `python -m pytest backend/tests/test_cli.py -k "start_session or generate_branch or rollback_session"`
  - add focused tests before changing resolver, trace, branch, rollback, or compare behavior.
  - cover ADR-0007 invalid proposal rejection, fallback activation, replay correctness, and
    multi-world decision-schema compliance before claiming the kernel contract is stronger.
- Eval gate:
  - `./make.ps1 eval-demo`
  - `./make.ps1 eval-transfer`
  - add transfer assertions before claiming a kernel change generalizes beyond Fog Harbor.
- Boundary gate:
  - `./make.ps1 public-demo-check`
  - `./make.ps1 plugin-release-check`
  - verify public demo and Mirror Codex plugin behavior remain read-only where required.
- Secret and hygiene gate:
  - `python scripts/check_no_secrets.py`
  - `git diff --check`

## Non-Goals

- Do not implement kernel expansion.
- Do not add free-form natural-language perturbation as an execution contract.
- Do not change scenario DSL, run trace, artifact layout, plugin MCP contract, or public API.
- Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota
  behavior to the public path or plugin path.
- Do not create real-world prediction, real-person persona, political persuasion,
  law-enforcement scoring, hiring, credit, medical, judicial, or high-risk decision workflows.
- Do not promote local April planning notes wholesale; promote only selected, reviewed facts.

## Open Questions

- TODO[verify]: Which `decision_trace.jsonl` fields should be stable contract versus
  implementation detail before richer provider behavior is added?
- TODO[verify]: Should Phase 49 require parent-vs-child compare output for every generated
  runtime node?
- TODO[verify]: Should checkpoint rollback exist in the next phase, or should runtime remain
  branch/node-only until another ADR?
- TODO[verify]: Should latest-session versus latest-activity semantics be resolved in the
  kernel phase, or split into a narrower product/runtime metadata issue first?
- TODO[verify]: Which Fog Harbor-shaped report and eval assumptions still block a stronger
  museum-night transfer proof?
- TODO[verify]: What measured generation duration would justify introducing `task_id`
  instead of keeping the CLI-first synchronous contract?

## Recommended Disposition

- Treat `#379` as satisfied when this brief lands through review with the required validation.
- Open Phase 49 candidate issues from the six work packages above only after the Phase 48 exit
  gate accepts the intake evidence.
- Keep Phase 49 protected-core by default unless a specific slice is classified safe after
  contracts and tests are ratified.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase48_kernel_perturbation_gap_brief.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```
