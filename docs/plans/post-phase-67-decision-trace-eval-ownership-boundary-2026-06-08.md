# Post-Phase-67 Decision Trace Eval Ownership Boundary

Date: 2026-06-08

## Scope

This boundary note closes the eval-ownership follow-up left by the Post-Phase-67 decision-trace replay audit.

It asks only whether future eval ownership for decision-trace replay metrics is a current source-backed blocker. It does not implement new eval metrics.

The minimum loop remains:

```text
corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval
```

The queue shorthand is `corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval`.

## Current-Code Finding

Current-code audit result: eval-owned decision-trace replay metrics remain unclaimed today.

This is not a source-backed Phase 68 blocker.

The current queue remains in the formal paused stop-state.

`backend/app/evals/service.py` currently has no `decision_trace`, `replay_cache`, or `accepted_from_replay` ownership.

`docs/architecture/contracts.md` does not require transfer eval summaries to include decision-trace replay metrics.

## Source Evidence

- `docs/architecture/contracts.md` states that `decision_trace.jsonl` is the durable v1 decision audit artifact.
- `docs/architecture/contracts.md` defines `replay_cache` when the selection is copied from an existing trace entry for the same `input_hash`.
- `docs/architecture/contracts.md` defines `accepted_from_replay` for replay-cache reuse.
- `backend/app/decision_kernel/service.py` looks up `replay_entry = self.replay_cache.get(input_hash)`.
- `backend/app/decision_kernel/service.py` finalizes cache hits with `provider_mode="replay_cache"` and `validation_status="accepted_from_replay"`.
- `backend/tests/test_pipeline.py` includes `test_simulation_replays_from_existing_decision_trace`.

## Blueprint Alignment Decision

Do not open Phase 68 from this boundary note.

Opening an implementation queue for eval-owned decision-trace replay metrics without a new source-backed blocker would be blueprint drift.

The correct current boundary is narrower: kernel-level replay and runner-level same-run-directory replay remain the current proven boundary, while eval-owned decision-trace replay metrics remain future contract work only if a later audit proves a minimum-loop gap.

No successor queue is opened by this boundary note.

## Future Trigger Conditions

Before eval-owned decision-trace replay metrics can become implementation work, a future reviewed audit must identify:

- the exact metric eval would own, such as trace existence, replay consistency, cache-hit rate, provider-call avoidance, privacy redaction, or runtime-node coverage
- the eval command and artifact scope, such as `eval-world`, `eval-transfer`, generated runtime sessions, or private-beta-only validation
- the source-backed minimum-loop gap or protected-core contract blocker that makes the metric necessary now
- whether `eval/summary.json` becomes a stable metric contract and therefore needs `docs/architecture/contracts.md` and possibly an ADR

## Boundaries

- This boundary note does not change `decision_trace.jsonl` shape.
- This boundary note does not change schema, scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, plugin MCP contract, route ownership, or artifact layout.
- This boundary note does not assert provider-backed replay readiness.
- This boundary note does not assert future-world readiness.
- No ADR or `docs/architecture/contracts.md` update is made by this boundary note because this diff does not change a protected-core contract.
- `status:needs-adr` and unresolved `risk:safety` findings remain merge blockers.
- Do not present Mirror as a real-world prediction machine.
- Do not build real-person personas or digital doubles.
- Do not build political persuasion, hidden surveillance, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.

## Validation Commands

- `python -m pytest backend/tests/test_post_phase67_decision_trace_eval_ownership_boundary.py -q`
- `python -m pytest backend/tests/test_post_phase67_decision_trace_replay_audit.py backend/tests/test_post_phase67_decision_trace_eval_ownership_boundary.py -q`
- `python scripts/check_no_secrets.py`
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
- `git diff --check`
