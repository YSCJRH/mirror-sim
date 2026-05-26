from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from types import ModuleType

import pytest


SMOKE_PATH = Path("scripts/smoke_phase64_selected_world_perturb_followup_readiness.py")
EVIDENCE_PATH = Path(
    "docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md"
)
PHASE63_EVIDENCE_PATH = Path(
    "docs/plans/phase-63-selected-world-review-next-action-route-fidelity-2026-05-26.md"
)
PHASE64_GATE_PATH = Path(
    "docs/plans/phase-64-selected-world-perturb-followup-readiness-gate-2026-05-26.md"
)
WORLD_PERTURB_PAGE = Path("frontend/src/app/worlds/[worldId]/perturb/page.tsx")
PRESET_COMPOSER = Path("frontend/src/app/components/preset-perturbation-composer.tsx")
SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]
EXPECTED_PRODUCT_CONFIGS = {
    "fog-harbor-east-gate": "data/demo/config/product.json",
    "museum-night": "data/worlds/museum-night/config/product.json",
    "library-rain": "data/worlds/library-rain/config/product.json",
}
EXPECTED_DECISION_SCHEMAS = {
    "fog-harbor-east-gate": "data/demo/config/decision_schema.yaml",
    "museum-night": "data/worlds/museum-night/config/decision_schema.yaml",
    "library-rain": "data/worlds/library-rain/config/decision_schema.yaml",
}


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def _load_smoke_module() -> ModuleType:
    assert SMOKE_PATH.exists(), SMOKE_PATH
    spec = importlib.util.spec_from_file_location("phase64_perturb_followup_smoke", SMOKE_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_phase64_perturb_followup_smoke_script_is_scoped_to_selected_worlds() -> None:
    script = _read(SMOKE_PATH)

    required_phrases = [
        "SELECTED_WORLD_IDS",
        "fog-harbor-east-gate",
        "museum-night",
        "library-rain",
        "PHASE63_SMOKE_PATH",
        "collect_selected_world_review_next_action_route_fidelity",
        "validate_selected_world_review_next_action_route_fidelity",
        "resolve_perturbation_payload",
        "load_decision_schema",
        "world_local_perturbation_presets",
        "decision_schema_defaults",
        "schema_resolutions",
        "validation_mutating_runtime_api_called",
        "--source-only",
        "--base-url",
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
        "task_id",
        "Hosted GPT is enabled",
        "BYOK is enabled",
    ]
    lowered = script.lower()
    for phrase in forbidden_phrases:
        assert phrase.lower() not in lowered


def test_phase64_perturb_sources_bind_world_route_presets_and_schema_defaults() -> None:
    page_source = _read(WORLD_PERTURB_PAGE)
    composer_source = _read(PRESET_COMPOSER)

    page_markers = [
        "params: Promise<{ worldId: string }>",
        "const { worldId } = await params;",
        "loadProductWorldConfig(worldId, locale)",
        "findLatestRuntimeSessionForWorld(worldId)",
        "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)",
        "product.decision_defaults?.provider",
        "product.decision_defaults?.model",
        "product.perturbation_options.map((option) => ({",
        "runtime: option.runtime",
        "runtimeHrefBase={`/worlds/${worldId}/runtime`}",
        "perturbHref={perturbHref}",
        "showStaticExplainPreview={false}",
    ]
    for marker in page_markers:
        assert marker in page_source

    composer_markers = [
        "worldId: string;",
        "baselineScenarioId: string;",
        "runtime?: {",
        "const runtimePreset = matchedOption.runtime;",
        "worldId,",
        "scenarioId: baselineScenarioId,",
        "sessionId: resolvedSessionId,",
        "perturbation: {",
        "kind: runtimePreset.kind",
        "target_id: runtimePreset.targetId",
        "timing: runtimePreset.timing",
        "parameters: {",
        "actor_id: runtimePreset.actorId",
    ]
    for marker in composer_markers:
        assert marker in composer_source


def test_phase64_perturb_followup_smoke_collects_schema_backed_world_local_presets() -> None:
    module = _load_smoke_module()

    evidence = module.collect_selected_world_perturb_followup_readiness(
        repo_root=Path.cwd(),
        include_route_smoke=False,
    )
    failures = module.validate_selected_world_perturb_followup_readiness(evidence)

    assert failures == []
    assert evidence["status"] == "pass"
    assert evidence["mode"] == "phase64_selected_world_perturb_followup_readiness_source"
    assert evidence["selected_world_ids"] == SELECTED_WORLD_IDS
    assert evidence["phase63_evidence_path"] == PHASE63_EVIDENCE_PATH.as_posix()
    assert evidence["phase64_gate_path"] == PHASE64_GATE_PATH.as_posix()
    assert evidence["source_paths"]["world_perturb_page"] == WORLD_PERTURB_PAGE.as_posix()
    assert evidence["source_paths"]["preset_perturbation_composer"] == PRESET_COMPOSER.as_posix()
    assert evidence["route_smoke_enabled"] is False

    worlds = evidence["worlds"]
    assert [world["world_id"] for world in worlds] == SELECTED_WORLD_IDS
    for world in worlds:
        world_id = world["world_id"]
        assert world["product_config_path"] == EXPECTED_PRODUCT_CONFIGS[world_id]
        assert world["decision_schema_path"] == EXPECTED_DECISION_SCHEMAS[world_id]
        assert world["next_action_route"] == f"/worlds/{world_id}/perturb"
        assert world["perturb_route_path"] == f"/worlds/{world_id}/perturb"
        assert world["perturb_followup_reachable"] is True
        assert world["world_scoped_perturb_route"] is True
        assert world["followup_requires_session"] is False
        assert world["validation_mutating_runtime_api_called"] is False
        assert world["world_local_perturbation_presets"] is True
        assert world["decision_schema_defaults"]["provider"] == "openai_compatible"
        assert world["decision_schema_defaults"]["model"] == ""
        assert world["preset_count"] >= 3
        assert len(world["schema_resolutions"]) == world["preset_count"]
        assert all(resolution["world_id"] == world_id for resolution in world["schema_resolutions"])
        assert all(resolution["resolution_hash"] for resolution in world["schema_resolutions"])
        assert all(world["perturb_followup_signals"].values())


def test_phase64_perturb_followup_smoke_records_phase63_source_fallback(monkeypatch) -> None:
    module = _load_smoke_module()
    phase63 = module._load_phase63_smoke(Path.cwd())
    missing_artifact = Path.cwd() / "artifacts" / "transfer" / "summary.json"

    def raise_missing_artifact(*_args, **_kwargs):
        raise FileNotFoundError(2, "No such file or directory", str(missing_artifact))

    monkeypatch.setattr(
        phase63,
        "collect_selected_world_review_next_action_route_fidelity",
        raise_missing_artifact,
    )
    monkeypatch.setattr(module, "_load_phase63_smoke", lambda _repo_root: phase63)
    monkeypatch.setattr(module, "_has_phase63_generated_artifacts", lambda _repo_root: False)

    evidence = module.collect_selected_world_perturb_followup_readiness(
        repo_root=Path.cwd(),
        include_route_smoke=False,
    )

    assert evidence["status"] == "pass"
    assert (
        evidence["phase63_route_fidelity_mode"]
        == "phase63_selected_world_review_next_action_route_fidelity_source_tracked"
    )
    assert evidence["phase63_route_fidelity_fallback_reason"] == "artifacts/transfer/summary.json"


def test_phase64_perturb_followup_smoke_rejects_partial_phase63_artifact_state(monkeypatch) -> None:
    module = _load_smoke_module()
    phase63 = module._load_phase63_smoke(Path.cwd())
    missing_artifact = Path.cwd() / "artifacts" / "transfer" / "summary.json"

    def raise_missing_artifact(*_args, **_kwargs):
        raise FileNotFoundError(2, "No such file or directory", str(missing_artifact))

    monkeypatch.setattr(
        phase63,
        "collect_selected_world_review_next_action_route_fidelity",
        raise_missing_artifact,
    )
    monkeypatch.setattr(module, "_load_phase63_smoke", lambda _repo_root: phase63)
    monkeypatch.setattr(module, "_has_phase63_generated_artifacts", lambda _repo_root: True)

    with pytest.raises(FileNotFoundError):
        module.collect_selected_world_perturb_followup_readiness(
            repo_root=Path.cwd(),
            include_route_smoke=False,
        )


def test_phase64_perturb_followup_smoke_script_runs_as_direct_source_command() -> None:
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
    assert payload["mode"] == "phase64_selected_world_perturb_followup_readiness_source"
    assert payload["selected_world_ids"] == SELECTED_WORLD_IDS


def test_phase64_perturb_followup_evidence_note_records_outputs_and_boundaries() -> None:
    evidence = _read(EVIDENCE_PATH)

    required_phrases = [
        "# Phase 64 Selected-World Perturb Follow-Up Readiness",
        "Issue: `#491` `Phase 64: add selected-world perturb follow-up readiness smoke`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "`docs/plans/phase-63-selected-world-review-next-action-route-fidelity-2026-05-26.md`",
        "`scripts/smoke_phase64_selected_world_perturb_followup_readiness.py`",
        "`python scripts/smoke_phase64_selected_world_perturb_followup_readiness.py --source-only`",
        "`python scripts/smoke_phase64_selected_world_perturb_followup_readiness.py --timeout 60`",
        "`python scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py --source-only`",
        "`npm run build --prefix frontend`",
        "Phase 63 `nextAction` targets remain `/worlds/<world_id>/perturb`",
        "world-local perturbation presets",
        "decision schema defaults",
        "`validation_mutating_runtime_api_called: false`",
        "does not start sessions during validation",
        "does not generate branches during validation",
        "does not call POST/runtime APIs during validation",
        "does not call provider/model paths",
        "does not change perturbation payload schema, decision schema, runtime/session/node manifests, or route ownership contracts",
    ]
    for phrase in required_phrases:
        assert phrase in evidence

    forbidden_phrases = [
        "Phase 64 promotes broad private-beta readiness",
        "Phase 64 promotes future-world readiness",
        "Phase 64 implements launch hub",
        "Phase 64 adds Hosted GPT",
        "Phase 64 adds BYOK",
        "Phase 64 adds new mutating runtime APIs",
        "Phase 64 changes perturbation payload schema",
        "Phase 64 changes decision schema",
    ]
    for phrase in forbidden_phrases:
        assert phrase not in evidence


def test_phase64_docs_reference_perturb_followup_evidence_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE64_GATE_PATH,
        EVIDENCE_PATH,
    ]
    required_phrases = [
        "`#491` `Phase 64: add selected-world perturb follow-up readiness smoke`",
        "`docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md`",
        "`scripts/smoke_phase64_selected_world_perturb_followup_readiness.py`",
        "selected-world perturb follow-up readiness",
        "world-local perturbation presets",
        "decision schema defaults",
    ]
    forbidden_phrases = [
        "Phase 64 promotes broad private-beta readiness",
        "Phase 64 implements launch hub",
        "Phase 64 replaces `/`",
        "Phase 64 adds Hosted GPT",
        "Phase 64 adds BYOK",
        "Phase 64 adds upload",
        "Phase 64 adds auth",
        "Phase 64 ratifies task_id",
        "Phase 64 changes scenario DSL",
        "Phase 64 changes claim labels",
        "Phase 64 changes report claim `evidence_ids`",
        "Phase 64 changes plugin MCP contract",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 64 perturb follow-up wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 64 scope: {phrase}"
