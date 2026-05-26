from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from types import ModuleType


SMOKE_PATH = Path("scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py")
EVIDENCE_PATH = Path(
    "docs/plans/phase-63-selected-world-review-next-action-route-fidelity-2026-05-26.md"
)
PHASE62_EVIDENCE_PATH = Path(
    "docs/plans/phase-62-selected-world-review-evidence-actionability-2026-05-25.md"
)
PHASE63_GATE_PATH = Path(
    "docs/plans/phase-63-selected-world-next-action-route-fidelity-gate-2026-05-25.md"
)
WORLD_REVIEW_PAGE = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")
RUNTIME_SESSION_DATA = Path("frontend/src/app/lib/runtime-session-data.ts")
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
    spec = importlib.util.spec_from_file_location("phase63_route_fidelity_smoke", SMOKE_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_phase63_route_fidelity_smoke_script_is_scoped_to_selected_worlds() -> None:
    script = _read(SMOKE_PATH)

    required_phrases = [
        "SELECTED_WORLD_IDS",
        "fog-harbor-east-gate",
        "museum-night",
        "library-rain",
        "PHASE62_SMOKE_PATH",
        "collect_selected_world_review_evidence_actionability",
        "validate_selected_world_review_evidence_actionability",
        "next_action_route",
        "world_scoped_followup_path",
        "existing-world-scoped-perturb-route",
        "select-or-generate-runtime-branch",
        "f\"/worlds/{world_id}/perturb\"",
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
        "openai_compatible",
        "BYOK is enabled",
    ]
    lowered = script.lower()
    for phrase in forbidden_phrases:
        assert phrase.lower() not in lowered


def test_phase63_review_source_keeps_next_action_routes_world_scoped_and_read_only() -> None:
    review_source = _read(WORLD_REVIEW_PAGE)
    runtime_source = _read(RUNTIME_SESSION_DATA)

    review_markers = [
        "const { worldId } = await params;",
        "findLatestRuntimeSessionForWorld(worldId)",
        "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)",
        "loadSelectedWorldReviewEvidenceBinding(worldId)",
        "`/worlds/${worldId}/perturb`",
        "`/worlds/${worldId}/perturb?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(activeNode.node_id)}`",
        "`/worlds/${worldId}/review?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}",
        "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}",
        "`/worlds/${worldId}`",
        "ButtonLink href={perturbHref}",
    ]
    for marker in review_markers:
        assert marker in review_source

    runtime_markers = [
        "findLatestRuntimeSessionForWorld",
        "listRuntimeSessionLocatorsForWorld(worldId)",
        "resolveProductWorldPaths(worldId).artifactsRoot",
        "if (session.world_id !== worldId)",
        "if (selectedNode.world_id !== worldId || rootNode.world_id !== worldId)",
    ]
    for marker in runtime_markers:
        assert marker in runtime_source

    forbidden_markers = [
        "/api/runtime/start-session",
        "/api/runtime/generate-branch",
        "/api/runtime/rollback-session",
        'method="POST"',
        "method='POST'",
        "task_id",
        "BYOK is enabled",
    ]
    lowered_review = review_source.lower()
    lowered_runtime = runtime_source.lower()
    for marker in forbidden_markers:
        assert marker.lower() not in lowered_review
        assert marker.lower() not in lowered_runtime


def test_phase63_route_fidelity_smoke_collects_world_scoped_followup_routes() -> None:
    module = _load_smoke_module()

    evidence = module.collect_selected_world_review_next_action_route_fidelity(
        repo_root=Path.cwd(),
        include_route_smoke=False,
    )
    failures = module.validate_selected_world_review_next_action_route_fidelity(evidence)

    assert failures == []
    assert evidence["status"] == "pass"
    assert evidence["mode"] == "phase63_selected_world_review_next_action_route_fidelity_source"
    assert evidence["selected_world_ids"] == SELECTED_WORLD_IDS
    assert evidence["phase62_evidence_path"] == PHASE62_EVIDENCE_PATH.as_posix()
    assert evidence["phase63_gate_path"] == PHASE63_GATE_PATH.as_posix()
    assert evidence["source_paths"]["world_review_page"] == WORLD_REVIEW_PAGE.as_posix()

    worlds = evidence["worlds"]
    assert [world["world_id"] for world in worlds] == SELECTED_WORLD_IDS
    for world in worlds:
        world_id = world["world_id"]
        assert world["artifact_root"] == EXPECTED_ARTIFACT_ROOTS[world_id]
        assert world["review_readiness"] == "ready"
        assert world["next_action"] == "select-or-generate-runtime-branch"
        assert world["next_action_route"] == f"/worlds/{world_id}/perturb"
        assert world["world_scoped_followup_path"] is True
        assert world["followup_route_mode"] == "existing-world-scoped-perturb-route"
        assert world["followup_requires_session"] is False
        assert world["mutating_runtime_api_called"] is False
        assert all(world["route_fidelity_signals"].values())


def test_phase63_route_fidelity_smoke_script_runs_as_direct_source_command() -> None:
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
    assert payload["mode"] == "phase63_selected_world_review_next_action_route_fidelity_source"
    assert payload["selected_world_ids"] == SELECTED_WORLD_IDS


def test_phase63_route_fidelity_evidence_note_records_outputs_and_boundaries() -> None:
    evidence = _read(EVIDENCE_PATH)

    required_phrases = [
        "# Phase 63 Selected-World Review Next-Action Route Fidelity",
        "Issue: `#485` `Phase 63: add selected-world review next-action route-fidelity smoke`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "`docs/plans/phase-62-selected-world-review-evidence-actionability-2026-05-25.md`",
        "`scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py`",
        "`python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --source-only`",
        "`python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --timeout 60`",
        "`npm run build --prefix frontend`",
        "read-only `nextAction` cues map only to existing world-scoped follow-up paths",
        "`next_action: select-or-generate-runtime-branch`",
        "`next_action_route: /worlds/<world_id>/perturb`",
        "`followup_route_mode: existing-world-scoped-perturb-route`",
        "does not start sessions",
        "does not generate branches",
        "does not call POST/runtime APIs",
        "does not call provider/model paths",
        "does not change route ownership, scenario DSL, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract",
    ]
    for phrase in required_phrases:
        assert phrase in evidence

    forbidden_phrases = [
        "Phase 63 promotes broad private-beta readiness",
        "Phase 63 promotes future-world readiness",
        "Phase 63 implements launch hub",
        "Phase 63 adds Hosted GPT",
        "Phase 63 adds BYOK",
        "Phase 63 adds new mutating runtime APIs",
        "Phase 63 changes route ownership",
    ]
    for phrase in forbidden_phrases:
        assert phrase not in evidence


def test_phase63_docs_reference_route_fidelity_evidence_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE63_GATE_PATH,
        EVIDENCE_PATH,
    ]
    required_phrases = [
        "`#485` `Phase 63: add selected-world review next-action route-fidelity smoke`",
        "`docs/plans/phase-63-selected-world-review-next-action-route-fidelity-2026-05-26.md`",
        "`scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py`",
        "selected-world review next-action route fidelity",
        "read-only `nextAction` cues map only to existing world-scoped follow-up paths",
    ]
    forbidden_phrases = [
        "Phase 63 promotes broad private-beta readiness",
        "Phase 63 implements launch hub",
        "Phase 63 replaces `/`",
        "Phase 63 adds Hosted GPT",
        "Phase 63 adds BYOK",
        "Phase 63 adds upload",
        "Phase 63 adds auth",
        "Phase 63 ratifies task_id",
        "Phase 63 changes scenario DSL",
        "Phase 63 changes claim labels",
        "Phase 63 changes report claim `evidence_ids`",
        "Phase 63 changes plugin MCP contract",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 63 route-fidelity wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 63 scope: {phrase}"
