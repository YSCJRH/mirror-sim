# Mirror Engine

<p align="center">
  <img src="mirror.png" alt="Mirror concept illustration" width="100%" />
</p>

**A constrained, evidence-backed scenario simulation engine for fictional or explicitly authorized worlds.**

**一个面向虚构或明确授权知识环境的、受约束且证据可追溯的情景推演引擎。**

---

## What Mirror Is | Mirror 是什么

Mirror turns a small bounded corpus into a replayable pipeline:

`corpus -> chunks -> graph -> personas -> scenarios -> deterministic runs -> report/claims -> eval`

It is built for what-if analysis in constrained worlds, not for open-world prediction.

Mirror 用于在受限世界中做条件化 what-if 推演，而不是做开放世界预测。

## What Mirror Is Not | Mirror 不是什么

- Not a real-world prediction machine
- Not a real-person profiling system
- Not a political influence, law-enforcement, hiring, credit, medical, or judicial decision system
- Not an open-world real-person replica platform

---

## Phase 1 Public Demo Mode

Phase 1 is a read-only, anonymous, deterministic-only public demo. It serves the precomputed Fog Harbor canonical artifacts so a visitor can understand Mirror, inspect branch comparison, review claims, follow evidence, and see the eval summary without an account or a provider key.

Public demo mode does not:

- create worlds
- upload or ingest a visitor corpus
- start a new runtime session or generate a new branch
- enable Hosted GPT or BYOK
- call the OpenAI API
- expose local filesystem paths through public API responses

Default public flags:

```env
MIRROR_PUBLIC_DEMO_MODE=1
MIRROR_ALLOW_ANONYMOUS_RUNS=0
MIRROR_HOSTED_MODEL_ENABLED=0
```

Public read-only endpoints:

- `/` -> guided public demo
- `/review` -> advanced review workspace for the same precomputed artifacts
- `/api/health` -> alive/version only
- `/api/ready` -> logical readiness for canonical artifacts, with degraded readiness surfaced as an HTTP failure
- `/api/public-demo/manifest` -> allowlisted logical artifact ids
- `/api/public-demo/artifacts/<id>` -> allowlisted canonical artifact content

---

## Why Claims, Evidence, And Eval Matter | 为什么强调 claims、evidence 和 eval

- `evidence_ids` keep world objects, actions, and report claims tied to source chunks.
- claim labels distinguish direct branch facts from bounded inference.
- evals prove the pipeline is still deterministic, replayable, and safe enough to trust as a sandbox.

如果没有 `evidence_ids`、claim labels 和 eval，Mirror 就只是“会跑的故事”；有了它们，输出才是可审查、可回放、可评估的推演结果。

---

## 3-Minute Demo Path | 3 分钟上手路径

Clone the repo:

```bash
git clone https://github.com/YSCJRH/mirror-sim.git
cd mirror-sim
```

Install the backend:

```bash
make setup
```

```powershell
./make.ps1 setup
```

Run the canonical checks:

```bash
make smoke
make test
make eval-demo
make eval-transfer
```

```powershell
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
./make.ps1 eval-transfer
```

Build and smoke-test the Phase 1 public demo:

```bash
make public-demo-check
```

```powershell
./make.ps1 public-demo-check
```

Validate the repo-local Codex plugin:

```bash
make plugin-check
make plugin-release-check
make plugin-cli-preflight
make plugin-app-preflight
```

```powershell
./make.ps1 plugin-check
./make.ps1 plugin-release-check
./make.ps1 plugin-cli-preflight
./make.ps1 plugin-app-preflight
```

Start the legacy local development stack:

```bash
make dev-api
make dev-web
```

```powershell
./make.ps1 dev-api
./make.ps1 dev-web
```

Start the current private-beta candidate web product preview:

```powershell
./scripts/start-private-alpha-web.ps1
```

The launcher keeps its historical `private-alpha` filename for compatibility, but it now starts and verifies the private-beta candidate product path.

Run the private-beta candidate web smoke:

```bash
python scripts/smoke_private_beta_web.py
```

