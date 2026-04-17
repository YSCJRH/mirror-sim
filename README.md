# Mirror Engine

<p align="center">
  <img src="mirror.png" alt="Mirror concept illustration" width="100%" />
</p>

Mirror Engine is a constrained, evidence-backed conditional simulation sandbox for fictional or explicitly authorized knowledge environments. It is designed to answer questions like "if this disturbance occurs, how do key actors, information flows, and outcomes change?" without presenting itself as a real-world future prediction machine.

## Current Status

The repository has completed Day 0 bootstrap, closed the Phase 1-34 gates, and resumed the successor queue as `Phase 35 - Execution Tracking and Escalation Trigger`.

- Governance documents and Codex execution rules are in place.
- The canonical demo world is `Fog Harbor East Gate`.
- The backend can ingest, build a graph, build personas, validate scenarios, simulate deterministic runs, generate reports, inspect world objects, and run evals.
- The repo now also includes the long-running automation and workbench pieces:
  - GitHub issue and PR templates
  - lane policy and bootstrap spec
  - CI upgraded to a long-running quality gate
  - local lane-classification, phase-audit, and GitHub queue-audit commands
  - protected `main` with required status checks and auto-merge for safe-lane PRs
  - a browser workbench that now supports claim -> evidence drill-down, trace review, reviewer scorecards, issue-comment packets, operator handoff briefs, execution kickoff boards, and escalation decision guides
  - a documented worktree-based pickup and handoff path for long-running queue execution
- GitHub queue state is aligned with the local baseline:
  - Phase 3 exit issue `#4` is closed
  - milestone `Phase 3 - Eval/UI/Demo` is closed
  - milestone `Phase 4 - Review Workflow and Ops Hardening` is closed
  - milestone `Phase 5 - Review Sign-off and Evidence Packaging` is closed
  - milestone `Phase 6 - Automation Activation and Queue Hygiene` is closed
  - milestone `Phase 7 - Operator Handoff and Review Delivery` is closed
  - milestone `Phase 8 - Closeout Delivery and Pickup Routing` is closed
  - milestone `Phase 9 - Review Delivery Polish and Completeness` is closed
  - milestone `Phase 10 - Guided Delivery and Quick Export` is closed
  - milestone `Phase 11 - Export Presets and Delivery Shortcuts` is closed
  - milestone `Phase 12 - Delivery Preset Refinement and Comparison Flow` is closed
  - milestone `Phase 13 - Guided Export Payload Review` is closed
  - milestone `Phase 14 - Export Delta and Copy Confidence` is closed
  - milestone `Phase 15 - Override Rationale and Delivery Confidence` is closed
  - milestone `Phase 16 - Export Bundle Composition and Handoff Packaging` is closed
  - milestone `Phase 17 - Final Bundle Delivery and Handoff Manifest` is closed
  - milestone `Phase 18 - Bundle Variants and Receiver Guidance` is closed
  - milestone `Phase 19 - Receiver Roles and Follow-Through Routing` is closed
  - milestone `Phase 20 - Role-Specific Bundle Layout and Decision Templates` is closed
  - milestone `Phase 21 - Role Presets and Response Packaging` is closed
  - milestone `Phase 22 - Preset Workflow and Packed Responses` is closed
  - Phase 22 queue was completed through issues `#151-#154`
  - milestone `Phase 23 - Preset Sessions and Response Kits` is closed
  - Phase 23 queue was completed through issues `#158-#161`
  - milestone `Phase 24 - Session Handoff and Route Comparison` is closed
  - Phase 24 queue was completed through issues `#165-#168`
  - milestone `Phase 25 - Handoff Delivery and Packet Variants` is closed
  - Phase 25 queue was completed through issues `#172-#175`
  - milestone `Phase 26 - Packet Delivery Prep and Sender Notes` is closed
  - Phase 26 queue was completed through issues `#179-#182`
  - milestone `Phase 27 - Sendoff Summary and Packet Recommendation` is closed
  - Phase 27 queue was completed through issues `#186-#189`
  - milestone `Phase 28 - Send Decision and Delivery Checklist` is closed
  - Phase 28 queue was completed through issues `#193-#196` plus branch-hygiene governance issues `#199-#200`
  - milestone `Phase 29 - Delivery Bundle and Follow-up Pack` is closed
  - Phase 29 queue was completed through issues `#204-#207`
  - milestone `Phase 30 - Delivery Confirmation and Receiver Response` is closed
  - Phase 30 queue was completed through issues `#211-#214`
  - milestone `Phase 31 - Reply Outcome and Resolution Handoff` is closed
  - Phase 31 queue was completed through issues `#218-#221`
  - milestone `Phase 32 - Resolution Status and Next-Step Routing` is closed
  - Phase 32 queue was completed through issues `#225-#228`
  - milestone `Phase 33 - Action Readiness and Escalation Packet` is closed
  - Phase 33 queue was completed through issues `#232-#235`
  - milestone `Phase 34 - Execution Kickoff and Escalation Decision` is closed
  - Phase 34 queue was completed through issues `#239-#242`
  - milestone `Phase 35 - Execution Tracking and Escalation Trigger` is open
  - Phase 35 queue is initialized through issues `#246-#249`

Local phase audits currently show:

- Phase 1: `pass`
- Phase 2: `pass`
- Phase 3: `pass`

## Quick Start

