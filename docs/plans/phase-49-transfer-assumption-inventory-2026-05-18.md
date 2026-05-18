# Phase 49 Transfer Assumption Inventory

Date: 2026-05-18

Issue: `#394` `Phase 49: strengthen transfer eval outcome coverage`

This note records the current Fog Harbor-shaped assumptions before Phase 49 claims any stronger
transfer posture. It does not add a third world and does not change scenario DSL, compare shape,
claim shape, public demo artifact layout, plugin behavior, or runtime orchestration.

## Transfer Baseline

- Fog Harbor remains the canonical public demo world and keeps `eval-demo` as its regression
  command.
- `museum-night` remains the second bounded fictional world used by `eval-transfer`.
- `eval-transfer` is still a two-world proof, not a general claim that every future world will
  work without additional contracts.
- Transfer checks must be driven by each world's `config/simulation_rules.yaml`, not by
  Fog Harbor object IDs or field names.

## Intentional Compatibility

- `RunTrace` still carries nullable top-level Fog Harbor-era fields such as
  `ledger_public_turn`, `budget_exposed_turn`, and `evacuation_turn`.
  - These fields remain compatibility surface for the canonical demo and older readers.
  - Transfer worlds must be evaluated through `final_state` plus world-local tracked outcomes
    when those top-level fields do not apply.
- `eval-demo` may keep Fog Harbor-specific object IDs, event IDs, and expected outcomes because
  it is the canonical demo regression.
- Report generation is intentionally generic at the transfer layer: report claims are selected
  from world-local tracked outcomes in `simulation_rules.yaml`.
- Transfer redline checks sample world-local graph, persona, and event IDs rather than fixed
  Fog Harbor IDs.

## Remaining Blockers

- Do not remove or rename legacy `RunTrace` top-level fields without a dedicated contract
  decision and migration plan.
- Do not claim transfer beyond the current two-world proof until another reviewed issue adds
  either a third world or a stronger compatibility contract.
- Do not add world-specific Python constants for `museum-night`; a transfer regression should
  fail because generic rule-driven checks fail, not because a hardcoded museum field is missing.
- Do not widen runtime orchestration into `task_id`, workers, retries, status states, or cleanup
  as part of transfer hardening.

## Ratified Phase 49 Check

`evaluate_transfer_world` now verifies:

- every world-local tracked outcome appears in each run summary or `final_state`;
- every world-local tracked outcome appears in compare outcome deltas;
- the default report scenario changes at least one tracked outcome against baseline;
- claim labels, `evidence_ids`, evidence resolution, and redline checks still run.

This keeps the proof stronger than artifact existence while remaining bounded to fictional,
authorized worlds.
