from __future__ import annotations

from pathlib import Path

from backend.app.config import get_settings
from backend.app.domain.models import Entity, Event, Relation
from backend.app.utils import read_jsonl, write_json
from backend.app.world_model import MatchRule, load_world_model


def _matches_rule(text: str, rule: MatchRule) -> bool:
    if rule.all and not all(keyword in text for keyword in rule.all):
        return False
    if rule.any and not any(keyword in text for keyword in rule.any):
        return False
    return bool(rule.all or rule.any)


def _match_aliases(text: str, aliases: list[str]) -> bool:
    return any(alias in text for alias in aliases)


def _evidence_for_aliases(chunk_rows: list[dict], aliases: list[str]) -> list[str]:
    return sorted({chunk["chunk_id"] for chunk in chunk_rows if _match_aliases(chunk["text"].lower(), aliases)})


def _evidence_for_rule(chunk_rows: list[dict], rule: MatchRule) -> list[str]:
    return sorted({chunk["chunk_id"] for chunk in chunk_rows if _matches_rule(chunk["text"].lower(), rule)})


def build_graph(chunks_path: Path, out_dir: Path, world_model_path: Path | None = None) -> dict:
    chunk_rows = read_jsonl(chunks_path)
    world_model = load_world_model(world_model_path or get_settings().world_model_path)
    entities: list[Entity] = []
    relations: list[Relation] = []
    events: list[Event] = []

    for definition in world_model.entities:
        evidence_ids = _evidence_for_aliases(chunk_rows, definition.aliases)
        entities.append(
            Entity(
                entity_id=definition.entity_id,
                name=definition.name,
                type=definition.type,
                aliases=definition.aliases,
                evidence_ids=evidence_ids,
            )
        )

    for rule in world_model.relations:
        evidence_ids = _evidence_for_rule(chunk_rows, rule.match)
        if evidence_ids:
            relations.append(
                Relation(
                    relation_id=rule.relation_id,
                    source_entity_id=rule.source_entity_id,
                    relation_type=rule.relation_type,
                    target_entity_id=rule.target_entity_id,
                    evidence_ids=evidence_ids,
                )
            )

    for definition in world_model.events:
        evidence_ids = _evidence_for_rule(chunk_rows, definition.match)
        if evidence_ids:
            events.append(
                Event(
                    event_id=definition.event_id,
                    name=definition.name,
                    kind=definition.kind,
                    participant_entity_ids=definition.participant_entity_ids,
                    evidence_ids=evidence_ids,
                )
            )

    payload = {
        "world_id": world_model.world_id,
        "entities": [entity.model_dump() for entity in entities],
        "relations": [relation.model_dump() for relation in relations],
        "events": [event.model_dump() for event in events],
        "stats": {
            "entity_count": len(entities),
            "relation_count": len(relations),
            "event_count": len(events),
            "chunk_count": len(chunk_rows),
        },
    }
    write_json(out_dir / "graph.json", payload)
    return payload