```powershell
python .\scripts\smoke_private_beta_web.py
```

The private-beta candidate product path is still available when public demo flags are disabled. It is the Next.js app under `frontend/`, and it shells out to the local Python CLI for session and branch mutations, so the web preview expects:

- `frontend/node_modules` to be installed
- backend Python dependencies to be installed
- a working `python` on `PATH` or `PYTHON`
- the repo to be run in-place, not from a copied frontend-only folder

Extra transfer proof:

```bash
python -m backend.app.cli eval-world --world museum-night
python -m backend.app.cli eval-world --world library-rain
```

## Optional Private-Beta Model Path

This path is not part of the Phase 1 public demo. Mirror can use an LLM inside the rule-bounded decision kernel only in explicitly configured private-beta or local environments.

The current integration path is backend-driven and environment-based:

```powershell
$env:OPENAI_API_KEY="your-api-key"
$env:MIRROR_DECISION_MODEL="your-chat-completions-compatible-gpt-model"
$env:OPENAI_BASE_URL="https://api.openai.com/v1"
```

Interactive sessions can also pin:

- one `decision provider`
- one `decision model`

Current supported session-level providers:

- `openai_compatible`
- `hosted_openai`
- `deterministic_only`

Hosted private-beta GPT access is server-side only and remains disabled by default:

```powershell
$env:MIRROR_HOSTED_MODEL_ENABLED="1"
$env:MIRROR_HOSTED_OPENAI_API_KEY="keep-this-in-local-env-or-deployment-secrets"
$env:MIRROR_HOSTED_DECISION_MODEL="your-chat-completions-compatible-gpt-model"
$env:MIRROR_BETA_ACCESS_CODE="private-beta-code"
$env:MIRROR_HOSTED_DAILY_REQUEST_LIMIT="20"
$env:MIRROR_HOSTED_SESSION_BRANCH_LIMIT="8"
```

Do not commit real values for these variables. The browser sends only the private-beta access code, and the server loads the hosted OpenAI key from local/deployment secrets.

What this means in practice:

- the model does **not** write world state directly
- the model only chooses among legal actions produced by the world rules
- every decision is validated and written into `decision_trace.jsonl`
- if the model is missing, unavailable, or invalid, Mirror falls back deterministically
- interactive runtime sessions can now pin one explicit decision model at creation time
- hosted GPT access is beta-gated and quota-limited before a model call is made

This keeps the private-beta runtime replayable while still allowing explicitly configured model-based branch generation outside the Phase 1 public demo.

Current private-beta candidate entrypoints:

- `/` -> current tracked root remains the guided public Fog Harbor demo
- `/worlds/<world_id>` -> world home
- `/worlds/new` -> bounded-world creation wizard
- `/worlds/<world_id>/perturb` -> main operator path
- `/worlds/<world_id>/runtime/<session_id>` -> live runtime workspace
- `/worlds/<world_id>/runtime/<session_id>/explain` -> live explain workspace
- `/worlds/<world_id>/runtime/<session_id>/report` -> live report workspace
- `/worlds/<world_id>/review` -> world-scoped review surface

Phase 50 Product Boundary Decision (`#401`): the private-beta launch hub remains planning-only for now.
Current tracked code keeps `/` as the public demo, and any future private-beta launch hub route
requires a separate reviewed route contract before replacing `/` or widening public/plugin
behavior. See `docs/plans/phase-50-product-boundary-2026-05-18.md`.

Phase 51 Private-Beta Route Ownership Contract (`#405`): the private-beta launch hub remains planning-only.
`/` and `/review` stay public-demo surfaces, while `/worlds/<world_id>` and its child routes
remain the private-beta candidate product path. See
`docs/plans/phase-51-private-beta-route-contract-2026-05-18.md`; the durable route ownership
contract is also recorded in `docs/architecture/contracts.md` and
`docs/decisions/ADR-0011-private-beta-route-ownership.md`.

