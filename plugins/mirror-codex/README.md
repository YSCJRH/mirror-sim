# Mirror Codex Plugin

Mirror Codex is a repo-local Codex plugin for understanding Mirror's Phase 1 public demo.

This first version is intentionally read-only and local-first. It packages one skill, `mirror-demo`, plus a small MCP server that guides Codex through the deterministic Fog Harbor demo without accepting arbitrary artifact paths, uploading data, calling model providers, or enabling runtime mutation.

## Boundaries

- Mirror is a constrained, evidence-backed, replayable what-if simulation sandbox for fictional or explicitly authorized worlds.
- The Phase 1 public demo is deterministic-only, read-only, anonymous, and precomputed.
- The public path does not create worlds, upload corpora, start new runs, enable Hosted GPT or BYOK, call the OpenAI API, add auth, add billing, add a database, add object storage, or add quotas.
- User configuration and provider secrets must stay in the user's local environment or their own deployment environment. They must not be committed, exposed to frontend code, printed in build logs, written to artifacts, or included in error pages.
- Do not use `NEXT_PUBLIC_OPENAI_API_KEY`.

## Contents

- `.codex-plugin/plugin.json`: Codex plugin metadata with `Read` capability only.
- `skills/mirror-demo/SKILL.md`: Workflow instructions for safe demo inspection.
- `.mcp.json`: MCP server registration for the fixed read-only `mirror-demo` stdio server.
- `mirror_codex_mcp/`: Local Python implementation for read-only demo tools.
- `scripts/run_mcp.py`: MCP server entrypoint.
- `scripts/smoke_mcp_stdio.py`: Fixed stdio smoke test for plugin install readiness.
- `scripts/acceptance_check.py`: Repo-local plugin install acceptance check.
- `scripts/cli_marketplace_preflight.py`: Optional Codex CLI marketplace registration preflight.
- `scripts/app_protocol_preflight.py`: Optional Codex app-server plugin install preflight.
- `scripts/write_ui_acceptance_template.py`: Blank interactive UI acceptance record helper.
- `scripts/check_pr_scope.py`: Workspace scope check for the plugin V1 PR.
- `scripts/validate_plugin.py`: Static validation for the plugin shell.
- `tests/`: Plugin MCP and sanitizer tests.

## Runbook

Use `docs/deploy/mirror-codex-plugin.md` for clean Codex install acceptance. Use `docs/releases/mirror-codex-plugin-v1.md` for the v1 release note and validation gate.

## MCP Tools

The MCP server exposes only these read-only tools:

- `get_demo_manifest`
- `get_demo_artifact`
- `get_eval_summary`
- `explain_demo_claim`
- `compare_demo_branches`

Tool inputs are logical ids such as `demo.claims`, `claim_evacuation_turn`, and `branch_reporter_detained`. Inputs are not filesystem paths, URLs, shell commands, provider names, or API-key fields.

## MCP Resources And Prompts

The MCP server also exposes read-only resources and prompts for easier onboarding.

Resource URIs are fixed allowlist entries:

- `mirror-demo://manifest`
- `mirror-demo://artifact/demo.claims`
- `mirror-demo://artifact/demo.eval_summary`
- `mirror-demo://artifact/demo.compare`

The full artifact URI set mirrors the logical public demo artifact ids. Prompt names are fixed allowlist entries:

- `inspect-public-demo`
- `review-claim-evidence`
- `compare-demo-branches`

Resources and prompts do not accept arbitrary paths, URLs, commands, provider config, API keys, model names, uploads, or mutation requests.

## Evidence Navigation Example

For a bounded claim review, use fixed MCP resources or equivalent logical artifact ids:

1. Read `mirror-demo://artifact/demo.claims`.
2. Select `claim_evacuation_turn`.
3. Preserve the claim `label` and `evidence_ids` in any summary.
4. Read `mirror-demo://artifact/demo.chunks` and match these evidence ids:
   `chunk_doc_budget_minutes_002`, `chunk_doc_budget_minutes_003`, and
   `chunk_doc_engineering_inspection_002`.
5. Read `mirror-demo://artifact/demo.documents` and match each chunk's `document_id` to
   sanitized document metadata.
6. Phrase the conclusion as "based on the current corpus and deterministic rules"; do not
   present it as a real-world prediction.

Do not ask the user for filesystem paths, URLs, provider keys, or local config during this
workflow. Public and plugin-facing output must not expose stripped path fields such as
`source_path`.

## MCP Contract

The durable v1 MCP contract is recorded in `docs/decisions/ADR-0010-mirror-codex-plugin-mcp-contract.md`. Keep the plugin README, skill, validator, and tests in sync with that ADR when changing the tool surface.

