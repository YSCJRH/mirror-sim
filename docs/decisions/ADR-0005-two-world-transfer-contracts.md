# ADR-0005: Two-World Transfer Contracts

## Status

- Accepted

## Context

Phase 46 closed the workbench queue in a clean release stop-state, but the repository still proved only one thing end to end:

- the canonical Fog Harbor demo works well

That is necessary, but it is not yet enough to show minimal transferability. The next bounded step is not a larger UI or a heavier runtime. It is a second small fictional world that can reuse the same constrained, deterministic, evidence-backed pipeline.

To make that credible, three contracts need to become explicit instead of remaining implicit:

- how non-canonical worlds are resolved on disk
- how the deterministic runner is configured without new world-specific Python constants
- how transfer eval proves that two worlds can both pass the same integrity checks

## Decision

- Keep the canonical demo contract unchanged:
  - `fog-harbor-east-gate` remains the canonical demo world
  - canonical inputs stay in `data/demo/`
  - canonical artifacts stay in `artifacts/demo/`
- Introduce bounded world-path resolution for additional worlds:
  - `data/worlds/<world_id>/`
  - `artifacts/worlds/<world_id>/`
- Ratify one new per-world runner config:
  - `config/simulation_rules.yaml`
- Freeze the purpose of `simulation_rules.yaml` to deterministic runner configuration only:
  - turn ownership
  - initial state
  - tracked outcomes
  - explicit step rules
  - bounded injection effects
- Do not introduce:
  - free-form agent planning
  - LLM-controlled simulation
  - a complex open-ended simulation DSL
- Keep external artifact contracts stable:
  - `TurnAction` shape stays unchanged
  - `RunTrace` shape stays unchanged
  - compare artifact shape stays unchanged
  - the canonical Fog Harbor compare path used by the workbench stays unchanged
- Add two new CLI entrypoints:
  - `python -m backend.app.cli eval-world --world <world_id>`
  - `python -m backend.app.cli eval-transfer`
- Freeze transfer eval semantics:
  - `eval-demo` remains the canonical Fog Harbor regression command
  - `eval-transfer` is the minimum portability proof and runs both Fog Harbor and the second bounded world
  - transfer summaries must expose `world_id`, counts, failures, and artifact paths
- Keep the frontend scope narrow in this round:
  - no multi-world selector yet
  - no new packet or handoff surfaces
  - only metadata and doc drift fixes are allowed

## Consequences

- Mirror can now prove that the pipeline is not single-world-only without claiming open-world generality.
- New bounded worlds can be added without hardcoding their turn sequence or state logic into the main runner.
- The canonical Fog Harbor demo remains stable for the current workbench and README flow.
- Future work can choose between:
  - more bounded worlds
  - a small frontend world selector
  - a new successor queue
  without first revisiting the core transfer contract.
