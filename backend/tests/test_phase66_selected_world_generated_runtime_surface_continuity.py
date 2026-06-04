from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from types import ModuleType


SMOKE_PATH = Path("scripts/smoke_phase66_selected_world_runtime_surface_continuity.py")
EVIDENCE_PATH = Path(
    "docs/plans/phase-66-selected-world-generated-runtime-surface-continuity-evidence-2026-06-04.md"
)
PHASE65_EVIDENCE_PATH = Path(
    "docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md"
)
PHASE66_GATE_PATH = Path(
    "docs/plans/phase-66-selected-world-generated-runtime-surface-continuity-gate-2026-06-04.md"
)
RUNTIME_SESSION_DATA = Path("frontend/src/app/lib/runtime-session-data.ts")
WORLD_RUNTIME_PAGE = Path("frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx")
WORLD_RUNTIME_EXPLAIN_PAGE = Path(
    "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/explain/page.tsx"
)
WORLD_RUNTIME_REPORT_PAGE = Path(
    "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/report/page.tsx"
)
WORLD_REVIEW_PAGE = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")
SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def _load_smoke_module() -> ModuleType:
    assert SMOKE_PATH.exists(), SMOKE_PATH
    spec = importlib.util.spec_from_file_location("phase66_runtime_surface_smoke", SMOKE_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_phase66_runtime_surface_smoke_script_is_scoped_to_existing_surfaces() -> None:
    script = _read(SMOKE_PATH)
    required_phrases = [
        "SELECTED_WORLD_IDS",
        "fog-harbor-east-gate",
        "museum-night",
        "library-rain",
        "PHASE65_SMOKE_PATH",
        "collect_selected_world_runtime_generation",
        "loadRuntimeSessionWorkspaceForWorld",
        "findLatestRuntimeSessionForWorld",
        "runtime_surface_loadable",
        "explain_surface_claim_drilldowns_ready",
        "report_surface_report_text_ready",
        "review_surface_latest_session_ready",
        "provider_or_model_calls",
        "async_task_or_worker_behavior",
        "new_route_or_api_added",
        "route_ownership_changed",
        "temporary_local_artifacts",
    ]
    for phrase in required_phrases:
        assert phrase in script

    forbidden_phrases = [
        "requests.post",
        "httpx.post",
        "urllib.request.Request",
        "method=\"POST\"",
        "method='POST'",
        "create_bounded_incident_world(",
        "run_transfer_eval(",
        "Hosted GPT is enabled",
        "BYOK is enabled",
    ]
    lowered = script.lower()
    for phrase in forbidden_phrases:
        assert phrase.lower() not in lowered


def test_phase66_runtime_loader_resolves_node_decision_trace_from_artifacts_root() -> None:
    source = _read(RUNTIME_SESSION_DATA)

    assert "loadRuntimeDecisionSummary(artifactsRoot, selectedNode.decision_trace_path)" in source
    assert "path.join(sessionRoot, decisionTracePath)" not in source


def test_phase66_world_scoped_surfaces_still_share_existing_workspace_loader() -> None:
    runtime_source = _read(WORLD_RUNTIME_PAGE)
    explain_source = _read(WORLD_RUNTIME_EXPLAIN_PAGE)
    report_source = _read(WORLD_RUNTIME_REPORT_PAGE)
    review_source = _read(WORLD_REVIEW_PAGE)

    for source in [runtime_source, explain_source, report_source]:
        for marker in [
            "params: Promise<{ worldId: string; sessionId: string }>",
            "const { worldId, sessionId } = await params;",
            "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, resolvedSearchParams?.node)",
            "`/worlds/${worldId}/runtime/${sessionId}",
            "`/worlds/${worldId}/review?session=${encodeURIComponent(sessionId)}",
        ]:
            assert marker in source

    for marker in [
        "params: Promise<{ worldId: string }>",
        "const { worldId } = await params;",
        "findLatestRuntimeSessionForWorld(worldId)",
        "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)",
        "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}",
        "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}/explain",
        "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}/report",
    ]:
        assert marker in review_source


def test_phase66_runtime_surface_smoke_collects_generated_artifact_continuity() -> None:
    module = _load_smoke_module()

    evidence = module.collect_selected_world_generated_runtime_surface_continuity(
        repo_root=Path.cwd()
    )
    failures = module.validate_selected_world_generated_runtime_surface_continuity(evidence)

    assert failures == []
    assert evidence["status"] == "pass"
    assert evidence["mode"] == "phase66_selected_world_generated_runtime_surface_continuity"
    assert evidence["selected_world_ids"] == SELECTED_WORLD_IDS
    assert evidence["phase65_evidence_path"] == PHASE65_EVIDENCE_PATH.as_posix()
    assert evidence["phase66_gate_path"] == PHASE66_GATE_PATH.as_posix()
    assert evidence["temporary_local_artifacts"] is True
    assert evidence["provider_or_model_calls"] is False
    assert evidence["async_task_or_worker_behavior"] is False
    assert evidence["new_route_or_api_added"] is False
    assert evidence["route_ownership_changed"] is False
    assert all(evidence["surface_source_signals"].values())

    worlds = evidence["worlds"]
    assert [world["world_id"] for world in worlds] == SELECTED_WORLD_IDS
    for world in worlds:
        world_id = world["world_id"]
        session_id = world["session_id"]
        active_node_id = world["active_node_id"]
        assert world["runtime_surface"]["path"] == (
            f"/worlds/{world_id}/runtime/{session_id}?node={active_node_id}"
        )
        assert world["runtime_surface"]["runtime_surface_loadable"] is True
        assert world["runtime_surface"]["world_scoped_loader_guard"] is True
        assert world["runtime_surface"]["decision_summary_ready"] is True
        assert world["runtime_surface"]["compare_delta_ready"] is True
        assert world["runtime_surface"]["comparison_rows_ready"] is True
        assert world["runtime_surface"]["lineage_node_ids"] == ["node_root", active_node_id]
        assert world["explain_surface"]["path"] == (
            f"/worlds/{world_id}/runtime/{session_id}/explain?node={active_node_id}"
        )
        assert world["explain_surface"]["explain_surface_claim_drilldowns_ready"] is True
        assert world["explain_surface"]["relevant_claim_count"] > 0
        assert world["explain_surface"]["evidence_chunk_count"] > 0
        assert world["explain_surface"]["related_runtime_turn_count"] > 0
        assert world["report_surface"]["path"] == (
            f"/worlds/{world_id}/runtime/{session_id}/report?node={active_node_id}"
        )
        assert world["report_surface"]["report_surface_report_text_ready"] is True
        assert world["report_surface"]["parsed_report_block_count"] > 0
        assert world["review_surface"]["path"] == (
            f"/worlds/{world_id}/review?session={session_id}&node={active_node_id}"
        )
        assert world["review_surface"]["review_surface_latest_session_ready"] is True
        assert world["review_surface"]["latest_session_id"] == session_id
        assert world["review_surface"]["latest_active_node_id"] == active_node_id
        assert world["claims_have_labels_and_evidence_ids"] is True
        assert world["claim_evidence_ids_resolve"] is True
        assert world["generated_decision_trace_provider_only"] is True


def test_phase66_validation_rejects_missing_surface_continuity() -> None:
    module = _load_smoke_module()
    evidence = module.collect_selected_world_generated_runtime_surface_continuity(
        repo_root=Path.cwd()
    )
    evidence["worlds"][0]["runtime_surface"]["decision_summary_ready"] = False

    failures = module.validate_selected_world_generated_runtime_surface_continuity(evidence)

    assert any("decision summary" in failure for failure in failures)


def test_phase66_validation_rejects_provider_backed_decision_trace_modes() -> None:
    module = _load_smoke_module()
    evidence = module.collect_selected_world_generated_runtime_surface_continuity(
        repo_root=Path.cwd()
    )
    evidence["worlds"][0]["runtime_surface"]["decision_provider_modes"] = ["hosted_openai"]

    failures = module.validate_selected_world_generated_runtime_surface_continuity(evidence)

    assert any("provider-backed decision trace" in failure for failure in failures)


def test_phase66_runtime_surface_smoke_script_runs_as_direct_command() -> None:
    completed = subprocess.run(
        [sys.executable, str(SMOKE_PATH)],
        cwd=Path.cwd(),
        check=False,
        capture_output=True,
        text=True,
    )

    assert completed.returncode == 0, completed.stderr
    payload = json.loads(completed.stdout)
    assert payload["status"] == "pass"
    assert payload["selected_world_ids"] == SELECTED_WORLD_IDS
    assert payload["temporary_local_artifacts"] is True


def test_phase66_runtime_surface_evidence_note_records_outputs_and_boundaries() -> None:
    evidence = _read(EVIDENCE_PATH)
    required_phrases = [
        "# Phase 66 Selected-World Generated Runtime Surface Continuity Evidence",
        "Issue: `#503` `Phase 66: add selected-world generated runtime surface continuity smoke`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "`docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md`",
        "`docs/plans/phase-66-selected-world-generated-runtime-surface-continuity-gate-2026-06-04.md`",
        "`scripts/smoke_phase66_selected_world_runtime_surface_continuity.py`",
        "`python scripts/smoke_phase66_selected_world_runtime_surface_continuity.py`",
        "`python scripts/smoke_phase65_selected_world_runtime_generation.py`",
        "`python -m pytest backend/tests/test_phase66_selected_world_generated_runtime_surface_continuity.py backend/tests/test_phase66_selected_world_generated_runtime_surface_continuity_gate.py -q`",
        "existing world-scoped runtime, explain, report, and review surfaces",
        "generated session/node artifacts",
        "temporary local artifacts",
        "decision summary",
        "compare deltas",
        "claim drilldowns",
        "node-scoped report text",
        "latest session lookup",
        "does not call provider/model paths",
        "does not add async/task_id behavior or worker queues",
        "does not add routes or APIs",
        "does not change scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract",
    ]
    for phrase in required_phrases:
        assert phrase in evidence

    forbidden_phrases = [
        "Phase 66 promotes broad private-beta readiness",
        "Phase 66 promotes future-world readiness",
        "Phase 66 implements launch hub",
        "Phase 66 adds Hosted GPT",
        "Phase 66 adds BYOK",
        "Phase 66 adds upload",
        "Phase 66 adds auth",
        "Phase 66 calls provider or model paths",
        "Phase 66 changes scenario DSL",
        "Phase 66 changes claim labels",
        "Phase 66 changes report claim `evidence_ids`",
    ]
    for phrase in forbidden_phrases:
        assert phrase not in evidence


def test_phase66_docs_reference_runtime_surface_evidence_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE66_GATE_PATH,
        EVIDENCE_PATH,
    ]
    required_phrases = [
        "`#503` `Phase 66: add selected-world generated runtime surface continuity smoke`",
        "`docs/plans/phase-66-selected-world-generated-runtime-surface-continuity-evidence-2026-06-04.md`",
        "`scripts/smoke_phase66_selected_world_runtime_surface_continuity.py`",
        "selected-world generated runtime surface continuity evidence",
        "existing world-scoped runtime, explain, report, and review surfaces",
        "temporary local artifacts",
    ]
    forbidden_phrases = [
        "Phase 66 promotes broad private-beta readiness",
        "Phase 66 implements launch hub",
        "Phase 66 replaces `/`",
        "Phase 66 adds Hosted GPT",
        "Phase 66 adds BYOK",
        "Phase 66 adds upload",
        "Phase 66 adds auth",
        "Phase 66 ratifies task_id",
        "Phase 66 changes scenario DSL",
        "Phase 66 changes claim labels",
        "Phase 66 changes report claim `evidence_ids`",
        "Phase 66 changes plugin MCP contract",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 66 runtime surface wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 66 scope: {phrase}"
