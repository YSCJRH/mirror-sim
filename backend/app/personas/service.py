from __future__ import annotations

from pathlib import Path

from backend.app.domain.models import Persona
from backend.app.utils import read_json, write_json


PERSONA_BLUEPRINTS = [
    {
        "persona_id": "persona_lin_lan",
        "entity_id": "entity_lin_lan",
        "public_role": "Archive clerk guarding the maintenance record trail.",
        "goals": ["Surface the diverted maintenance funds before the storm hits.", "Keep a durable copy of the ledger available to trusted messengers."],
        "constraints": ["Has little executive authority.", "Needs others to amplify the archive evidence."],
        "known_facts": ["The copied ledger links festival spending to missing repair money.", "Su He's latest inspection references the same delayed work order."],
        "private_info": ["Lin Lan made a private copy of the ledger before the archive room closed."],
        "relationships": [{"target_id": "persona_su_he", "kind": "coordinates_with"}, {"target_id": "persona_zhao_ke", "kind": "distrusts"}],
    },
    {
        "persona_id": "persona_su_he",
        "entity_id": "entity_su_he",
        "public_role": "Waterworks engineer responsible for the East Gate inspection.",
        "goals": ["Get the gate reinforced before the surge window closes.", "Escalate evacuation if evidence confirms leadership is delaying repairs."],
        "constraints": ["Cannot repair the gate alone.", "Needs records or public pressure to override festival priorities."],
        "known_facts": ["The East Gate brace is already widening under pressure.", "Festival traffic would slow emergency repairs."],
        "private_info": ["Su He believes the next surge could trigger a compound failure if leadership waits."],
        "relationships": [{"target_id": "persona_lin_lan", "kind": "depends_on"}, {"target_id": "persona_chen_yu", "kind": "trusts"}],
    },
    {
        "persona_id": "persona_chen_yu",
        "entity_id": "entity_chen_yu",
        "public_role": "Tugboat captain tracking tide behavior in the eastern channel.",
        "goals": ["Warn the harbor before carts and festival barges block evacuation lanes.", "Push officials to respect tide observations from the quay."],
        "constraints": ["Has operational knowledge but no policy authority.", "Depends on dispatch routes to move warnings quickly."],
        "known_facts": ["The gate seam is already throwing spray under strain.", "A late evacuation order will trap equipment on the quay road."],
        "private_info": ["Chen Yu trusts Su He's risk assessment more than the mayor's office messaging."],
        "relationships": [{"target_id": "persona_su_he", "kind": "trusts"}, {"target_id": "persona_zhao_ke", "kind": "pressures"}],
    },
    {
        "persona_id": "persona_zhao_ke",
        "entity_id": "entity_zhao_ke",
        "public_role": "Deputy mayor trying to preserve the Sea Lantern Festival schedule.",
        "goals": ["Avoid a public cancellation before the opening ceremony.", "Keep control of the narrative around the gate delay."],
        "constraints": ["Needs some factual basis before ordering a visible evacuation.", "Faces public backlash if the budget diversion becomes undeniable."],
        "known_facts": ["Festival spending already consumed money earmarked for gate repairs.", "Visible documentary proof could force an emergency reversal."],
        "private_info": ["Zhao Ke worries more about public embarrassment than engineering nuance until pressure becomes undeniable."],
        "relationships": [{"target_id": "persona_lin_lan", "kind": "fears_disclosure_from"}, {"target_id": "persona_su_he", "kind": "deflects"}],
    },
]


def build_personas(graph_path: Path, out_dir: Path) -> list[Persona]:
    graph_payload = read_json(graph_path)
    entity_index = {entity["entity_id"]: entity for entity in graph_payload["entities"]}
    relations = graph_payload["relations"]
    personas: list[Persona] = []

    for blueprint in PERSONA_BLUEPRINTS:
        evidence_ids = set(entity_index[blueprint["entity_id"]]["evidence_ids"])
        for relation in relations:
            if relation["source_entity_id"] == blueprint["entity_id"] or relation["target_entity_id"] == blueprint["entity_id"]:
                evidence_ids.update(relation["evidence_ids"])
        personas.append(
            Persona(
                persona_id=blueprint["persona_id"],
                entity_id=blueprint["entity_id"],
                public_role=blueprint["public_role"],
                goals=blueprint["goals"],
                constraints=blueprint["constraints"],
                known_facts=blueprint["known_facts"],
                private_info=blueprint["private_info"],
                relationships=blueprint["relationships"],
                evidence_ids=sorted(evidence_ids),
            )
        )

    write_json(out_dir / "personas.json", {"personas": [persona.model_dump() for persona in personas]})
    return personas
