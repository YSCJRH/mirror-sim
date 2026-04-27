# Mirror Codex Plugin Runbook

## Intent

Use this runbook to verify the repo-local `mirror-codex` plugin in a clean Codex
environment. The plugin is for read-only inspection of Mirror's deterministic Phase 1
public demo. It must not upload data, call model providers, create worlds, mutate runtime
state, or read arbitrary filesystem paths.

## Scope

This runbook covers:

- repo-local marketplace discovery from `.agents/plugins/marketplace.json`
- plugin manifest and skill validation
- local MCP stdio smoke for the fixed `mirror-demo` server
- manual demo-inspection prompts for Codex

This runbook does not cover Hosted GPT, BYOK, corpus upload, auth, billing, database, object
storage, quota, or runtime mutation.

TODO[verify]: Codex plugin UI labels and install controls can vary by Codex version. Treat the
filesystem checks and MCP smoke below as the stable acceptance path, and record any UI-specific
differences in a follow-up note.

## Preconditions

From the repository root:

```powershell
python -m backend.app.cli eval-demo
./make.ps1 plugin-check
./make.ps1 plugin-release-check
```

The plugin check must report:

- `Mirror Codex plugin validation passed.`
- plugin MCP tests passing
- `Mirror Codex MCP stdio smoke passed.`
- `Mirror Codex plugin install acceptance passed.`
- `Mirror Codex plugin PR scope check passed.`

No provider key is required. Do not set `NEXT_PUBLIC_OPENAI_API_KEY`.

## Discovery Checks

Confirm the marketplace entry is repo-local and available:

```powershell
Get-Content -Raw .agents/plugins/marketplace.json
Get-Content -Raw plugins/mirror-codex/.codex-plugin/plugin.json
Get-Content -Raw plugins/mirror-codex/.mcp.json
```

Expected facts:

- marketplace source path is `./plugins/mirror-codex`
- installation policy is `AVAILABLE`
- plugin capability is `Read`
- MCP server command is `python` with args `["./scripts/run_mcp.py"]`
- no hooks or apps are registered

The deterministic install acceptance check performs the same discovery from the repository
root, resolves the repo-local plugin path, starts the MCP server from the plugin directory
using `.mcp.json`, and verifies tools, resources, prompts, claim evidence, sanitized document
metadata, and path-argument rejection:

```powershell
python plugins/mirror-codex/scripts/acceptance_check.py
```

## Codex Manual Acceptance

After enabling the repo-local plugin in Codex, ask Codex:

```text
Use Mirror Demo to inspect demo.claims and explain claim_evacuation_turn.
```

Expected behavior:

- Codex reads Mirror's public demo boundary before summarizing.
- Codex uses logical artifact ids, not filesystem paths.
- The claim explanation keeps both `label` and `evidence_ids`.
- The answer uses bounded wording such as "based on the deterministic Fog Harbor demo".

Then ask:

```text
Use Mirror Demo to compare branch_reporter_detained against the baseline.
```

Expected behavior:

- The comparison is framed as deterministic branch comparison, not real-world prediction.
- Output does not expose `summary_path`, `trace_path`, `snapshot_dir`, or local paths.

## Evidence Navigation Acceptance

For a manual evidence walk, ask Codex:

```text
Use Mirror Demo to review claim_evacuation_turn and show how its evidence_ids map to chunks and sanitized document metadata.
```

Expected behavior:

- Codex reads `demo.claims`, `demo.chunks`, and `demo.documents` through logical ids or fixed
  `mirror-demo://...` resources.
- Codex preserves `label` and `evidence_ids` for `claim_evacuation_turn`.
- Codex can identify the evidence ids `chunk_doc_budget_minutes_002`,
  `chunk_doc_budget_minutes_003`, and `chunk_doc_engineering_inspection_002`.
- Codex uses bounded wording such as "based on the current corpus and deterministic rules".
- Codex does not ask for filesystem paths, URLs, provider keys, uploads, or local config.
- Codex does not expose stripped path fields such as `source_path`.

## MCP Smoke

Run the fixed stdio smoke:

```powershell
python plugins/mirror-codex/scripts/smoke_mcp_stdio.py
```

The smoke verifies:

- `initialize`
- `tools/list`
- `resources/list`
- `prompts/list`
- `get_demo_manifest`
- `get_eval_summary`
- `explain_demo_claim`
- `compare_demo_branches`
- rejection of a path-bearing extra argument

## Optional Remote Public Demo Check

Remote checks are explicit release checks, not local plugin defaults:

```powershell
./make.ps1 plugin-remote-check
./make.ps1 plugin-remote-check -BaseUrl https://mirror-public-demo.onrender.com
```

Expected remote facts:

- `/api/health` and `/api/ready` return public demo mode
- readiness reports 8 artifacts ok
- workbench reports 4 branches and 3 claims
- eval status is `pass`
- mutation routes remain blocked

## Troubleshooting

If artifacts are missing, regenerate the deterministic demo:

```powershell
python -m backend.app.cli eval-demo
```

If the plugin does not appear in Codex UI, first verify:

- `.agents/plugins/marketplace.json` exists at repo root
- `plugins/mirror-codex/.codex-plugin/plugin.json` has `"name": "mirror-codex"`
- `.mcp.json` registers only `mirror-demo`

If remote smoke fails with a URL or TLS error, rerun with explicit retries and inspect whether
PowerShell can reach the endpoints:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri https://mirror-public-demo.onrender.com/api/health
Invoke-WebRequest -UseBasicParsing -Uri https://mirror-public-demo.onrender.com/api/ready
```

If secret scanning fails, do not suppress the finding. Remove the secret-shaped value and rerun:

```powershell
python scripts/check_no_secrets.py
```

## Release Gate

For plugin-facing changes, run:

```powershell
./make.ps1 plugin-release-check
```

The release gate includes `plugins/mirror-codex/scripts/check_pr_scope.py`. It allows the
plugin V1 files and reports local-only untracked `docs/plans/...` files plus generated
`backend/mirror_engine.egg-info/...` packaging metadata separately so they stay out of the
plugin PR.

To print the exact path list for staging, run:

```powershell
python plugins/mirror-codex/scripts/check_pr_scope.py --stage-list
```

Review the output first. To stage only those paths:

```powershell
python plugins/mirror-codex/scripts/check_pr_scope.py --stage-list | git add --pathspec-from-file=-
```

If frontend code or frontend routes changed, also run:

```powershell
npm run build --prefix frontend
```
