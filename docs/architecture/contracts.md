# Core Contracts

This file freezes the current cross-phase contracts that later runner, eval, and workbench changes now depend on.

## Stable Object IDs

- `document_id`
- `chunk_id`
- `entity_id`
- `relation_id`
- `event_id`
- `persona_id`
- `scenario_id`
- `branch_id`
- `compare_id`
- `session_id`
- `node_id`
- `run_id`
- `turn_id`
- `claim_id`

All IDs must be serializable, stable across files, and traceable in `artifacts/`.

## Evidence And Claims

- `Entity`, `Relation`, `Event`, `Persona`, `TurnAction`, and `Claim` always carry non-empty `evidence_ids`, or an explicit non-evidence label.
- `Persona.field_provenance` is a field-level map of `field_name -> evidence_ids`.
- `Persona.field_provenance` must be non-empty for every non-empty core field:
  - `public_role`
  - `goals`
  - `constraints`
  - `known_facts`
  - `private_info`
  - `relationships`
- Claim labels are restricted to:
  - `evidence_backed`
  - `inferred`
  - `speculative`

## World Resolution Contract

- The canonical demo world remains `fog-harbor-east-gate`.
- Canonical demo inputs stay under `data/demo/`.
- Canonical demo artifacts stay under `artifacts/demo/`.
- Additional bounded worlds resolve through:
  - `data/worlds/<world_id>/`
  - `artifacts/worlds/<world_id>/`
- Runtime-created bounded worlds resolve through:
  - `state/worlds/<world_id>/`
  - `state/artifacts/worlds/<world_id>/`
- World resolution is path-based and deterministic; it does not depend on world-specific Python constants baked into the runner.

## World Model Contract

- Canonical demo world modeling is driven by `data/demo/config/world_model.yaml`.
- Additional worlds must provide `config/world_model.yaml` under their own world root.
- `graph.json` is the durable world-model artifact and now contains:
  - `entities`
  - `relations`
  - `events`
  - `stats`
- `personas.json` keeps the same top-level shape, but each persona now includes:
  - aggregate `evidence_ids`
  - field-level `field_provenance`

## Query Contract

- The Phase 1 query surface is CLI-first.
- The canonical query entrypoint is:
  - `python -m backend.app.cli inspect-world --kind <entity|persona|event> --id <stable-id> --graph <graph.json> --personas <personas.json>`
- `inspect-world` returns stable JSON with:
  - `world_id`
  - `kind`
  - `object`

## Scenario Contract

- `scenario_id` names the full scenario package.
- `world_id` must resolve to one bounded world root.
- `branch_count` is part of the scenario execution contract.
  - `branch_count: 1` preserves the current single-branch behavior.
  - `branch_count > 1` requests deterministic multi-branch execution for one scenario package.
  - Phase 45 does not add new scenario YAML fields beyond giving `branch_count` executable semantics.
- Each injection has its own `injection_id` and `kind`.
- Injection kinds are world-local strings validated by `config/decision_schema.yaml`.
- The canonical demo currently includes:
  - `delay_document`
  - `block_contact`
  - `resource_failure`

## Simulation Rules Contract

- Each world now provides `config/simulation_rules.yaml`.
- `simulation_rules.yaml` is the deterministic runner contract for:
  - `turn_sequence`
  - `initial_state`
  - `tracked_outcomes`
  - supported injection effects
  - explicit per-turn step rules
- The runner remains bounded and replayable:
  - no free-form agent planning
  - no unconstrained LLM control loop
  - no open-ended world simulation DSL
- Fog Harbor keeps its existing behavior through world-local rules instead of runner hardcoding.

## World Decision Schema Contract

- Each world now provides `config/decision_schema.yaml`.
- `decision_schema.yaml` is the legal execution contract for:
  - allowed action types
  - perturbation kinds
  - timing tokens
  - target source classes
  - actor source classes
  - required and optional perturbation parameters
  - decision-kernel retry and fallback policy
- `decision_schema.yaml` is the source of truth for perturbation validation.
  - user-facing labels in the frontend are not the execution contract
  - world-local stable IDs and timing tokens are the execution contract
- The stable top-level `decision_schema.yaml` fields are:
  - `world_id`
  - `schema_version`
  - `allowed_action_types`
  - `timing_tokens`
  - `perturbations`
  - `decision_kernel`
