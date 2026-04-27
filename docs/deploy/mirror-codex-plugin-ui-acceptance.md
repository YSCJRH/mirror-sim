# Mirror Codex Plugin UI Acceptance

## Intent

Use this checklist to verify the repo-local `mirror-codex` plugin in a Codex app session after
PR #353. This is a UI-facing complement to `docs/deploy/mirror-codex-plugin.md`; it does not
replace the deterministic filesystem and MCP checks.

## Current Evidence

- Direct evidence: `main` contains `.agents/plugins/marketplace.json` with a repo-local
  `mirror-codex` entry whose source path is `./plugins/mirror-codex`, installation policy is
  `AVAILABLE`, and category is `Engineering`.
- Direct evidence: `plugins/mirror-codex/.codex-plugin/plugin.json` exposes `skills:
  "./skills/"`, `mcpServers: "./.mcp.json"`, and interface capability `Read`.
- Direct evidence: `plugins/mirror-codex/.mcp.json` registers one fixed `mirror-demo` server
  with command `python` and args `["./scripts/run_mcp.py"]`.
- Direct evidence: `./make.ps1 plugin-release-check` validates the plugin manifest, MCP
  tools/resources/prompts, install acceptance, secret scan, phase2 audit, and PR scope.

TODO[verify]: Record the exact Codex app UI labels and install/enable controls from a clean
Codex versioned environment. The current local CLI checks cannot inspect interactive Codex app
controls directly.

## Current Session Preflight

Direct evidence: in the Codex thread that created this checklist, tool discovery for
`mirror-codex` and `mirror-demo` did not expose Mirror plugin tools after PR #353 and PR #354
were merged. This indicates the running thread cannot be used as a clean post-install UI
acceptance session.

Reasonable inference: repo-local plugin discovery is likely evaluated when a Codex app session
or workspace is opened, not dynamically after a plugin lands on `main` inside an already-running
thread.

Do not close the UI `TODO[verify]` from this current-thread preflight alone. Use a new Codex
app session opened at the repository root and record the exact UI labels and controls observed
there.

## CLI Marketplace Preflight

Run the scriptable preflight:

```powershell
./make.ps1 plugin-cli-preflight
```

Direct evidence: on 2026-04-27, `codex marketplace add D:\mirror` succeeded in an isolated
temporary `CODEX_HOME` and wrote:

```toml
[marketplaces.mirror-local]
source_type = "local"
source = '\\?\D:\mirror'
```

Direct evidence: `codex marketplace add D:\mirror\.agents\plugins` failed because the CLI
looks for `.agents/plugins/marketplace.json` under the supplied marketplace root. Use the
repository root as the source when testing local marketplace registration from the CLI.

Direct evidence: adding the marketplace, then manually setting
`[plugins."mirror-codex@mirror-local"] enabled = true` in the isolated config, did not make
the `mirror-demo` skill appear in `codex -C D:\mirror debug prompt-input`.

Reasonable inference: local marketplace registration is scriptable, but plugin installation
or enablement includes Codex app state that is not reproduced by manually editing config.
This CLI preflight can support troubleshooting, but it still does not close the UI
`TODO[verify]`.

## UI Acceptance Steps

Start from a clean Codex app session opened at the repository root.

1. Open the plugin or marketplace view.
2. Confirm the marketplace display name is `Mirror Local Plugins`.
3. Confirm a repo-local plugin named `mirror-codex` or displayed as `Mirror Codex` is visible.
4. Confirm the plugin shows a read-only capability or equivalent `Read` wording.
5. Enable or install the plugin using the app UI.
6. Confirm the `mirror-demo` skill is available.
7. Confirm the MCP server named `mirror-demo` is registered, if the UI exposes MCP servers.
8. Ask: `Use Mirror Demo to inspect demo.claims and explain claim_evacuation_turn.`
9. Ask: `Use Mirror Demo to compare branch_reporter_detained against the baseline.`
10. Ask: `Use Mirror Demo to review claim_evacuation_turn and show how its evidence_ids map to chunks and sanitized document metadata.`

## Expected Behavior

- Codex frames Mirror as a constrained, evidence-backed, replayable what-if simulation sandbox
  for fictional or explicitly authorized worlds.
- Codex keeps the Phase 1 public demo deterministic-only, read-only, anonymous, precomputed,
  and local-first for plugin use.
- Codex uses logical artifact ids or fixed `mirror-demo://...` resources, not arbitrary
  filesystem paths.
- Claim responses preserve both `label` and `evidence_ids`.
- Evidence navigation for `claim_evacuation_turn` includes
  `chunk_doc_budget_minutes_002`, `chunk_doc_budget_minutes_003`, and
  `chunk_doc_engineering_inspection_002`.
- Output does not expose `artifact_paths`, `summary_path`, `trace_path`, `snapshot_dir`,
  document `source_path`, local filesystem paths, provider config, API keys, or model names.
- Output does not present Mirror as a real-world prediction tool, real-person digital twin
  system, political persuasion tool, or high-risk decision system.

## Failure Handling

If the plugin does not appear in the UI, rerun:

```powershell
python plugins/mirror-codex/scripts/acceptance_check.py
```

Then confirm:

- `.agents/plugins/marketplace.json` exists at repo root
- the marketplace source path is `./plugins/mirror-codex`
- `plugins/mirror-codex/.codex-plugin/plugin.json` has `"name": "mirror-codex"`
- `plugins/mirror-codex/.mcp.json` registers only `mirror-demo`

If UI labels differ from this document, update this file and
`docs/deploy/mirror-codex-plugin.md` with the direct evidence and leave any remaining unknowns
as `TODO[verify]: ...`.
