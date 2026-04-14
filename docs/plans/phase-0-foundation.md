# Phase 0 Foundation

## Objective

Turn the blueprint in `mirror.md` into a runnable, reviewable repository scaffold that supports deterministic demo execution.

## Implementation Assumptions

- `RunTrace` is the run-level summary object; `TurnAction` is the per-turn JSONL record.
- Scenario IDs and injection kinds are distinct. The scenario `reporter_detained` is implemented using a `delay_document` injection.
- `Makefile` remains the canonical interface; `make.ps1` and `make.cmd` exist to keep Windows execution friction low.
- Frontend workbench is intentionally deferred. Phase 0 only preserves its entry points.

## Deliverables

- Governance docs: `AGENTS.md`, `README.md`, templates, backlog
- Demo data: corpus, scenarios, expectations
- Contracts: Pydantic models, schema notes, artifact rules
- CLI pipeline: ingest, build-graph, personas, validate-scenario, simulate, report, eval-demo
- Verification: smoke, pytest, eval summary

## TODO[verify]

- Whether Phase 0 should also include GitHub remote setup and CI bootstrapping
- Exact toolchain lock strategy for Python/Node versions beyond the initial `pyproject.toml` and `package.json`
