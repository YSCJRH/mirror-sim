from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from types import ModuleType


SMOKE_PATH = Path("scripts/smoke_phase65_selected_world_runtime_generation.py")
EVIDENCE_PATH = Path(
    "docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md"
)
PHASE65_GATE_PATH = Path(
    "docs/plans/phase-65-selected-world-deterministic-runtime-generation-gate-2026-06-01.md"
)
PHASE64_EVIDENCE_PATH = Path(
    "docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md"
)
SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]
EXPECTED_SCENARIOS = {
    "fog-harbor-east-gate": "scenario_baseline",
    "museum-night": "scenario_museum_night_baseline",
    "library-rain": "scenario_library_rain_baseline",
}


def _read(path: Path) -> str:
    assert path.exists(), path
    return path.read_text(encoding="utf-8")


def _load_smoke_module() -> ModuleType:
    assert SMOKE_PATH.exists(), SMOKE_PATH
    spec = importlib.util.spec_from_file_location("phase65_runtime_generation_smoke", SMOKE_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_phase65_runtime_generation_smoke_script_is_scoped_to_existing_cli_contracts() -> None:
    script = _read(SMOKE_PATH)
    required_phrases = [
        "SELECTED_WORLD_IDS",
        "fog-harbor-east-gate",
        "museum-night",
        "library-rain",
        "start-session",
        "generate-branch",
        "deterministic_only",
        "TemporaryDirectory",
        "mismatch_rejection",
        "claims_have_labels_and_evidence_ids",
        "provider_or_model_calls",
        "async_task_or_worker_behavior",
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
        "task_id",
        "Hosted GPT is enabled",
        "BYOK is enabled",
    ]
    lowered = script.lower()
    for phrase in forbidden_phrases:
        assert phrase.lower() not in lowered


def test_phase65_runtime_generation_smoke_collects_three_worlds_with_temp_artifacts() -> None:
    module = _load_smoke_module()

    evidence = module.collect_selected_world_runtime_generation(repo_root=Path.cwd())
    failures = module.validate_selected_world_runtime_generation(evidence)

    assert failures == []
    assert evidence["status"] == "pass"
    assert evidence["mode"] == "phase65_selected_world_runtime_generation"
    assert evidence["selected_world_ids"] == SELECTED_WORLD_IDS
    assert evidence["phase65_gate_path"] == PHASE65_GATE_PATH.as_posix()
    assert evidence["phase64_evidence_path"] == PHASE64_EVIDENCE_PATH.as_posix()
    assert evidence["temporary_local_artifacts"] is True
    assert evidence["provider_or_model_calls"] is False
    assert evidence["async_task_or_worker_behavior"] is False
    assert evidence["new_route_or_api_added"] is False

    worlds = evidence["worlds"]
    assert [world["world_id"] for world in worlds] == SELECTED_WORLD_IDS
    for world in worlds:
        world_id = world["world_id"]
        assert world["scenario_id"] == EXPECTED_SCENARIOS[world_id]
        assert world["session_world_id"] == world_id
        assert world["root_node_world_id"] == world_id
        assert world["generated_node_world_id"] == world_id
        assert world["generated_node_id"] != "node_root"
        assert world["active_node_id"] == world["generated_node_id"]
        assert world["session_decision_config"]["provider"] == "deterministic_only"
        assert world["session_decision_config"]["model_id"] is None
        assert world["generated_decision_trace_provider_only"] is True
        assert world["mismatch_rejection"]["status"] == "rejected"
        assert "belongs to world" in world["mismatch_rejection"]["stderr"]
        assert world["artifact_integrity"]["summary"] is True
        assert world["artifact_integrity"]["trace"] is True
        assert world["artifact_integrity"]["snapshots"] is True
        assert world["artifact_integrity"]["compare"] is True
        assert world["artifact_integrity"]["report"] is True
        assert world["artifact_integrity"]["claims"] is True
        assert world["artifact_integrity"]["resolution"] is True
        assert world["artifact_integrity"]["decision_trace"] is True
        assert world["claims_have_labels_and_evidence_ids"] is True
        assert world["claims_use_allowed_labels"] is True
        assert world["claim_evidence_ids_resolve"] is True
        assert world["claim_count"] > 0


def test_phase65_claim_integrity_check_rejects_empty_unknown_and_unresolved_fields() -> None:
    module = _load_smoke_module()

    with TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        claims_path = root / "claims.json"
        chunks_path = root / "chunks.jsonl"
        claims_path.write_text(
            json.dumps(
                [
                    {
                        "claim_id": "claim_empty_evidence",
                        "label": "evidence_backed",
                        "evidence_ids": [],
                    },
                    {
                        "claim_id": "claim_unknown_label",
                        "label": "unsupported",
                        "evidence_ids": ["chunk_known"],
                    },
                    {
                        "claim_id": "claim_unresolved_evidence",
                        "label": "inferred",
                        "evidence_ids": ["chunk_missing"],
                    },
                ]
            ),
            encoding="utf-8",
        )
        chunks_path.write_text(json.dumps({"chunk_id": "chunk_known"}) + "\n", encoding="utf-8")

        status = module._claim_integrity_status(claims_path, chunks_path)

    assert status["claims_have_labels_and_evidence_ids"] is False
    assert status["claims_use_allowed_labels"] is False
    assert status["claim_evidence_ids_resolve"] is False
    assert status["invalid_claim_labels"] == ["unsupported"]
    assert status["invalid_evidence_ids"] == ["chunk_missing"]


def test_phase65_runtime_generation_smoke_script_runs_as_direct_command() -> None:
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


def test_phase65_runtime_generation_evidence_note_records_outputs_and_boundaries() -> None:
    evidence = _read(EVIDENCE_PATH)
    required_phrases = [
        "# Phase 65 Selected-World Runtime Generation Evidence",
        "Issue: `#497` `Phase 65: add selected-world deterministic runtime generation smoke`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "`docs/plans/phase-65-selected-world-deterministic-runtime-generation-gate-2026-06-01.md`",
        "`docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md`",
        "`scripts/smoke_phase65_selected_world_runtime_generation.py`",
        "`python scripts/smoke_phase65_selected_world_runtime_generation.py`",
        "`python -m pytest backend/tests/test_phase65_selected_world_runtime_generation.py backend/tests/test_phase65_selected_world_runtime_generation_gate.py -q`",
        "`start-session`",
        "`generate-branch`",
        "`deterministic_only`",
        "temporary local artifacts",
        "session and generated node world IDs remain world-scoped",
        "mismatch rejection is exercised with the existing `--world` guard",
        "compare, report, claims, resolution, and decision trace artifacts are present",
        "Every emitted report claim keeps both `label` and `evidence_ids`.",
        "does not call provider/model paths",
        "does not add async/task_id behavior or worker queues",
        "does not add routes or APIs",
        "does not change scenario DSL, perturbation payload schema, decision schema, claim labels, report claim `evidence_ids`, run trace shape, compare artifact shape, session/node manifest shape, public demo artifact layout, or plugin MCP contract",
    ]
    for phrase in required_phrases:
        assert phrase in evidence

    forbidden_phrases = [
        "Phase 65 promotes broad private-beta readiness",
        "Phase 65 promotes future-world readiness",
        "Phase 65 implements launch hub",
        "Phase 65 adds Hosted GPT",
        "Phase 65 adds BYOK",
        "Phase 65 adds upload",
        "Phase 65 adds auth",
        "Phase 65 calls provider or model paths",
        "Phase 65 changes scenario DSL",
        "Phase 65 changes claim labels",
        "Phase 65 changes report claim `evidence_ids`",
    ]
    for phrase in forbidden_phrases:
        assert phrase not in evidence


def test_phase65_docs_reference_runtime_generation_evidence_without_scope_expansion() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        PHASE65_GATE_PATH,
        EVIDENCE_PATH,
    ]
    required_phrases = [
        "`#497` `Phase 65: add selected-world deterministic runtime generation smoke`",
        "`docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md`",
        "`scripts/smoke_phase65_selected_world_runtime_generation.py`",
        "selected-world deterministic runtime generation evidence",
        "existing v1 CLI/session contracts",
        "temporary local artifacts",
    ]
    forbidden_phrases = [
        "Phase 65 promotes broad private-beta readiness",
        "Phase 65 implements launch hub",
        "Phase 65 replaces `/`",
        "Phase 65 adds Hosted GPT",
        "Phase 65 adds BYOK",
        "Phase 65 adds upload",
        "Phase 65 adds auth",
        "Phase 65 ratifies task_id",
        "Phase 65 changes scenario DSL",
        "Phase 65 changes claim labels",
        "Phase 65 changes report claim `evidence_ids`",
        "Phase 65 changes plugin MCP contract",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 65 runtime evidence wording: {phrase}"
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} expands blocked Phase 65 scope: {phrase}"
