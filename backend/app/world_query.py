from __future__ import annotations

from pathlib import Path
from typing import Literal

from backend.app.utils import read_json


WorldObjectKind = Literal["entity", "persona", "event"]


def inspect_world(kind: WorldObjectKind, object_id: str, graph_path: Path, personas_path: Path) -> dict:
    graph_payload = read_json(graph_path)
    persona_payload = read_json(personas_path)

    if kind == "entity":
        collection = graph_payload["entities"]
        id_field = "entity_id"
    elif kind == "event":
        collection = graph_payload["events"]
        id_field = "event_id"
    else:
        collection = persona_payload["personas"]
        id_field = "persona_id"

    for item in collection:
        if item[id_field] == object_id:
            return {
                "world_id": graph_payload["world_id"],
                "kind": kind,
                "object": item,
            }

    raise ValueError(f"Unknown {kind} id: {object_id}")
