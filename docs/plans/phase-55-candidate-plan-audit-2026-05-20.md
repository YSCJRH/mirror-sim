# Phase 55 Candidate Plan Audit

Date: 2026-05-20

Issue: `#434` `Phase 55: audit candidate product-reframe plans and freeze contract-safe scope`

This note audits the untracked April/private-beta/kernel/design-system planning notes
against the tracked Mirror boundary after the Phase 54 closeout and Phase 55 successor
gate. It freezes what Phase 55 may safely use before any product-facing guardrail work.

Phase 55 may use candidate notes as inputs for analysis-first main-path acceptance
criteria. It must not promote those notes as durable truth, ratify new product/runtime
contracts, or ratify changes to public demo, plugin, Hosted GPT/BYOK, launch hub, async, or runtime mutation boundaries.

## Durable Boundary Inputs

The durable sources for this audit are:

- `mirror.md`
- `docs/architecture/contracts.md`
- `docs/plans/phase-50-product-boundary-2026-05-18.md`
- `docs/plans/phase-51-private-beta-route-contract-2026-05-18.md`
- `docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md`
- `docs/plans/phase-55-successor-gate-2026-05-20.md`

The tracked boundary is:

- `/` remains the guided public demo unless a later reviewed route contract changes it.
- `/review` remains an advanced review surface, not a launch hub.
- `/worlds/<world_id>` remains the private-beta candidate product path.
- Keep synchronous generation for v1. Defer async task contract ratification.
- Hosted/private-beta model latency is still TODO[verify] and cannot justify async
  workers, `task_id`, heartbeat, retry, status, cleanup, or background APIs.
- Candidate planning notes are not durable truth until intentionally promoted by a
  reviewed PR.

## Candidate Classification

| Candidate input | Classification | Phase 55 safe use | Blocked or deferred use |
| --- | --- | --- | --- |
| `docs/plans/takeover-audit-2026-04/README.md` | safe-input with stale baseline caveat | Use the contract-safe scope guardrails: no `compare.json`, artifact layout, claim/evidence, scenario DSL, world resolution, backend API, durable artifact, or multi-world selector changes. | Do not reuse its April 21 paused GitHub state as current truth; Phase 55 is now active. |
| `docs/plans/takeover-audit-2026-04/01-baseline-reconfirm.md` | superseded baseline evidence | Use only as historical evidence that paused can be an intentional stop-state. | Do not reuse its open issue, PR, milestone, or test-count snapshot as current truth. |
| `docs/plans/takeover-audit-2026-04/02-project-governance-brief.md` | safe-input | Use Mirror positioning, safety redlines, queue truth, stop-state interpretation, and contract discipline. | Do not use it to self-start work outside GitHub milestone and exit-gate structure. |
| `docs/plans/takeover-audit-2026-04/03-frontend-ia-diagnosis.md` | safe-input | Use the `/` briefing dashboard and `/review` analysis-first diagnosis; treat legacy export/handoff as secondary. | Do not change backend API, compare truth, claim/evidence truth, scenario, or world contracts. |
| `docs/plans/takeover-audit-2026-04/04-frontend-modularity-and-figma-seed.md` | safe-input | Use the recommendation to unify scoring rules, lazy-load legacy scorecard, split loaders by route responsibility, and keep design-system v1 on dashboard/deep review. | Defer legacy export/handoff redesign, multi-world selector UI, backend-driven tokens, and contract changes to compare/report/claim artifacts. |
| `docs/plans/takeover-audit-2026-04/05-successor-decision-brief.md` | safe-input | Use the front-end focused, contract-safe, analysis-first, main-path-only successor shape. | Defer `compare.json`, claim/evidence, backend API, multi-world selector, full legacy export/handoff redesign, broad queue, and governance rework. |
| `docs/plans/branch-analysis-product-reframe-2026-04/README.md` | safe-input with implementation caveat | Use the world -> baseline -> perturbation -> change -> explanation narrative, Analyst Mode containment, and `compare.json` as comparison truth. | Do not implement new route shells or product reframe execution in Phase 55 unless a specific issue keeps the work contract-safe and validated. |
| `docs/plans/hybrid-linear-main-path-design-system.md` | safe-input with code-verification caveat | Use the main-path token/component vocabulary and the rule that legacy `review-scorecard` is not the primary design language. | Do not treat untracked design-system notes or local code references as durable component inventory without verifying current `frontend/` code. |
| `docs/plans/hybrid-linear-main-path-manual-review.md` | safe-input with artifact caveat | Use the manual review criteria for analysis-first `/review`, legacy tools as secondary, and coherent home/review visual system. | Do not treat local screenshot paths under `artifacts/ui-review/` as committed evidence. |
| `docs/plans/interactive-perturbation-simulator-2026-04/README.md` | contract-candidate and deferred | Use only the honesty rule: until interactive simulator work lands, do not imply arbitrary perturbation authoring or live rollback exists. | Defer branch generation entrypoints, perturbation payload contract, branch history, checkpoint semantics, rollback semantics, and ADR work. |
| `docs/plans/interactive-kernel-baseline-2026-04-22.md` | contract-blocked and deferred | Use replayability, structured perturbations, and rule-bounded model participation only as future decision criteria after blueprint, ADR, and contract review. | Block kernel ratification, resolver expansion, decision trace/replay contract changes, and outcome/report/eval generalization in Phase 55. |
| `docs/plans/private-alpha-baseline-2026-04-22.md` | superseded and contract-blocked | Use only low-level safety reminders such as request-scoped credentials not persisted into artifacts. | Block its claims that `/` is now the launch hub, that Launch Hub is current product truth, or that session contract/provider behavior is ratified for Phase 55. |
| `docs/plans/private-alpha-launch-ready-2026-04-22.md` | superseded launch plan | Use as historical structure for how an external launch plan might be decomposed later. | Do not use `Alpha 1 - Private Launch`, launch hub migration, BYO LLM integration, or private-alpha deployment as Phase 55 scope. |
| `docs/plans/private-alpha-runbook-2026-04-22.md` | candidate-only and contract-blocked | Use data-handling reminders: browser-session keys should not be persisted, hosted keys must stay server-side, and only fictional or authorized corpus material is allowed. | Block launch hub as product entry, hosted_openai as Phase 55 scope, BYOK expansion, live branch generation expansion, and rollback continuation work. |
| `docs/plans/private-alpha-zh-manual-review-2026-04-22.md` | candidate-only with route caveat | Use only the Chinese main-path wording criteria after re-checking current route/stage language: avoid internal field names, raw `claims`, and engineering state terms in user-facing review/explain surfaces. | Do not use the launch-hub route assumptions, private-alpha stage name, or private-alpha route list as current route ownership. |
| `docs/plans/private-beta-readiness-2026-04-23.md` | candidate-only and contract-blocked | Use the stage-term reminder that historical `private-alpha` filenames are compatibility labels and that legacy top-level routes should not be treated as the main product path. | Block its `hosted_openai` readiness claim, launch-hub-adjacent product posture, route readiness claims, and HTTP smoke claims until separately revalidated. |

