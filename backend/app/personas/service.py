from __future__ import annotations

from pathlib import Path

from backend.app.config import get_settings
from backend.app.domain.models import Persona
from backend.app.utils import read_json, write_json
from backend.app.world_model import EvidenceReference, TextFieldDefinition, load_world_model


def _resolve_evidence(reference: EvidenceReference, entity_index: dict, relation_index: dict, event_index: dict) -> list[str]:
    evidence_ids: set[str] = set()
    for entity_id in reference.entity_ids:
        evidence_ids.update(entity_index[entity_id]["evidence_ids"])
    for relation_id in reference.relation_ids:
        evidence_ids.update(relation_index[relation_id]["evidence_ids"])
    for event_id in reference.event_ids:
        evidence_ids.update(event_index[event_id]["evidence_ids"])
    return sorted(evidence_ids)


def _field_provenance(
    items: list[TextFieldDefinition],
    entity_index: dict,
    relation_index: dict,
    event_index: dict,
) -> tuple[list[str], list[str]]:
    texts = [item.text for item in items]
    evidence_ids: set[str] = set()
    for item in items:
        evidence_ids.update(_resolve_evidence(item.evidence, entity_index, relation_index, event_index))
    return texts, sorted(evidence_ids)


def build_personas(graph_path: Path, out_dir: Path, world_model_path: Path | None = None) -> list[Persona]:
    graph_payload = read_json(graph_path)
    world_model = load_world_model(world_model_path or get_settings().world_model_path)
    entity_index = {entity["entity_id"]: entity for entity in graph_payload["entities"]}
    relation_index = {relation["relation_id"]: relation for relation in graph_payload["relations"]}
    event_index = {event["event_id"]: event for event in graph_payload["events"]}
    personas: list[Persona] = []

    for blueprint in world_model.personas:
        goals, goals_evidence = _field_provenance(blueprint.goals, entity_index, relation_index, event_index)
        constraints, constraints_evidence = _field_provenance(blueprint.constraints, entity_index, relation_index, event_index)
        known_facts, known_facts_evidence = _field_provenance(blueprint.known_facts, entity_index, relation_index, event_index)
        private_info, private_info_evidence = _field_provenance(blueprint.private_info, entity_index, relation_index, event_index)
        public_role_evidence = _resolve_evidence(blueprint.public_role.evidence, entity_index, relation_index, event_index)
        relationships = [{"target_id": item.target_id, "kind": item.kind} for item in blueprint.relationships]
        relationships_evidence = sorted(
            {
                evidence_id
                for item in blueprint.relationships
                for evidence_id in _resolve_evidence(item.evidence, entity_index, relation_index, event_index)
            }
        )
        field_provenance = {
            "public_role": public_role_evidence,
            "goals": goals_evidence,
            "constraints": constraints_evidence,
            "known_facts": known_facts_evidence,
            "private_info": private_info_evidence,
            "relationships": relationships_evidence,
        }
        for field_name, field_value in (
            ("public_role", blueprint.public_role.text),
            ("goals", goals),
            ("constraints", constraints),
            ("known_facts", known_facts),
            ("private_info", private_info),
            ("relationships", relationships),
        ):
            if field_value and not field_provenance[field_name]:
                raise ValueError(f"Persona field is missing provenance: {blueprint.persona_id}.{field_name}")

        evidence_ids = set(entity_index[blueprint.entity_id]["evidence_ids"])
        for field_ids in field_provenance.values():
            evidence_ids.update(field_ids)
        personas.append(
            Persona(
                persona_id=blueprint.persona_id,
                entity_id=blueprint.entity_id,
                public_role=blueprint.public_role.text,
                goals=goals,
                constraints=constraints,
                known_facts=known_facts,
                private_info=private_info,
                relationships=relationships,
                field_provenance=field_provenance,
                evidence_ids=sorted(evidence_ids),
            )
        )

    write_json(out_dir / "personas.json", {"personas": [persona.model_dump() for persona in personas]})
    return personas
