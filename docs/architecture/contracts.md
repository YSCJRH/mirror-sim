# Core Contracts

This file freezes the current cross-phase contracts that later runner, eval, and workbench changes now depend on.

## Stable Object IDs

- `document_id`
- `chunk_id`
- `entity_id`
- `relation_id`
- `event_id`
- `persona_id`
- `scenario_id`
- `branch_id`
- `compare_id`
- `run_id`
- `turn_id`
- `claim_id`

All IDs must be serializable, stable across files, and traceable in `artifacts/`.

## Evidence And Claims

- `Entity`, `Relation`, `Event`, `Persona`, `TurnAction`, and `Claim` always carry non-empty `evidence_ids`, or an explicit non-evidence label.
- `Persona.field_provenance` is a field-level map of `field_name -> evidence_ids`.
- `Persona.field_provenance` must be non-empty for every non-empty core field:
  - `public_role`
  - `goals`
  - `constraints`
  - `known_facts`
  - `private_info`
  - `relationships`
- Claim labels are restricted to:
  - `evidence_backed`
  - `inferred`
  - `speculative`

## World Model Contract

- Demo world modeling is driven by `data/demo/config/world_model.yaml`.
- `graph.json` is the durable world-model artifact and now contains:
  - `entities`
  - `relations`
  - `events`
  - `stats`
- `personas.json` keeps the same top-level shape, but each persona now includes:
  - aggregate `evidence_ids`
  - field-level `field_provenance`

## Query Contract

- The Phase 1 query surface is CLI-first.
- The canonical query entrypoint is:
  - `python -m backend.app.cli inspect-world --kind <entity|persona|event> --id <stable-id> --graph <graph.json> --personas <personas.json>`
- `inspect-world` returns stable JSON with:
  - `world_id`
  - `kind`
  - `object`

## Scenario Contract

- `scenario_id` names the full scenario package.
- `branch_count` is part of the scenario execution contract.
  - `branch_count: 1` preserves the current single-branch behavior.
  - `branch_count > 1` requests deterministic multi-branch execution for one scenario package.
  - Phase 45 does not add new scenario YAML fields beyond giving `branch_count` executable semantics.
- Each injection has its own `injection_id` and `kind`.
- Current supported injection kinds remain:
  - `delay_document`
  - `block_contact`
  - `resource_failure`

## Run Contract

- `TurnAction` is the line format stored in `run_trace.jsonl`.
- `RunTrace` is the branch-run summary model stored in `summary.json`.
- Simulation remains seeded, bounded, deterministic, and writes snapshots per turn.
- `run_id` remains the execution artifact ID for one concrete branch run.
- `branch_id` is the stable compare-level ID for one branch inside a multi-branch scenario.
- `TurnAction` shape does not change as part of the Phase 45 compare-contract ratification.

## Compare Contract

- When `branch_count > 1`, the backend must emit a durable compare artifact at:
  - `artifacts/<scope>/compare/<scenario_id>/compare.json`
- `compare.json` is the canonical branch-relationship artifact for one scenario compare set.
- Required top-level fields:
  - `compare_id`
  - `scenario_id`
  - `seed`
  - `branch_count`
  - `reference_branch_id`
  - `branches`
  - `reference_deltas`
- Each `branches[]` item must include:
  - `branch_id`
  - `label`
  - `run_id`
  - `is_reference`
  - `summary_path`
  - `trace_path`
  - `snapshot_dir`
- Each `reference_deltas[]` item must include:
  - `branch_id`
  - `divergent_turn_count`
  - `divergent_turns`
  - `outcome_deltas`
- Each `divergent_turns[]` item must at minimum include:
  - `turn_index`
  - `reference_turn_id`
  - `candidate_turn_id`
- Each `outcome_deltas` entry must expose:
  - `reference`
  - `candidate`
  - `delta`
- Backend ownership:
  - the backend chooses `reference_branch_id`
  - the backend assigns `branch_id`
  - the backend emits the canonical file references for branch runs
- Frontend ownership:
  - when `compare.json` exists, the frontend should use it as the top-level source of truth for compare overview and branch routing
  - the frontend may still read run summaries, traces, and snapshots for drill-down
- Report and eval ownership:
  - reports and claims may remain pair-scoped in the initial Phase 45 implementation, but the chosen branch pair must come from compare truth
  - evals should consume `compare.json` whenever a scenario uses `branch_count > 1`

## Artifact Contract

```text
artifacts/demo/
├── ingest/
├── graph/
│   └── graph.json
├── personas/
│   └── personas.json
├── scenario/
├── run/
│   └── <scenario-run-artifacts>/
├── compare/
│   └── <scenario_id>/
│       └── compare.json
├── report/
└── eval/
```

- Existing single-branch and Phase 44 matrix artifacts remain valid while Phase 45 implementation catches up to the new compare contract.

## Platform Assumption

The canonical command names remain `make setup|smoke|test|eval-demo|dev-api|dev-web`.  
Because GNU Make is absent in the current Windows environment, the repo also ships `make.ps1` and `make.cmd`.
