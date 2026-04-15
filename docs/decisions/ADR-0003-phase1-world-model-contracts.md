# ADR-0003: Phase 1 World Model Contracts

## Status

- Accepted

## Context

Phase 0 proved the canonical Fog Harbor demo can run end-to-end, but it still relied on demo-specific hardcoded graph and persona definitions. The next sprint hardens the world model so later scenario and simulation work can build on a stable, queryable, evidence-backed layer instead of piling more logic onto code constants.

This change touches long-lived contracts in two places:

- domain schema now needs a first-class `Event`
- persona provenance must move from object-level only to field-level
- the repo now exposes a durable query surface through `inspect-world`

Per the project decision rules, domain schema changes and command interface changes require an ADR instead of only updating the contract notes.

## Decision

- Introduce `Event` as a first-class domain object with:
  - `event_id`
  - `name`
  - `kind`
  - `participant_entity_ids`
  - `evidence_ids`
- Extend `Persona` with `field_provenance: dict[str, list[str]]`.
- Freeze the initial field-level provenance requirement for:
  - `public_role`
  - `goals`
  - `constraints`
  - `known_facts`
  - `private_info`
  - `relationships`
- Move demo-specific world definitions out of Python constants and into `data/demo/config/world_model.yaml`.
- Add a CLI-first query surface:
  - `python -m backend.app.cli inspect-world ...`
- Keep simulation semantics unchanged in this sprint:
  - no `branch_count` expansion
  - no GraphRAG-lite
  - no external LLM extraction

## Consequences

- World-model artifacts become more durable and easier to inspect across future sprints.
- Tests and evals must now protect `events` and `field_provenance`, not only aggregate claim evidence.
- Querying stays intentionally simple and local-first, which keeps the contract stable while avoiding premature API expansion.
- Future changes to `Event` shape, field provenance semantics, or `inspect-world` output should be treated as contract changes and recorded in a follow-up ADR.
