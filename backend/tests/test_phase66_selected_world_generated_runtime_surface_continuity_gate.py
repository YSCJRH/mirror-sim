from __future__ import annotations

import json
from pathlib import Path


PHASE65_GATE_PATH = Path(
    "docs/plans/phase-65-selected-world-deterministic-runtime-generation-gate-2026-06-01.md"
)
PHASE66_GATE_PATH = Path(
    "docs/plans/phase-66-selected-world-generated-runtime-surface-continuity-gate-2026-06-04.md"
)
PHASE65_TITLE = "Phase 65 - Selected-World Deterministic Runtime Generation Evidence Gate"
PHASE65_CLOSEOUT_PR = "#500"
PHASE65_EXIT_ISSUE = "#495"
PHASE65_SYNC_ISSUE = "#496"
PHASE65_SMOKE_ISSUE = "#497"
PHASE66_TITLE = "Phase 66 - Selected-World Generated Runtime Surface Continuity Gate"
PHASE66_MILESTONE_NUMBER = "#66"
PHASE66_EXIT_ISSUE_NUMBER = "#501"
PHASE66_SYNC_ISSUE_NUMBER = "#502"
PHASE66_SMOKE_ISSUE_NUMBER = "#503"
PHASE66_SYNC_ISSUE = (
    "Phase 66: sync repo truth after Phase 65 closeout and define selected-world "
    "generated-runtime surface continuity gate"
)
PHASE66_SMOKE_ISSUE = "Phase 66: add selected-world generated runtime surface continuity smoke"
PHASE66_TODO = (
    "TODO[verify]: Phase 66 generated-runtime surface continuity is inferred from "
    "Phase 65 evidence and existing world-scoped runtime/review/report routes; no "
    "tracked pre-Phase-66 doc currently names this scope."
)


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def test_phase65_docs_record_externally_verified_closeout() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE65_GATE_PATH,
    ]
    required_phrases = [
        f"Phase 65 is closed as `{PHASE65_TITLE}`",
        f"`{PHASE65_EXIT_ISSUE}` `Phase 65 exit gate` closed by PR `{PHASE65_CLOSEOUT_PR}`",
        f"`{PHASE65_SYNC_ISSUE}` closed by PR `#498`",
        f"`{PHASE65_SMOKE_ISSUE}` closed by PR `#499`",
        f"milestone `{PHASE65_TITLE}` is closed",
        "`audit-github-queue` reports `paused` with no active milestone after Phase 65 closeout",
        "`docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md`",
        "`scripts/smoke_phase65_selected_world_runtime_generation.py`",
    ]
    forbidden_phrases = [
        "Phase 65 closeout target is recorded",
        "After this Phase 65 closeout PR merges and external closure is verified",
        "Phase 65 exit gate: closeout target recorded in this PR",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing verified Phase 65 closeout wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} still contains pre-merge Phase 65 target wording: {phrase}"


