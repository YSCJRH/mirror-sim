# Phase 56 Candidate Source Verification

Date: 2026-05-20

Issue: `#442` `Phase 56: source-verify candidate planning signals against current frontend`

Current baseline: `6f46a52` `Record Phase 56 successor gate`

This note records the Phase 56 source check for narrow candidate planning
signals. It promotes only signals that are directly backed by current tracked
frontend source. It rejects or defers candidate-only claims when the current
source or ratified Phase 50-56 boundaries do not support them.

## Current Frontend Source Evidence

The tracked frontend source is the authority for this issue. Untracked April,
private-alpha, private-beta, kernel, design-system, and takeover planning notes
remain candidate inputs only.

| Surface | Current source evidence | Phase 56 finding |
| --- | --- | --- |
| `/` | `frontend/src/app/page.tsx` sets metadata title `Mirror Public Demo`, uses the `Deterministic-only Phase 1` hero, links to branch comparison, evidence explain, and advanced review, and states that runtime mutation, create-world, corpus upload, Hosted GPT, BYOK, auth, payment, database storage, and quota systems are reserved for later phases. | `/` remains the guided Phase 1 public demo, not a launch hub. |
| `/review` | `frontend/src/app/review/page.tsx` declares `data-review-surface="advanced-analyst-mode"`, renders `ReviewRubricPanel`, then `trace-claims`, `claims`, `reference`, `advanced-operations`, and only then `LegacyOperationsPanel`. | The public review surface is durable as analysis-first Analyst Mode, with scorecard -> trace/claims -> claims -> reference -> legacy operations. |
| `/worlds/<world_id>/review` | `frontend/src/app/worlds/[worldId]/review/page.tsx` reads `worldId` from route params, loads `loadProductWorldConfig(worldId, locale)`, conditionally loads `loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)`, and renders `ReviewRubricPanel`, `RuntimeReviewBrief`, and `RuntimeLineagePanel` only when a runtime workspace exists. The no-session branch tells users to generate one live branch first. | `/worlds/<world_id>/review` is promoted only as an existing world-scoped private-beta review surface with explicit no-session limits. |

## Candidate Signal Classification

| Candidate signal | Classification | Evidence |
| --- | --- | --- |
| Analysis-first public review ordering, with scorecard and trace/claims ahead of legacy packet/export/handoff surfaces. | Promote | Current `/review` source keeps `ReviewRubricPanel`, trace, claims, and reference ahead of `LegacyOperationsPanel`. Candidate evidence appears in `docs/plans/hybrid-linear-main-path-manual-review.md`; Phase 55 review-surface tests already protect this ordering. |
| Existing world-scoped review entrypoint for one bounded world route. | Promote | Current `/worlds/[worldId]/review` source is route-param scoped and loads world-specific product data. It renders rubric, review brief, and lineage when a runtime workspace exists, and otherwise preserves the no-session prompt. Candidate evidence appears in `docs/plans/private-alpha-baseline-2026-04-22.md:34`. |
| April launch-hub replacement signal. | Reject | `docs/plans/private-alpha-baseline-2026-04-22.md:9` claims root-route launch-hub replacement, but current `/` source is still the read-only public demo and explicitly reserves mutation and model-access systems for later phases. Phase 50 and Phase 51 durable decisions also keep any launch-hub replacement planning-only. |
| Hosted GPT/BYOK availability signal. | Reject | `docs/plans/private-beta-readiness-2026-04-23.md:24` records a hosted-model availability claim, but current public source says Hosted GPT and BYOK are reserved for later phases, and Phase 56 does not widen model-access, public-demo, plugin, or runtime mutation contracts. |
| private-beta route readiness snapshots and HTTP smoke observations in untracked notes. | Defer | They may be useful operator context, but they are not enough to become durable readiness truth until reproduced by reviewed tests or checked-in verification artifacts. The current contract proves three selected bounded fictional worlds and does not claim broad or future-world readiness. |
| Figma/design-system synchronization claims from untracked planning notes. | Defer | Current code names can guide future Figma work, but Phase 56 does not write to Figma or ratify a design-system contract. Candidate evidence appears in `docs/plans/hybrid-linear-main-path-design-system.md`. |
| Interactive simulator and kernel contract claims. | Defer | Candidate evidence appears in `docs/plans/interactive-perturbation-simulator-2026-04/README.md`, but those claims affect interaction, scenario, runtime, and trace contracts and need a separate reviewed contract boundary before promotion. |

