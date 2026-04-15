from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    repo_root: Path
    data_root: Path
    artifacts_root: Path
    manifest_path: Path
    world_model_path: Path
    baseline_scenario_path: Path
    intervention_scenario_path: Path
    expectations_path: Path
    redlines_path: Path


def get_settings() -> Settings:
    repo_root = Path(__file__).resolve().parents[2]
    data_root = repo_root / "data" / "demo"
    artifacts_root = repo_root / "artifacts" / "demo"
    return Settings(
        repo_root=repo_root,
        data_root=data_root,
        artifacts_root=artifacts_root,
        manifest_path=data_root / "corpus" / "manifest.yaml",
        world_model_path=data_root / "config" / "world_model.yaml",
        baseline_scenario_path=data_root / "scenarios" / "baseline.yaml",
        intervention_scenario_path=data_root / "scenarios" / "reporter_detained.yaml",
        expectations_path=data_root / "expectations" / "demo_eval.yaml",
        redlines_path=repo_root / "evals" / "assertions" / "redlines.yaml",
    )