- Each `perturbations[]` item must declare:
  - `kind`
  - `target_sources`
  - `actor_sources`
  - `timing_tokens`
  - `required_parameters`
  - `optional_parameters`
- Parameter declarations are typed by scalar token. V1 supported parameter type tokens are
  `int`, `float`, `bool`, and `str`; unknown parameter type tokens must fail validation.
- Product-facing perturbation templates may carry localized labels, summaries, and draft text,
  but executable generation must use only the template-resolved runtime payload:
  - `kind`
  - `target_id`
  - `timing`
  - `summary`
  - `parameters`
  - `evidence_ids`
- `actor_id`, when needed, is carried inside `parameters` and is resolved separately against
  the perturbation's allowed `actor_sources`; it must not be treated as a free-form parameter.
- Resolver output must record the normalized payload, target source class, optional actor
  source class, resolved actor id, timing token, validated parameters, schema version, notes,
  and one deterministic `resolution_hash`.

## Run Contract

- `TurnAction` is the line format stored in `run_trace.jsonl`.
- `RunTrace` is the branch-run summary model stored in `summary.json`.
- Simulation remains seeded, bounded, replayable, and writes snapshots per turn.
- `run_id` remains the execution artifact ID for one concrete branch run.
- `branch_id` is the stable compare-level ID for one branch inside a multi-branch scenario.
- `TurnAction` shape does not change as part of the Phase 45 compare-contract ratification.

## Decision Kernel Contract

- The execution kernel now follows:
  - resolved perturbation
  - legal choice set
  - LLM proposal
  - rule validation
  - deterministic state apply
- LLM participation is allowed only inside the legal action space computed by the world rules.
- The kernel may not:
  - invent new action types outside the world decision schema
  - write arbitrary world state directly
  - bypass validator checks
  - bypass replay persistence
- Kernel entry must reject any candidate `StepChoice` whose `action_type` is not listed in
  the world-local `decision_schema.yaml` `allowed_action_types`; this is a defense-in-depth
  guard in addition to upstream scenario and simulation rule validation.
- Deterministic fallback is mandatory when:
  - the model is unavailable
  - the output is invalid
  - retries are exhausted
- Replayability is mandatory.
  - the same world state plus the same legal choice set must be able to replay the same selected action through stored decision artifacts
- `decision_trace.jsonl` is the durable v1 decision audit artifact. Each line is a
  `DecisionTraceEntry` with these stable fields:
  - `run_id`
  - `turn_index`
  - `actor_id`
  - `provider_mode`
  - `model_id`
  - `prompt_version`
  - `input_hash`
  - `output_hash`
  - `available_choices`
  - `selected_choice_index`
  - `selected_action_type`
  - `selected_target_id`
  - `rationale`
  - `validation_status`
  - `fallback_used`
- Stable `provider_mode` values are:
  - `openai_compatible` when a configured request-scoped compatible provider returns a
    validated legal choice.
  - `hosted_openai` when the hosted private-beta provider returns a validated legal choice.
  - `deterministic_fallback` when model configuration is absent, provider execution fails,
    model output is invalid, or retry attempts are exhausted.
  - `single_choice` when only one legal action exists.
  - `replay_cache` when the selection is copied from an existing trace entry for the same
    `input_hash`.
- Stable `validation_status` values are:
  - `accepted_after_attempt_<n>` for validated provider output.
  - `accepted_via_fallback` for deterministic fallback after invalid/unavailable provider
    output or missing provider configuration.
  - `accepted_single_choice` for a one-choice legal action set.
  - `accepted_from_replay` for replay-cache reuse.
- Replay uses `input_hash`, which is computed from the world id, scenario id, turn index,
  actor id, current state, and legal choice summaries. If a cached trace entry has the same
  hash and its `selected_choice_index` is still legal, the kernel must select that cached
  index without re-querying a provider.
- Decision traces are append-only audit history for a concrete run/node artifact. A replay
  cache hit appends a new trace row with `provider_mode` set to `replay_cache` and
  `validation_status` set to `accepted_from_replay` rather than rewriting the original row.
- Replay-cache rows preserve the cached decision provenance for `model_id`, `prompt_version`,
  `rationale`, and `output_hash`, while the new row's `run_id`, `turn_index`, and `actor_id`
  describe the current replay context.
- Fallback traces must not fail open. They must select the deterministic fallback action,
  set `fallback_used` to `true`, set `provider_mode` to `deterministic_fallback`, and set
  `validation_status` to `accepted_via_fallback`.
