from __future__ import annotations

from pathlib import Path

from pydantic import Field

from backend.app.domain.models import MirrorBaseModel
from backend.app.utils import load_yaml


class MatchRule(MirrorBaseModel):
    all: list[str] = Field(default_factory=list)
    any: list[str] = Field(default_factory=list)


class EntityDefinition(MirrorBaseModel):
    entity_id: str
    name: str
    type: str
    aliases: list[str] = Field(default_factory=list)


class RelationDefinition(MirrorBaseModel):
    relation_id: str
    source_entity_id: str
    relation_type: str
    target_entity_id: str
    match: MatchRule = Field(default_factory=MatchRule)


class EventDefinition(MirrorBaseModel):
    event_id: str
    name: str
    kind: str
    participant_entity_ids: list[str] = Field(default_factory=list)
    match: MatchRule = Field(default_factory=MatchRule)


class EvidenceReference(MirrorBaseModel):
    entity_ids: list[str] = Field(default_factory=list)
    relation_ids: list[str] = Field(default_factory=list)
    event_ids: list[str] = Field(default_factory=list)


class TextFieldDefinition(MirrorBaseModel):
    text: str
    evidence: EvidenceReference = Field(default_factory=EvidenceReference)


class RelationshipDefinition(MirrorBaseModel):
    target_id: str
    kind: str
    evidence: EvidenceReference = Field(default_factory=EvidenceReference)


class PersonaDefinition(MirrorBaseModel):
    persona_id: str
    entity_id: str
    public_role: TextFieldDefinition
    goals: list[TextFieldDefinition] = Field(default_factory=list)
    constraints: list[TextFieldDefinition] = Field(default_factory=list)
    known_facts: list[TextFieldDefinition] = Field(default_factory=list)
    private_info: list[TextFieldDefinition] = Field(default_factory=list)
    relationships: list[RelationshipDefinition] = Field(default_factory=list)


class WorldModelConfig(MirrorBaseModel):
    world_id: str
    entities: list[EntityDefinition] = Field(default_factory=list)
    relations: list[RelationDefinition] = Field(default_factory=list)
    events: list[EventDefinition] = Field(default_factory=list)
    personas: list[PersonaDefinition] = Field(default_factory=list)


def load_world_model(path: Path) -> WorldModelConfig:
    return WorldModelConfig.model_validate(load_yaml(path))