Phase 51 Runtime Readiness and World-Scoped Guard Verification (`#406`): synchronous v1
generation remains the current runtime contract. The private-beta composer now passes
route-derived `worldId` into branch generation, CLI-backed mutations pass `--world`, backend
session services reject expected-world mismatches, and world-scoped workspace loading rejects
session or node manifests that conflict with route `worldId` or `sessionId`. See
`docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md`.

Phase 52 Legacy Route Containment and Runtime Scope Audit: Phase 51 is closed after PR
`#409`, issue `#403`, and milestone `Phase 51 - Private-Beta Route Contract and Runtime
Readiness Gate`; private-beta route ownership and world-scoped session guards remain ratified by Phase 51. Phase 52 is closed after PR `#416`, issue `#410`, and milestone `Phase 52 - Legacy Route Containment and Runtime Scope Audit`; before Phase 53 was opened, `audit-github-queue` reported the formal paused stop-state with no active milestone. Repo-truth sync closed
through PR `#414`; the Phase 52 Legacy Top-Level Runtime Route Audit for `#412` closed
through PR `#415` and is recorded in
`docs/plans/phase-52-legacy-runtime-route-audit-2026-05-18.md`. The Phase 52 Runtime Mutation Guard Regression Baseline for `#413` is closed by PR `#416` and is recorded in
`docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md`. It strengthens
runtime mutation guard regression coverage for route-derived `worldId` and public-demo
blocking after the legacy top-level runtime routes audit, without widening public demo,
plugin, Hosted GPT/BYOK, or async contracts. See
`docs/plans/phase-52-successor-gate-2026-05-18.md`.

Phase 53 Transfer Generalization and Third-World Readiness: Phase 53 is closed after
PR `#424`, issue `#418`, and milestone `Phase 53 - Transfer Generalization and
Third-World Readiness`. After closeout, `audit-github-queue` returned the formal paused
stop-state until Phase 54 was opened. `#419` closed the initial transfer gate sync by PR `#422`; `#420` `Phase 53: audit transfer assumptions and third-world readiness constraints` closed the
transfer-assumption audit by PR `#423`; `#421` `Phase 53: add bounded third-world transfer readiness evidence` added `library-rain` as the third original fictional bounded world by
PR `#424`. Phase 53 strengthened bounded transfer generalization evidence without widening
public demo, plugin, Hosted GPT/BYOK, launch hub, async, or runtime mutation boundaries.
See `docs/plans/phase-53-successor-gate-2026-05-19.md`,
`docs/plans/phase-53-transfer-assumption-audit-2026-05-19.md`, and
`docs/plans/phase-53-third-world-transfer-evidence-2026-05-19.md`.

Phase 54 Runtime Orchestration Measurement and Async Contract Decision Gate: Phase 54 is
closed after PR `#430`, issue `#426`, and milestone `Phase 54 - Runtime Orchestration Measurement and Async Contract Decision Gate`. After closeout,
`audit-github-queue` reported `paused` in the formal paused stop-state until Phase 55 was opened. `#427`
`Phase 54: sync repo truth after Phase 53 closeout and define runtime gate` closed by
PR `#429`, and `#428` `Phase 54: refresh runtime measurement and decide async contract boundary` closed by PR `#430`. Phase 54 was a protected-core
runtime measurement and async contract decision gate; it keeps synchronous generation for v1,
defers async task contract ratification, and did not implement async workers, `task_id`,
launch hub, public path, plugin, Hosted GPT/BYOK, or runtime mutation expansion.
See `docs/plans/phase-54-successor-gate-2026-05-19.md` and
`docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md`.

Phase 55 Analysis-First Main Path and Review Surface Guardrails: Phase 55 is closed
after PR `#438`, issue `#432`, and milestone `Phase 55 - Analysis-First Main Path
and Review Surface Guardrails`. `#433` closed by PR `#436`, `#434` closed by PR
`#437`, and `#435` closed by PR `#438`. Immediately after closeout and before
Phase 56 opened, `audit-github-queue` reported `paused` in the formal paused
stop-state.
Phase 55 kept public demo, plugin, Hosted GPT/BYOK, launch hub, async, and runtime
mutation boundaries unchanged, and untracked private-beta, kernel, and design-system
planning notes remain candidate inputs until a reviewed PR intentionally promotes them. See
`docs/plans/phase-55-successor-gate-2026-05-20.md`.

