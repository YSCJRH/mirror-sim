# ADR-0006: Interactive Simulator Runtime v1

## Status

- Accepted

## Context

The current frontend has already moved away from a pure review-workbench framing and toward a simulator-shaped product flow:

- world
- perturbation
- branch change
- explanation
- rollback or retry

That product direction is useful, but the implementation is still using one transitional shortcut:

- the frontend composer maps user edits onto precomputed preset branches

That shortcut is acceptable for main-path UX prototyping, but it is now the main blocker. More frontend polish will produce diminishing returns until one runtime contract becomes explicit:

- how a perturbation becomes a generated branch
- how a session tree is represented
- how rollback works
- how generated nodes relate to existing run and compare artifacts

The project already has accepted contracts for:

- deterministic runs
- multi-branch compare artifacts
- bounded multi-world transfer

This ADR adds the next layer without weakening those contracts.

## Decision

- Introduce one new interactive exploration layer that is session-based rather than scenario-matrix-based.
  - `compare.json` remains the durable contract for pre-authored scenario comparison sets.
  - interactive generation adds a separate session namespace instead of overloading scenario compare artifacts.

- Keep v1 CLI-first.
  - Canonical entrypoints:
    - `start-session [--decision-provider <provider>] [--decision-model <model_id>]`
    - `inspect-session`
    - `generate-branch`
    - `rollback-session`
  - API or worker orchestration may be added later, but they should mirror the same contract instead of inventing a separate shape first.

- Introduce two new stable IDs:
  - `session_id`: identifies one interactive simulation exploration rooted in one world and one baseline scenario
  - `node_id`: identifies one durable node inside one session tree

- Freeze one session-local decision-model pin.
  - a session may capture one explicit model id at creation time
  - child-branch generation inside that session reuses the pinned model
  - changing the model should create a new session until a later contract explicitly widens session reconfiguration

- Freeze one session-local decision-provider pin.
  - v1 providers are `openai_compatible` and `deterministic_only`
  - ADR-0008 later extends this list with `hosted_openai` for private-beta hosted model access
  - `deterministic_only` disables model calls and keeps the session on deterministic fallback only

- Freeze rollback semantics as pointer movement rather than mutation.
  - rollback changes `active_node_id`
  - rollback does not delete descendant nodes
  - rollback does not rewrite prior run artifacts
  - re-perturbing from any node creates a new child node

- Freeze the minimum perturbation execution payload.
  - required:
    - `kind`
    - `target_id`
    - `timing`
    - `summary`
  - optional:
    - `parameters`
    - `evidence_ids`
  - user-facing composer strings are not themselves the execution contract; they must resolve into stable world-local IDs and deterministic timing before generation.

- Store interactive artifacts under a session namespace.
  - canonical root:
    - `artifacts/<scope>/sessions/<session_id>/`
  - required:
    - `session.json`
    - `nodes/<node_id>/node.json`
  - optional:
    - `compare/<node_id>/compare.json`

- Make node manifests the bridge between runtime generation and the existing artifact system.
  - each successful node publishes:
    - `run_id`
    - `summary_path`
    - `trace_path`
    - `snapshot_dir`
    - `compare_path` when parent-vs-child compare is emitted
    - `report_path` when node-scoped report materialization is emitted
    - `claims_path` when node-scoped claims are emitted
  - this keeps run, trace, and compare drill-down compatible with the existing workbench surfaces

- Keep the current bounded-world and claim/evidence boundaries intact.
  - no open-ended world simulation DSL
  - no unconstrained LLM execution loop
  - no weakening of claim/evidence integrity
  - generated runtime nodes must remain replayable through stored resolution and decision artifacts

- Explicitly defer task orchestration.
  - v1 does not yet ratify `task_id`, queue semantics, or worker heartbeats
  - TODO[verify]: if web-triggered generation proves too long-running for a synchronous contract, ratify a task contract in a dedicated follow-up ADR

## Consequences

- The frontend can stop pretending that preset branch mapping is the final product model.
- Backend work now has a stable minimal target for:
  - perturbation execution
  - branch-tree persistence
  - rollback
  - generated branch artifact routing

- Existing compare consumers do not need to be broken or migrated immediately.
  - scenario compare stays under `artifacts/<scope>/compare/<scenario_id>/compare.json`
  - interactive compare stays under `artifacts/<scope>/sessions/<session_id>/compare/<node_id>/compare.json`

- The project gains one new long-lived contract family under `sessions/`.

- Implemented baseline:
  - CLI entrypoints exist for `start-session`, `inspect-session`, `generate-branch`, and `rollback-session`
  - `session.json` and `node.json` are materialized
  - session compare/report/claims artifacts are emitted for generated nodes

- Follow-up work is still required:
  - ratify the LLM-bounded decision kernel contract
  - expand perturbation resolution beyond preset runtime mappings
  - decide whether parent-vs-child `compare.json` should always be emitted or only when requested for every runtime path
  - generalize the runtime beyond Fog Harbor-shaped outcomes and payload assumptions
