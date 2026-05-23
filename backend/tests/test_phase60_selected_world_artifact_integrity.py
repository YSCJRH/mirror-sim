from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from types import ModuleType

from backend.app.evals.service import run_transfer_eval
from backend.app.worlds import resolve_world_paths


SMOKE_PATH = Path("scripts/smoke_phase60_selected_world_artifact_integrity.py")
EVIDENCE_PATH = Path(
    "docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md"
)
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
    spec = importlib.util.spec_from_file_location("phase60_artifact_integrity_smoke", SMOKE_PATH)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_phase60_artifact_integrity_smoke_script_is_scoped_to_selected_worlds() -> None:
    script = _read(SMOKE_PATH)

    required_phrases = [
        "SELECTED_WORLD_IDS",
        "fog-harbor-east-gate",
        "museum-night",
        "library-rain",
        "EXPECTED_ARTIFACT_ROOTS",
        "artifacts/demo",
        "artifacts/worlds/museum-night",
        "artifacts/worlds/library-rain",
        "label",
        "evidence_ids",
        "claim_evidence_resolves",
        "transfer_proof_world_local",
    ]
    for phrase in required_phrases:
        assert phrase in script

    forbidden_phrases = [
        "start_session(",
        "generate_branch(",
        "rollback_session(",
        "create_bounded_incident_world(",
        "openai",
        "hosted_openai",
        "task_id",
        "async",
        "upload",
        "billing",
    ]
    lowered = script.lower()
    for phrase in forbidden_phrases:
        assert phrase.lower() not in lowered


def test_phase60_selected_world_ids_and_default_artifact_roots_are_stable() -> None:
    for world_id in SELECTED_WORLD_IDS:
        paths = resolve_world_paths(world_id, repo_root=Path.cwd())
        assert paths.world_id == world_id
        assert paths.artifacts_root.relative_to(Path.cwd()).as_posix() == EXPECTED_ARTIFACT_ROOTS[world_id]


def test_phase60_artifact_integrity_smoke_validates_generated_transfer_artifacts() -> None:
    module = _load_smoke_module()

    transfer_summary = run_transfer_eval(repo_root=Path.cwd())
    assert transfer_summary.status == "pass"

    evidence = module.collect_selected_world_artifact_integrity(repo_root=Path.cwd())

    assert evidence["selected_world_ids"] == SELECTED_WORLD_IDS
    assert evidence["transfer_summary"]["status"] == "pass"
    assert evidence["transfer_summary"]["metrics"]["world_count"] == 3
    assert evidence["transfer_summary"]["metrics"]["scenario_count"] == 8
    assert evidence["transfer_summary"]["metrics"]["tracked_outcome_count"] == 18
    assert evidence["transfer_summary"]["metrics"]["transfer_worlds_with_default_report_delta"] == 3
    assert evidence["transfer_summary"]["metrics"]["transfer_proof_world_local"] is True

    worlds = evidence["worlds"]
    assert [world["world_id"] for world in worlds] == SELECTED_WORLD_IDS
    for world in worlds:
        world_id = world["world_id"]
        assert world["artifact_root"] == EXPECTED_ARTIFACT_ROOTS[world_id]
        assert world["eval_summary_path"] == f"{EXPECTED_ARTIFACT_ROOTS[world_id]}/eval/summary.json"
        assert world["eval_status"] == "pass"
        assert world["claim_count"] > 0
        assert world["claims_labeled"] is True
        assert world["claims_have_evidence_ids"] is True
        assert world["claim_evidence_resolves"] is True
        assert world["artifact_paths"]["eval"] == world["eval_summary_path"]
        assert world["artifact_paths"]["claims"] == f"{EXPECTED_ARTIFACT_ROOTS[world_id]}/report/claims.json"


def test_phase60_artifact_integrity_smoke_script_runs_as_direct_command() -> None:
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


def test_phase60_artifact_integrity_evidence_note_records_outputs_and_boundaries() -> None:
    evidence = _read(EVIDENCE_PATH)

    required_phrases = [
        "# Phase 60 Selected-World Review Artifact Integrity Evidence",
        "Issue: `#467` `Phase 60: add selected-world review artifact integrity smoke`",
        "`fog-harbor-east-gate`",
        "`museum-night`",
        "`library-rain`",
        "`artifacts/demo`",
        "`artifacts/worlds/museum-night`",
        "`artifacts/worlds/library-rain`",
        "`artifacts/demo/eval/summary.json`",
        "`artifacts/worlds/museum-night/eval/summary.json`",
        "`artifacts/worlds/library-rain/eval/summary.json`",
        "`artifacts/transfer/summary.json`",
        "`world_count: 3`",
        "`scenario_count: 8`",
        "`tracked_outcome_count: 18`",
        "`transfer_worlds_with_default_report_delta: 3`",
        "`transfer_proof_world_local: true`",
        "Every report claim keeps both `label` and `evidence_ids`.",
        "`claim_evidence_resolves`",
        "`python scripts/smoke_phase60_selected_world_artifact_integrity.py`",
        "`python -m pytest backend/tests/test_phase60_selected_world_artifact_integrity.py -q`",
        "`./make.ps1 eval-transfer`",
        "`./make.ps1 smoke`",
        "`./make.ps1 test`",
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


def test_active_phase60_docs_reference_artifact_integrity_evidence_note() -> None:
    docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-60-selected-world-artifact-integrity-gate-2026-05-23.md"),
    ]
    required_phrases = [
        "`#467` `Phase 60: add selected-world review artifact integrity smoke`",
        "`docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md`",
        "`scripts/smoke_phase60_selected_world_artifact_integrity.py`",
        "selected-world review artifact integrity evidence",
    ]

    for path in docs:
        text = _read(path)
        for phrase in required_phrases:
            assert phrase in text, f"{path} is missing Phase 60 evidence wording: {phrase}"
