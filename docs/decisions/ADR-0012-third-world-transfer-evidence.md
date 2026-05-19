# ADR-0012: Third-World Transfer Evidence

## Status

- Accepted

## Context

ADR-0005 ratified the two-world transfer contract: `eval-transfer` had to pass both the
canonical Fog Harbor demo and `museum-night` before Mirror could claim it was not
single-world-only.

Phase 53 issue `#420` then audited the transfer language and recorded that the two-world
proof was still not third-world readiness. Phase 53 issue `#421` chooses the evidence path:
add a small original fictional bounded world and keep the proof world-local instead of making
a broad transfer claim.

## Decision

- Add `library-rain` as the third original fictional bounded world.
- Extend `DEFAULT_TRANSFER_WORLD_IDS` to:
  - `fog-harbor-east-gate`
  - `museum-night`
  - `library-rain`
- Keep each selected world's data under its reviewed world root:
  - canonical Fog Harbor data remains under `data/demo/`
  - `museum-night` remains under `data/worlds/museum-night/`
  - `library-rain` lives under `data/worlds/library-rain/`
- Keep the transfer proof rule-driven and world-local:
  - tracked outcomes come from each world's `config/simulation_rules.yaml`
  - default report scenarios stay world-local
  - report claims must keep both `label` and `evidence_ids`
- Record the Phase 53 evidence slice in
  `docs/plans/phase-53-third-world-transfer-evidence-2026-05-19.md`.
- This decision does not change scenario DSL, claim labels, run trace shape, compare artifact shape,
  session/node manifest shape, public demo artifact layout, or plugin MCP contract.

## Consequences

- `eval-transfer` now proves the deterministic ingest, graph, persona, scenario, run, compare,
  report, and eval pipeline across three selected bounded fictional worlds.
- The proof is stronger than ADR-0005's two-world minimum, but it does not claim future-world readiness.
- Public demo, plugin, Hosted GPT/BYOK, launch hub, async runtime, and runtime mutation boundaries
  remain unchanged.
- Future transfer claims still need either more reviewed bounded worlds or a separate compatibility
  contract before claiming broader generalization.
