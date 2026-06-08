from __future__ import annotations

import json
from dataclasses import replace
from pathlib import Path

from backend.app.evals.service import DEFAULT_TRANSFER_WORLD_IDS, evaluate_transfer_world, run_world_eval
from backend.app.simulation.rules import load_simulation_plan
from backend.app.worlds import CANONICAL_DEMO_WORLD_ID, resolve_world_paths


def _museum_world_paths(artifacts_root: Path):
    return replace(resolve_world_paths("museum-night"), artifacts_root=artifacts_root)


def _library_world_paths(artifacts_root: Path):
    return replace(resolve_world_paths("library-rain"), artifacts_root=artifacts_root)


def test_default_transfer_world_set_includes_third_bounded_world() -> None:
    assert DEFAULT_TRANSFER_WORLD_IDS == [
        CANONICAL_DEMO_WORLD_ID,
        "museum-night",
        "library-rain",
    ]


def test_resolve_world_paths_supports_canonical_and_transfer_world() -> None:
    demo_paths = resolve_world_paths(CANONICAL_DEMO_WORLD_ID)
    museum_paths = resolve_world_paths("museum-night")
    library_paths = resolve_world_paths("library-rain")

    assert demo_paths.data_root.name == "demo"
    assert demo_paths.artifacts_root.name == "demo"
    assert museum_paths.data_root.name == "museum-night"
    assert museum_paths.artifacts_root.name == "museum-night"
    assert museum_paths.simulation_rules_path.name == "simulation_rules.yaml"
    assert library_paths.data_root.name == "library-rain"
    assert library_paths.artifacts_root.name == "library-rain"
    assert library_paths.simulation_rules_path.name == "simulation_rules.yaml"


def test_transfer_world_simulation_rules_load() -> None:
    plan = load_simulation_plan(resolve_world_paths("museum-night").simulation_rules_path)
    assert plan.world_id == "museum-night"
    assert plan.compare_id == "scenario_museum_night_matrix"
    assert plan.default_report_scenario == "checklist_delayed"
    assert len(plan.turn_sequence) == 8

    library_plan = load_simulation_plan(resolve_world_paths("library-rain").simulation_rules_path)
    assert library_plan.world_id == "library-rain"
    assert library_plan.compare_id == "scenario_library_rain_matrix"
    assert library_plan.default_report_scenario == "catalog_delayed"
    assert len(library_plan.turn_sequence) == 8


def test_museum_night_world_eval_passes(tmp_path: Path) -> None:
    result = run_world_eval("museum-night", artifacts_root=tmp_path / "museum-night")
    assert result.status == "pass"
    assert result.world_id == "museum-night"
    assert result.metrics["scenario_count"] == 2
    assert result.metrics["tracked_outcome_count"] == 5
    assert result.metrics["tracked_outcome_fields_covered"] == 5
    assert result.metrics["compare_outcome_fields_covered"] == 5
    assert result.metrics["changed_tracked_outcome_count"] >= 1
    assert result.metrics["default_report_changed_outcome_count"] >= 1
    assert result.metrics["report_compare_sourced"] is True
    assert result.metrics["transfer_proof_world_local"] is True
    assert Path(result.artifact_paths["report"]).exists()
    assert Path(result.artifact_paths["eval"]).exists()


def test_library_rain_world_eval_passes(tmp_path: Path) -> None:
    result = run_world_eval("library-rain", artifacts_root=tmp_path / "library-rain")
    assert result.status == "pass"
    assert result.world_id == "library-rain"
    assert result.metrics["scenario_count"] == 2
    assert result.metrics["tracked_outcome_count"] == 5
    assert result.metrics["tracked_outcome_fields_covered"] == 5
    assert result.metrics["compare_outcome_fields_covered"] == 5
    assert result.metrics["changed_tracked_outcome_count"] >= 1
    assert result.metrics["default_report_changed_outcome_count"] >= 1
    assert result.metrics["report_compare_sourced"] is True
    assert result.metrics["transfer_proof_world_local"] is True
    assert Path(result.artifact_paths["report"]).exists()
    assert Path(result.artifact_paths["eval"]).exists()


def test_transfer_world_eval_fails_when_tracked_outcome_missing_from_runs(tmp_path: Path) -> None:
    artifacts_root = tmp_path / "museum-night"
    run_world_eval("museum-night", artifacts_root=artifacts_root)

    for summary_path in artifacts_root.glob("run/*/summary.json"):
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
        summary.get("final_state", {}).pop("opening_status", None)
        summary.pop("opening_status", None)
        summary_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    result = evaluate_transfer_world(_museum_world_paths(artifacts_root))

    assert result.status == "fail"
    assert result.metrics["tracked_outcome_fields_covered"] == 4
    assert any("tracked_outcomes_in_run_summaries" in failure for failure in result.failures)


def test_transfer_world_eval_fails_when_tracked_outcomes_do_not_change(tmp_path: Path) -> None:
    artifacts_root = tmp_path / "museum-night"
    run_world_eval("museum-night", artifacts_root=artifacts_root)

    compare_path = artifacts_root / "compare" / "scenario_museum_night_matrix" / "compare.json"
    compare_payload = json.loads(compare_path.read_text(encoding="utf-8"))
    for delta in compare_payload["reference_deltas"]:
        for outcome_delta in delta["outcome_deltas"].values():
            outcome_delta["candidate"] = outcome_delta["reference"]
            outcome_delta["delta"] = 0
    compare_path.write_text(json.dumps(compare_payload, indent=2) + "\n", encoding="utf-8")

    result = evaluate_transfer_world(_museum_world_paths(artifacts_root))

    assert result.status == "fail"
    assert result.metrics["changed_tracked_outcome_count"] == 0
    assert result.metrics["default_report_changed_outcome_count"] == 0
    assert result.metrics["transfer_proof_world_local"] is False
    assert any("tracked_outcomes_have_semantic_delta" in failure for failure in result.failures)
    assert any("default_report_scenario_has_semantic_delta" in failure for failure in result.failures)