- Trace privacy is part of the contract:
  - `input_hash` and `output_hash` are hashes, not raw prompt or raw provider output.
  - raw provider credentials, beta access codes, request headers, provider exception text,
    and local filesystem paths must not be written into `decision_trace.jsonl`.
  - `rationale` may summarize accepted model rationale or deterministic fallback reason, but
    must not include raw provider errors.

## Compare Contract

- When `branch_count > 1`, the backend must emit a durable compare artifact at:
  - `artifacts/<scope>/compare/<scenario_id>/compare.json`
- `compare.json` is the canonical branch-relationship artifact for one scenario compare set.
- Required top-level fields:
  - `compare_id`
  - `scenario_id`
  - `seed`
  - `branch_count`
  - `reference_branch_id`
  - `branches`
  - `reference_deltas`
- Each `branches[]` item must include:
  - `branch_id`
  - `label`
  - `run_id`
  - `is_reference`
  - `summary_path`
  - `trace_path`
  - `snapshot_dir`
- Each `reference_deltas[]` item must include:
  - `branch_id`
  - `divergent_turn_count`
  - `divergent_turns`
  - `outcome_deltas`
- Each `divergent_turns[]` item must at minimum include:
  - `turn_index`
  - `reference_turn_id`
  - `candidate_turn_id`
- Each `outcome_deltas` entry must expose:
  - `reference`
  - `candidate`
  - `delta`
- Backend ownership:
  - the backend chooses `reference_branch_id`
  - the backend assigns `branch_id`
  - the backend emits the canonical file references for branch runs
- Frontend ownership:
  - when `compare.json` exists, the frontend should use it as the top-level source of truth for compare overview and branch routing
  - the frontend may still read run summaries, traces, and snapshots for drill-down
- Report and eval ownership:
  - reports and claims may remain pair-scoped in the initial Phase 45 implementation, but the chosen branch pair must come from compare truth
  - evals should consume `compare.json` whenever a scenario uses `branch_count > 1`

## Interactive Simulator Runtime Contract

- Interactive simulation remains CLI-first in v1.
- The runtime layer sits on top of the existing world, run, and compare contracts.
- The interactive layer must not rewrite or weaken:
  - `compare.json`
  - `TurnAction`
  - claim label or `evidence_ids` requirements
  - world-local deterministic rules
- Canonical v1 entrypoints are:
  - `python -m backend.app.cli start-session --world <world_id> --scenario <scenario_id> [--decision-provider <provider>] [--decision-model <model_id>]`
  - `python -m backend.app.cli inspect-session --session <session_id>`
  - `python -m backend.app.cli generate-branch --session <session_id> --from <node_id> --perturbation <json-or-file>`
  - `python -m backend.app.cli rollback-session --session <session_id> --to <node_id>`
- `start-session` creates one durable simulation session rooted in one bounded world plus one baseline scenario.
- `start-session` may pin one session-local decision model.
  - when present, the pinned model overrides the default environment-driven model lookup for later branch generation inside that session
  - when omitted, the session captures the current default model if one is configured
- `start-session` may pin one session-local decision provider.
  - supported v1 providers:
    - `openai_compatible`
    - `hosted_openai`
    - `deterministic_only`
  - `hosted_openai` uses only server-side environment secrets and never accepts a browser-submitted OpenAI API key.
  - `deterministic_only` disables LLM calls for that session and uses deterministic fallback only
- `generate-branch` may receive transient runtime credentials for one request.
  - `api_key` and `api_base_url` are request-scoped only
  - raw credentials must not be written into `session.json`, `node.json`, `report.md`, `claims.json`, or `decision_trace.jsonl`
- `generate-branch` may receive `beta_user_id` only for hosted private-beta quota accounting.
  - web clients must derive this from an authenticated/beta-gated request, not from a raw OpenAI API key
  - hosted quota ledgers live under ignored runtime state such as `state/usage/hosted-openai-YYYY-MM-DD.json`
  - quota ledgers must store hashed user identities only, not raw access codes, raw user identifiers, or API keys
- Server-side hosted OpenAI secrets must be loaded from deployment secrets or local ignored `.env` files only.
  - `MIRROR_HOSTED_OPENAI_API_KEY` must never be committed to the open-source repo
  - artifacts, traces, logs, and reports may record provider/model/fallback metadata, but not raw hosted secrets
