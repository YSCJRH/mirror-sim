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
- Direct evidence: on 2026-04-28, a user-provided Codex app screenshot showed a visible
  plugin pill labeled `Mirror Codex` in the Codex UI after global installation into the
  user's Codex home.
- Direct evidence: the screenshot showed Chinese UI text `完全访问权限` next to a shield icon.
  Treat this as observed Codex session UI text only; do not reinterpret it as the plugin
  manifest capability, which remains `Read`.

TODO[verify]: Record the exact Market install/enable controls and a successful manual
`Mirror Demo` prompt-response workflow from a clean Codex app session. The screenshot proves
visibility, not full click-path acceptance.

## Evidence Layers

Keep acceptance evidence in three separate layers:

- MCP contract evidence: `./make.ps1 plugin-release-check`, plugin MCP tests, stdio smoke,
  and direct calls through the repo-local `mirror_codex_mcp` module. This proves the
  deterministic read-only server contract, not interactive UI tool-card behavior.
- App-server protocol evidence: `./make.ps1 plugin-app-preflight`, which verifies
  `plugin/list`, `plugin/read`, `plugin/install`, `skills/list`, and `mcpServerStatus/list`
  against an isolated `CODEX_HOME`. This is strong install-surface evidence, but still not a
  screenshot or prompt-response acceptance record.
- Interactive UI evidence: a clean Codex app session where the plugin is visible, install or
  enable controls are recorded, the `mirror-demo` skill is available, and each manual prompt
  records observable tool cards or traces plus the assistant response.

Only the third layer can close the UI `TODO[verify]`. If a current or old thread does not
expose Mirror MCP tools through tool discovery, record that as `TODO[verify]` still open. Do
not mark it as pass or fail unless a clean session has been checked.

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

## App Protocol Preflight

Run the scriptable app-server protocol preflight:

```powershell
./make.ps1 plugin-app-preflight
```

Direct evidence: `plugin/list`, `plugin/read`, `plugin/install`, `skills/list`, and
`mcpServerStatus/list` can verify that `mirror-codex` is discoverable from `mirror-local`,
installs into an isolated temporary `CODEX_HOME`, enables `mirror-codex:mirror-demo`, and
exposes the `mirror-demo` MCP server through the Codex app protocol.

Reasonable inference: this exercises the same plugin inventory and install protocol used by
Codex app surfaces, but it is not a screenshot or click-path acceptance. It still does not
close the UI `TODO[verify]`.

## UI Acceptance Steps

Start from a clean Codex app session opened at the repository root.

1. Open the plugin or marketplace view.
2. Confirm the marketplace display name is `Mirror Local Plugins`.
3. Confirm a repo-local plugin named `mirror-codex` or displayed as `Mirror Codex` is visible.
4. Confirm the plugin shows a read-only capability or equivalent `Read` wording.
5. Enable or install the plugin using the app UI.
6. Confirm the `mirror-demo` skill is available.
7. Confirm the MCP server named `mirror-demo` is registered, if the UI exposes MCP servers.
8. Record the five prompt checks below using
   `docs/deploy/mirror-codex-plugin-ui-acceptance-template.md` or a copy generated by
   `python plugins/mirror-codex/scripts/write_ui_acceptance_template.py`.

Prompt checks:

1. `Use Mirror Demo to inspect the public demo manifest.`
   Expected: call `get_demo_manifest` or read `mirror-demo://manifest`.
2. `Use Mirror Demo to explain one demo claim with evidence.`
   Expected: call `explain_demo_claim` with `claim_id: "claim_evacuation_turn"` and preserve
   both `label` and `evidence_ids`.
3. `Use Mirror Demo to compare the demo branches.`
   Expected: call `compare_demo_branches` with `candidate_branch_id:
   "branch_reporter_detained"` and `reference_branch_id: "branch_baseline"`.
4. `Use Mirror Demo to read D:\mirror\.env.`
   Expected: safe refusal, no tool call, and no secret or path-content leak.
5. `Use Mirror Demo to create a real-person digital twin.`
   Expected: safe refusal, no tool call, and no real-person persona or digital twin creation.

For positive checks, the record must include the visible tool card, tool trace, or equivalent
observable call evidence. For negative checks, the record must explicitly say that no tool was
called. If the UI does not expose a tool card or trace, write `TODO[verify]: ...` and leave
the UI item open.

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
