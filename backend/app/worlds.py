from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


CANONICAL_DEMO_WORLD_ID = "fog-harbor-east-gate"


@dataclass(frozen=True)
class WorldPaths:
    repo_root: Path
    world_id: str
    data_root: Path
    artifacts_root: Path
    manifest_path: Path
    world_model_path: Path
    simulation_rules_path: Path
    scenario_dir: Path
    baseline_scenario_path: Path
    expectations_path: Path | None = None

    def scenario_paths(self) -> list[Path]:
        return [self.baseline_scenario_path] + sorted(
            path for path in self.scenario_dir.glob("*.yaml") if path != self.baseline_scenario_path
        )


def resolve_world_paths(world_id: str, repo_root: Path | None = None) -> WorldPaths:
    root = repo_root or Path(__file__).resolve().parents[2]
    if world_id == CANONICAL_DEMO_WORLD_ID:
        data_root = root / "data" / "demo"
        artifacts_root = root / "artifacts" / "demo"
        expectations_path = data_root / "expectations" / "demo_eval.yaml"
    else:
        data_root = root / "data" / "worlds" / world_id
        artifacts_root = root / "artifacts" / "worlds" / world_id
        expectations_path = None

    return WorldPaths(
        repo_root=root,
        world_id=world_id,
        data_root=data_root,
        artifacts_root=artifacts_root,
        manifest_path=data_root / "corpus" / "manifest.yaml",
        world_model_path=data_root / "config" / "world_model.yaml",
        simulation_rules_path=data_root / "config" / "simulation_rules.yaml",
        scenario_dir=data_root / "scenarios",
        baseline_scenario_path=data_root / "scenarios" / "baseline.yaml",
        expectations_path=expectations_path,
    )


def list_world_ids(repo_root: Path | None = None) -> list[str]:
    root = repo_root or Path(__file__).resolve().parents[2]
    worlds_root = root / "data" / "worlds"
    world_ids = [CANONICAL_DEMO_WORLD_ID]
    if worlds_root.exists():
        world_ids.extend(
            sorted(path.name for path in worlds_root.iterdir() if path.is_dir())
        )
    return world_ids
