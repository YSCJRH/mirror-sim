# Phase 48 Boundary Acceptance

Date: 2026-05-17

Issue: `#377` `Phase 48: public private plugin boundary acceptance`

## Purpose

Record the Phase 48 boundary acceptance pass after the Phase 47 closeout and Phase 48
successor-gate sync. This report verifies the public demo and Mirror Codex plugin boundaries
without changing runtime behavior, public API routes, frontend routes, scenario DSL, claim
labels, run trace shape, artifact layout, or plugin MCP contract.

## Direct Evidence

- `./make.ps1 public-demo-check` passed.
  - `eval-demo status: pass (23/23 checks passed)`.
  - Provider secret scan passed for `artifacts\demo`.
  - `npm run build --prefix frontend` completed successfully.
  - Provider secret scan passed for `frontend\.next\static`.
  - Local public demo HTTP smoke reported:
    - `publicDemoMode: true`
    - `artifact_count: 8`
    - `claims: 3`
    - `eval_status: pass`
    - workbench `branchCount: 4`
    - workbench `comparisonCount: 3`
    - workbench `claimCount: 3`
    - pages `/`, `/review`, `/changes/<branch>`, `/explain/<branch>`, and `/worlds/new`
      returned `200`.
  - Local smoke logs were written under `artifacts\ui-review\` and remain generated
    artifacts, not tracked source files.
- `scripts/smoke_public_demo_web.py` directly checks public-demo boundary behavior:
  - `/api/health` and `/api/ready` must report `publicDemoMode: true`.
  - public artifact payloads must not expose `artifact_paths`, `summary_path`, `trace_path`,
    `snapshot_dir`, or `source_path`.
  - `/api/runtime/start-session`, `/api/runtime/generate-branch`,
    `/api/runtime/rollback-session`, and `/api/worlds/create` must return `403` in public
    demo mode.
- `./make.ps1 plugin-release-check` passed.
  - Mirror Codex plugin validation passed.
  - `python -m pytest plugins\mirror-codex\tests -q` reported `10 passed`.
  - MCP stdio smoke passed.
  - Plugin install acceptance passed.
  - Plugin PR scope check passed and kept local-only untracked `docs/plans/...` files out of
    plugin PR scope.
  - Secret scan passed.
  - `python -m backend.app.cli audit-phase phase2` reported `status: pass`.
  - Phase 2 audit confirmed all report claims keep `label` and `evidence_ids`.
- `./make.ps1 plugin-app-preflight` passed as app-server protocol evidence.
  - `plugin/list` saw `mirror-codex@mirror-local` from
    `D:\mirror\.agents\plugins\marketplace.json`.
  - `plugin/read` reported display name `Mirror Codex`, skill
    `mirror-codex:mirror-demo`, and MCP server `mirror-demo`.
  - `plugin/install` passed with no `appsNeedingAuth`.
  - `skills/list` reported `mirror-codex:mirror-demo` enabled after install.
  - The preflight reported `calls_model_provider: false`.
  - Optional `mcpServerStatus/list` and `mcpServer/resource/read` probes timed out and are
    recorded as open app/session integration evidence, not MCP contract failures.
- `docs/decisions/ADR-0010-mirror-codex-plugin-mcp-contract.md` remains the accepted v1
  Mirror Codex MCP contract.

## Boundary Findings

- Public demo remains deterministic-only, read-only, anonymous, and logical-artifact-id-only.
- Public demo mutation routes remain blocked in public mode.
- Public artifact responses remain sanitized against internal path fields.
- Mirror Codex remains read-only, local-first, and deterministic-demo-only.
- Mirror Codex exposes one fixed `mirror-demo` MCP server and does not add mutating tools.
- Hosted GPT, BYOK, upload, create-world, auth, billing, database, object storage, and quota
  behavior did not enter the public demo or plugin path in this acceptance pass.

## Interactive UI Evidence Status

This pass does not close the Mirror Codex interactive UI tool-card acceptance item.

Direct evidence available in repo-tracked docs:

- `docs/deploy/mirror-codex-plugin-ui-acceptance.md` defines three evidence layers: MCP
  contract evidence, app-server protocol evidence, and interactive UI evidence.
- `./make.ps1 plugin-release-check` proves the MCP contract layer.
- `./make.ps1 plugin-app-preflight` proves plugin inventory, install, and skill visibility
  through the app-server protocol layer.

Open evidence:

- TODO[verify]: A clean Codex app session must still record visible MCP tool cards, resource
  traces, or equivalent observable call evidence for the seven UI prompts before the
  interactive UI item can be classified as `pass`.
- TODO[verify]: The app-server preflight timed out on optional `mcpServerStatus/list` and
  `mcpServer/resource/read`; this remains open app/session integration evidence and does not
  change the v1 MCP contract.

## Validation Commands

```powershell
./make.ps1 public-demo-check
./make.ps1 plugin-release-check
./make.ps1 plugin-app-preflight
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```

## Remaining Phase 48 Work

- `#378` should audit private-beta runtime route and provider-secret contract language before
  new runtime work is promoted.
- `#379` should convert kernel and perturbation follow-up material into explicit Phase 49
  candidate work.
- `#375` remains the blocked exit gate until Phase 48 work satisfies its exit criteria.
