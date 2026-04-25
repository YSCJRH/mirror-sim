# Phase 1 Public Demo

## Scope

Phase 1 is a public, anonymous, deterministic-only demo for the precomputed Fog Harbor canonical artifacts. Visitors can understand Mirror, inspect branch comparison, read claims, follow evidence, and see the eval summary.

Mirror remains a constrained, evidence-backed, replayable what-if simulation sandbox for fictional or explicitly authorized worlds.

## Explicit Non-Goals

- Do not present Mirror as real-world prediction.
- Do not build real-person personas or digital doubles.
- Do not build political persuasion or high-risk decision systems.
- Do not enable Hosted GPT, BYOK, corpus upload, world creation, auth, payment, database storage, object storage, or quota systems in Phase 1.
- Do not call the OpenAI API in public demo mode.

## Public Flags

```env
MIRROR_PUBLIC_DEMO_MODE=1
MIRROR_ALLOW_ANONYMOUS_RUNS=0
MIRROR_HOSTED_MODEL_ENABLED=0
```

Provider secrets must stay out of the repository, browser bundle, Docker image, build logs, runtime logs, artifacts, and error pages.

## Public Interfaces

- `ArtifactSource` maps logical ids to canonical demo artifacts.
- `/api/health` returns alive/version status only.
- `/api/ready` checks canonical artifact presence, parseability, and full workbench-loadability without returning local paths, and returns 503 when readiness is degraded.
- `/api/public-demo/manifest` returns allowlisted logical artifact metadata.
- `/api/public-demo/artifacts/[artifactId]` returns only allowlisted content.
- If the FastAPI service is deployed separately, `/public-demo/manifest` and `/public-demo/artifacts/{artifact_id}` provide the same read-only allowlisted artifact boundary.

Logical artifact ids:

- `demo.report`
- `demo.claims`
- `demo.eval_summary`
- `demo.compare`
- `demo.documents`
- `demo.chunks`
- `demo.graph`
- `demo.rubric`

## Acceptance

Run artifact-producing commands sequentially because they rebuild shared demo outputs:

```bash
python scripts/check_no_secrets.py
make test
make smoke
make eval-demo
make eval-transfer
make public-demo-check
```

Windows:

```powershell
python .\scripts\check_no_secrets.py
.\make.ps1 test
.\make.ps1 smoke
.\make.ps1 eval-demo
.\make.ps1 eval-transfer
.\make.ps1 public-demo-check
```

Phase 1 is complete only when the anonymous path requires no login, no provider key, no upload, no model call, no world creation, and no paid runtime mutation. Public smoke must verify that `start-session`, `generate-branch`, `rollback-session`, and `worlds/create` return 403 in public demo mode.

Public artifact API responses must not return local path metadata. The smoke test checks for `artifact_paths`, `summary_path`, `trace_path`, `snapshot_dir`, document `source_path`, local repository path fragments, and provider secret variable names.

## Phase 2 Reserved Interfaces

The current code leaves private-beta/runtime routes in place behind public demo flags. Phase 2 may add auth, database-backed world records, object storage, and quota contracts, but Phase 1 deliberately avoids implementing those systems.
