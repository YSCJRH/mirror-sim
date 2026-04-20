# Fog Harbor Walkthrough

This note explains the canonical Fog Harbor artifact flow for developers who are new to Mirror.

## Artifact Flow

Mirror's canonical demo follows the same bounded pipeline on every run:

1. `corpus`
2. `chunks`
3. `graph`
4. `personas`
5. `scenarios`
6. `runs`
7. `report / claims`
8. `eval`

The canonical inputs live in `data/demo/`. The generated outputs live in `artifacts/demo/`.

## Commands

Backend setup:

```bash
make setup
```

```powershell
./make.ps1 setup
```

Canonical validation:

```bash
make smoke
make test
make eval-demo
```

```powershell
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
```

Workbench:

```bash
make dev-api
make dev-web
```

```powershell
./make.ps1 dev-api
./make.ps1 dev-web
```

## Key Files To Inspect

Source data:

- `data/demo/corpus/manifest.yaml`
- `data/demo/config/world_model.yaml`
- `data/demo/config/simulation_rules.yaml`
- `data/demo/scenarios/*.yaml`

Generated artifacts:

- `artifacts/demo/ingest/documents.jsonl`
- `artifacts/demo/ingest/chunks.jsonl`
- `artifacts/demo/graph/graph.json`
- `artifacts/demo/personas/personas.json`
- `artifacts/demo/scenario/*.json`
- `artifacts/demo/run/<scenario>/summary.json`
- `artifacts/demo/run/<scenario>/run_trace.jsonl`
- `artifacts/demo/compare/scenario_fog_harbor_phase44_matrix/compare.json`
- `artifacts/demo/report/report.md`
- `artifacts/demo/report/claims.json`
- `artifacts/demo/eval/summary.json`

## How To Read The Flow

### Corpus -> Chunks

`ingest` reads the bounded Fog Harbor documents and splits them into chunk-level evidence rows.

Those chunk IDs become the durable `evidence_ids` that later world objects, personas, actions, and claims point back to.

### Chunks -> Graph

`build-graph` uses `data/demo/config/world_model.yaml` to derive:

- entities
- relations
- events

Every retained world object should carry `evidence_ids`.

### Graph -> Personas

`personas` builds field-level persona cards from the graph.

Check `artifacts/demo/personas/personas.json` for:

- aggregate persona `evidence_ids`
- `field_provenance`

If a persona field is populated but has no provenance, the pipeline should fail.

### Scenarios -> Runs

Scenario YAML files stay explicit and bounded. The canonical baseline is `baseline.yaml`, while injected branches such as `reporter_detained.yaml` or `harbor_comms_failure.yaml` change one disturbance at a time.

Each run writes:

- `summary.json`
- `run_trace.jsonl`
- `snapshots/turn-XX.json`

### Runs -> Compare / Report / Claims

Fog Harbor keeps a canonical matrix compare artifact at:

- `artifacts/demo/compare/scenario_fog_harbor_phase44_matrix/compare.json`

The main report is pair-scoped:

- baseline
- one focal intervention branch

Claims live in `artifacts/demo/report/claims.json`.

## How To Verify Claim Grounding

Open `artifacts/demo/report/claims.json` and verify:

- every claim has a `label`
- every claim has non-empty `evidence_ids`
- those `evidence_ids` resolve back to chunk IDs in `artifacts/demo/ingest/chunks.jsonl`

This is the fastest manual check that the report is still evidence-backed rather than free-form narrative.

## Baseline vs Intervention

Read baseline and injected branches as a controlled comparison:

- baseline: the bounded world with no extra injected disturbance
- intervention: the same world plus one explicit disturbance

The interesting question is not "what will the real world do?" It is:

> Under the same corpus and deterministic rules, which outcome fields, actions, and claims change when one bounded disturbance is injected?

That is the core Mirror reading model.
