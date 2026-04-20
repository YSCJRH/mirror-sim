from __future__ import annotations

from pathlib import Path

from backend.app.evals.service import run_world_eval
from backend.app.simulation.rules import load_simulation_plan
from backend.app.worlds import CANONICAL_DEMO_WORLD_ID, resolve_world_paths


def test_resolve_world_paths_supports_canonical_and_transfer_world() -> None:
    demo_paths = resolve_world_paths(CANONICAL_DEMO_WORLD_ID)
    museum_paths = resolve_world_paths("museum-night")

    assert demo_paths.data_root.name == "demo"
    assert demo_paths.artifacts_root.name == "demo"
    assert museum_paths.data_root.name == "museum-night"
    assert museum_paths.artifacts_root.name == "museum-night"
    assert museum_paths.simulation_rules_path.name == "simulation_rules.yaml"


def test_transfer_world_simulation_rules_load() -> None:
    plan = load_simulation_plan(resolve_world_paths("museum-night").simulation_rules_path)
    assert plan.world_id == "museum-night"
    assert plan.compare_id == "scenario_museum_night_matrix"
    assert plan.default_report_scenario == "checklist_delayed"
    assert len(plan.turn_sequence) == 8


def test_museum_night_world_eval_passes(tmp_path: Path) -> None:
    result = run_world_eval("museum-night", artifacts_root=tmp_path / "museum-night")
    assert result.status == "pass"
    assert result.world_id == "museum-night"
    assert result.metrics["scenario_count"] == 2
    assert Path(result.artifact_paths["report"]).exists()
    assert Path(result.artifact_paths["eval"]).exists()
