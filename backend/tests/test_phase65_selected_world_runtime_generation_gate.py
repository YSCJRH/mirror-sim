from __future__ import annotations

import json
from pathlib import Path


PHASE65_GATE_PATH = Path(
    "docs/plans/phase-65-selected-world-deterministic-runtime-generation-gate-2026-06-01.md"
)
PHASE64_EVIDENCE_PATH = Path(
    "docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md"
)
PHASE65_TITLE = "Phase 65 - Selected-World Deterministic Runtime Generation Evidence Gate"
PHASE65_EXIT_ISSUE = "#495"
PHASE65_SYNC_ISSUE_NUMBER = "#496"
PHASE65_SYNC_ISSUE = (
    "Phase 65: sync repo truth after Phase 64 closeout and define selected-world runtime-generation evidence gate"
)
PHASE65_SMOKE_ISSUE_NUMBER = "#497"
PHASE65_SMOKE_ISSUE = "Phase 65: add selected-world deterministic runtime generation smoke"
PHASE65_SYNC_PR = "#498"
PHASE65_SMOKE_PR = "#499"
PHASE65_CLOSEOUT_PR = "#500"
PHASE65_CLOSEOUT_STATUS = f"`#495` `Phase 65 exit gate` closed by PR `{PHASE65_CLOSEOUT_PR}`"
PHASE65_EXTERNAL_STOP_STATE = (
    "`audit-github-queue` reports `paused` with no active milestone after Phase 65 closeout"
)
PHASE64_TITLE = "Phase 64 - Selected-World Perturb Follow-Up Readiness Gate"


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase65_runtime_generation_gate_exists_with_required_sections() -> None:
    gate = _read(PHASE65_GATE_PATH)
    required_sections = [
        "# Phase 65 Selected-World Deterministic Runtime Generation Evidence Gate",
        f"Issue: `{PHASE65_EXIT_ISSUE}` `Phase 65 exit gate`",
        "Current state: Phase 65 is closed; Phase 64 is closed.",
        "## Post-Phase-64 Baseline",
        "## Phase 65 Closed Queue",
        "## Selected-World Deterministic Runtime Generation Scope",
        "## Candidate Input Policy",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase65_gate_records_scope_and_boundaries() -> None:
    gate = _read(PHASE65_GATE_PATH)
    required_phrases = [
        "Phase 64 is closed after PR `#494`.",
        "`#489` `Phase 64 exit gate` closed by PR `#494`",
        f"milestone `{PHASE64_TITLE}` is closed",
        "`audit-github-queue` reports `paused` with no active milestone after Phase 64 closeout",
        PHASE65_TITLE,
        f"`{PHASE65_EXIT_ISSUE}` `Phase 65 exit gate`",
        f"`{PHASE65_SYNC_ISSUE_NUMBER}` `{PHASE65_SYNC_ISSUE}`",
        f"`{PHASE65_SMOKE_ISSUE_NUMBER}` `{PHASE65_SMOKE_ISSUE}`",
        f"`{PHASE65_SYNC_ISSUE_NUMBER}` closed by PR `{PHASE65_SYNC_PR}`",
        f"`{PHASE65_SMOKE_ISSUE_NUMBER}` closed by PR `{PHASE65_SMOKE_PR}`",
        f"Phase 65 is closed as `{PHASE65_TITLE}`",
        f"milestone `{PHASE65_TITLE}` is closed",
        PHASE65_CLOSEOUT_STATUS,
        PHASE65_EXTERNAL_STOP_STATE,
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "deterministic runtime generation evidence",
        "existing v1 CLI/session contracts",
        "`start-session`",
        "`generate-branch`",
        "temporary local artifacts",
        "route-derived `worldId` guards",
        "Phase 64 selected-world perturb follow-up readiness is the historical baseline",
        "untracked private-alpha, private-beta, kernel, and design-system planning notes remain candidate inputs only",
        "status:needs-adr",
        "risk:safety",
        "Do not add routes or APIs.",
        "Do not change scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract.",
        "Do not add async/task_id behavior or worker queues.",
        "Do not implement launch hub behavior.",
        "Do not call provider or model paths.",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or public/plugin path expansion.",
        "Do not promote broad private-beta readiness.",
        "Do not claim future-world readiness.",
        "Do not promote untracked planning notes as durable truth.",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_phase64_evidence_note_no_longer_claims_active_queue() -> None:
    evidence = _read(PHASE64_EVIDENCE_PATH)
    assert "Phase 64 is closed after PR `#494`" in evidence
    assert "`#489` `Phase 64 exit gate` closed by PR `#494`" in evidence
    assert "Phase 64 remains active" not in evidence
    assert "`#489` remains the blocked exit gate" not in evidence


def test_active_state_docs_record_phase65_queue_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE65_GATE_PATH,
    ]
    required_phrases = [
        f"Phase 65 is closed as `{PHASE65_TITLE}`",
        PHASE65_TITLE,
        f"`{PHASE65_EXIT_ISSUE}` `Phase 65 exit gate`",
        f"`{PHASE65_SYNC_ISSUE_NUMBER}` `{PHASE65_SYNC_ISSUE}`",
        f"`{PHASE65_SMOKE_ISSUE_NUMBER}` `{PHASE65_SMOKE_ISSUE}`",
        f"`{PHASE65_SYNC_ISSUE_NUMBER}` closed by PR `{PHASE65_SYNC_PR}`",
        f"`{PHASE65_SMOKE_ISSUE_NUMBER}` closed by PR `{PHASE65_SMOKE_PR}`",
        PHASE65_CLOSEOUT_STATUS,
        PHASE65_EXTERNAL_STOP_STATE,
        "`docs/plans/phase-65-selected-world-deterministic-runtime-generation-gate-2026-06-01.md`",
        "`docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md`",
        "`scripts/smoke_phase65_selected_world_runtime_generation.py`",
        "selected-world deterministic runtime generation evidence",
        "existing v1 CLI/session contracts",
        "temporary local artifacts",
        "Phase 64 is closed after PR `#494`",
        "`#489` `Phase 64 exit gate` closed by PR `#494`",
    ]
    forbidden_phrases = [
        "Phase 65 implements async",
        "Phase 65 ratifies task_id",
        "Phase 65 adds workers",
        "Phase 65 implements launch hub",
        "Phase 65 replaces `/`",
        "Phase 65 widens the public path",
        "Phase 65 calls provider or model paths",
        "Phase 65 adds Hosted GPT",
        "Phase 65 adds BYOK",
        "Phase 65 adds upload",
        "Phase 65 adds auth",
        "Phase 65 adds database",
        "Phase 65 adds object storage",
        "Phase 65 changes route ownership",
        "Phase 65 changes scenario DSL",
        "Phase 65 changes perturbation payload schema",
        "Phase 65 changes decision schema",
        "Phase 65 changes claim labels",
        "Phase 65 changes report claim `evidence_ids`",
        "Phase 65 changes run trace shape",
        "Phase 65 changes compare artifact shape",
        "Phase 65 changes session/node manifest shape",
        "Phase 65 changes plugin MCP contract",
        "Phase 65 changes artifact layout",
        "Phase 65 promotes broad private-beta readiness",
        "Phase 65 promotes future-world readiness",
        "Phase 65 promotes untracked planning notes",
        "Phase 65 is active",
        "Phase 65 active",
        "Phase 65 Active Queue",
        "Phase 65 exit gate `#495`: open / blocked",
        "`audit-github-queue` reports `ready` for the active Phase 65 milestone",
        "remaining active work item",
        "Phase 65 closeout target is recorded",
        "After this Phase 65 closeout PR merges and external closure is verified",
        "Phase 65 exit gate: closeout target recorded in this PR",
        "Phase 64 is active",
        "Phase 64 active",
        "Phase 64 Active Queue",
        "Phase 64 exit gate `#489`: open / blocked",
        "`audit-github-queue` reports `paused` with no active milestone after Phase 65 sync",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 65 closeout target wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 65 scope: {phrase}"


def test_current_state_capabilities_summary_includes_recent_phase_queue() -> None:
    current_state = _read(Path("docs/plans/current-state-baseline.md"))
    required_phrases = [
        "Phase 63 closed after selected-world review next-action route fidelity",
        "Phase 64 closed after PR `#494`",
        f"Phase 65 is closed as `{PHASE65_TITLE}`",
        "selected-world deterministic runtime generation evidence reproduced through existing v1 CLI/session contracts",
    ]
    for phrase in required_phrases:
        assert phrase in current_state


def test_bootstrap_spec_records_phase65_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": PHASE65_TITLE,
        "description": (
            "Prove with temporary local deterministic artifacts that Fog Harbor, Museum Night, "
            "and Library Rain can each start a world-scoped runtime session and generate one "
            "branch through existing v1 CLI/session contracts without adding APIs, schemas, "
            "async/task_id behavior, launch hub behavior, provider calls, public/plugin "
            "expansion, or broad private-beta/future-world readiness claims."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:65",
        "color": "C8E6C9",
        "description": "Phase 65 selected-world deterministic runtime generation evidence work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 65 exit gate",
        PHASE65_SYNC_ISSUE,
        PHASE65_SMOKE_ISSUE,
    ]:
        assert title in titles
        assert titles[title]["milestone"] == PHASE65_TITLE
        assert "phase:65" in titles[title]["labels"]

    assert "lane:protected-core" in titles["Phase 65 exit gate"]["labels"]
    assert "status:blocked" in titles["Phase 65 exit gate"]["labels"]

    assert "lane:protected-core" in titles[PHASE65_SYNC_ISSUE]["labels"]
    assert "risk:core-contract" in titles[PHASE65_SYNC_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE65_SYNC_ISSUE]["labels"]

    assert "lane:protected-core" in titles[PHASE65_SMOKE_ISSUE]["labels"]
    assert "area:backend" in titles[PHASE65_SMOKE_ISSUE]["labels"]
    assert "risk:core-contract" in titles[PHASE65_SMOKE_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE65_SMOKE_ISSUE]["labels"]
