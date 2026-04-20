from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from backend.app.worlds import CANONICAL_DEMO_WORLD_ID, resolve_world_paths


@dataclass(frozen=True)
class Settings:
    repo_root: Path
    world_id: str
    data_root: Path
    artifacts_root: Path
    manifest_path: Path
    world_model_path: Path
    simulation_rules_path: Path
    scenario_dir: Path
    baseline_scenario_path: Path
    intervention_scenario_path: Path
    expectations_path: Path
    redlines_path: Path


def get_settings() -> Settings:
    repo_root = Path(__file__).resolve().parents[2]
    world_paths = resolve_world_paths(CANONICAL_DEMO_WORLD_ID, repo_root=repo_root)
    return Settings(
        repo_root=repo_root,
        world_id=world_paths.world_id,
        data_root=world_paths.data_root,
        artifacts_root=world_paths.artifacts_root,
        manifest_path=world_paths.manifest_path,
        world_model_path=world_paths.world_model_path,
        simulation_rules_path=world_paths.simulation_rules_path,
        scenario_dir=world_paths.scenario_dir,
        baseline_scenario_path=world_paths.baseline_scenario_path,
        intervention_scenario_path=world_paths.scenario_dir / "reporter_detained.yaml",
        expectations_path=world_paths.expectations_path or (world_paths.data_root / "expectations" / "demo_eval.yaml"),
        redlines_path=repo_root / "evals" / "assertions" / "redlines.yaml",
    )
