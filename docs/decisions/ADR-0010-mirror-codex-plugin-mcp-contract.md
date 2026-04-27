# ADR-0010: Mirror Codex Plugin MCP Contract

## Status

Accepted

## Context

The repo-local `mirror-codex` plugin gives Codex a first-party way to inspect Mirror's
deterministic Phase 1 public demo. That plugin includes a local MCP server, so its tool
surface is a long-lived developer contract even though it is not a public web API.

ADR-0009 already defines the Phase 1 public demo artifact-source boundary: public callers
use allowlisted logical artifact ids, public output strips implementation paths, and the
public path does not create worlds, upload corpora, call model providers, or mutate runtime
state. The Codex plugin must preserve that same boundary.

## Decision

Mirror Codex plugin v1 is read-only, local-first, and deterministic-demo-only.

The plugin manifest exposes only the `Read` capability. The plugin registers one fixed local
stdio MCP server in `plugins/mirror-codex/.mcp.json`:

```json
{
  "mcpServers": {
    "mirror-demo": {
      "command": "python",
      "args": ["./scripts/run_mcp.py"]
    }
  }
}
```

The command and args are hardcoded. They must not be composed from user input, provider
configuration, environment secrets, URLs, shell snippets, or arbitrary filesystem paths.

The v1 MCP tool allowlist is:

- `get_demo_manifest`: no arguments.
- `get_demo_artifact`: `artifact_id` must be one of `demo.report`, `demo.claims`,
  `demo.eval_summary`, `demo.compare`, `demo.documents`, `demo.chunks`, `demo.graph`,
  or `demo.rubric`.
- `get_eval_summary`: no arguments.
- `explain_demo_claim`: `claim_id` must be a logical claim id from `demo.claims`, not a
  path or query.
- `compare_demo_branches`: `candidate_branch_id` must be one of
  `branch_harbor_comms_failure`, `branch_mayor_signal_blocked`, or
  `branch_reporter_detained`; optional `reference_branch_id` is limited to
  `branch_baseline`.

The v1 MCP resource allowlist is:

- `mirror-demo://manifest`
- `mirror-demo://artifact/demo.report`
- `mirror-demo://artifact/demo.claims`
- `mirror-demo://artifact/demo.eval_summary`
- `mirror-demo://artifact/demo.compare`
- `mirror-demo://artifact/demo.documents`
- `mirror-demo://artifact/demo.chunks`
- `mirror-demo://artifact/demo.graph`
- `mirror-demo://artifact/demo.rubric`

The v1 MCP prompt allowlist is:

- `inspect-public-demo`
- `review-claim-evidence`
- `compare-demo-branches`

Every MCP tool must declare `annotations.readOnlyHint: true` and a closed input schema with
`additionalProperties: false`. Tool schemas must not expose inputs named `path`, `file`,
`filepath`, `filename`, `url`, `command`, `args`, `api_key`, `provider`, or `model`.

The MCP server may read only the canonical demo artifacts needed for those logical ids and
allowlisted resource URIs. It must reject path-like tool input containing `/`, `\`, `:`,
`..`, or leading `.`. Resource reads and prompt gets must use exact allowlisted names/URIs,
not user-provided filesystem paths, URLs, shell snippets, provider configuration, or API
keys. It must not read secrets, shell out, call OpenAI or other model providers, upload user
data, create worlds, start runtime sessions, write artifacts, or add Hosted GPT, BYOK, auth,
billing, database, object storage, or quota behavior.

MCP output must preserve claim reviewability. Any report claim returned by the plugin must
keep both `label` and `evidence_ids`. Output must strip implementation path fields already
excluded from Phase 1 public API responses, including `artifact_paths`, `summary_path`,
`trace_path`, `snapshot_dir`, and document `source_path`.

## Consequences

- Developers can enable the plugin without granting it a mutation surface or provider
  credentials.
- The MCP server remains dependency-light and auditable in this slice.
- Future tool, resource, or prompt additions must update this ADR, the plugin README, the
  `mirror-demo` skill, static validation, and MCP tests in the same change.
- Any future mutating workflow must be a separate contract and must not be added to this
  Phase 1 public demo path by default.

## Validation

The plugin contract is enforced by:

```bash
make plugin-check
python scripts/check_no_secrets.py
python -m backend.app.cli audit-phase phase2
git diff --check
```

If frontend code or public demo frontend routes change, also run:

```bash
npm run build --prefix frontend
```
