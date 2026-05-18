# Phase 48 Private-Beta Runtime Contract Audit

Date: 2026-05-18

Issue: `#378` `Phase 48: private beta runtime contract audit`

## Purpose

Audit the private-beta runtime contract surface before any new runtime implementation phase.
This report reconciles tracked README, contracts, ADRs, backend code, frontend routes, and
tests. It does not change runtime behavior, public API shape, scenario DSL, claim/evidence
shape, run trace shape, artifact layout, or provider-secret handling.

## Direct Evidence

- `README.md` keeps Phase 1 public demo separate from the private-beta candidate path:
  - public demo visitors cannot upload a corpus, create worlds, start runtime sessions,
    generate branches, enable Hosted GPT or BYOK, or call the OpenAI API.
  - the private-beta candidate web path is available only when public demo flags are
    disabled.
  - hosted private-beta GPT access is server-side only, disabled by default, beta-gated, and
    quota-limited before a model call.
- `docs/architecture/contracts.md` defines the runtime as CLI-first in v1:
  - `start-session`, `inspect-session`, `generate-branch`, and `rollback-session` are the
    canonical entrypoints.
  - `start-session` may pin one provider and one model.
  - `hosted_openai` uses server-side environment secrets and never accepts a browser-submitted
    OpenAI API key.
  - `generate-branch` may receive request-scoped BYOK credentials, but raw credentials must
    not be written into `session.json`, `node.json`, reports, claims, or decision traces.
  - hosted quota ledgers live under ignored `state/usage/` and must store hashed user
    identities only.
  - rollback only changes `active_node_id`; it does not delete nodes or rewrite run artifacts.
- `docs/decisions/ADR-0006-interactive-simulator-runtime-v1.md` is accepted and freezes the
  v1 runtime shape:
  - session/node IDs are durable.
  - generated nodes live under a session namespace.
  - rollback is pointer movement.
  - task queues and `task_id` are explicitly deferred.
- `docs/decisions/ADR-0008-hosted-model-access-and-key-safety.md` is accepted and freezes the
  hosted provider safety boundary:
  - `hosted_openai` reads the OpenAI API key only from `MIRROR_HOSTED_OPENAI_API_KEY`.
  - the browser never receives the hosted OpenAI API key.
  - the beta access code is an interim identity gate, not a long-term account system.
  - quota identities are hashed before storage.
- `backend/app/sessions/service.py` implements the v1 contract:
  - `start_session` rejects non-baseline or multi-branch scenarios and persists provider/model
    metadata in `decision_config`.
  - `generate_branch` validates hosted access and quota before generation when the session
    provider is `hosted_openai`.
  - generated child nodes write run, compare, report, claims, resolution, and decision trace
    references under the session namespace.
  - `rollback_session` only changes `active_node_id` after checking the target exists.
- `backend/app/model_access/service.py` implements hosted provider gating and quota:
  - hosted access requires `MIRROR_HOSTED_MODEL_ENABLED`, `MIRROR_HOSTED_OPENAI_API_KEY`, and a
    hosted or default decision model.
  - usage files are written under `state/usage/hosted-openai-YYYY-MM-DD.json`.
  - user identity is hashed before storage.
- `frontend/src/app/api/runtime/start-session/route.ts`,
  `frontend/src/app/api/runtime/generate-branch/route.ts`, and
  `frontend/src/app/api/runtime/rollback-session/route.ts` block runtime mutations in public
  demo mode through `publicDemoMutationsDisabled()`.
- `frontend/src/app/api/runtime/start-session/route.ts` and
  `frontend/src/app/api/runtime/generate-branch/route.ts` require hosted beta access code,
  hosted enablement, server-side hosted key, and configured hosted/default model before
  hosted runtime calls proceed.
- `frontend/src/app/lib/runtime-cli.ts` passes BYOK values as request-scoped environment
  variables to the local Python CLI and does not add them to CLI args.
- `backend/tests/test_model_access.py` verifies hosted access requires enablement, a server
  secret, and a model; hosted session manifests do not write the hosted key; quota stores a
  hash rather than the raw identity.
- Targeted runtime/provider validation passed:

```powershell
python -m pytest backend/tests/test_model_access.py backend/tests/test_cli.py -k "start_session or generate_branch or rollback_session or hosted" -q
```

Result: `11 passed, 18 deselected`.

## Reasonable Inference

- The tracked runtime contract is internally consistent: private-beta runtime work can proceed
  only as a local/private path and must not widen Phase 1 public demo behavior.
- Hosted provider secrets are intended to remain server-side or local-only. The browser sends
  only beta access code for `hosted_openai`, while the hosted OpenAI key is loaded from server
  environment.
- BYOK remains request-scoped for web `openai_compatible`. The current browser UI stores BYOK
  values in `sessionStorage`, sends explicit model/key values to the private runtime API, and
  does not use server provider env as a client-visible fallback. This is consistent with
  ADR-0008 as a private-beta path, but it is not appropriate for the public demo path.
- The current world/product surfaces use "latest session" semantics based on
  `session.created_at`, not "latest activity" semantics based on node generation or rollback.
- Route-level runtime error redaction is now covered by
  `backend/tests/test_frontend_runtime_error_redaction.py`; private-beta mutation routes return
  generic localized client errors instead of raw provider/runtime exception text, and
  `openai_compatible` web preflight trims provider/model/key input, no longer branches on server
  provider env presence, and clears inherited provider env when request-scoped BYOK is absent.

## Open Questions

- TODO[verify]: Decide whether the product should surface the latest created session or the
  latest active/modified session. Current code sorts session locators by `session.created_at`;
  rollback and branch generation update `active_node_id` but do not update a `last_activity_at`
  field.
- TODO[verify]: If web-triggered generation becomes long-running, ratify a `task_id`/worker
  contract in a follow-up ADR instead of widening ADR-0006 implicitly.
- TODO[verify]: Reconcile local untracked private-beta planning files only by promoting
  selected, reviewed facts through a future PR; they are not source of truth for this audit.

## Follow-Up Recommendations

- Open a protected-core Phase 49 candidate for the latest-session versus latest-activity
  decision before adding more launch-hub or world-card affordances.
- Keep the provider-error redaction regression in the runtime route validation set before any
  broader private-beta Hosted GPT trial.
- Keep `MIRROR_HOSTED_OPENAI_API_KEY`, real BYOK values, beta access codes, usage ledgers, and
  local `.env` files out of tracked source, frontend bundles, generated artifacts, build logs,
  and error pages.
- Do not change `session.json`, `node.json`, `decision_trace.jsonl`, perturbation payloads,
  or public API route behavior without updating `docs/architecture/contracts.md` and an ADR
  when the contract is long-lived.

## Validation Commands

```powershell
python -m pytest backend/tests/test_frontend_runtime_error_redaction.py -q
python -m pytest backend/tests/test_model_access.py backend/tests/test_cli.py -k "start_session or generate_branch or rollback_session or hosted" -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```

## Remaining Phase 48 Work

- `#379` should convert kernel and perturbation follow-up material into explicit Phase 49
  candidate work.
- `#375` remains the blocked exit gate until Phase 48 work satisfies its exit criteria.
