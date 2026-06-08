# Post-Phase-67 Decision Trace Replay Audit

Date: 2026-06-08

This audit closes the second `TODO[verify]` from the Post-Phase-67 successor intake audit: audit current decision-trace/replay evidence before treating trace hardening as a protected-core blocker.

## Current-Code Finding

Current-code audit result: no source-backed Phase 68 blocker is proven by decision-trace/replay hardening today.

The decision-trace replay proof is current for kernel-level replay and runner-level same-run-directory replay.

The current queue remains in the formal paused stop-state.

The minimum loop remains:

```text
corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval
```

The queue shorthand is `corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval`.

## Source Evidence

- `docs/architecture/contracts.md` states that `decision_trace.jsonl` is the durable v1 decision audit artifact and defines stable fields for each `DecisionTraceEntry`.
- `docs/architecture/contracts.md` defines `replay_cache` when the selection is copied from an existing trace entry for the same `input_hash`.
- `docs/architecture/contracts.md` defines `accepted_from_replay` for replay-cache reuse.
- `docs/architecture/contracts.md` says Decision traces are append-only audit history for a concrete run/node artifact.
- `backend/app/decision_kernel/service.py` looks up `replay_entry = self.replay_cache.get(input_hash)`.
- `backend/app/decision_kernel/service.py` finalizes cache hits with `provider_mode="replay_cache"` and `validation_status="accepted_from_replay"`.
- `backend/app/decision_kernel/service.py` writes trace entries through `_append_trace(self.decision_trace_path, entry)` and updates the in-memory cache after each choice.
- `README.md` now scopes the trace claim to materialized generated-run decisions because session root nodes start without a `decision_trace_path` until branch generation materializes runtime artifacts.

## Validation Evidence

- `backend/tests/test_decision_kernel.py` includes `test_decision_kernel_replay_uses_cached_choice_without_provider_call`.
- That kernel test asserts `replay["provider_mode"] == "replay_cache"` and `replay["validation_status"] == "accepted_from_replay"`.
- `backend/tests/test_pipeline.py` includes `test_simulation_replays_from_existing_decision_trace`.
- That runner-level test executes `simulate_scenario` twice against the same run directory and asserts every appended replay row satisfies `row["provider_mode"] == "replay_cache"` and `row["validation_status"] == "accepted_from_replay"`.
- The runner-level test also compares replay `row["input_hash"]` values and selected choice indexes to the original trace rows.

## Successor Decision

Do not open Phase 68 from this audit.

This audit does not prove a protected-core blocker. It proves that the current decision-trace/replay contract has source and test evidence at the kernel boundary and through a deterministic runner replay path.

No successor queue is opened by this audit.

Follow-up boundary: `docs/plans/post-phase-67-decision-trace-eval-ownership-boundary-2026-06-08.md` records that future eval ownership for decision-trace replay metrics remains unclaimed and is not a current Phase 68 blocker.

## Boundaries

- This audit does not change `decision_trace.jsonl` shape.
- This audit does not claim provider-backed replay readiness beyond the current cache-hit and fallback evidence.
- This audit does not implement eval-owned decision-trace replay metrics.
- This audit does not change schema, scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, plugin MCP contract, route ownership, or artifact layout.
- No ADR or `docs/architecture/contracts.md` update is made by this audit because this diff does not change a protected-core contract.
- `status:needs-adr` and unresolved `risk:safety` findings remain merge blockers.
- Do not present Mirror as a real-world prediction machine.
- Do not build real-person personas or digital doubles.
- Do not build political persuasion, hidden surveillance, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.

## Validation Commands

- `python -m pytest backend/tests/test_pipeline.py::test_simulation_replays_from_existing_decision_trace -q`
- `python -m pytest backend/tests/test_decision_kernel.py backend/tests/test_pipeline.py::test_scenario_validation_and_simulation_are_deterministic backend/tests/test_pipeline.py::test_simulation_replays_from_existing_decision_trace backend/tests/test_post_phase67_decision_trace_replay_audit.py -q`
- `python scripts/check_no_secrets.py`
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
- `git diff --check`
