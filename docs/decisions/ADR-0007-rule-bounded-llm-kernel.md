# ADR-0007: Rule-Bounded LLM Decision Kernel

## Status

- Accepted

## Context

Mirror started from a deterministic rule-first simulation core.

That baseline was appropriate when the project needed:

- bounded worlds
- stable branch comparison
- replayable artifacts
- evidence-backed reports

But the next phase needs more than a fixed first-match state machine.

The project now needs a kernel that can:

- analyze richer perturbations
- choose among multiple legal branch actions
- stay adaptable across worlds
- remain replayable and auditable

At the same time, Mirror must not become an unconstrained agent sandbox.

The blueprint and safety boundaries still require:

- bounded worlds
- explicit contracts
- replayability
- durable evidence/report/eval artifacts
- no hidden free-form control loop

## Decision

- Mirror now accepts LLM participation inside the analysis kernel.
- LLM participation is allowed only through a rule-bounded decision loop:
  - world rules define the legal action space
  - the simulator computes which actions are currently legal
  - the LLM may propose which legal action to choose and why
  - a validator accepts only legal proposals
  - state transitions remain deterministic once a legal action is selected

- LLMs may not:
  - invent new action types outside the world decision schema
  - write arbitrary world state directly
  - bypass state preconditions
  - bypass replay/audit persistence
  - expand beyond the bounded world contract

- Replayability is a hard requirement.
  - every decision point must persist:
    - model identifier
    - prompt version
    - input hash
    - output hash
    - validated action selection
    - validation result
    - fallback flag
  - replay must prefer stored decisions over re-sampling

- Deterministic fallback is mandatory.
  - if the model is unavailable
  - if the output is invalid
  - if retries are exhausted
  then the kernel must fall back to a bounded deterministic strategy instead of failing open

- World-local decision schema becomes the legal surface for the kernel.
  - `config/decision_schema.yaml` defines:
    - allowed action types
    - perturbation kinds
    - timing tokens
    - target source classes
    - parameter schema
    - retry/fallback policy

## Consequences

- Mirror is no longer a pure rule-only simulator.
- Mirror is also not an unconstrained LLM simulator.
- The real kernel becomes:
  - `resolved perturbation -> legal choice set -> LLM proposal -> validation -> deterministic state apply`

- New durable artifacts become first-class:
  - `resolution.json`
  - `decision_trace.jsonl`

- Eval now needs to cover:
  - invalid proposal rejection
  - fallback activation
  - replay correctness
  - multi-world decision-schema compliance

## Not Adopted

- Fully free-form natural-language perturbation as the execution contract
- Open-ended agent planning without world-local action schemas
- Non-replayable LLM sampling inside the core execution path
- LLM-written raw state patches without validator control
