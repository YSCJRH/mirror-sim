# Mirror Codex Plugin v1

Mirror Codex Plugin v1 is the first repo-local Codex plugin surface for Mirror's Phase 1
public demo.

## Highlights

- repo-local plugin at `plugins/mirror-codex`
- marketplace entry at `.agents/plugins/marketplace.json`
- `mirror-demo` skill for deterministic public demo onboarding
- read-only local MCP server for logical artifact and claim/evidence inspection
- fixed MCP resources and prompts for safer onboarding navigation
- documented evidence navigation example for `claim_evacuation_turn`
- durable MCP contract in `docs/decisions/ADR-0010-mirror-codex-plugin-mcp-contract.md`
- `plugin-check` target in `Makefile` and `make.ps1`
- `plugin-release-check` local release gate
- `plugin-remote-check` explicit remote public demo gate
- deterministic repo-local plugin install acceptance check
- PR scope hygiene that keeps local-only `docs/plans/...` files and generated
  `backend/mirror_engine.egg-info/...` packaging metadata out of the plugin PR
- Linux, Windows, and deploy workflow gates for `plugin-release-check`
- optional remote public demo smoke with HTTP retry controls

## Tool Surface

The v1 MCP tool allowlist is:

- `get_demo_manifest`
- `get_demo_artifact`
- `get_eval_summary`
- `explain_demo_claim`
- `compare_demo_branches`

All tools are read-only, schema-bound, and logical-id-only. They must not accept arbitrary
filesystem paths, URLs, shell commands, provider config, API keys, or model names.

The v1 MCP resource allowlist uses fixed `mirror-demo://...` URIs for the manifest and
public demo artifacts. The v1 prompt allowlist is:

- `inspect-public-demo`
- `review-claim-evidence`
- `compare-demo-branches`

Resources and prompts are read-only and must not accept arbitrary paths, URLs, provider
configuration, API keys, user uploads, or mutation requests.

The documented evidence navigation flow uses `demo.claims`, `demo.chunks`, and
`demo.documents` to map `claim_evacuation_turn` to its `label`, `evidence_ids`, evidence
chunks, and sanitized document metadata. The example stays bounded to deterministic demo
support and must not expose stripped path fields such as `source_path`.

## Safety Boundary

The plugin preserves the Phase 1 public demo boundary:

- deterministic-only
- read-only
- precomputed canonical Fog Harbor artifacts
- no Hosted GPT
- no BYOK
- no corpus upload
- no create-world flow
- no runtime mutation
- no auth, billing, database, object storage, or quota
- no provider secrets in repository files, frontend code, build logs, artifacts, or error pages

Mirror remains a constrained, evidence-backed, replayable what-if sandbox for fictional or
explicitly authorized worlds. It is not a real-world prediction machine, real-person digital
twin system, political persuasion tool, or high-risk decision system.

## Validation

Local plugin release gate:

```powershell
./make.ps1 plugin-release-check
```

Optional explicit remote public demo check:

```powershell
./make.ps1 plugin-remote-check
./make.ps1 plugin-remote-check -BaseUrl https://mirror-public-demo.onrender.com
```

If frontend code or frontend routes changed, also run:

```powershell
npm run build --prefix frontend
```

## Acceptance Notes

- `plugin-check` runs plugin static validation, MCP tests, and MCP stdio smoke.
- `acceptance_check.py` verifies marketplace discovery, plugin manifest shape, `.mcp.json`
  launch, tools/resources/prompts, claim evidence, sanitized documents, and path rejection.
- `check_pr_scope.py` reports the plugin V1 file scope and excludes local-only untracked
  `docs/plans/...` files and generated `backend/mirror_engine.egg-info/...` packaging metadata
  from the plugin PR.
- MCP output must strip internal path fields such as `artifact_paths`, `summary_path`,
  `trace_path`, `snapshot_dir`, and document `source_path`.
- Claims returned through the plugin must preserve both `label` and `evidence_ids`.

## PR Draft

### What Changed

- Added the repo-local `mirror-codex` Codex plugin with a `Read`-only manifest, `mirror-demo`
  skill, fixed `.mcp.json`, and local Python MCP server.
- Added read-only MCP tools, resources, and prompts for the deterministic Fog Harbor public
  demo. Inputs are logical ids only; tools do not accept filesystem paths, URLs, provider
  config, API keys, model names, uploads, or mutation requests.
- Added plugin validation, MCP tests, stdio smoke, deterministic install acceptance, and PR
  scope hygiene. `plugin-release-check` now runs those checks plus secret scan, phase2 audit,
  and whitespace diff validation.
- Scoped PR hygiene reports local-only plan files and generated editable-install egg metadata
  separately so they do not get staged into the plugin PR.
- Added the durable MCP contract ADR and operator docs for install acceptance, evidence
  navigation, release checks, and explicit remote public demo smoke.

### Tests

- [x] `./make.ps1 plugin-release-check`
- [x] `python -m pytest backend\tests\test_api.py -q`
- [x] `python plugins\mirror-codex\scripts\check_pr_scope.py --stage-list`
- [x] `./make.ps1 plugin-remote-check`
- [ ] `npm run build --prefix frontend` - not run because this PR does not touch frontend code

### Artifacts

- Direct evidence: local `plugin-release-check` reports plugin validation passed, 8 MCP tests
  passed, MCP stdio smoke passed, install acceptance passed, PR scope check passed, secret
  scan passed, and phase2 audit status `pass`.
- Direct evidence: remote public demo smoke against `https://mirror-public-demo.onrender.com`
  reports 8 artifacts OK, 3 claims, eval status `pass`, and key pages returning 200.
- Direct evidence: PR scope check reports local-only untracked `docs/plans/...` files and
  generated `backend/mirror_engine.egg-info/...` packaging metadata as excluded from the
  plugin PR.
- Reasonable inference: `npm run build --prefix frontend` is not required for this PR because
  the change set does not modify frontend code or frontend routes.

### Contract Impact

- Adds ADR-0010 as the durable v1 contract for the repo-local Mirror Codex plugin MCP surface.
- Does not change scenario DSL, simulation runtime, public demo artifact layout, claim labels,
  run trace shape, frontend routes, or backend public API routes.
- Claims returned through the plugin preserve both `label` and `evidence_ids`.

### Safety Impact

- Preserves the Phase 1 public demo boundary: deterministic-only, read-only, precomputed,
  anonymous, and local-first for plugin usage.
- Does not add Hosted GPT, BYOK, corpus upload, create-world, runtime mutation, auth, billing,
  database, object storage, quotas, or provider secret handling.
- Does not present Mirror as a real-world prediction tool, real-person digital twin system,
  political persuasion tool, or high-risk decision system.

### TODO[verify]

- TODO[verify]: Record the exact Codex UI install wording after testing this plugin in a
  clean Codex versioned environment.