Phase 56 Source-Verified Candidate Promotion and Review Continuity: Phase 56 is
closed after PR `#447`; `#440` closed by PR `#447` after post-merge validation,
and milestone `Phase 56 - Source-Verified Candidate Promotion and Review
Continuity` is closed. `#441` closed by PR `#444`, `#442` closed by PR `#445`,
and `#443` closed by PR `#446`. After
milestone 56 closed, `audit-github-queue` reports `paused` with
`active_milestone: null`. Phase 56 kept public demo, plugin, Hosted GPT/BYOK,
launch hub, async, and runtime mutation boundaries unchanged, and candidate
inputs only become durable truth after a reviewed PR promotes a specific
source-verified signal. See `docs/plans/phase-56-successor-gate-2026-05-20.md`.

Phase 57 - Post-Phase-56 Repo Truth Sync and Successor Boundary: Phase 57 is
closed after PR `#451`; `#448` closed by PR `#451`, `#449` closed by PR `#450`,
milestone `Phase 57 - Post-Phase-56 Repo Truth Sync and Successor Boundary` is
closed, and `audit-github-queue` reports `paused` with no active milestone.
Phase 57 did not open product or runtime implementation scope; untracked
candidate planning notes remain candidate inputs only until a reviewed PR
promotes a specific source-verified signal. See
`docs/plans/phase-57-successor-boundary-2026-05-20.md`.

Phase 58 - Private-Beta Route Readiness Evidence Gate: Phase 58 is closed after
PR `#458`; `#453` `Phase 58 exit gate` closed by PR `#458`, `#454` `Phase 58: sync repo truth after
PR #452 and define route-readiness evidence gate` closed by PR `#456`, and
`#455` `Phase 58: reproduce private-beta route-readiness snapshots with tracked
smoke coverage` closed by PR `#457`. Milestone `Phase 58 - Private-Beta Route
Readiness Evidence Gate` is closed, and `audit-github-queue` reports `paused`
with no active milestone. Phase 58 reproduced narrow
private-beta route-readiness candidate evidence with tracked validation, but it
does not promote broad private-beta readiness or open product/runtime expansion.
See `docs/plans/phase-58-route-readiness-evidence-gate-2026-05-20.md` and
`docs/plans/phase-58-route-readiness-snapshot-evidence-2026-05-20.md`.

Phase 59 - Selected-World Route Continuity Evidence Gate: Phase 59 is closed.
`#459` `Phase 59 exit gate` closed by PR `#464`,
`#460` `Phase 59: sync repo truth after Phase 58 closeout and define
selected-world route gate` closed by PR `#462`, and `#461` `Phase 59: add
GET-only selected-world route smoke for Fog Harbor, Museum Night, and Library
Rain` closed by PR `#463`. Milestone `Phase 59 - Selected-World Route
Continuity Evidence Gate` is closed, and `audit-github-queue` reports
`paused` with no active milestone. Phase 59 is limited to narrow GET-only
route-readiness evidence for selected bounded fictional worlds:
`fog-harbor-east-gate`, `museum-night`, and `library-rain`. It does not promote
broad private-beta readiness, future-world readiness, launch hub behavior,
async/task_id behavior, Hosted GPT/BYOK, upload, auth, billing, database,
object storage, quota, public/plugin path expansion, runtime mutation expansion,
or schema/artifact/claim contract changes. See
`docs/plans/phase-59-selected-world-route-continuity-gate-2026-05-23.md`.
Tracked selected-world route evidence lives in
`docs/plans/phase-59-selected-world-route-evidence-2026-05-23.md`.
Closeout shorthand: `#459` closed by PR `#464`; `#460` closed by PR `#462`; `#461` closed by PR `#463`.

