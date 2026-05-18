# ADR-0011: Private-Beta Route Ownership

## Status

Accepted

## Context

Phase 50 kept the private-beta launch hub planning-only and left route placement unresolved.
At the same time, the tracked app already has two distinct route families:

- public-demo routes such as `/`, `/review`, `/api/public-demo/manifest`, and
  `/api/public-demo/artifacts/<artifact_id>`
- private-beta candidate routes under `/worlds/<world_id>` plus runtime and review children

Replacing `/` with a launch hub would blur the Phase 1 public demo release boundary and could
accidentally move private-beta mutation, Hosted GPT, BYOK, upload, auth, billing, database,
object storage, quota, or async-runtime expectations into the public path.

## Decision

Mirror keeps `/` owned by the guided Phase 1 public Fog Harbor demo.

`/review` remains the advanced read-only public-demo review surface. The private-beta
candidate product path remains world-scoped under `/worlds/<world_id>` and related
`/worlds/...` runtime/review routes when public-demo flags are disabled in local or
explicitly authorized private-beta environments.

The private-beta launch hub remains planning-only in Phase 51. A future launch hub must not
replace `/` or move private-beta capabilities into the public path without a separate
reviewed work item that names its route, access mode, public-demo interaction, and deployment
posture.

World-scoped navigation may link back to `/`, but that link must be labeled as the public
demo rather than as a launch hub until a future reviewed contract creates a real launch-hub
route.

This decision does not add or alter public demo endpoints, Mirror Codex MCP tools/resources,
Hosted GPT, BYOK, upload/ingest, auth, billing, database, object storage, quota, async task
queues, `task_id`, retry/status/cleanup semantics, scenario DSL, claim/evidence shape, run
trace shape, compare artifacts, or public demo artifact layout.

Top-level `/perturb`, `/runtime/<session_id>`, and child runtime routes remain legacy
compatibility surfaces. They are not the canonical private-beta route owners unless a future
reviewed contract changes that status.

## Consequences

- The public release path keeps a stable, read-only, deterministic landing route.
- Private-beta work can continue under explicit world-scoped routes without implying a public
  launch hub or account system.
- Future launch-hub work must start with a route/access/deployment contract before
  implementation.
- TODO[verify]: verify route/session mismatch handling before expanding private-beta runtime
  surfaces.
- TODO[verify]: verify that private-beta composer requests pass route-derived `worldId`
  through every world-scoped mutation before treating runtime generation as route-safe.

## Validation

The route ownership contract is checked by:

```bash
python -m pytest backend/tests/test_phase51_route_contract_note.py backend/tests/test_phase51_successor_gate.py -q
python scripts/check_no_secrets.py
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
git diff --check
```
