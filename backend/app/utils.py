from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterable

import yaml


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def write_json(path: Path, payload: Any) -> None:
    ensure_dir(path.parent)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def read_json_arg(raw: str) -> Any:
    stripped = raw.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        return json.loads(raw)

    path = Path(raw)
    try:
        if path.exists():
            return read_json(path)
    except OSError:
        pass
    return json.loads(raw)


def write_jsonl(path: Path, items: Iterable[Any]) -> None:
    ensure_dir(path.parent)
    with path.open("w", encoding="utf-8") as handle:
        for item in items:
            if hasattr(item, "model_dump"):
                payload = item.model_dump()
            else:
                payload = item
            handle.write(json.dumps(payload, ensure_ascii=False) + "\n")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def load_yaml(path: Path) -> Any:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "_", value.strip().lower()).strip("_")
    return normalized or "item"
