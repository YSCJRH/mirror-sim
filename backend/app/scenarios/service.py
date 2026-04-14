from __future__ import annotations

from pathlib import Path

from backend.app.domain.models import Scenario
from backend.app.safety.service import ensure_safe_scenario
from backend.app.utils import load_yaml, write_json


def load_scenario(path: Path) -> Scenario:
    payload = load_yaml(path)
    ensure_safe_scenario(payload)
    return Scenario.model_validate(payload)


def validate_scenario(path: Path, out_path: Path | None = None) -> Scenario:
    scenario = load_scenario(path)
    if out_path is not None:
        write_json(out_path, scenario.model_dump())
    return scenario
