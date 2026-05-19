# Phase 53 Transfer Assumption Audit

Date: 2026-05-19

Issue: `#420` `Phase 53: audit transfer assumptions and third-world readiness constraints`

Current work item: `#420` `Phase 53: audit transfer assumptions and third-world readiness constraints`

This note records the evidence-bounded transfer posture before Phase 53 adds any third-world
readiness evidence. It audits the current `eval-transfer` proof, identifies what Mirror may
and may not claim, and defines the criteria that `#421` or a reviewed compatibility-contract
alternative must satisfy. It does not add the third world, change schema, change scenario DSL,
change claim labels, change run trace shape, change compare artifact shape, change session/node manifest shape,
change public demo artifact layout, change plugin MCP contract, change
public/private routes, add an async runtime, or widen runtime mutation behavior.

## Evidence Inputs

- `docs/plans/phase-49-transfer-assumption-inventory-2026-05-18.md` records the current
  Fog Harbor-shaped assumptions and says `eval-transfer` is a two-world proof.
- `docs/decisions/ADR-0005-two-world-transfer-contracts.md` ratifies the current two-world
  transfer contract and keeps `eval-transfer` as the minimum portability proof.
- `docs/architecture/contracts.md` defines `eval-transfer` as the dual-world transfer proof
  across the canonical demo and the current second world.
- `backend/app/evals/service.py` defines
  `DEFAULT_TRANSFER_WORLD_IDS = [CANONICAL_DEMO_WORLD_ID, "museum-night"]`.
- `backend/app/evals/service.py` evaluates transfer worlds through world-local tracked outcomes
  and records `transfer_proof_world_local` only when each selected world covers its configured
  outcomes in run summaries and compare deltas.
- `data/demo/` remains the canonical Fog Harbor fixture.
- `data/worlds/museum-night/` remains the second bounded fictional transfer fixture.

## Supported Claims

- Mirror has a two-world transfer proof across `fog-harbor-east-gate` and `museum-night`.
- `eval-transfer` proves Mirror is not single-world-only.
- The current transfer proof covers the canonical demo and the current second bounded world
  selected by `DEFAULT_TRANSFER_WORLD_IDS`.
- Current transfer eval checks are world-local: tracked outcomes come from each world's
  `config/simulation_rules.yaml`, and report claims are checked for both `label` and
  `evidence_ids`.
- The current two-world proof supports saying that the constrained deterministic ingest,
  graph, persona, scenario, run, compare, report, and eval pipeline has passed across the
  two selected fictional or explicitly authorized bounded worlds.

## Blocked Claims

- Do not claim broad transfer readiness beyond the current two-world proof.
- Do not claim third-world readiness before `#421` adds evidence or a reviewed compatibility contract.
- Do not claim every future world will work without additional contracts.
- Do not claim unbounded world coverage, real-world forecasts, or readiness for real-person
  personas.
- Do not claim transfer eval proves a public launch hub, plugin write path, Hosted GPT/BYOK path,
  async runtime, worker queue, retry/status contract, or mutating runtime API.
- Do not claim transfer hardening permits removal or rename of legacy `RunTrace` top-level fields.
- Do not claim any third-world corpus, persona, or scenario evidence unless it is original,
  fictional, or explicitly authorized.

## Third-World Readiness Criteria

Before Mirror can claim third-world readiness, the next evidence slice must satisfy all of these:

- Use original, fictional, or explicitly authorized data.
- Keep world data under `data/worlds/<world_id>/` and generated artifacts under
  `artifacts/worlds/<world_id>/`.
- Provide world-local `config/simulation_rules.yaml` with initial state, turn sequence,
  tracked outcomes, explicit step rules, bounded injection effects, and a default report scenario.
- Avoid world-specific Python constants for the new world; failures must be driven by generic
  rule-driven checks.
- Ensure every world-local tracked outcome appears in run summaries or `final_state`.
- Ensure every world-local tracked outcome appears in compare outcome deltas.
- Ensure the default report scenario changes at least one tracked outcome against baseline.
- Every report claim must keep both `label` and `evidence_ids`.
- Ensure report claim `evidence_ids` resolve to ingested chunk IDs.
- pass `python -m backend.app.cli eval-world --world <world_id>`.
- Pass `./make.ps1 eval-transfer` after either adding the third world to the reviewed transfer
  set or ratifying why a stronger compatibility contract remains a two-world proof.
- Preserve scenario DSL, claim labels, run trace shape, compare artifact shape, session/node
  manifest shape, public demo artifact layout, and plugin MCP contract unless a separate ADR
  ratifies the change.

## Current Evidence Gaps

- Phase 53 has not yet added a third bounded world.
- `eval-transfer` currently reports `world_count: 2`; that is enough to show Mirror is not
  single-world-only, but not enough to claim broad transfer readiness.
- The current transfer proof relies on `fog-harbor-east-gate` and `museum-night`; it does not
  show that all future world schemas, evidence corpora, tracked outcomes, or scenario choices
  are compatible without additional review.
- No hosted/private-beta runtime timing evidence is created by this audit.
- No public demo, plugin, launch hub, async runtime, or runtime mutation contract changes are
  created by this audit.

## Required Follow-Up For `#421`

`#421` should choose exactly one path before claiming third-world readiness:

1. Add a small original/fictional third bounded world and extend the reviewed transfer set.
2. Ratify a stronger compatibility contract that explains why the current two-world proof is
   sufficient for the next product decision without claiming third-world readiness.

Either path must keep transfer language evidence-bounded, preserve claim/evidence integrity,
and avoid real-world forecasts or real-person persona claims.

## Validation Commands

For this audit slice, run:

```powershell
python -m pytest backend/tests/test_phase53_transfer_assumption_audit.py backend/tests/test_phase53_successor_gate.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
python -m backend.app.cli classify-lane --files README.md docs/plans/current-state-baseline.md docs/plans/automation-roadmap.md docs/plans/phase-execution-queue.md docs/plans/phase-53-successor-gate-2026-05-19.md docs/plans/phase-53-transfer-assumption-audit-2026-05-19.md backend/tests/test_phase53_transfer_assumption_audit.py
git diff --check
./make.ps1 test
./make.ps1 eval-demo
./make.ps1 eval-transfer
```
