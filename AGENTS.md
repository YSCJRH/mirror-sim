# AGENTS.md

Mirror's long-term blueprint, safety boundaries, and architecture intent live in the repo-root `mirror.md`.
Unless a task explicitly says otherwise, implementation should stay aligned with `mirror.md`.

This file keeps only the short execution rules that Codex should follow first.

## Intent

Mirror is a constrained, evidence-backed, replayable what-if simulation sandbox for fictional or explicitly authorized worlds.

## Non-Goals

- Do not present Mirror as a real-world prediction machine.
- Do not build real-person personas or digital doubles.
- Do not build political persuasion, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.
- Do not package simulation output as certain real-world conclusions.

## Repo Map

- `mirror.md`: long-term project blueprint and boundaries
- `README.md`: public overview and quickstart
- `docs/plans/`: active plans and baselines
- `docs/decisions/`: ADRs and durable design decisions
- `data/demo/`: canonical Fog Harbor demo data
- `data/worlds/`: additional bounded worlds such as transfer demos
- `backend/`: CLI, pipeline, automation, and service code
- `frontend/`: review workbench
- `evals/`: assertions and eval assets
- `artifacts/`: generated outputs, not committed

## Canonical Commands

- `make setup`
- `make smoke`
- `make test`
- `make eval-demo`
- `make eval-transfer`
- `make dev-api`
- `make dev-web`

Windows entrypoints:

- `./make.ps1 setup`
- `./make.ps1 smoke`
- `./make.ps1 test`
- `./make.ps1 eval-demo`
- `./make.ps1 eval-transfer`

## Working Rules

- If a change touches more than 3 files, share a brief plan first.
- Before changing schema, scenario DSL, claim labels, run trace shape, or artifact layout, confirm the contract boundary.
- If a task changes a core contract, update `docs/architecture/contracts.md` and add an ADR when the contract is long-lived.
- Every task should end with at least one concrete validation command or test.
- Every report claim must keep both `label` and `evidence_ids`.
- Write uncertainty explicitly as `TODO[verify]: ...`; do not invent facts.

## Safety And Licensing

- Only ingest clearly permitted data.
- `data/demo/` and `data/worlds/` should remain original, fictional, or explicitly authorized.
- Default to blocking real-person personas, political persuasion, hidden surveillance, and high-risk decision domains.
- Borrow workflow ideas from open source projects, not copy-paste code. Record AGPL-sensitive dependency decisions before adoption.

## Definition Of Done

- The feature or fix is implemented.
- Minimal validation exists and passes, or the blocker is stated clearly.
- Observable output or artifacts exist when the task is pipeline-facing.
- Docs and contracts are synced when behavior changed.
- Claim/evidence integrity is preserved.
- New risks or unresolved edges are written down explicitly.
