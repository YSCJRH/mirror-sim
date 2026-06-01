from __future__ import annotations

import json
from pathlib import Path


PHASE64_GATE_PATH = Path(
    "docs/plans/phase-64-selected-world-perturb-followup-readiness-gate-2026-05-26.md"
)
PHASE64_TITLE = "Phase 64 - Selected-World Perturb Follow-Up Readiness Gate"
PHASE64_EXIT_ISSUE = "#489"
PHASE64_SYNC_ISSUE_NUMBER = "#490"
PHASE64_SYNC_ISSUE = (
    "Phase 64: sync repo truth after Phase 63 closeout and define selected-world perturb follow-up gate"
)
PHASE64_SMOKE_ISSUE_NUMBER = "#491"
PHASE64_SMOKE_ISSUE = "Phase 64: add selected-world perturb follow-up readiness smoke"
PHASE64_SYNC_PR = "#492"
PHASE64_SMOKE_PR = "#493"
PHASE64_CLOSEOUT_PR = "#494"
PHASE63_TITLE = "Phase 63 - Selected-World Review Next-Action Route-Fidelity Gate"


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase64_perturb_followup_readiness_gate_exists_with_required_sections() -> None:
    gate = _read(PHASE64_GATE_PATH)
    required_sections = [
        "# Phase 64 Selected-World Perturb Follow-Up Readiness Gate",
        f"Issue: `{PHASE64_EXIT_ISSUE}` `Phase 64 exit gate`",
        "Current state: Phase 64 is closed; Phase 63 is closed.",
        "## Post-Phase-63 Baseline",
        "## Phase 64 Closed Queue",
        "## Selected-World Perturb Follow-Up Readiness Scope",
        "## Candidate Input Policy",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase64_gate_records_scope_and_boundaries() -> None:
    gate = _read(PHASE64_GATE_PATH)
    required_phrases = [
        "Phase 63 is closed after PR `#488`.",
        "`#483` `Phase 63 exit gate` closed by PR `#488`",
        f"milestone `{PHASE63_TITLE}` is closed",
        "`audit-github-queue` reports `paused` with no active milestone after Phase 63 closeout",
        PHASE64_TITLE,
        f"`{PHASE64_EXIT_ISSUE}` `Phase 64 exit gate`",
        f"`{PHASE64_SYNC_ISSUE_NUMBER}` `{PHASE64_SYNC_ISSUE}`",
        f"`{PHASE64_SMOKE_ISSUE_NUMBER}` `{PHASE64_SMOKE_ISSUE}`",
        f"`{PHASE64_SYNC_ISSUE_NUMBER}` closed by PR `{PHASE64_SYNC_PR}`",
        f"`{PHASE64_SMOKE_ISSUE_NUMBER}` closed by PR `{PHASE64_SMOKE_PR}`",
        f"`{PHASE64_EXIT_ISSUE}` `Phase 64 exit gate` closed by PR `{PHASE64_CLOSEOUT_PR}`",
        f"milestone `{PHASE64_TITLE}` is closed",
        "`audit-github-queue` reports `paused` with no active milestone after Phase 64 closeout",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "selected-world perturb follow-up readiness",
        "world-local perturbation presets",
        "decision schema defaults",
        "Phase 63 selected-world review next-action route fidelity is the historical baseline",
        "`frontend/src/app/worlds/[worldId]/perturb/page.tsx`",
        "`frontend/src/app/components/preset-perturbation-composer.tsx`",
        "untracked private-alpha, private-beta, kernel, and design-system planning notes remain candidate inputs only",
        "status:needs-adr",
        "risk:safety",
        "Do not start runtime sessions.",
        "Do not generate branches.",
        "Do not call POST/runtime APIs.",
        "Do not call provider or model paths.",
        "Do not change perturbation payload schema or decision schema.",
        "Do not promote broad private-beta readiness.",
        "Do not implement launch hub behavior.",
        "Do not add async/task_id behavior.",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion.",
        "Do not add or change runtime mutation behavior.",
        "Do not change route ownership, scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.",
        "Do not claim future-world readiness.",
        "Do not promote untracked planning notes as durable truth.",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_closeout_state_docs_record_phase64_queue_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE64_GATE_PATH,
    ]
    required_phrases = [
        "Phase 64 is closed",
        PHASE64_TITLE,
        f"`{PHASE64_EXIT_ISSUE}` `Phase 64 exit gate`",
        f"`{PHASE64_SYNC_ISSUE_NUMBER}` `{PHASE64_SYNC_ISSUE}`",
        f"`{PHASE64_SMOKE_ISSUE_NUMBER}` `{PHASE64_SMOKE_ISSUE}`",
        f"`{PHASE64_SYNC_ISSUE_NUMBER}` closed by PR `{PHASE64_SYNC_PR}`",
        f"`{PHASE64_SMOKE_ISSUE_NUMBER}` closed by PR `{PHASE64_SMOKE_PR}`",
        f"`{PHASE64_EXIT_ISSUE}` `Phase 64 exit gate` closed by PR `{PHASE64_CLOSEOUT_PR}`",
        f"milestone `{PHASE64_TITLE}` is closed",
        "`audit-github-queue` reports `paused` with no active milestone after Phase 64 closeout",
        "`docs/plans/phase-64-selected-world-perturb-followup-readiness-gate-2026-05-26.md`",
        "`docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md`",
        "`scripts/smoke_phase64_selected_world_perturb_followup_readiness.py`",
        "selected-world perturb follow-up readiness",
        "world-local perturbation presets",
        "decision schema defaults",
        "Phase 63 selected-world review next-action route fidelity is the historical baseline",
        "Phase 63 is closed after PR `#488`",
        "`#483` `Phase 63 exit gate` closed by PR `#488`",
    ]
    forbidden_phrases = [
        "Phase 64 implements async",
        "Phase 64 implements launch hub",
        "Phase 64 replaces `/`",
        "Phase 64 widens the public path",
        "Phase 64 starts runtime sessions",
        "Phase 64 generates branches",
        "Phase 64 calls POST/runtime APIs",
        "Phase 64 calls provider or model paths",
        "Phase 64 adds Hosted GPT",
        "Phase 64 adds BYOK",
        "Phase 64 adds upload",
        "Phase 64 adds auth",
        "Phase 64 adds database",
        "Phase 64 adds object storage",
        "Phase 64 ratifies task_id",
        "Phase 64 changes perturbation payload schema",
        "Phase 64 changes decision schema",
        "Phase 64 changes route ownership",
        "Phase 64 changes scenario DSL",
        "Phase 64 changes claim labels",
        "Phase 64 changes report claim `evidence_ids`",
        "Phase 64 changes run trace shape",
        "Phase 64 changes compare artifact shape",
        "Phase 64 changes plugin MCP contract",
        "Phase 64 changes artifact layout",
        "Phase 64 promotes broad private-beta readiness",
        "Phase 64 promotes future-world readiness",
        "Phase 64 promotes untracked planning notes",
        "Phase 64 is active",
        "Phase 64 active",
        "Phase 64 Active Queue",
        "Phase 64 exit gate `#489`: open / blocked",
        "`audit-github-queue` reports `ready` with active milestone",
        "`audit-github-queue` reports `ready` for the active Phase 64 milestone",
        "remaining active work item",
        "ready / current",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 64 active queue wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 64 scope: {phrase}"


def test_bootstrap_spec_records_phase64_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": PHASE64_TITLE,
        "description": (
            "Prove that selected-world perturb follow-up surfaces are reachable, world-scoped, "
            "schema-backed, and bounded for Fog Harbor, Museum Night, and Library Rain without "
            "starting sessions, generating branches, adding mutating APIs, widening "
            "runtime/public/plugin contracts, or promoting broad readiness claims."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:64",
        "color": "C8E6C9",
        "description": "Phase 64 selected-world perturb follow-up readiness work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 64 exit gate",
        PHASE64_SYNC_ISSUE,
        PHASE64_SMOKE_ISSUE,
    ]:
        assert title in titles
        assert titles[title]["milestone"] == PHASE64_TITLE
        assert "phase:64" in titles[title]["labels"]

    assert "lane:protected-core" in titles["Phase 64 exit gate"]["labels"]
    assert "status:blocked" in titles["Phase 64 exit gate"]["labels"]

    assert "lane:protected-core" in titles[PHASE64_SYNC_ISSUE]["labels"]
    assert "risk:ci" in titles[PHASE64_SYNC_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE64_SYNC_ISSUE]["labels"]

    assert "lane:protected-core" in titles[PHASE64_SMOKE_ISSUE]["labels"]
    assert "area:frontend" in titles[PHASE64_SMOKE_ISSUE]["labels"]
    assert "risk:ci" in titles[PHASE64_SMOKE_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE64_SMOKE_ISSUE]["labels"]
