# ADR-0004: Ratify Multi-Branch Compare Contracts

## Status

- Accepted

## Context

Phase 44 proved two things at the same time:

- the Fog Harbor demo is already useful as a comparison-first workbench
- the current comparison path is still assembled from separate scenario files plus frontend reconstruction over raw run artifacts

That Phase 44 shape is good enough for a canonical scenario matrix, but it is not yet a formal multi-branch contract:

- `Scenario.branch_count` already exists in the domain model, but it is still treated as a reserved field
- the frontend currently discovers branch relationships from artifact layout instead of a durable compare artifact
- evals can compare run summaries today, but they do so by rebuilding the comparison from run-level fields instead of consuming a first-class compare payload

Phase 45 needs one ratified contract before implementation starts, so that the runner issue and the focused diff-surface issue do not each invent their own branch identity, compare shape, or backward-compatibility rule.

## Decision

- Promote `branch_count` from a reserved field to an execution contract.
  - `branch_count: 1` preserves the current single-branch behavior.
  - `branch_count > 1` requests deterministic multi-branch execution for one scenario package under the same `scenario_id`, world, seed, and turn budget.
- Keep the scenario DSL stable in this ADR.
  - No new scenario YAML fields are introduced here.
  - Branch labels or branch roles are emitted by generated artifacts, not authored as new DSL keys in this phase.
- Introduce two new stable IDs:
  - `branch_id`: identifies one branch inside one scenario compare set
  - `compare_id`: identifies one durable compare artifact for one scenario compare set
- Keep `run_id` as the execution-level identifier for one concrete branch run.
  - `run_id` remains the ID that ties together `summary.json`, `run_trace.jsonl`, and snapshot files for one executed branch.
  - `run_id` does not replace `branch_id`, and `branch_id` does not replace `run_id`.
- Ratify one canonical compare artifact for multi-branch scenarios:
  - required path: `artifacts/<scope>/compare/<scenario_id>/compare.json`
  - for the current demo scope, that means `artifacts/demo/compare/<scenario_id>/compare.json`
- Require `compare.json` to carry the canonical branch relationship and routing data.
  - Top-level required fields:
    - `compare_id`
    - `scenario_id`
    - `seed`
    - `branch_count`
    - `reference_branch_id`
    - `branches`
    - `reference_deltas`
  - Each `branches[]` item must contain:
    - `branch_id`
    - `label`
    - `run_id`
    - `is_reference`
    - `summary_path`
    - `trace_path`
    - `snapshot_dir`
  - Each `reference_deltas[]` item must contain:
    - `branch_id`
    - `divergent_turn_count`
    - `divergent_turns`
    - `outcome_deltas`
  - Each `divergent_turns[]` item must at minimum expose:
    - `turn_index`
    - `reference_turn_id`
    - `candidate_turn_id`
  - Each `outcome_deltas` entry must expose:
    - `reference`
    - `candidate`
    - `delta`
- Make the backend the owner of compare truth.
  - The backend runner is responsible for selecting the reference branch, assigning `branch_id`, emitting branch labels, and writing `compare.json`.
  - The backend runner may evolve the internal run-directory layout, but `compare.json` must publish the canonical file references that downstream consumers should follow.
- Make the frontend a consumer of compare truth rather than a discoverer of compare truth.
  - When `compare.json` exists, the workbench should use it as the source of truth for scenario compare overview, branch routing, and focused diff entrypoints.
  - The frontend may still read run summaries, traces, and snapshots for drill-down, but it should not infer branch membership or compare pairing only from directory scans once a compare artifact exists.
- Freeze the Phase 45 consumption boundary for reports, claims, and evals.
  - Claim labels stay unchanged.
  - `TurnAction` stays unchanged.
  - Reports and claims may remain pair-scoped in the initial Phase 45 implementation, but the chosen reference/focal branch pair must come from the compare artifact instead of ad hoc frontend selection.
  - Evals should consume `compare.json` as the canonical branch-comparison source whenever a scenario uses `branch_count > 1`.
- Preserve backward compatibility explicitly.
  - Existing single-branch scenarios with `branch_count: 1` remain valid.
  - The Phase 44 canonical matrix of separate scenario files remains a supported dataset pattern and does not need migration in this ADR issue.
  - Existing pairwise report artifacts remain valid while Phase 45 implementation catches the runner and workbench up to the new compare contract.

## Consequences

- Phase 45 runner work now has a fixed target for branch identity and compare artifact generation.
- Phase 45 workbench work now has a fixed target for top-level compare consumption and branch routing.
- Compare truth moves out of frontend reconstruction and into durable backend artifacts, which should make reruns, evals, and future report expansion easier to stabilize.
- The project accepts one new long-lived artifact family under `artifacts/<scope>/compare/`.
- Follow-up work is still required:
  - `#325` must implement the runner and compare artifact contract
  - `#326` must switch focused diff surfaces to consume compare artifacts
  - Any future expansion of report artifact shape beyond pair-scoped output should be treated as a follow-up contract change if it changes durable file structure or claim/report interfaces