Contract summary:

- One fixed local stdio server: `python ./scripts/run_mcp.py`.
- Five allowlisted read-only tools, all with `annotations.readOnlyHint: true`.
- Fixed read-only resources under `mirror-demo://...` and fixed prompt names.
- Closed input schemas with `additionalProperties: false`.
- Logical ids only; no arbitrary paths, URLs, commands, provider config, API keys, or model names.
- Sanitized output only; no `artifact_paths`, `summary_path`, `trace_path`, `snapshot_dir`, or document `source_path`.
- Claims returned through the plugin must keep both `label` and `evidence_ids`.

## Typical Checks

Run these from the repository root:

```powershell
./make.ps1 plugin-check
./make.ps1 plugin-release-check
./make.ps1 plugin-cli-preflight
./make.ps1 plugin-app-preflight
```

`plugin-check` runs static validation, MCP tests, the fixed stdio smoke, and repo-local plugin install acceptance. `plugin-release-check` adds plugin PR scope hygiene, secret scanning, phase2 audit, and whitespace diff validation. To run the same release steps manually:

```powershell
python plugins/mirror-codex/scripts/validate_plugin.py
python -m pytest plugins/mirror-codex/tests -q
python plugins/mirror-codex/scripts/smoke_mcp_stdio.py
python plugins/mirror-codex/scripts/acceptance_check.py
python plugins/mirror-codex/scripts/check_pr_scope.py
python scripts/check_no_secrets.py
python -m backend.app.cli audit-phase phase2
git diff --check
```

The PR scope check allows this plugin V1 change set and reports local-only untracked
`docs/plans/...` files and generated `backend/mirror_engine.egg-info/...` packaging metadata
separately so they do not get staged into the plugin PR.

To prepare a precise staging list without adding local-only plan files:

```powershell
python plugins/mirror-codex/scripts/check_pr_scope.py --stage-list
```

The output is path-only and can be reviewed before staging, or piped to Git:

```powershell
python plugins/mirror-codex/scripts/check_pr_scope.py --stage-list | git add --pathspec-from-file=-
```

For a clean local install check, enable the repo-local `mirror-codex` plugin from `.agents/plugins/marketplace.json`, then ask Codex to use the `mirror-demo` skill to inspect `demo.claims` and compare `branch_reporter_detained`. The same MCP path is covered by `smoke_mcp_stdio.py`.

For interactive Codex app UI acceptance, use
`docs/deploy/mirror-codex-plugin-ui-acceptance.md` and record the session with
`docs/deploy/mirror-codex-plugin-ui-acceptance-template.md`. To create a local ignored copy
under `artifacts/manual/`, run:

```powershell
python plugins/mirror-codex/scripts/write_ui_acceptance_template.py
```

This helper only writes a blank record. It does not call Codex, model providers, or MCP tools,
and it does not prove that UI tool cards appeared.

If the Codex CLI is installed, you can also run a local marketplace preflight without using
your real Codex home:

```powershell
./make.ps1 plugin-cli-preflight
```

This script creates an isolated temporary `CODEX_HOME`, runs `codex marketplace add` against
the repository root, and renders `codex debug prompt-input`. It does not call `codex exec`,
does not call model providers, and does not close the Codex app UI `TODO[verify]`.

For a closer non-interactive app-surface check, run:

```powershell
./make.ps1 plugin-app-preflight
```

This starts `codex app-server` with an isolated temporary `CODEX_HOME`, verifies
`plugin/list`, `plugin/read`, `plugin/install`, and `skills/list`, and confirms that
`mirror-codex:mirror-demo` is installed and enabled through the app protocol. It also attempts
`mcpServerStatus/list`; status timeout is recorded as open evidence unless the script is run
with `--require-mcp-status`. It still does not inspect interactive Codex app UI labels or
controls.

Remote public demo checks are optional and must be explicit. They are not part of `plugin-check`:

```powershell
./make.ps1 plugin-remote-check
./make.ps1 plugin-remote-check -BaseUrl https://mirror-public-demo.onrender.com
```

Keep this remote check out of default local validation so the plugin remains local-first and usable without network access.

If a later change touches frontend code, also run:

```powershell
npm run build --prefix frontend
```

## Public Demo Surfaces

Use logical artifact ids from the public manifest:

- `demo.report`
- `demo.claims`
- `demo.eval_summary`
- `demo.compare`
- `demo.documents`
- `demo.chunks`
- `demo.graph`
- `demo.rubric`

Do not treat a user-supplied filesystem path as a demo artifact id.