PowerShell:

```powershell
./make.ps1 smoke
./make.ps1 test
./make.ps1 eval-demo
```

Unix-like shells with `make` installed:

```bash
make smoke
make test
make eval-demo
```

Direct CLI examples:

```bash
python -m backend.app.cli ingest data/demo/corpus/manifest.yaml --out artifacts/demo/ingest
python -m backend.app.cli build-graph artifacts/demo/ingest/chunks.jsonl --out artifacts/demo/graph
python -m backend.app.cli personas artifacts/demo/graph/graph.json --out artifacts/demo/personas
python -m backend.app.cli validate-scenario data/demo/scenarios/reporter_detained.yaml --out artifacts/demo/scenario/reporter_detained.json
python -m backend.app.cli simulate data/demo/scenarios/reporter_detained.yaml --graph artifacts/demo/graph/graph.json --personas artifacts/demo/personas/personas.json --out artifacts/demo/run/reporter_detained
python -m backend.app.cli report artifacts/demo/run/reporter_detained --baseline artifacts/demo/run/baseline --out artifacts/demo/report
python -m backend.app.cli inspect-world --kind entity --id entity_east_gate --graph artifacts/demo/graph/graph.json --personas artifacts/demo/personas/personas.json
python -m backend.app.cli classify-lane --files README.md backend/app/cli.py
python -m backend.app.cli audit-phase phase1
python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim
```

## Repo Map

- [mirror.md](/D:/mirror/mirror.md): top-level blueprint and harness
- [AGENTS.md](/D:/mirror/AGENTS.md): Codex execution rules
- [docs/plans/phase-0-foundation.md](/D:/mirror/docs/plans/phase-0-foundation.md): Phase 0 implementation note
- [docs/plans/automation-roadmap.md](/D:/mirror/docs/plans/automation-roadmap.md): long-running automation bootstrap and operating plan
- [docs/plans/phase-execution-queue.md](/D:/mirror/docs/plans/phase-execution-queue.md): current phase queue and execution order
- [docs/plans/current-state-baseline.md](/D:/mirror/docs/plans/current-state-baseline.md): current handoff baseline and trusted source-of-truth checks
- [docs/plans/long-running-loop-runbook.md](/D:/mirror/docs/plans/long-running-loop-runbook.md): worktree-based queue pickup, review, and handoff runbook
- [docs/architecture/contracts.md](/D:/mirror/docs/architecture/contracts.md): durable contracts and assumptions
- [data/demo/config/world_model.yaml](/D:/mirror/data/demo/config/world_model.yaml): demo world model and persona blueprint
- [data/demo](/D:/mirror/data/demo): demo world, scenarios, expectations
- [backend](/D:/mirror/backend): FastAPI app, CLI, automation helpers, domain models, pipeline
- [evals/assertions](/D:/mirror/evals/assertions): automated assertions and redlines
- [frontend](/D:/mirror/frontend): review workbench with Phase 34 kickoff and escalation-decision surfaces landed while the current Phase 35 execution-tracking queue continues to consume the same artifact surface
- [.github/automation/bootstrap-spec.json](/D:/mirror/.github/automation/bootstrap-spec.json): GitHub bootstrap source of truth
- [.github/automation/lane-policy.json](/D:/mirror/.github/automation/lane-policy.json): safe-lane vs protected-core policy

## Architecture Shape

The current deterministic backbone remains:

```text
Corpus
  -> Ingest / Chunk
  -> Graph Build
  -> Persona Cards
  -> Scenario Validation
  -> Baseline Run
  -> Injected Run
  -> Diff Report + Claims
  -> Eval Summary
```

Key principles:

- Deterministic backbone first; LLMs stay at the edge.
- Local files and transparent artifacts first; heavy infra later.
- Reports must carry claim labels and `evidence_ids`.
- World model outputs must remain queryable.
- Safety and eval are part of the main loop, not an appendix.

## Automation Bootstrap

Mirror now treats GitHub as the operational source of truth for long-running automation.

Repository-side automation assets:

- `.github/ISSUE_TEMPLATE/`
- `.github/pull_request_template.md`
- `.github/workflows/phase0.yml`
- `.github/workflows/pull-request-lane.yml`
- `python scripts/bootstrap_github.py --repo YSCJRH/mirror-sim`
- `python -m backend.app.cli classify-lane ...`
- `python -m backend.app.cli audit-phase ...`
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`

Important constraint:

- Day 0 bootstrap and Phase 34 closeout are complete. Phase 35 is now the active successor queue and should remain the only open execution milestone.
- The current handoff baseline is tracked in [docs/plans/current-state-baseline.md](/D:/mirror/docs/plans/current-state-baseline.md).
- Long-running pickup, worktree usage, and branch hygiene are documented in [docs/plans/long-running-loop-runbook.md](/D:/mirror/docs/plans/long-running-loop-runbook.md).
- The local heartbeat automation may resume pickup guidance only against the Phase 35 queue and must stop again if `audit-github-queue` leaves `ready`.
- Protected-core changes still must not auto-merge just because checks are green.

## Non-goals

- Open-world ingest
- Real-person or real-society modeling
- Free-form agent swarm
- Heavy graph databases as the default
- Fancy UI before artifacts and evals are stable
- Deep binding to external LLM APIs in the core loop

## License

This repository is licensed under `MIT`.
