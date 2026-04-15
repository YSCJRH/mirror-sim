# Phase Execution Queue

This note turns the current post-Day-0 repository state into an automation-ready queue.

## Current Gate State

- Phase 1 local audit: `pass`
- Phase 2 local audit: `pass`
- Phase 3 local audit: `fail`
  - current blocker: `frontend/src/app/page.tsx` does not exist

## Implication

Automation should no longer spend time on Day 0 bootstrap.

- Phase 1 and Phase 2 local audits are green, but the active backlog should still prefer Phase 1 hardening over Phase 3 UI expansion.
- The next queue should focus on locking query stability, world-model expectations, and evidence/redline regressions.
- Phase 3 remains intentionally parked behind those hardening tasks, even though its only explicit local audit failure is the missing workbench entrypoint.

## Recommended Queue

### P1-1 Query Golden Assertions

- Goal: add stable golden assertions for `inspect-world` on one canonical entity, persona, and event
- Lane: `lane:auto-safe`
- Area: `area:backend`
- Minimal test:
  - `./make.ps1 test`
  - `python -m backend.app.cli inspect-world --kind entity --id entity_east_gate --graph ... --personas ...`

### P1-2 Canonical World Expectations

- Goal: add expectations for core demo entities, relations, and events beyond simple non-empty evidence checks
- Lane: `lane:auto-safe`
- Area: `area:docs-evals`
- Minimal test:
  - `./make.ps1 eval-demo`
  - expectation set verifies stable world-model IDs and core structure

### P1-3 Query And Report Safety Wording

- Goal: extend redline-style assertions to cover query and report wording boundaries
- Lane: `lane:auto-safe`
- Area: `area:docs-evals`
- Minimal test:
  - `./make.ps1 test`
  - `./make.ps1 eval-demo`

### P1-4 Phase Audit In CI

- Goal: pull `audit-phase phase1` and `audit-phase phase2` into the long-running validation path so regressions fail earlier
- Lane: `lane:auto-safe`
- Area: `area:docs-evals`
- Minimal test:
  - CI or smoke path fails if a phase audit regresses

### P1-5 Persona Over-Inference Review

- Goal: review whether persona generation currently exceeds evidence-backed boundaries and tighten only if needed
- Lane: `lane:protected-core`
- Area: `area:backend`
- Minimal test:
  - `./make.ps1 smoke`
  - `./make.ps1 test`
  - any contract-affecting change must update docs and, if needed, an ADR

### P3-parked Workbench Shell

- Goal: replace the deferred frontend shell with a concrete browser entrypoint at `frontend/src/app/page.tsx`
- Lane: `lane:auto-safe`
- Area: `area:frontend`
- Minimal test:
  - `python -m backend.app.cli audit-phase phase3`

## Protected-Core Reminder

Even after Day 0, the following remain protected-core and must not auto-merge just because checks are green:

- `docs/architecture/contracts.md`
- `docs/decisions/`
- `backend/app/domain/`
- `backend/app/scenarios/`
- `backend/app/simulation/`
- `backend/app/reports/`

## TODO[verify]

- TODO[verify]: Codex cron automations should target worktrees rather than a long-lived checkout.
- TODO[verify]: If Phase 3 needs a backend artifact API instead of direct file reads, confirm that the chosen route does not quietly expand the protected-core contract surface.
