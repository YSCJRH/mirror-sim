# ADR-0001: Phase 0 Contracts And Platform Interfaces

## Status

- Accepted

## Context

Phase 0 introduces the first durable contracts for Mirror Engine:

- the object model and artifact layout
- the difference between scenario IDs and injection kinds
- the difference between run-level summaries and per-turn trace entries
- the command interface in an environment where GNU Make is not installed by default

Without freezing these choices early, later Codex threads would keep renaming fields and moving files, which is exactly the failure mode `mirror.md` warns against.

## Decision

- `RunTrace` is the run-level summary model stored in `summary.json`.
- `TurnAction` is the per-turn event model stored in `run_trace.jsonl`.
- `scenario_id` names the whole scenario package. Injection kind remains a nested field under `injections[*].kind`.
- Phase 0 supports only explicit patch-style injection kinds:
  - `delay_document`
  - `block_contact`
  - `resource_failure`
- Reports must emit labeled claims with non-empty `evidence_ids`.
- The canonical command names remain:
  - `make setup`
  - `make smoke`
  - `make test`
  - `make eval-demo`
  - `make dev-api`
  - `make dev-web`
- Because the current Windows environment does not ship `make`, the repo also ships `make.ps1` and `make.cmd` as compatibility wrappers instead of renaming the canonical interface.

## Consequences

- New work should build on the existing artifact tree instead of inventing alternate output paths.
- Any future rename of claim labels, scenario structure, run-trace shape, or command names requires a new decision record.
- Cross-platform execution becomes easier because CI and local runs can share the same target names while using different wrappers where needed.
