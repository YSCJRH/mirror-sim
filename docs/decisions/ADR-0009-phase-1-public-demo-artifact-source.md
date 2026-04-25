# ADR-0009: Phase 1 Public Demo Artifact Source

## Status

Accepted

## Context

Mirror's public Phase 1 deployment needs to let anonymous visitors inspect the canonical Fog Harbor demo without accounts, uploads, model calls, or runtime mutation. The earlier private-beta workbench could read local artifacts directly and expose implementation-oriented paths. That is not the right boundary for a public anonymous demo.

## Decision

Phase 1 public demo uses a logical `ArtifactSource` boundary. Public frontend and API code reads allowlisted artifact ids such as `demo.report`, `demo.claims`, `demo.eval_summary`, `demo.compare`, `demo.documents`, `demo.chunks`, and `demo.graph`.

Public API routes expose:

- `/api/health`
- `/api/ready`
- `/api/public-demo/manifest`
- `/api/public-demo/artifacts/<artifact_id>`

Public mutation routes are disabled when:

```env
MIRROR_PUBLIC_DEMO_MODE=1
MIRROR_ALLOW_ANONYMOUS_RUNS=0
```

Hosted GPT remains disabled by default:

```env
MIRROR_HOSTED_MODEL_ENABLED=0
```

## Consequences

- The public demo can be deployed without OpenAI provider secrets.
- Public API responses must avoid absolute filesystem paths and arbitrary path reads.
- Public API responses must strip artifact-internal path fields such as `artifact_paths`, `summary_path`, `trace_path`, `snapshot_dir`, and document `source_path`.
- Private-beta runtime routes may remain in the codebase, but they are not part of Phase 1 public behavior.
- Phase 2 can add auth, database records, object storage, and quota contracts without forcing those systems into the public Phase 1 release.

## Validation

The acceptance path is:

```bash
python scripts/check_no_secrets.py
make test
make smoke
make eval-demo
make eval-transfer
make public-demo-check
```