## Promoted Signals

Promote: analysis-first public review ordering.

- The current public review page keeps the analysis path in this order:
  scorecard -> trace/claims -> claims -> reference -> legacy operations.
- This is a source-backed acceptance signal because it is visible in tracked
  `frontend/src/app/review/page.tsx` and already protected by
  `backend/tests/test_phase55_review_surface_guardrail.py`.

Promote: existing world-scoped review entrypoint.

- The current world review page is route-derived from `worldId` and does not
  reuse `/review` as a generic global workspace.
- It renders runtime review brief and lineage only when a runtime workspace exists.
- The no-session state remains an explicit prompt to generate one live branch first.
- The promoted truth is intentionally narrow:
  `/worlds/<world_id>/review` is promoted only as an existing world-scoped
  private-beta review surface with no-session limits.

## Rejected Signals

Reject: April launch-hub replacement signal.

- The current root page source and ratified Phase 50-56 boundaries keep `/` as
  the guided public demo.
- This rejection blocks treating April launch-hub planning language as durable
  repo truth.

Reject: Hosted GPT/BYOK availability signal.

- Phase 56 does not promote candidate-only hosted-model or BYOK availability
  notes into the public demo, plugin path, or durable route posture.
- Server-side private-beta model access remains outside this issue unless a
  later reviewed contract explicitly reopens that boundary.

## Deferred Signals

Defer: private-beta readiness snapshots.

- Candidate HTTP smoke notes can inform later validation design.
- They do not prove broad readiness, launch readiness, or route promotion until
  reproduced by tracked tests or reviewed artifacts.

Defer: Figma/design-system synchronization claims.

- Current code primitives remain the source of truth for future design sync.
- This issue does not create, update, or ratify Figma assets.

Defer: interactive simulator and kernel contract claims.

- Interactive simulator and kernel planning may become useful future input, but
  #442 does not ratify interaction, scenario, runtime, or trace contract changes.
- Any later promotion must cite tracked source or add an ADR and contract update.

## Durable Truth Guardrails

- Candidate planning notes stay candidate-only until a reviewed PR promotes a specific source-verified signal.
- A promoted signal must cite tracked source or checked-in validation evidence.
- No ADR or `docs/architecture/contracts.md` update is made by #442.
- No frontend route, backend API, artifact layout, data contract, or plugin MCP contract changes are made by #442.
- Do not import April/private-beta/kernel/design-system planning notes
  wholesale.
- Do not treat screenshots, untracked manual review notes, or local smoke
  snapshots as durable readiness evidence by themselves.
- Do not use this source-verification note to add new routes, backend APIs,
  runtime mutation, Hosted GPT/BYOK, async/task_id, launch hub behavior, plugin
  mutation, upload/auth/billing/database/object-storage/quota behavior, or
  contract changes.
- Keep the public demo, plugin, Hosted GPT/BYOK, launch hub, async, and runtime
  mutation boundaries unchanged.
- The current compatibility evidence remains bounded to the selected fictional
  worlds already covered by tracked evals. #442 does not claim broad or
  future-world readiness.

## Non-Goals

- Do not implement launch hub behavior.
- Do not replace `/` or widen the public path.
- Do not change `/review` into the private-beta main path.
- Do not change the scenario DSL, claim labels, report claim `evidence_ids`,
  run trace shape, compare artifact shape, public demo artifact layout, or
  plugin MCP contract.
- Do not change backend APIs or runtime mutation semantics.
- Do not promote broad private-beta readiness, Hosted GPT, BYOK, upload, auth,
  billing, database, object storage, or quota claims.
- Do not add async/task_id behavior.

## Validation Commands

- `python -m pytest backend/tests/test_phase56_candidate_source_verification.py -q`
- `python -m pytest backend/tests/test_phase56_candidate_source_verification.py backend/tests/test_phase56_successor_gate.py backend/tests/test_phase55_candidate_plan_audit.py backend/tests/test_phase55_review_surface_guardrail.py -q`
- `python scripts/check_no_secrets.py`
- `python -m backend.app.cli classify-lane --files docs/plans/phase-56-candidate-source-verification-2026-05-20.md backend/tests/test_phase56_candidate_source_verification.py`
- `git diff --check`
- `./make.ps1 test`
