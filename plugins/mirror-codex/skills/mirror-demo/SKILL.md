---
name: mirror-demo
description: Use when Codex needs to explain, inspect, or validate Mirror's read-only deterministic Phase 1 public demo, including manifest, claims, evidence, eval summary, branch comparison, and public safety boundaries. Use for Mirror public demo onboarding, safe local demo checks, and claim/evidence review without model calls or filesystem-path artifact access.
---

# Mirror Demo

Use this skill to help developers understand and inspect Mirror's deterministic public demo.

## Core Contract

- Keep the workflow read-only, deterministic, and local-first.
- Treat Mirror as a constrained what-if sandbox for fictional or explicitly authorized worlds.
- Do not present Mirror as a real-world prediction machine.
- Do not build real-person personas, digital doubles, political persuasion, law-enforcement scoring, hiring, credit, medical, or judicial decision systems.
- Do not create worlds, upload corpora, start runtime sessions, generate branches, mutate artifacts, or call model providers.
- Do not ask for or write provider secrets. Do not use `NEXT_PUBLIC_OPENAI_API_KEY`.
- Keep user configuration in local env or the user's own deployment environment; never put it in repo files, frontend code, build logs, artifacts, or error pages.

## First Pass

Read the boundary docs before summarizing or advising:

```powershell
Get-Content -Raw AGENTS.md
Get-Content -Raw README.md
rg -n "Phase 1 Public Demo Mode|What Mirror Is Not|Public read-only endpoints" README.md
```

If deeper architecture context matters, read `mirror.md` and distinguish direct evidence, reasonable inference, and open questions.

For MCP tool-contract questions, read `docs/decisions/ADR-0010-mirror-codex-plugin-mcp-contract.md`. Treat it as the durable v1 boundary for the repo-local plugin.

## Demo Workflow

Use public logical artifact ids, not arbitrary filesystem paths:

- `demo.report`
- `demo.claims`
- `demo.eval_summary`
- `demo.compare`
- `demo.documents`
- `demo.chunks`
- `demo.graph`
- `demo.rubric`

To inspect the local public demo API contract, prefer:

```powershell
rg -n "PUBLIC_DEMO_ARTIFACTS|/public-demo/manifest|/public-demo/artifacts|/readyz|/healthz" backend\app\main.py
rg -n "PUBLIC_DEMO_ARTIFACTS|ArtifactSource|normalizeTrustedDemoPath" frontend\src\app\lib
```

To inspect claims and evidence, verify every report claim has both `label` and `evidence_ids`. Summaries must say "based on the current corpus and deterministic rules" or equivalent bounded language, not certain real-world conclusions.

## MCP Tools

If the Mirror Codex plugin MCP server is enabled, use only its read-only tools:

- `get_demo_manifest`
- `get_demo_artifact`
- `get_eval_summary`
- `explain_demo_claim`
- `compare_demo_branches`

Pass only logical ids such as `demo.claims`, `claim_evacuation_turn`, or `branch_reporter_detained`. Do not pass filesystem paths, URLs, shell commands, provider names, API keys, or config values.

## MCP Resources And Prompts

If MCP resources are available, use only fixed `mirror-demo://...` resources such as:

- `mirror-demo://manifest`
- `mirror-demo://artifact/demo.claims`
- `mirror-demo://artifact/demo.eval_summary`
- `mirror-demo://artifact/demo.compare`

If MCP prompts are available, use only fixed prompt names:

- `inspect-public-demo`
- `review-claim-evidence`
- `compare-demo-branches`

Do not invent resource URIs or prompt arguments. Do not pass paths, URLs, provider config, API keys, model names, or user documents.

## Evidence Navigation

For a claim/evidence review, keep the chain explicit and read-only:

1. Read `mirror-demo://artifact/demo.claims` or `demo.claims`.
2. Pick the requested logical claim id, for example `claim_evacuation_turn`.
3. Preserve the claim `label` and `evidence_ids`.
4. Read `mirror-demo://artifact/demo.chunks` or `demo.chunks` and match evidence ids such as
   `chunk_doc_budget_minutes_002`, `chunk_doc_budget_minutes_003`, and
   `chunk_doc_engineering_inspection_002`.
5. Read `mirror-demo://artifact/demo.documents` or `demo.documents` and match each chunk's
   `document_id` to sanitized document metadata.
6. Summarize only what the deterministic demo supports. Use bounded language such as
   "based on the current corpus and deterministic rules."

Do not expose document `source_path`, local artifact paths, or user-local configuration in the
answer.

## Validation

For plugin/demo-only work that does not touch frontend code, run:

```powershell
./make.ps1 plugin-release-check
```

`plugin-release-check` runs static validation, MCP tests, `python plugins/mirror-codex/scripts/smoke_mcp_stdio.py`, secret scan, phase2 audit, and whitespace diff validation.

If frontend code or frontend routes changed, also run:

```powershell
npm run build --prefix frontend
```

Remote public demo smoke is optional and only for explicit release checks:

```powershell
python scripts/smoke_public_demo_web.py --base-url https://mirror-public-demo.onrender.com
```

Do not add this remote check to the default plugin workflow.

## MCP Boundary

This plugin registers one fixed local stdio MCP server. Keep tool inputs schema-bound to logical ids and keep the command/args in `.mcp.json` hardcoded. Do not add mutating tools, arbitrary path reads, model calls, uploads, hosted provider paths, BYOK, auth, billing, database, object storage, or quota behavior.

If the MCP tool, resource, or prompt surface changes, update the ADR, plugin README, this skill, static validator, and plugin tests in the same change.
