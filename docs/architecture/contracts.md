# Core Contracts

This file freezes the Phase 0 assumptions that other modules should build against.

## Stable Object IDs

- `document_id`
- `chunk_id`
- `entity_id`
- `relation_id`
- `persona_id`
- `scenario_id`
- `run_id`
- `turn_id`
- `claim_id`

All IDs must be serializable, stable across files, and traceable in `artifacts/`.

## Evidence And Claims

- `Entity`, `Relation`, `Persona`, `TurnAction`, and `Claim` always carry `evidence_ids`, or an explicit non-evidence label.
- Claim labels are restricted to:
  - `evidence_backed`
  - `inferred`
  - `speculative`

## Scenario Contract

- `scenario_id` names the full scenario package.
- Each injection has its own `injection_id` and `kind`.
- Phase 0 supports only:
  - `delay_document`
  - `block_contact`
  - `resource_failure`

## Run Contract

- `TurnAction` is the line format stored in `run_trace.jsonl`.
- `RunTrace` is the run-level summary model stored in `summary.json`.
- Simulation is seeded, bounded, deterministic, and writes snapshots per turn.

## Artifact Contract

```text
artifacts/demo/
├─ ingest/
├─ graph/
├─ personas/
├─ scenario/
├─ run/
│  ├─ baseline/
│  └─ reporter_detained/
├─ report/
└─ eval/
```

## Platform Assumption

The canonical command names remain `make setup|smoke|test|eval-demo|dev-api|dev-web`.  
Because GNU Make is absent in the current Windows environment, the repo also ships `make.ps1` and `make.cmd`.
