from __future__ import annotations

from pathlib import Path

from backend.app.domain.models import Entity, Relation
from backend.app.utils import read_jsonl, write_json


ENTITY_DEFINITIONS = [
    {"entity_id": "entity_lin_lan", "name": "Lin Lan", "type": "person", "aliases": ["lin lan", "archive clerk", "archive room"]},
    {"entity_id": "entity_zhao_ke", "name": "Zhao Ke", "type": "person", "aliases": ["zhao ke", "deputy mayor", "mayor's office"]},
    {"entity_id": "entity_su_he", "name": "Su He", "type": "person", "aliases": ["su he", "engineer su he", "public works office"]},
    {"entity_id": "entity_chen_yu", "name": "Chen Yu", "type": "person", "aliases": ["chen yu", "captain chen yu", "tug lantern three"]},
    {"entity_id": "entity_east_gate", "name": "East Gate", "type": "infrastructure", "aliases": ["east gate", "flood gate", "gate seam"]},
    {"entity_id": "entity_maintenance_ledger", "name": "Maintenance Ledger", "type": "document", "aliases": ["maintenance ledger", "ledger copy", "copied pages"]},
    {"entity_id": "entity_sea_lantern_festival", "name": "Sea Lantern Festival", "type": "event", "aliases": ["sea lantern festival", "festival", "opening ceremony"]},
    {"entity_id": "entity_east_wharf", "name": "East Wharf", "type": "location", "aliases": ["east wharf", "harbor square", "quay"]},
]

RELATION_RULES = [
    {"relation_id": "relation_lin_lan_controls_ledger", "source_entity_id": "entity_lin_lan", "relation_type": "controls", "target_entity_id": "entity_maintenance_ledger", "keywords": ["lin lan", "ledger"]},
    {"relation_id": "relation_su_he_inspects_gate", "source_entity_id": "entity_su_he", "relation_type": "inspects", "target_entity_id": "entity_east_gate", "keywords": ["su he", "east gate"]},
    {"relation_id": "relation_zhao_ke_protects_festival", "source_entity_id": "entity_zhao_ke", "relation_type": "protects", "target_entity_id": "entity_sea_lantern_festival", "keywords": ["zhao ke", "festival"]},
    {"relation_id": "relation_chen_yu_observes_tides", "source_entity_id": "entity_chen_yu", "relation_type": "observes", "target_entity_id": "entity_east_gate", "keywords": ["chen yu", "tide"]},
    {"relation_id": "relation_festival_diverts_maintenance_budget", "source_entity_id": "entity_sea_lantern_festival", "relation_type": "draws_funding_from", "target_entity_id": "entity_east_gate", "keywords": ["festival", "maintenance", "reassigned"]},
]


def build_graph(chunks_path: Path, out_dir: Path) -> dict:
    chunk_rows = read_jsonl(chunks_path)
    entities: list[Entity] = []
    relations: list[Relation] = []

    for definition in ENTITY_DEFINITIONS:
        evidence_ids = sorted(
            {
                chunk["chunk_id"]
                for chunk in chunk_rows
                if any(alias in chunk["text"].lower() for alias in definition["aliases"])
            }
        )
        entities.append(
            Entity(
                entity_id=definition["entity_id"],
                name=definition["name"],
                type=definition["type"],
                aliases=definition["aliases"],
                evidence_ids=evidence_ids,
            )
        )

    for rule in RELATION_RULES:
        evidence_ids = sorted(
            {
                chunk["chunk_id"]
                for chunk in chunk_rows
                if all(keyword in chunk["text"].lower() for keyword in rule["keywords"])
            }
        )
        if evidence_ids:
            relations.append(
                Relation(
                    relation_id=rule["relation_id"],
                    source_entity_id=rule["source_entity_id"],
                    relation_type=rule["relation_type"],
                    target_entity_id=rule["target_entity_id"],
                    evidence_ids=evidence_ids,
                )
            )

    payload = {
        "world_id": "fog-harbor-east-gate",
        "entities": [entity.model_dump() for entity in entities],
        "relations": [relation.model_dump() for relation in relations],
        "stats": {
            "entity_count": len(entities),
            "relation_count": len(relations),
            "chunk_count": len(chunk_rows),
        },
    }
    write_json(out_dir / "graph.json", payload)
    return payload