Phase 60 - Selected-World Review Artifact Integrity Gate: Phase 60 is closed.
Milestone `Phase 60 - Selected-World Review Artifact Integrity Gate` is closed,
and `audit-github-queue` reports `paused` with no active milestone. `#465`
`Phase 60 exit gate` closed by PR `#470`. `#466` `Phase 60: sync repo truth
after Phase 59 closeout and define artifact integrity gate` closed by PR
`#468`. `#467` `Phase 60: add selected-world review artifact integrity smoke`
closed by PR `#469`. Phase 60 was limited to narrow selected-world review
artifact integrity evidence for `fog-harbor-east-gate`, `museum-night`, and
`library-rain`; it does not promote broad private-beta readiness,
future-world readiness, launch hub behavior, async/task_id behavior, Hosted
GPT/BYOK, upload, auth, billing, database, object storage, quota, public/plugin
path expansion, runtime mutation expansion, or schema/artifact/claim contract
changes. The gate note lives in
`docs/plans/phase-60-selected-world-artifact-integrity-gate-2026-05-23.md`.
The selected-world review artifact integrity evidence lives in
`docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md`
and is reproduced by `scripts/smoke_phase60_selected_world_artifact_integrity.py`.

---

## What You Can Inspect Locally | 本地能看到什么

- Canonical Fog Harbor artifacts under `artifacts/demo/`
- Second-world transfer artifacts under `artifacts/worlds/museum-night/`
- Third-world transfer artifacts under `artifacts/worlds/library-rain/`
- Transfer summary under `artifacts/transfer/summary.json`
- Review workbench reading from the canonical compare/evidence/eval path

Useful artifact checkpoints:

- `artifacts/demo/graph/graph.json`
- `artifacts/demo/personas/personas.json`
- `artifacts/demo/report/claims.json`
- `artifacts/demo/eval/summary.json`
- `artifacts/worlds/museum-night/eval/summary.json`
- `artifacts/worlds/library-rain/eval/summary.json`

For a guided walkthrough of the canonical demo flow, see [docs/demo/fog-harbor-walkthrough.md](docs/demo/fog-harbor-walkthrough.md).

---

## Current Status | 当前状态

