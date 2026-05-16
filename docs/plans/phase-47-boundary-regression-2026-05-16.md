# Phase 47 Boundary Regression

Date: 2026-05-16

Issue: `#367` `Phase 47: public/private/plugin boundary regression`

## Purpose

Record the first Phase 47 boundary regression pass after the successor queue opened. This
report verifies the current public demo and Mirror Codex plugin boundaries without changing
runtime behavior, public API routes, frontend routes, scenario DSL, claim labels, run trace
shape, artifact layout, or plugin MCP contract.

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
  - Plugin PR scope check passed.
  - Secret scan passed.
  - `python -m backend.app.cli audit-phase phase2` reported `status: pass`.
  - `git diff --check` passed inside the release check.
- `plugins/mirror-codex/tests/test_mcp_server.py` covers logical artifact ids, sanitizer
  behavior, path rejection, and claim integrity for `label` plus `evidence_ids`.
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim` reported
  `ready` with active milestone `Phase 47 - Boundary Readiness and Successor Hygiene`.

## Boundary Findings

- Public demo remains deterministic-only, read-only, anonymous, and logical-artifact-id-only.
- Public demo mutation routes remain blocked in public mode.
- Public artifact responses remain sanitized against internal path fields.
- Mirror Codex remains read-only and local-first for deterministic demo inspection.
- Mirror Codex plugin checks continue to exclude local-only untracked `docs/plans/...` files
  from plugin PR scope.
- Hosted GPT, BYOK, upload, auth, billing, database, object storage, and quota behavior did
  not enter the public demo or plugin path in this regression pass.

## Non-Blocking Observations

- `./make.ps1 public-demo-check` printed transient network `ETIMEDOUT` retry warnings after
  the main local smoke output. The command exit code was `0`, the local smoke payload passed,
  and the generated `public-demo-http-smoke-*.err.log` file for the run was empty.
- This pass did not close the Mirror Codex interactive UI tool-card acceptance item. That item
  still requires a clean Codex app session with visible MCP tool or resource evidence.

## Validation Commands

```powershell
./make.ps1 public-demo-check
./make.ps1 plugin-release-check
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```

## Remaining Phase 47 Work

- `#368` should harden runtime world safety preflight before unsafe user-authored content is
  written.
- `#369` should keep the main product path centered on compare, evidence, and eval.
- `#365` remains the blocked exit gate until Phase 47 work satisfies its exit criteria.
