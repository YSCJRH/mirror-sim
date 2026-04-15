# Mirror Engine

<p align="center">
  <img src="mirror.png" alt="Mirror concept illustration" width="100%" />
</p>

Mirror Engine is a constrained, evidence-backed conditional simulation sandbox for fictional or explicitly authorized knowledge environments. It is designed to answer questions like "if this disturbance occurs, how do key actors, information flows, and outcomes change?" without presenting itself as a real-world future prediction machine.

## Current Status

The repository has completed Day 0 bootstrap, closed Phase 1 and Phase 2 gates, and is now actively delivering the Phase 3 workbench.

- Governance documents and Codex execution rules are in place.
- The canonical demo world is `Fog Harbor East Gate`.
- The backend can ingest, build a graph, build personas, validate scenarios, simulate deterministic runs, generate reports, inspect world objects, and run evals.
- The repo now also includes the long-running automation and workbench pieces:
  - GitHub issue and PR templates
  - lane policy and bootstrap spec
  - CI upgraded to a long-running quality gate
  - local lane-classification and phase-audit commands
  - protected `main` with required status checks and auto-merge for safe-lane PRs
  - a browser workbench shell that now renders report, claims, eval summary, rubric, corpus, graph, and scenarios

Local phase audits currently show:

- Phase 1: `pass`
- Phase 2: `pass`
- Phase 3: `pass`

## Quick Start

PowerShell:

```powershell
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
```

Unix-like shells with `make` installed:

```bash
make smoke
make test
make eval-demo
```

Direct CLI examples:

```bash
python -m backend.app.cli ingest data/demo/corpus/manifest.yaml --out artifacts/demo/ingest
python -m backend.app.cli build-graph artifacts/demo/ingest/chunks.jsonl --out artifacts/demo/graph
python -m backend.app.cli personas artifacts/demo/graph/graph.json --out artifacts/demo/personas
python -m backend.app.cli validate-scenario data/demo/scenarios/reporter_detained.yaml --out artifacts/demo/scenario/reporter_detained.json
python -m backend.app.cli simulate data/demo/scenarios/reporter_detained.yaml --graph artifacts/demo/graph/graph.json --personas artifacts/demo/personas/personas.json --out artifacts/demo/run/reporter_detained
python -m backend.app.cli report artifacts/demo/run/reporter_detained --baseline artifacts/demo/run/baseline --out artifacts/demo/report
python -m backend.app.cli inspect-world --kind entity --id entity_east_gate --graph artifacts/demo/graph/graph.json --personas artifacts/demo/personas/personas.json
python -m backend.app.cli classify-lane --files README.md backend/app/cli.py
python -m backend.app.cli audit-phase phase1
```

## Repo Map

- [mirror.md](/D:/mirror/mirror.md): top-level blueprint and harness
- [AGENTS.md](/D:/mirror/AGENTS.md): Codex execution rules
- [docs/plans/phase-0-foundation.md](/D:/mirror/docs/plans/phase-0-foundation.md): Phase 0 implementation note
- [docs/plans/automation-roadmap.md](/D:/mirror/docs/plans/automation-roadmap.md): long-running automation bootstrap and operating plan
- [docs/plans/phase-execution-queue.md](/D:/mirror/docs/plans/phase-execution-queue.md): current phase queue and execution order
- [docs/architecture/contracts.md](/D:/mirror/docs/architecture/contracts.md): durable contracts and assumptions
- [data/demo/config/world_model.yaml](/D:/mirror/data/demo/config/world_model.yaml): demo world model and persona blueprint
- [data/demo](/D:/mirror/data/demo): demo world, scenarios, expectations
- [backend](/D:/mirror/backend): FastAPI app, CLI, automation helpers, domain models, pipeline
- [evals/assertions](/D:/mirror/evals/assertions): automated assertions and redlines
- [frontend](/D:/mirror/frontend): active Phase 3 workbench shell
- [.github/automation/bootstrap-spec.json](/D:/mirror/.github/automation/bootstrap-spec.json): GitHub bootstrap source of truth
- [.github/automation/lane-policy.json](/D:/mirror/.github/automation/lane-policy.json): safe-lane vs protected-core policy

## Architecture Shape

The current deterministic backbone remains:

```text
Corpus
  -> Ingest / Chunk
  -> Graph Build
  -> Persona Cards
  -> Scenario Validation
  -> Baseline Run
  -> Injected Run
  -> Diff Report + Claims
  -> Eval Summary
```

Key principles:

- Deterministic backbone first; LLMs stay at the edge.
- Local files and transparent artifacts first; heavy infra later.
- Reports must carry claim labels and `evidence_ids`.
- World model outputs must remain queryable.
- Safety and eval are part of the main loop, not an appendix.

## Automation Bootstrap

Mirror now treats GitHub as the operational source of truth for long-running automation.

Repository-side automation assets:

- `.github/ISSUE_TEMPLATE/`
- `.github/pull_request_template.md`
- `.github/workflows/phase0.yml`
- `.github/workflows/pull-request-lane.yml`
- `python scripts/bootstrap_github.py --repo YSCJRH/mirror-sim`
- `python -m backend.app.cli classify-lane ...`
- `python -m backend.app.cli audit-phase ...`

Important constraint:

- Day 0 bootstrap is complete. The current execution queue is tracked in [docs/plans/phase-execution-queue.md](/D:/mirror/docs/plans/phase-execution-queue.md).
- Protected-core changes still must not auto-merge just because checks are green.

## Non-goals

- Open-world ingest
- Real-person or real-society modeling
- Free-form agent swarm
- Heavy graph databases as the default
- Fancy UI before artifacts and evals are stable
- Deep binding to external LLM APIs in the core loop

## License

This repository is licensed under `MIT`.