- `generate-branch` creates one new child node from one existing node; it does not mutate prior nodes in place.
- `rollback-session` only changes the active pointer for the session.
  - rollback does not delete nodes
  - rollback does not rewrite run artifacts
  - rollback to baseline means setting `active_node_id` back to the root node
- `last_activity_at` is the session ordering timestamp for product surfaces.
  - new sessions set `last_activity_at` equal to `created_at`
  - successful `generate-branch` updates `last_activity_at` after the child node and artifacts are materialized
  - successful `rollback-session` updates `last_activity_at` after the active pointer changes
  - rollback to the current active node leaves `last_activity_at` unchanged
  - failed generation or rollback does not ratify a v1 activity update
- V1 does not introduce task queues or a separate `task_id` contract.
  - TODO[verify]: if web-triggered generation needs long-running worker semantics, ratify `task_id` in a follow-up ADR instead of widening v1 now.

## Perturbation Payload Contract

- The product-facing composer may continue to expose user-readable `kind`, `target`, `timing`, and `summary` fields.
- Before execution, the backend must resolve that product input into one durable perturbation payload.
- Required fields:
  - `kind`
  - `target_id`
  - `timing`
  - `summary`
- Optional fields:
  - `parameters`
  - `evidence_ids`
- `target_id` must resolve inside one bounded world.
- `timing` must be deterministic and world-resolved.
  - it may be represented by turn index, named phase, or another bounded world-local timing token
- `parameters` is the only extensibility bucket for world-specific perturbation detail in v1.
- `parameters` must be a typed key/value map whose accepted keys are exactly the union of the
  selected perturbation's required and optional parameter declarations plus the special
  `actor_id` key.
- Every perturbation payload must be resolved through the world-local decision schema before execution.
- Resolution must record:
  - normalized perturbation payload
  - target source class
  - actor source class when applicable
  - resolved actor id when applicable
  - timing token
  - validated parameters
  - schema version
  - resolution hash
- Resolution must reject:
  - unsupported perturbation kinds
  - unsupported timing tokens
  - targets outside the selected perturbation's allowed source classes
  - actor ids outside the selected perturbation's allowed source classes
  - missing required parameters
  - unexpected parameters
  - values that do not match declared scalar parameter types
- `resolution_hash` is computed from the normalized resolved payload and schema context, not
  from frontend display strings.
- Free-form user text alone is not an execution contract.
  - it must be mapped into stable world-local IDs and deterministic timing before generation starts

## Session Tree Contract

- `session_id` identifies one interactive simulation exploration rooted in one world and one baseline scenario.
- `node_id` identifies one durable node inside one session tree.
- The root node must:
  - have `parent_node_id: null`
  - represent the baseline checkpoint
  - have no perturbation payload
- Every non-root node must record:
  - `node_id`
  - `session_id`
  - `parent_node_id`
  - `status`
  - `perturbation`
  - artifact references for the generated branch
- Supported node statuses in v1:
  - `pending`
  - `running`
  - `succeeded`
  - `failed`
- Session manifests must expose:
  - `session_id`
  - `world_id`
  - `scenario_id`
  - `root_node_id`
  - `active_node_id`
  - `decision_config`
  - `created_at`
  - `last_activity_at`
  - `nodes`
- `decision_config` must publish:
  - `provider`
  - `model_id`
- `active_node_id` is the only rollback-sensitive field.
- Readers of older session manifests without `last_activity_at` must fall back to `created_at`.
- Re-perturbing from any node creates a new sibling or child node; it never overwrites prior descendants.

## Interactive Artifact Contract

- Interactive simulator artifacts live under a session namespace so they do not collide with scenario compare artifacts.
- Canonical path:
  - `artifacts/<scope>/sessions/<session_id>/`
- Required files:
  - `session.json`
  - `nodes/<node_id>/node.json`
- Required files for every successful generated non-root node:
  - `compare/<node_id>/compare.json`
- Optional node-scoped materialized files:
  - `nodes/<node_id>/report/report.md`
  - `nodes/<node_id>/report/claims.json`
  - `nodes/<node_id>/resolution.json`
  - `nodes/<node_id>/decision_trace.jsonl`
- `node.json` must publish the canonical references the frontend should consume:
  - `run_id`
  - `summary_path`
  - `trace_path`
  - `snapshot_dir`
  - `compare_path` for every successful generated non-root node
  - `report_path` when a node-scoped report is materialized
  - `claims_path` when node-scoped claims are materialized
  - `resolution_path` when perturbation resolution is materialized
  - `decision_trace_path` when decision replay/audit is materialized
