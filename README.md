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
```

```powershell
./make.ps1 plugin-check
./make.ps1 plugin-release-check
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

- `/` -> launch hub
- `/worlds/<world_id>` -> world home
- `/worlds/new` -> bounded-world creation wizard
- `/worlds/<world_id>/perturb` -> main operator path
- `/worlds/<world_id>/runtime/<session_id>` -> live runtime workspace
- `/worlds/<world_id>/runtime/<session_id>/explain` -> live explain workspace
- `/worlds/<world_id>/runtime/<session_id>/report` -> live report workspace
- `/worlds/<world_id>/review` -> world-scoped review surface

---

## What You Can Inspect Locally | 本地能看到什么

- Canonical Fog Harbor artifacts under `artifacts/demo/`
- Second-world transfer artifacts under `artifacts/worlds/museum-night/`
- Transfer summary under `artifacts/transfer/summary.json`
- Review workbench reading from the canonical compare/evidence/eval path

Useful artifact checkpoints:

- `artifacts/demo/graph/graph.json`
- `artifacts/demo/personas/personas.json`
- `artifacts/demo/report/claims.json`
- `artifacts/demo/eval/summary.json`
- `artifacts/worlds/museum-night/eval/summary.json`

For a guided walkthrough of the canonical demo flow, see [docs/demo/fog-harbor-walkthrough.md](docs/demo/fog-harbor-walkthrough.md).

---

## Current Status | 当前状态

- `v0.1.0` is the formal release baseline.
- The current stop-state / queue state lives in [docs/plans/current-state-baseline.md](docs/plans/current-state-baseline.md).
- The current private-beta candidate status is tracked in [docs/plans/private-beta-readiness-2026-04-23.md](docs/plans/private-beta-readiness-2026-04-23.md).
- No Phase 47 is pre-opened or implied here.
- Fog Harbor remains the canonical demo world; `museum-night` is the minimal transfer world used to prove the pipeline is not single-world-only.

---

## Repo Layout | 仓库结构

```text
mirror-sim
├── backend/          # CLI, pipeline, eval, and automation services
├── frontend/         # world-scoped web product plus legacy review/demo surfaces
├── data/demo/        # canonical Fog Harbor demo
├── data/worlds/      # additional bounded worlds such as museum-night
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
