from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from types import ModuleType


SMOKE_PATH = Path("scripts/smoke_phase61_selected_world_review_surface_binding.py")
EVIDENCE_PATH = Path(
    "docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md"
)
PHASE60_EVIDENCE_PATH = Path(
    "docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md"
)
PHASE61_GATE_PATH = Path(
    "docs/plans/phase-61-selected-world-review-surface-evidence-binding-gate-2026-05-23.md"
)
WORLD_REVIEW_PAGE = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")
RUNTIME_SESSION_DATA = Path("frontend/src/app/lib/runtime-session-data.ts")
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
    spec = importlib.util.spec_from_file_location("phase61_review_surface_binding_smoke", SMOKE_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_phase61_smoke_script_is_scoped_to_selected_world_review_surfaces() -> None:
    script = _read(SMOKE_PATH)

    required_phrases = [
        "SELECTED_WORLD_IDS",
        "fog-harbor-east-gate",
        "museum-night",
        "library-rain",
        "EXPECTED_ARTIFACT_ROOTS",
        "collect_selected_world_artifact_integrity",
        "validate_selected_world_artifact_integrity",
        "loadSelectedWorldReviewEvidenceBinding",
        "claim_evidence_resolves",
        "/worlds/{world_id}/review",
        "?session=",
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
        "hosted_openai",
    ]
    lowered = script.lower()
    for phrase in forbidden_phrases:
        assert phrase.lower() not in lowered


def test_phase61_review_source_binds_world_route_to_runtime_artifact_evidence() -> None:
    review_source = _read(WORLD_REVIEW_PAGE)
    runtime_source = _read(RUNTIME_SESSION_DATA)

    review_markers = [
        "params: Promise<{ worldId: string }>",
        "const { worldId } = await params;",
        "loadProductWorldConfig(worldId, locale)",
        "findLatestRuntimeSessionForWorld(worldId)",
        "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)",
        "claimCount={runtimeWorkspace.relevantClaims.length}",
        "loadSelectedWorldReviewEvidenceBinding(worldId)",
        'data-review-evidence-binding="selected-world-review-surface"',
        "<SelectedWorldReviewEvidencePanel",
        "<RuntimeReviewBrief",
        "`/worlds/${worldId}/review",
        "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}",
    ]
    for marker in review_markers:
        assert marker in review_source

    forbidden_review_markers = [
        "loadAnalystReview",
        "buildMainPathNavigation",
        'href="/review"',
        "`/review?session=${",
    ]
    for marker in forbidden_review_markers:
        assert marker not in review_source

    runtime_markers = [
        "const artifactsRoot = resolveProductWorldPaths(worldId).artifactsRoot;",
        "if (session.world_id !== worldId)",
        "if (selectedNode.world_id !== worldId || rootNode.world_id !== worldId)",
        "lineage.some((entry) => entry.node.world_id !== worldId || entry.node.session_id !== sessionId)",
        "loadRuntimeClaimDrilldowns",
        "claim.evidence_ids",
        "chunks.jsonl",
        "documents.jsonl",
    ]
    for marker in runtime_markers:
        assert marker in runtime_source


def test_phase61_selected_world_review_evidence_loader_binds_artifact_claims_and_chunks() -> None:
    loader_source = _read(SELECTED_WORLD_REVIEW_EVIDENCE)

    required_markers = [
        "export async function loadSelectedWorldReviewEvidenceBinding",
        "resolveProductWorldPaths(worldId)",
        'path.join(paths.artifactsRoot, "eval", "summary.json")',
        'path.join(paths.artifactsRoot, "report", "claims.json")',
        'path.join(paths.artifactsRoot, "ingest", "chunks.jsonl")',
        "claim.evidence_ids",
        "validEvidenceIds",
        "claimEvidenceResolves",
        "repoRelative",
    ]
    for marker in required_markers:
        assert marker in loader_source

    forbidden_markers = [
        "start-session",
        "generate-branch",
        "rollback-session",
        "worlds/create",
        "task_id",
        "hosted_openai",
    ]
    lowered = loader_source.lower()
    for marker in forbidden_markers:
        assert marker.lower() not in lowered


def test_phase61_selected_world_review_binding_smoke_collects_artifact_and_route_evidence() -> None:
    module = _load_smoke_module()

    evidence = module.collect_selected_world_review_surface_binding(
        repo_root=Path.cwd(),
        include_route_smoke=False,
    )
    failures = module.validate_selected_world_review_surface_binding(evidence)

    assert failures == []
    assert evidence["status"] == "pass"
    assert evidence["selected_world_ids"] == SELECTED_WORLD_IDS
    assert evidence["phase60_evidence_path"] == PHASE60_EVIDENCE_PATH.as_posix()
    assert evidence["phase61_gate_path"] == PHASE61_GATE_PATH.as_posix()

    worlds = evidence["worlds"]
    assert [world["world_id"] for world in worlds] == SELECTED_WORLD_IDS
    for world in worlds:
        world_id = world["world_id"]
        assert world["product_world_id"] == world_id
        assert world["artifact_root"] == EXPECTED_ARTIFACT_ROOTS[world_id]
        assert world["route_path"] == f"/worlds/{world_id}/review"
        assert world["route_smoke_path"] == f"/worlds/{world_id}/review?session="
        assert world["eval_status"] == "pass"
        assert world["claim_count"] > 0
        assert world["claims_labeled"] is True
        assert world["claims_have_evidence_ids"] is True
        assert world["claim_evidence_resolves"] is True
        assert world["binding_signals"]["review_route_uses_world_id"] is True
        assert world["binding_signals"]["review_surface_renders_artifact_evidence_panel"] is True
        assert world["binding_signals"]["review_evidence_loader_binds_artifact_claims_and_chunks"] is True
        assert world["binding_signals"]["runtime_loader_uses_world_artifact_root"] is True
        assert world["binding_signals"]["runtime_claims_bind_to_evidence_chunks"] is True


def test_phase61_smoke_script_runs_as_direct_source_command() -> None:
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
    assert payload["mode"] == "phase61_selected_world_review_surface_binding_source"
    assert payload["selected_world_ids"] == SELECTED_WORLD_IDS


def test_phase61_review_surface_binding_evidence_note_records_outputs_and_boundaries() -> None:
    evidence = _read(EVIDENCE_PATH)

    required_phrases = [
        "# Phase 61 Selected-World Review Surface Evidence Binding",
        "Issue: `#473` `Phase 61: add selected-world review surface evidence binding smoke`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "`docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md`",
        "`scripts/smoke_phase61_selected_world_review_surface_binding.py`",
        "`python scripts/smoke_phase61_selected_world_review_surface_binding.py --source-only`",
        "`python scripts/smoke_phase61_selected_world_review_surface_binding.py --timeout 60`",
        "`npm run build --prefix frontend`",
        "selected-world review surfaces bind to stable route `worldId` values",
        "artifact roots validated by Phase 60",
        "report claims keep both `label` and `evidence_ids`",
        "does not start sessions",
        "does not generate branches",
        "does not call provider/model paths",
        "does not change scenario DSL, claim labels, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract",
    ]
    for phrase in required_phrases:
        assert phrase in evidence

    forbidden_phrases = [
        "broad private-beta readiness",
        "future-world readiness",
        "launch hub implementation",
        "Hosted GPT/BYOK readiness",
        "new mutating runtime APIs",
    ]
    for phrase in forbidden_phrases:
        assert phrase not in evidence


def test_phase61_docs_reference_review_surface_binding_evidence_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE61_GATE_PATH,
        EVIDENCE_PATH,
    ]
    required_phrases = [
        "`#473` `Phase 61: add selected-world review surface evidence binding smoke`",
        "`docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md`",
        "`scripts/smoke_phase61_selected_world_review_surface_binding.py`",
        "selected-world review surface evidence binding",
    ]

    forbidden_phrases = [
        "Phase 61 promotes broad private-beta readiness",
        "Phase 61 implements launch hub",
        "Phase 61 replaces `/`",
        "Phase 61 adds Hosted GPT",
        "Phase 61 adds BYOK",
        "Phase 61 adds upload",
        "Phase 61 adds auth",
        "Phase 61 ratifies task_id",
        "Phase 61 changes scenario DSL",
        "Phase 61 changes claim labels",
        "Phase 61 changes plugin MCP contract",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 61 evidence wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 61 scope: {phrase}"