- Root node manifests must keep `compare_path: null`; the root checkpoint has no parent.
- Interactive session compare artifacts are separate from scenario-level compare artifacts.
  - `artifacts/<scope>/compare/<scenario_id>/compare.json` remains the contract for pre-authored scenario compare sets
  - `artifacts/<scope>/sessions/<session_id>/compare/<node_id>/compare.json` is the contract for one generated node compared to its parent checkpoint
- Every successful generated non-root runtime node must emit a parent-vs-child compare artifact.
  - The reference branch is the immediate parent checkpoint, not always the session root.
  - The candidate branch is the generated child node.
  - The compare artifact uses the existing `CompareArtifact` shape with `branch_count: 2`.
  - The compare artifact must publish branch file references under the session namespace.
- Runtime compare emission must not create or mutate scenario-level compare artifacts under
  `artifacts/<scope>/compare/<scenario_id>/`.
- The frontend may treat `session.json` plus `node.json` as the source of truth for:
  - branch tree rendering
  - current active node
  - rollback targets
  - generated branch routing
- The frontend must continue to use run summaries, traces, snapshots, and compare artifacts for drill-down rather than inventing synthetic branch truth.

## Public Demo Artifact Source Contract

- Phase 1 public demo surfaces must read canonical artifacts through a logical artifact source, not arbitrary filesystem paths.
- Public logical artifact ids are:
  - `demo.report`
  - `demo.claims`
  - `demo.eval_summary`
  - `demo.compare`
  - `demo.documents`
  - `demo.chunks`
  - `demo.graph`
  - `demo.rubric`
- Public API routes may expose only allowlisted logical artifacts:
  - `/api/public-demo/manifest`
  - `/api/public-demo/artifacts/<artifact_id>`
- FastAPI may expose the same logical contract under `/public-demo/manifest` and `/public-demo/artifacts/<artifact_id>` when the backend service is deployed separately.
- Public API responses must not expose absolute repository paths, runtime paths, provider secrets, or arbitrary path lookup results.
- Public API responses must strip artifact-internal path fields before returning content, including `artifact_paths`, `summary_path`, `trace_path`, `snapshot_dir`, and document `source_path`.
- Public demo mutation routes must be disabled when `MIRROR_PUBLIC_DEMO_MODE=1` and `MIRROR_ALLOW_ANONYMOUS_RUNS` is not `1`.
- `MIRROR_ALLOW_ANONYMOUS_RUNS=1` is a private-preview/runtime override for local or
  explicitly authorized deployments. It is not part of the Phase 1 public demo release
  profile.
- Phase 1 public demo mode does not start sessions, generate branches, upload corpus data, create worlds, enable Hosted GPT, accept BYOK, or call the OpenAI API.

## Artifact Contract

```text
artifacts/demo/
├── ingest/
├── graph/
│   └── graph.json
├── personas/
│   └── personas.json
├── scenario/
├── run/
│   └── <scenario-run-artifacts>/
├── compare/
│   └── <scenario_id>/
│       └── compare.json
├── sessions/
│   └── <session_id>/
│       ├── session.json
│       ├── nodes/
│       │   └── <node_id>/
│       │       └── node.json
│       └── compare/
│           └── <node_id>/
│               └── compare.json
├── report/
└── eval/

artifacts/worlds/<world_id>/
├── ingest/
├── graph/
├── personas/
├── scenario/
├── run/
├── compare/
├── sessions/
├── report/
└── eval/
```

- Existing single-branch and Phase 44 matrix artifacts remain valid while the compare and interactive session contracts are implemented incrementally.

## Eval Contract

- `python -m backend.app.cli eval-demo` remains the canonical Fog Harbor regression command.
- `python -m backend.app.cli eval-world --world <world_id>` runs the bounded world pipeline plus transfer eval for one world.
- `python -m backend.app.cli eval-transfer` runs the dual-world transfer proof across the canonical demo and the current second world.
- Transfer eval summaries must include:
  - `world_id`
  - `scenario_count`
  - `checks_total`
  - `checks_passed`
  - `failed_checks`
  - `artifact_paths`

## Platform Assumption

The canonical command names remain `make setup|smoke|test|eval-demo|eval-transfer|dev-api|dev-web`.
Because GNU Make is absent in the current Windows environment, the repo also ships `make.ps1` and `make.cmd`.
