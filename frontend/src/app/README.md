# Frontend Workbench

This app now carries two layers at once:

- the Phase 1 public deterministic-only demo path
- the private-beta candidate product path, available only when public demo flags are disabled
- the older demo/reference workbench path

Phase 1 public demo routes:

- `/` is the guided public Fog Harbor demo
- `/review` is the advanced analyst workspace for the same precomputed artifacts
- `/changes/[branchId]` is the branch comparison explorer
- `/explain/[branchId]` is the claims/evidence explanation view
- `/api/health` returns alive/version status without local paths
- `/api/ready` checks logical canonical artifact readiness
- `/api/public-demo/manifest` returns allowlisted logical artifact ids
- `/api/public-demo/artifacts/[artifactId]` returns only allowlisted demo artifact content

Phase 1 public demo mutation rules:

- `/api/runtime/start-session`, `/api/runtime/generate-branch`, `/api/runtime/rollback-session`, and `/api/worlds/create` return 403 when `MIRROR_PUBLIC_DEMO_MODE=1` and `MIRROR_ALLOW_ANONYMOUS_RUNS` is not `1`
- `/worlds/new` shows a disabled explanation in public mode
- Hosted GPT, BYOK, corpus upload, auth, billing, object storage, database-backed worlds, and quotas are reserved for later phases

Artifact access uses `ArtifactSource` and logical ids such as `demo.report`, `demo.claims`, `demo.eval_summary`, `demo.compare`, `demo.documents`, `demo.chunks`, and `demo.graph`. Public routes never accept arbitrary filesystem paths.

Private-beta candidate product routes:

- `/` is the `Launch Hub`
- `/worlds/new` creates one bounded incident world under the runtime state root
- `/worlds/new` now includes quick-start presets and a clearer data-authorization note so first-time users do not have to author every field from scratch
- `/worlds/[worldId]` is the world home
- `/worlds/[worldId]/perturb` is the main operator path
- `/worlds/[worldId]/runtime/[sessionId]` is the world-scoped live runtime view
- `/worlds/[worldId]/runtime/[sessionId]/explain` is the world-scoped live explain view
- `/worlds/[worldId]/runtime/[sessionId]/report` is the world-scoped live report view
- `/worlds/[worldId]/review` is the world-scoped review surface, with scorecard + inline branch digest + report/claims previews
- world home, perturb, and review automatically pick up the latest live session for the world when no explicit session query is present
- Launch Hub now also surfaces the latest live node per world and links directly into the current runtime and review entrypoints
- Launch Hub now prioritizes fast return paths: continue the latest session when available, otherwise create a world or open perturb
- canonical product metadata now supports locale-aware world names, summaries, baselines, and perturbation labels; self-serve worlds continue to display the language the user entered
- main product-shell terms on the private-beta candidate path are being normalized alongside locale-aware world metadata, so Chinese mode no longer mixes core route labels with obvious English operator wording
- runtime result cards now prefer world-defined outcome labels from product metadata instead of exposing raw outcome field keys directly
- self-serve world creation now submits the current UI locale so generated baseline titles, perturbation summaries, and default outcome labels follow the language the user is working in
- world-scoped mutation routes now pass explicit `worldId` through the web wrapper, so `generate-branch` and `rollback-session` reach the correct artifacts root instead of failing against the CLI

Key runtime behavior:

- users can create a new bounded world without writing repo-tracked files
- world data resolves from runtime `state/worlds/*` and `state/artifacts/worlds/*` before repo seed worlds
- the perturbation workspace supports session-level `provider + model`
- `api_key` and `api_base_url` are browser-session-only inputs and are not persisted in session artifacts
- `hosted_openai` uses the server-side hosted key only; the browser provides a private-beta access code, not an OpenAI API key
- hosted generation passes a hashed beta identity into the backend so quota state can be recorded under ignored runtime `state/usage/*`
- the perturbation workspace restores the last browser-session provider/model choice to reduce repeat setup for returning users
- live runtime surfaces expose the active decision-model summary, including provider mode, model id, fallback count, and replay count
- `openai_compatible` now requires a concrete model id unless `MIRROR_DECISION_MODEL` is already supplied on the server

Legacy/demo routes kept for reference:

- `/perturb`
- `/changes/[branchId]`
- `/explain/[branchId]`
- `/runtime/[sessionId]`
- `/runtime/[sessionId]/explain`
- `/runtime/[sessionId]/report`
- `/review`

UI chrome still supports `中文 / EN` through the lightweight `mirror-lang` cookie.