- `v0.1.0` is the formal release baseline.
- The current queue state lives in [docs/plans/current-state-baseline.md](docs/plans/current-state-baseline.md).
- The completed Phase 47 successor gate lives in [docs/plans/phase-47-successor-gate-2026-05-16.md](docs/plans/phase-47-successor-gate-2026-05-16.md).
- The completed Phase 48 successor gate lives in [docs/plans/phase-48-successor-gate-2026-05-17.md](docs/plans/phase-48-successor-gate-2026-05-17.md).
- The completed Phase 49 successor gate lives in [docs/plans/phase-49-successor-gate-2026-05-18.md](docs/plans/phase-49-successor-gate-2026-05-18.md).
- The completed Phase 50 successor gate lives in [docs/plans/phase-50-successor-gate-2026-05-18.md](docs/plans/phase-50-successor-gate-2026-05-18.md).
- The completed Phase 51 successor gate lives in [docs/plans/phase-51-successor-gate-2026-05-18.md](docs/plans/phase-51-successor-gate-2026-05-18.md).
- The completed Phase 52 successor gate lives in [docs/plans/phase-52-successor-gate-2026-05-18.md](docs/plans/phase-52-successor-gate-2026-05-18.md).
- The completed Phase 53 Successor Gate lives in [docs/plans/phase-53-successor-gate-2026-05-19.md](docs/plans/phase-53-successor-gate-2026-05-19.md).
- The completed Phase 53 Transfer Assumption Audit lives in [docs/plans/phase-53-transfer-assumption-audit-2026-05-19.md](docs/plans/phase-53-transfer-assumption-audit-2026-05-19.md).
- The completed Phase 53 Third-World Transfer Evidence note lives in [docs/plans/phase-53-third-world-transfer-evidence-2026-05-19.md](docs/plans/phase-53-third-world-transfer-evidence-2026-05-19.md).
- The completed Phase 54 Successor Gate lives in [docs/plans/phase-54-successor-gate-2026-05-19.md](docs/plans/phase-54-successor-gate-2026-05-19.md).
- The Phase 54 Runtime Measurement and Async Contract Decision lives in [docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md](docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md).
- The completed Phase 55 Successor Gate lives in [docs/plans/phase-55-successor-gate-2026-05-20.md](docs/plans/phase-55-successor-gate-2026-05-20.md).
- The Phase 56 Successor Gate closeout note lives in [docs/plans/phase-56-successor-gate-2026-05-20.md](docs/plans/phase-56-successor-gate-2026-05-20.md).
- The Phase 57 Successor Boundary lives in [docs/plans/phase-57-successor-boundary-2026-05-20.md](docs/plans/phase-57-successor-boundary-2026-05-20.md).
- The Phase 58 Route Readiness Evidence Gate lives in [docs/plans/phase-58-route-readiness-evidence-gate-2026-05-20.md](docs/plans/phase-58-route-readiness-evidence-gate-2026-05-20.md).
- The Phase 58 Route Readiness Snapshot Evidence lives in [docs/plans/phase-58-route-readiness-snapshot-evidence-2026-05-20.md](docs/plans/phase-58-route-readiness-snapshot-evidence-2026-05-20.md).
- The Phase 59 Selected-World Route Continuity Gate lives in [docs/plans/phase-59-selected-world-route-continuity-gate-2026-05-23.md](docs/plans/phase-59-selected-world-route-continuity-gate-2026-05-23.md).
- The Phase 59 Selected-World Route Evidence lives in [docs/plans/phase-59-selected-world-route-evidence-2026-05-23.md](docs/plans/phase-59-selected-world-route-evidence-2026-05-23.md).
- The Phase 60 Selected-World Review Artifact Integrity Gate lives in [docs/plans/phase-60-selected-world-artifact-integrity-gate-2026-05-23.md](docs/plans/phase-60-selected-world-artifact-integrity-gate-2026-05-23.md).
- The Phase 60 Selected-World Review Artifact Integrity Evidence lives in `docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md` and is reproduced by `scripts/smoke_phase60_selected_world_artifact_integrity.py`.
- Phase 61 is closed as `Phase 61 - Selected-World Review Surface Evidence Binding Gate`; `#471` `Phase 61 exit gate` closed by the Phase 61 closeout PR, `#472` `Phase 61: sync repo truth after Phase 60 closeout and define review surface evidence gate` closed by PR `#474`, and `#473` `Phase 61: add selected-world review surface evidence binding smoke` closed by PR `#475`. The milestone is closed, `audit-github-queue` reports `paused` with no active milestone, and `Phase 60 selected-world review artifact integrity evidence remains historical baseline`. The Phase 61 gate lives in `docs/plans/phase-61-selected-world-review-surface-evidence-binding-gate-2026-05-23.md` and covers selected-world review surface evidence binding only. The tracked #473 evidence lives in `docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md` and is reproduced by `scripts/smoke_phase61_selected_world_review_surface_binding.py`.
- Phase 48 is closed after PR `#382`, issue `#375`, and milestone `Phase 48 - Successor Intake and Boundary Contract Triage`.
- Phase 49 is closed after PR `#395`, issue `#383`, and milestone `Phase 49 - Kernel, Perturbation, and Runtime Contract Hardening`; completed work items were `#384`, `#386`, `#388`, `#390`, `#392`, and `#394`.
- Phase 50 is closed after PR `#402`, issue `#396`, and milestone `Phase 50 - Runtime Orchestration Measurement and Product Boundary`; completed work items were `#397`, `#398`, and `#401`. Phase 50 measured before any `task_id` or worker contract is introduced and kept the private-beta launch hub planning-only for now.
- Phase 51 is closed after PR `#409`, issue `#403`, and milestone `Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate`; completed work items were `#404`, `#405`, and `#406`.
- Phase 52 is closed after PR `#416`, issue `#410`, and milestone `Phase 52 - Legacy Route Containment and Runtime Scope Audit`; completed work items were `#411`, `#412`, and `#413`. Before Phase 53 was opened, `audit-github-queue` reported the formal paused stop-state with no active milestone. The legacy top-level runtime routes audit note lives in `docs/plans/phase-52-legacy-runtime-route-audit-2026-05-18.md`; the runtime guard note lives in `docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md`; Phase 52 did not widen public demo, plugin, Hosted GPT/BYOK, or async contracts and keeps route-derived `worldId` guard coverage in scope.
- Phase 53 is closed after PR `#424`, issue `#418`, and milestone `Phase 53 - Transfer Generalization and Third-World Readiness`; after closeout, the queue returned to the formal paused stop-state until Phase 54 was opened. `#419` closed by PR `#422`, `#420` `Phase 53: audit transfer assumptions and third-world readiness constraints` closed by PR `#423`, and `#421` `Phase 53: add bounded third-world transfer readiness evidence` closed by PR `#424`. Phase 53 strengthened bounded transfer generalization evidence without widening public demo, plugin, Hosted GPT/BYOK, launch hub, async, or runtime mutation boundaries, and `library-rain` is the third-world evidence slice.
- Phase 54 is closed after PR `#430`, issue `#426`, and milestone `Phase 54 - Runtime Orchestration Measurement and Async Contract Decision Gate`; after closeout, `audit-github-queue` reported `paused` in the formal paused stop-state until Phase 55 opened. `#427` closed by PR `#429`, and `#428` closed by PR `#430`. Keep synchronous generation for v1. Defer async task contract ratification. Phase 54 covered runtime measurement and async contract decision work without implementing async workers, `task_id`, launch hub, public path, plugin, Hosted GPT/BYOK, or runtime mutation expansion. The Phase 54 Successor Gate lives in `docs/plans/phase-54-successor-gate-2026-05-19.md`; the decision note lives in `docs/plans/phase-54-runtime-measurement-async-contract-decision-2026-05-19.md`.
- Phase 54 decision posture: public demo, plugin, Hosted GPT/BYOK, launch hub, async, and runtime mutation boundaries remain unchanged.
- Phase 55 is closed after PR `#438`, issue `#432`, and milestone `Phase 55 - Analysis-First Main Path and Review Surface Guardrails`; `#433` closed by PR `#436`, `#434` closed by PR `#437`, and `#435` closed by PR `#438`. Immediately after closeout and before Phase 56 opened, `audit-github-queue` reported `paused` in the formal paused stop-state. The Phase 55 Successor Gate lives in `docs/plans/phase-55-successor-gate-2026-05-20.md`.
- Phase 56 is closed after PR `#447`; `#440` closed by PR `#447` after post-merge validation, and milestone `Phase 56 - Source-Verified Candidate Promotion and Review Continuity` is closed. `#441` closed by PR `#444`, `#442` closed by PR `#445`, and `#443` closed by PR `#446`. After milestone 56 closed, `audit-github-queue` reports `paused` with `active_milestone: null`. The Phase 56 Successor Gate lives in `docs/plans/phase-56-successor-gate-2026-05-20.md`.
- Phase 57 is closed after PR `#451`; `#448` closed by PR `#451`, `#449` closed by PR `#450`, milestone `Phase 57 - Post-Phase-56 Repo Truth Sync and Successor Boundary` is closed, and `audit-github-queue` reports `paused` with no active milestone. The Phase 57 Successor Boundary lives in `docs/plans/phase-57-successor-boundary-2026-05-20.md`.
- Phase 58 is closed after PR `#458`; `#453` `Phase 58 exit gate` closed by PR `#458`, `#454` `Phase 58: sync repo truth after PR #452 and define route-readiness evidence gate` closed by PR `#456`, `#455` `Phase 58: reproduce private-beta route-readiness snapshots with tracked smoke coverage` closed by PR `#457`, milestone `Phase 58 - Private-Beta Route Readiness Evidence Gate` is closed, and `audit-github-queue` reports `paused` with no active milestone. The Phase 58 Route Readiness Evidence Gate lives in `docs/plans/phase-58-route-readiness-evidence-gate-2026-05-20.md`, and the tracked snapshot evidence lives in `docs/plans/phase-58-route-readiness-snapshot-evidence-2026-05-20.md`.
- Phase 59 is closed; `#459` `Phase 59 exit gate` closed by PR `#464`, `#460` `Phase 59: sync repo truth after Phase 58 closeout and define selected-world route gate` closed by PR `#462`, `#461` `Phase 59: add GET-only selected-world route smoke for Fog Harbor, Museum Night, and Library Rain` closed by PR `#463`, milestone `Phase 59 - Selected-World Route Continuity Evidence Gate` is closed, and `audit-github-queue` reports `paused` with no active milestone. The Phase 59 Selected-World Route Continuity Gate lives in `docs/plans/phase-59-selected-world-route-continuity-gate-2026-05-23.md`.
- The Phase 59 Selected-World Route Evidence lives in `docs/plans/phase-59-selected-world-route-evidence-2026-05-23.md`.
- Phase 60 is closed; milestone `Phase 60 - Selected-World Review Artifact Integrity Gate` is closed, `#465` `Phase 60 exit gate` closed by PR `#470`, `#466` `Phase 60: sync repo truth after Phase 59 closeout and define artifact integrity gate` closed by PR `#468`, `#467` `Phase 60: add selected-world review artifact integrity smoke` closed by PR `#469`, and `audit-github-queue` reports `paused` with no active milestone. The Phase 60 gate lives in `docs/plans/phase-60-selected-world-artifact-integrity-gate-2026-05-23.md`; the selected-world review artifact integrity evidence lives in `docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md` and is reproduced by `scripts/smoke_phase60_selected_world_artifact_integrity.py`.
- Phase 61 is closed as `Phase 61 - Selected-World Review Surface Evidence Binding Gate`; milestone `Phase 61 - Selected-World Review Surface Evidence Binding Gate` is closed, `#471` `Phase 61 exit gate` closed by the Phase 61 closeout PR, `#472` `Phase 61: sync repo truth after Phase 60 closeout and define review surface evidence gate` closed by PR `#474`, `#473` `Phase 61: add selected-world review surface evidence binding smoke` closed by PR `#475`, and `audit-github-queue` reports `paused` with no active milestone. `Phase 60 selected-world review artifact integrity evidence remains historical baseline`. The gate note lives in `docs/plans/phase-61-selected-world-review-surface-evidence-binding-gate-2026-05-23.md`. The selected-world review surface evidence binding note lives in `docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md` and is reproduced by `scripts/smoke_phase61_selected_world_review_surface_binding.py`.
- Closeout shorthand: `#459` closed by PR `#464`; `#460` closed by PR `#462`; `#461` closed by PR `#463`; `#465` closed by PR `#470`; `#466` closed by PR `#468`; `#467` closed by PR `#469`; `#471` closed by the Phase 61 closeout PR; `#472` closed by PR `#474`; `#473` closed by PR `#475`.
- Private-beta planning material remains candidate input until it is promoted through a reviewed PR.
- Fog Harbor remains the canonical demo world; `museum-night` and `library-rain` are the selected bounded transfer worlds used to prove the pipeline has passed across three selected bounded fictional worlds.

---

## Repo Layout | 仓库结构

```text
mirror-sim
├── backend/          # CLI, pipeline, eval, and automation services
├── frontend/         # world-scoped web product plus legacy review/demo surfaces
├── data/demo/        # canonical Fog Harbor demo
├── data/worlds/      # additional bounded worlds such as museum-night and library-rain
├── docs/             # plans, ADRs, contracts, walkthroughs, release notes
├── evals/            # assertions and eval assets
└── scripts/          # bootstrap and utility scripts
```

---

## Contributing | 贡献方式

Read [AGENTS.md](AGENTS.md) before changing contracts, pipeline behavior, or docs. Mirror favors small, reviewable changes with explicit validation.

Typical flow:

1. Create a focused branch
2. Make a bounded change
3. Run the relevant checks
4. Open a PR against `main`

---

## License | 许可证

Mirror is released under the MIT License. See [LICENSE](LICENSE) for details.