def test_phase66_successor_boundary_gate_exists_with_required_sections() -> None:
    gate = _read(PHASE66_GATE_PATH)
    required_sections = [
        "# Phase 66 Selected-World Generated Runtime Surface Continuity Gate",
        f"Issue: `{PHASE66_EXIT_ISSUE_NUMBER}` `Phase 66 exit gate`",
        "Current state: Phase 66 successor boundary is active; Phase 65 is closed.",
        "## Post-Phase-65 Baseline",
        "## Phase 66 Active Queue",
        "## Selected-World Generated Runtime Surface Continuity Scope",
        "## Candidate Input Policy",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase66_gate_records_inferred_scope_and_boundaries() -> None:
    gate = _read(PHASE66_GATE_PATH)
    required_phrases = [
        PHASE65_TITLE,
        f"`{PHASE65_EXIT_ISSUE}` `Phase 65 exit gate` closed by PR `{PHASE65_CLOSEOUT_PR}`",
        f"milestone `{PHASE65_TITLE}` is closed",
        "`audit-github-queue` reports `paused` with no active milestone after Phase 65 closeout",
        PHASE66_TITLE,
        f"milestone `{PHASE66_TITLE}` is open as milestone `{PHASE66_MILESTONE_NUMBER}`",
        f"`{PHASE66_EXIT_ISSUE_NUMBER}` `Phase 66 exit gate`",
        f"`{PHASE66_SYNC_ISSUE_NUMBER}` `{PHASE66_SYNC_ISSUE}`",
        f"`{PHASE66_SMOKE_ISSUE_NUMBER}` `{PHASE66_SMOKE_ISSUE}`",
        "this Phase 66 repo-truth sync PR",
        PHASE66_TODO,
        "selected bounded fictional or explicitly authorized worlds",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "existing world-scoped runtime, explain, report, and review surfaces",
        "generated session/node artifacts",
        "existing v1 CLI/session contracts",
        "temporary local artifacts",
        "route-derived `worldId` guards",
        "Every report claim must keep both `label` and `evidence_ids`.",
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


def test_active_state_docs_record_phase66_queue_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE66_GATE_PATH,
    ]
    required_phrases = [
        "Phase 66 successor boundary is active",
        PHASE66_TITLE,
        f"milestone `{PHASE66_TITLE}` is open as milestone `{PHASE66_MILESTONE_NUMBER}`",
        f"`{PHASE66_EXIT_ISSUE_NUMBER}` `Phase 66 exit gate`",
        f"`{PHASE66_SYNC_ISSUE_NUMBER}` `{PHASE66_SYNC_ISSUE}`",
        f"`{PHASE66_SMOKE_ISSUE_NUMBER}` `{PHASE66_SMOKE_ISSUE}`",
        PHASE66_TODO,
        "`docs/plans/phase-66-selected-world-generated-runtime-surface-continuity-gate-2026-06-04.md`",
        "selected-world generated runtime surface continuity",
        "selected bounded fictional or explicitly authorized worlds",
        "existing world-scoped runtime, explain, report, and review surfaces",
        "existing v1 CLI/session contracts",
        "temporary local artifacts",
        f"Phase 65 is closed as `{PHASE65_TITLE}`",
        f"`{PHASE65_EXIT_ISSUE}` `Phase 65 exit gate` closed by PR `{PHASE65_CLOSEOUT_PR}`",
    ]
    forbidden_phrases = [
        "Phase 66 implements async",
        "Phase 66 ratifies task_id",
        "Phase 66 adds workers",
        "Phase 66 implements launch hub",
        "Phase 66 replaces `/`",
        "Phase 66 widens the public path",
        "Phase 66 calls provider or model paths",
        "Phase 66 adds Hosted GPT",
        "Phase 66 adds BYOK",
        "Phase 66 adds upload",
        "Phase 66 adds auth",
        "Phase 66 adds database",
        "Phase 66 adds object storage",
        "Phase 66 changes route ownership",
        "Phase 66 changes scenario DSL",
        "Phase 66 changes perturbation payload schema",
        "Phase 66 changes decision schema",
        "Phase 66 changes claim labels",
        "Phase 66 changes report claim `evidence_ids`",
        "Phase 66 changes run trace shape",
        "Phase 66 changes compare artifact shape",
        "Phase 66 changes session/node manifest shape",
        "Phase 66 changes plugin MCP contract",
        "Phase 66 changes artifact layout",
        "Phase 66 promotes broad private-beta readiness",
        "Phase 66 promotes future-world readiness",
        "Phase 66 promotes untracked planning notes",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 66 successor-boundary wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 66 scope: {phrase}"


def test_bootstrap_spec_records_phase66_queue() -> None:
    spec = json.loads(Path(".github/automation/bootstrap-spec.json").read_text(encoding="utf-8"))

    assert {
        "title": PHASE66_TITLE,
        "description": (
            "Prove that selected bounded fictional or explicitly authorized worlds and "
            "selected-world generated runtime session and node artifacts for Fog Harbor, "
            "Museum Night, and Library Rain can be consumed by existing world-scoped runtime, "
            "explain, report, and review surfaces without adding APIs, schemas, async/task_id "
            "behavior, launch hub behavior, provider calls, public/plugin expansion, or broad "
            "private-beta/future-world readiness claims."
        ),
    } in spec["milestones"]
    assert {
        "name": "phase:66",
        "color": "C8E6C9",
        "description": "Phase 66 selected-world generated runtime surface continuity work.",
    } in spec["labels"]

    titles = {issue["title"]: issue for issue in spec["issues"]}
    for title in [
        "Phase 66 exit gate",
        PHASE66_SYNC_ISSUE,
        PHASE66_SMOKE_ISSUE,
    ]:
        assert title in titles
        assert titles[title]["milestone"] == PHASE66_TITLE
        assert "phase:66" in titles[title]["labels"]

    assert "lane:protected-core" in titles["Phase 66 exit gate"]["labels"]
    assert "status:blocked" in titles["Phase 66 exit gate"]["labels"]

    assert "lane:protected-core" in titles[PHASE66_SYNC_ISSUE]["labels"]
    assert "risk:core-contract" in titles[PHASE66_SYNC_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE66_SYNC_ISSUE]["labels"]

    assert "lane:protected-core" in titles[PHASE66_SMOKE_ISSUE]["labels"]
    assert "area:frontend" in titles[PHASE66_SMOKE_ISSUE]["labels"]
    assert "area:backend" in titles[PHASE66_SMOKE_ISSUE]["labels"]
    assert "risk:core-contract" in titles[PHASE66_SMOKE_ISSUE]["labels"]
    assert "status:ready" in titles[PHASE66_SMOKE_ISSUE]["labels"]
