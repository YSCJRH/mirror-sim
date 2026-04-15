# Core Contracts

This file freezes the current post-Phase-0 contracts that Phase 1 hardening now depends on.

## Stable Object IDs

- `document_id`
- `chunk_id`
- `entity_id`
- `relation_id`
- `event_id`
- `persona_id`
- `scenario_id`
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
- Each injection has its own `injection_id` and `kind`.
- Phase 0 and this Phase 1 hardening pass still support only:
  - `delay_document`
  - `block_contact`
  - `resource_failure`

## Run Contract

- `TurnAction` is the line format stored in `run_trace.jsonl`.
- `RunTrace` is the run-level summary model stored in `summary.json`.
- Simulation remains seeded, bounded, deterministic, and writes snapshots per turn.
- `branch_count` remains reserved for future runner generalization and does not gain new execution semantics in this sprint.

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
│   ├── baseline/
│   └── reporter_detained/
├── report/
└── eval/
```

## Platform Assumption

The canonical command names remain `make setup|smoke|test|eval-demo|dev-api|dev-web`.  
Because GNU Make is absent in the current Windows environment, the repo also ships `make.ps1` and `make.cmd`.
