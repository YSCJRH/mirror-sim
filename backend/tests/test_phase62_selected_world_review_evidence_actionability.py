from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from types import ModuleType


SMOKE_PATH = Path("scripts/smoke_phase62_selected_world_review_actionability.py")
EVIDENCE_PATH = Path(
    "docs/plans/phase-62-selected-world-review-evidence-actionability-2026-05-25.md"
)
PHASE61_EVIDENCE_PATH = Path(
    "docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md"
)
PHASE62_GATE_PATH = Path(
    "docs/plans/phase-62-selected-world-review-evidence-actionability-gate-2026-05-25.md"
)
WORLD_REVIEW_PAGE = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")
SELECTED_WORLD_REVIEW_EVIDENCE = Path("frontend/src/app/lib/selected-world-review-evidence.ts")
SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]
EXPECTED_ARTIFACT_ROOTS = {
    "fog-harbor-east-gate": "artifacts/demo",
    "museum-night": "artifacts/worlds/museum-night",
    "library-rain": "artifacts/worlds/library-rain",
}


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def _load_smoke_module() -> ModuleType:
    assert SMOKE_PATH.exists(), SMOKE_PATH
    spec = importlib.util.spec_from_file_location("phase62_review_actionability_smoke", SMOKE_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_phase62_actionability_smoke_script_is_scoped_to_selected_worlds() -> None:
    script = _read(SMOKE_PATH)

    required_phrases = [
        "SELECTED_WORLD_IDS",
        "fog-harbor-east-gate",
        "museum-night",
        "library-rain",
        "PHASE61_SMOKE_PATH",
        "collect_selected_world_review_surface_binding",
        "validate_selected_world_review_surface_binding",
        "review_readiness",
        "next_action",
        "readiness_signals",
        "actionability_signals",
        "select-or-generate-runtime-branch",
        "repair-selected-world-evidence",
        "--source-only",
        "--base-url",
    ]
    for phrase in required_phrases:
        assert phrase in script

    forbidden_phrases = [
        "/api/runtime/start-session",
        "/api/runtime/generate-branch",
        "/api/runtime/rollback-session",
        "create_bounded_incident_world(",
        "run_transfer_eval(",
        'method="POST"',
        "method='POST'",
        "task_id",
        "hosted_openai",
    ]
    lowered = script.lower()
    for phrase in forbidden_phrases:
        assert phrase.lower() not in lowered


def test_phase62_review_source_exposes_read_only_readiness_and_next_action() -> None:
    review_source = _read(WORLD_REVIEW_PAGE)
    loader_source = _read(SELECTED_WORLD_REVIEW_EVIDENCE)

    loader_markers = [
        "reviewReadiness",
        "nextAction",
        "nextActionReason",
        "readinessSignals",
        "buildReviewEvidenceActionability",
        'evalStatus === "pass"',
        "claimCount > 0",
        "claimsLabeled",
        "claimsHaveEvidenceIds",
        "claimEvidenceResolves",
        '"select-or-generate-runtime-branch"',
        '"repair-selected-world-evidence"',
    ]
    for marker in loader_markers:
        assert marker in loader_source

    review_markers = [
        'data-review-evidence-actionability="selected-world-review-readiness"',
        "Review readiness",
        "Next action",
        "read-only review readiness",
        "evidence.reviewReadiness",
        "evidence.nextAction",
        "evidence.nextActionReason",
        "readinessSignals",
    ]
    for marker in review_markers:
        assert marker in review_source

    forbidden_markers = [
        "start-session",
        "generate-branch",
        "rollback-session",
        "task_id",
        "hosted_openai",
        "BYOK is enabled",
    ]
    lowered_loader = loader_source.lower()
    lowered_review = review_source.lower()
    for marker in forbidden_markers:
        assert marker.lower() not in lowered_loader
        assert marker.lower() not in lowered_review


def test_phase62_actionability_smoke_collects_review_readiness_and_next_actions() -> None:
    module = _load_smoke_module()

    evidence = module.collect_selected_world_review_evidence_actionability(
        repo_root=Path.cwd(),
        include_route_smoke=False,
    )
    failures = module.validate_selected_world_review_evidence_actionability(evidence)

    assert failures == []
    assert evidence["status"] == "pass"
    assert evidence["mode"] == "phase62_selected_world_review_evidence_actionability_source"
    assert evidence["selected_world_ids"] == SELECTED_WORLD_IDS
    assert evidence["phase61_evidence_path"] == PHASE61_EVIDENCE_PATH.as_posix()
    assert evidence["phase62_gate_path"] == PHASE62_GATE_PATH.as_posix()
    assert evidence["source_paths"]["selected_world_review_evidence"] == SELECTED_WORLD_REVIEW_EVIDENCE.as_posix()

    worlds = evidence["worlds"]
    assert [world["world_id"] for world in worlds] == SELECTED_WORLD_IDS
    for world in worlds:
        world_id = world["world_id"]
        assert world["artifact_root"] == EXPECTED_ARTIFACT_ROOTS[world_id]
        assert world["eval_status"] == "pass"
        assert world["claim_count"] > 0
        assert world["claims_labeled"] is True
        assert world["claims_have_evidence_ids"] is True
        assert world["claim_evidence_resolves"] is True
        assert world["review_readiness"] == "ready"
        assert world["next_action"] == "select-or-generate-runtime-branch"
        assert world["next_action_reason"]
        assert all(world["readiness_signals"].values())
        assert world["actionability_signals"]["review_surface_renders_readiness_panel"] is True
        assert world["actionability_signals"]["loader_derives_actionability_from_evidence_binding"] is True
        assert world["actionability_signals"]["actionability_stays_read_only"] is True


def test_phase62_actionability_smoke_script_runs_as_direct_source_command() -> None:
    completed = subprocess.run(
        [sys.executable, str(SMOKE_PATH), "--source-only"],
        cwd=Path.cwd(),
        check=False,
        capture_output=True,
        text=True,
    )

    assert completed.returncode == 0, completed.stderr
    payload = json.loads(completed.stdout)
    assert payload["status"] == "pass"
    assert payload["mode"] == "phase62_selected_world_review_evidence_actionability_source"
    assert payload["selected_world_ids"] == SELECTED_WORLD_IDS


def test_phase62_actionability_evidence_note_records_outputs_and_boundaries() -> None:
    evidence = _read(EVIDENCE_PATH)

    required_phrases = [
        "# Phase 62 Selected-World Review Evidence Actionability",
        "Issue: `#479` `Phase 62: add selected-world review evidence actionability smoke`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "`docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md`",
        "`scripts/smoke_phase62_selected_world_review_actionability.py`",
        "`python scripts/smoke_phase62_selected_world_review_actionability.py --source-only`",
        "`python scripts/smoke_phase62_selected_world_review_actionability.py --timeout 60`",
        "`npm run build --prefix frontend`",
        "selected-world review surfaces expose read-only review readiness and next-action signals",
        "`review_readiness: ready`",
        "`next_action: select-or-generate-runtime-branch`",
        "readiness is derived from artifact root, eval status, report claim count, claim labels, `evidence_ids`, and evidence chunk resolution",
        "does not start sessions",
        "does not generate branches",
        "does not call provider/model paths",
        "does not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract",
    ]
    for phrase in required_phrases:
        assert phrase in evidence

    forbidden_phrases = [
        "Phase 62 promotes broad private-beta readiness",
        "Phase 62 promotes future-world readiness",
        "Phase 62 implements launch hub",
        "Phase 62 adds Hosted GPT",
        "Phase 62 adds BYOK",
        "Phase 62 adds new mutating runtime APIs",
    ]
    for phrase in forbidden_phrases:
        assert phrase not in evidence


def test_phase62_docs_reference_actionability_evidence_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE62_GATE_PATH,
        EVIDENCE_PATH,
    ]
    required_phrases = [
        "`#479` `Phase 62: add selected-world review evidence actionability smoke`",
        "`docs/plans/phase-62-selected-world-review-evidence-actionability-2026-05-25.md`",
        "`scripts/smoke_phase62_selected_world_review_actionability.py`",
        "selected-world review evidence actionability",
        "read-only review readiness and next-action signals",
    ]
    forbidden_phrases = [
        "Phase 62 promotes broad private-beta readiness",
        "Phase 62 implements launch hub",
        "Phase 62 replaces `/`",
        "Phase 62 adds Hosted GPT",
        "Phase 62 adds BYOK",
        "Phase 62 adds upload",
        "Phase 62 adds auth",
        "Phase 62 ratifies task_id",
        "Phase 62 changes scenario DSL",
        "Phase 62 changes claim labels",
        "Phase 62 changes report claim `evidence_ids`",
        "Phase 62 changes plugin MCP contract",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 62 actionability wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 62 scope: {phrase}"