## Phase 55 Safe Inputs

Phase 55 may safely carry forward these acceptance signals:

- `/` should preserve the world/baseline/compare/eval briefing narrative without new backend API expansion.
- `/review` should be analysis-first: trace, claims, evidence/reference, and lightweight rubric before delivery/export surfaces.
- Legacy scorecard, export, handoff, and routing surfaces should stay secondary, lazy, or compatibility-only.
- Main-path scoring/recommendation logic should not fork into separate incompatible rules.
- Main-path bilingual and product copy should avoid raw internal field names, raw `claims` wording, and engineering status phrasing where a user-facing label exists.
- Design-system v1 should stay limited to dashboard and deep-review main path primitives.
- Any future Figma or Linear translation remains planning-only until a separate execution surface exists.

## Deferred Or Blocked Inputs

The following are outside Phase 55 unless a later reviewed work item changes the boundary:

- launch hub implementation or replacement of `/`
- public-path widening
- plugin MCP mutation or Hosted GPT/BYOK support
- Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or deployment expansion
- async workers, `task_id`, worker queue, heartbeat, retry, status, cleanup, or background APIs
- branch-generation entrypoint contract changes
- perturbation payload contract changes
- rollback/checkpoint/branch-history semantics
- new mutating runtime APIs without route-derived `worldId`
- scenario DSL, claim label, report claim `evidence_ids`, run trace, compare artifact, session/node manifest, public demo artifact layout, or plugin MCP contract changes
- multi-world selector UI
- full redesign of the legacy export/handoff surface

## Analysis-First Main-Path Scope

The next contract-safe Phase 55 implementation issue may use this scope:

- add a regression guardrail that proves the active public demo/review copy remains
  analysis-first and does not present legacy packet/handoff tooling as the main product
  center of gravity
- reference `phase-55-candidate-plan-audit-2026-05-20.md` as the accepted candidate
  input filter
- avoid touching runtime/session mutation code, backend API shape, durable artifacts,
  scenario DSL, claim/evidence, or plugin contracts

## Non-Goals

- Do not promote the untracked candidate planning notes as durable truth in this issue.
- Do not implement new routes, UI, Figma files, Linear objects, runtime behavior, or backend APIs in this issue.
- Do not write ADRs for branch generation, rollback, task queues, launch hub, Hosted GPT,
  or BYOK in this issue.
- Do not change `docs/architecture/contracts.md`; this audit does not ratify a new contract.
- Do not recreate local Codex automations.

## TODO[verify]

- TODO[verify]: Before implementing any specific candidate signal, re-check the current
  `frontend/` source rather than relying on April local screenshots or stale route text.
- TODO[verify]: Hosted/private-beta model latency remains unverified and cannot support
  async contract work.
- TODO[verify]: If the interactive simulator becomes an implementation target, open a
  protected-core ADR covering branch generation, perturbation payload, rollback/checkpoint,
  and branch-tree addressing before code changes.
- TODO[verify]: If any private-beta route or model access claim is promoted, revalidate it
  against current public-demo flags, deployment posture, and route ownership contracts.

## Validation Commands

```powershell
python -m pytest backend/tests/test_phase55_candidate_plan_audit.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli classify-lane --files docs/plans/phase-55-candidate-plan-audit-2026-05-20.md backend/tests/test_phase55_candidate_plan_audit.py
git diff --check
```
