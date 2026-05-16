# Phase 47 Main-Path Product Containment

Date: 2026-05-16

## Scope

This report closes the Phase 47 main-path product containment work item.

Issue: `#369 Phase 47: main-path product containment`

Goal: verify that the default Mirror operator path remains centered on comparison, evidence, and eval review while packet-heavy or legacy operations remain secondary.

## Direct Evidence

- `frontend/src/app/page.tsx:37` keeps `Advanced Review` as the third top-level homepage action, after branch comparison and claims/evidence (`frontend/src/app/page.tsx:49`, `frontend/src/app/page.tsx:52`, `frontend/src/app/page.tsx:55`).
- `frontend/src/app/page.tsx:42` and `frontend/src/app/page.tsx:45` describe the Phase 1 public path as deterministic-only and explicitly not real-world prediction, real-person replica, political persuasion, or high-risk decision tooling.
- `frontend/src/app/page.tsx:80` states that runtime mutation, create-world, corpus upload, Hosted GPT, BYOK, auth, payment, database storage, and quota systems are reserved for later phases.
- `frontend/src/app/review/page.tsx:103` through `frontend/src/app/review/page.tsx:107` frame `/review` as a deeper workspace after the public guided demo and keep it read-only for public deployments.
- `/review` section navigation orders the page as scorecard, trace/claims, reference, then advanced operations (`frontend/src/app/review/page.tsx:113`, `frontend/src/app/review/page.tsx:116`, `frontend/src/app/review/page.tsx:120`, `frontend/src/app/review/page.tsx:122`).
- `/review` renders the main review rubric before legacy operations (`frontend/src/app/review/page.tsx:141`) and places legacy compatibility only in the later `advanced-operations` section (`frontend/src/app/review/page.tsx:394`, `frontend/src/app/review/page.tsx:400`).
- The legacy panel copy states that the default bilingual path stays in scorecard, trace, claims, and reference sections above (`frontend/src/app/review/page.tsx:407`).
- `frontend/src/app/lib/copy.ts:201` records that heavy scorecard, routing logic, and old packet surfaces remain secondary.
- `frontend/src/app/lib/copy.ts:244` through `frontend/src/app/lib/copy.ts:246` describe deep review as score, trace, and evidence first, before any legacy tools.
- `frontend/src/app/lib/copy.ts:267` through `frontend/src/app/lib/copy.ts:272` describe historical packet, delivery, and operational surfaces as compatibility, not the default review path.
- `frontend/src/app/components/legacy-operations-panel.tsx:11` through `frontend/src/app/components/legacy-operations-panel.tsx:12` lazy-load the legacy scorecard implementation, and `frontend/src/app/components/legacy-operations-panel.tsx:49` through `frontend/src/app/components/legacy-operations-panel.tsx:71` render it only after the closed `details` drawer is opened.
- `frontend/src/app/worlds/[worldId]/review/page.tsx:176` describes the world-scoped review as score-first, followed by runtime, explain, or report only if needed.
- `frontend/src/app/worlds/[worldId]/review/page.tsx:233`, `frontend/src/app/worlds/[worldId]/review/page.tsx:244`, `frontend/src/app/worlds/[worldId]/review/page.tsx:254`, and `frontend/src/app/worlds/[worldId]/review/page.tsx:272` show the world-scoped order as rubric, review brief, perturbation lineage, and then follow-up entrypoints.
- `frontend/src/app/lib/main-path-navigation.ts:28` through `frontend/src/app/lib/main-path-navigation.ts:53` keep default public navigation on world, perturb, branches, explain, and analyst mode.
- `frontend/src/app/lib/workbench-data.ts:5`, `frontend/src/app/lib/workbench-data.ts:447`, and `frontend/src/app/lib/workbench-data.ts:448` continue reading the public compare, claims, and eval summary artifacts by logical id, while the claim types and drilldown logic keep `label` and `evidence_ids` (`frontend/src/app/lib/workbench-data.ts:10`, `frontend/src/app/lib/workbench-data.ts:11`, `frontend/src/app/lib/workbench-data.ts:493`).

## Reasonable Inference

- Packet-heavy and legacy surfaces still exist, but they no longer dominate the default product path. They are either downstream of the public guided demo or inside explicitly labeled compatibility sections.
- The current branch does not need frontend code changes because the inspected routes already encode the desired containment.
- Existing compare, evidence, and eval contracts remain preserved because this work changes no schema, scenario DSL, claim/evidence shape, run trace shape, or artifact layout.

## Open Questions

- TODO[verify]: future private-beta product work should keep checking that packet/export/handoff surfaces do not move back into the default navigation or first review section.
- TODO[verify]: if a later frontend change touches runtime review, compare, evidence, eval, packet export, or handoff UI, rerun `npm run build --prefix frontend` and inspect the changed route order before merging.
- TODO[verify]: a future browser visual pass should confirm that the closed legacy drawer does not dominate above-the-fold desktop or mobile `/review`; this report verifies source order and copy, not rendered pixel priority.

## Decision

No frontend code change is required for this Phase 47 item. The public and world-scoped review surfaces already keep analysis-first review ahead of compatibility tooling, and the repository can close `#369` with documentation evidence only.

## Validation

- `python scripts/check_no_secrets.py`
- `python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim`
- `git diff --check`
