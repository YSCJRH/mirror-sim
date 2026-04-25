from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

import yaml
from pydantic import Field

from backend.app.domain.models import MirrorBaseModel
from backend.app.graph.service import build_graph
from backend.app.ingest.service import ingest_manifest
from backend.app.personas.service import build_personas
from backend.app.utils import ensure_dir, slugify, write_json
from backend.app.worlds import state_artifacts_root, state_worlds_root


class WorldTemplateDocumentInput(MirrorBaseModel):
    title: str
    kind: str
    text: str


class WorldTemplateRoleInput(MirrorBaseModel):
    slot: Literal["records_lead", "field_operator", "observer", "decision_lead"]
    name: str
    public_role: str


class WorldTemplateOutcomeInput(MirrorBaseModel):
    field: Literal[
        "evidence_public_turn",
        "response_turn",
        "public_event_status",
        "response_triggered",
        "risk_known_by",
    ]
    label: str


class CreateWorldTemplateInput(MirrorBaseModel):
    world_name: str
    world_summary: str
    authorized_context: str
    authorization_confirmed: bool
    locale: Literal["en", "zh-CN"] | None = None
    documents: list[WorldTemplateDocumentInput] = Field(default_factory=list)
    roles: list[WorldTemplateRoleInput] = Field(default_factory=list)
    risk_asset_name: str
    evidence_document_name: str
    public_event_name: str
    response_location_name: str
    tracked_outcomes: list[WorldTemplateOutcomeInput] = Field(default_factory=list)


class CreatedWorldResult(MirrorBaseModel):
    world_id: str
    world_root: str
    artifacts_root: str
    product_path: str
    baseline_scenario_id: str


def _is_chinese(spec: CreateWorldTemplateInput) -> bool:
    return spec.locale == "zh-CN"


def _write_yaml(path: Path, payload: object) -> None:
    ensure_dir(path.parent)
    path.write_text(
        yaml.safe_dump(payload, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )


def _require_role(
    roles: list[WorldTemplateRoleInput],
    slot: Literal["records_lead", "field_operator", "observer", "decision_lead"],
) -> WorldTemplateRoleInput:
    role = next((item for item in roles if item.slot == slot), None)
    if role is None:
        raise ValueError(f"Missing required role slot `{slot}`.")
    return role


def _default_outcomes(spec: CreateWorldTemplateInput) -> list[WorldTemplateOutcomeInput]:
    if spec.tracked_outcomes:
        return spec.tracked_outcomes
    if _is_chinese(spec):
        return [
            WorldTemplateOutcomeInput(
                field="evidence_public_turn",
                label=f"{spec.evidence_document_name}公开回合",
            ),
            WorldTemplateOutcomeInput(
                field="response_turn",
                label=f"{spec.response_location_name}响应回合",
            ),
            WorldTemplateOutcomeInput(
                field="public_event_status",
                label=f"{spec.public_event_name}状态",
            ),
            WorldTemplateOutcomeInput(
                field="response_triggered",
                label="是否进入响应",
            ),
            WorldTemplateOutcomeInput(
                field="risk_known_by",
                label="风险认知传播",
            ),
        ]
    return [
        WorldTemplateOutcomeInput(
            field="evidence_public_turn",
            label=f"{spec.evidence_document_name} publication turn",
        ),
        WorldTemplateOutcomeInput(
            field="response_turn",
            label=f"{spec.response_location_name} response turn",
        ),
        WorldTemplateOutcomeInput(
            field="public_event_status",
            label=f"{spec.public_event_name} status",
        ),
        WorldTemplateOutcomeInput(
            field="response_triggered",
            label="Response trigger state",
        ),
        WorldTemplateOutcomeInput(
            field="risk_known_by",
            label="Risk knowledge spread",
        ),
    ]


def _role_entity_id(slot: str) -> str:
    return f"entity_{slot}"


def _role_persona_id(slot: str) -> str:
    return f"persona_{slot}"


def _seed_document_text(spec: CreateWorldTemplateInput) -> str:
    roles = {role.slot: role for role in spec.roles}
    if _is_chinese(spec):
        return "\n\n".join(
            [
                f"{roles['records_lead'].name}保管着{spec.evidence_document_name}，并决定何时把它以 copy / publish 的方式送入决策链。",
                f"{roles['field_operator'].name}负责检查{spec.risk_asset_name}，确认 risk / failure 是否已经上升。",
                f"{roles['observer'].name}观察{spec.response_location_name}周边情况，并送出第一轮 warning。",
                f"{roles['decision_lead'].name}决定{spec.public_event_name}是继续按 schedule 推进，还是切换到 response posture。",
                f"这个名为{spec.world_name}的受约束世界，已根据以下说明获准用于模拟：{spec.authorized_context}",
                f"基线问题是：{spec.evidence_document_name}能否在{spec.public_event_name}进入决策前及时公开，以及{spec.response_location_name}是否会因此触发 response / queue 变化。",
            ]
        )
    return "\n\n".join(
        [
            f"{roles['records_lead'].name} safeguards the {spec.evidence_document_name} and can publish it into the decision loop.",
            f"{roles['field_operator'].name} inspects the {spec.risk_asset_name} and confirms the operational risk.",
            f"{roles['observer'].name} observes the situation around {spec.response_location_name} and carries the first warning.",
            f"{roles['decision_lead'].name} decides whether {spec.public_event_name} stays on schedule or shifts into a response posture.",
            f"The bounded incident world called {spec.world_name} is authorized for simulation under this note: {spec.authorized_context}",
            f"The baseline question is whether {spec.evidence_document_name} becomes public before {spec.response_location_name} needs a response decision for {spec.public_event_name}.",
        ]
    )


def _baseline_title(spec: CreateWorldTemplateInput) -> str:
    if _is_chinese(spec):
        return f"{spec.world_name}基线"
    return f"Baseline {spec.world_name}"


def _evaluation_questions(spec: CreateWorldTemplateInput) -> list[str]:
    if _is_chinese(spec):
        return [
            f"{spec.evidence_document_name}会在第几回合进入决策链？",
            f"{spec.response_location_name}会在第几回合触发响应？",
            f"{spec.public_event_name}最终是否还能按计划进行？",
        ]
    return [
        f"When does {spec.evidence_document_name} surface into the decision loop?",
        f"When does the response around {spec.response_location_name} trigger?",
        f"Does {spec.public_event_name} stay on schedule?",
    ]


def create_bounded_incident_world(
    spec: CreateWorldTemplateInput,
    *,
    repo_root: Path | None = None,
) -> CreatedWorldResult:
    if not spec.authorization_confirmed:
        raise ValueError("authorization_confirmed must be true before publishing a world.")
    if len(spec.documents) == 0:
        raise ValueError("At least one authorized document is required.")

    root = repo_root or Path(__file__).resolve().parents[3]
    world_id = slugify(spec.world_name)
    if world_id == "fog_harbor_east_gate":
        raise ValueError("`fog-harbor-east-gate` is reserved for the canonical demo world.")

    world_root = state_worlds_root(root) / world_id
    artifacts_root = state_artifacts_root(root) / world_id
    if world_root.exists():
        raise ValueError(f"World `{world_id}` already exists under `{world_root}`.")

    roles = {
        "records_lead": _require_role(spec.roles, "records_lead"),
        "field_operator": _require_role(spec.roles, "field_operator"),
        "observer": _require_role(spec.roles, "observer"),
        "decision_lead": _require_role(spec.roles, "decision_lead"),
    }
    outcomes = _default_outcomes(spec)

    docs_dir = ensure_dir(world_root / "corpus" / "docs")
    manifest_docs: list[dict[str, object]] = []
    for index, document in enumerate(spec.documents, start=1):
        doc_slug = slugify(document.title)
        filename = f"{index:02d}_{doc_slug}.md"
        (docs_dir / filename).write_text(document.text.strip() + "\n", encoding="utf-8")
        manifest_docs.append(
            {
                "document_id": f"doc_user_{index:02d}",
                "title": document.title,
                "kind": document.kind,
                "path": f"docs/{filename}",
                "created_at": None,
                "metadata": {
                    "source": "user_upload",
                },
            }
        )

    seed_filename = "00_world_seed.md"
    (docs_dir / seed_filename).write_text(_seed_document_text(spec) + "\n", encoding="utf-8")
    manifest_docs.insert(
        0,
        {
            "document_id": "doc_world_seed",
            "title": f"{spec.world_name} seed note",
            "kind": "world_seed",
            "path": f"docs/{seed_filename}",
            "created_at": None,
            "metadata": {
                "source": "system_seed",
            },
        },
    )

    manifest = {
        "world_id": world_id,
        "title": spec.world_name,
        "docs": manifest_docs,
    }
    _write_yaml(world_root / "corpus" / "manifest.yaml", manifest)

    risk_asset_entity_id = "entity_risk_asset"
    evidence_document_entity_id = "entity_evidence_document"
    public_event_entity_id = "entity_public_event"
    response_location_entity_id = "entity_response_location"

    world_model = {
        "world_id": world_id,
        "entities": [
            {
                "entity_id": _role_entity_id("records_lead"),
                "name": roles["records_lead"].name,
                "type": "person",
                "aliases": [roles["records_lead"].name.lower(), "records lead"],
            },
            {
                "entity_id": _role_entity_id("field_operator"),
                "name": roles["field_operator"].name,
                "type": "person",
                "aliases": [roles["field_operator"].name.lower(), "field operator"],
            },
            {
                "entity_id": _role_entity_id("observer"),
                "name": roles["observer"].name,
                "type": "person",
                "aliases": [roles["observer"].name.lower(), "observer"],
            },
            {
                "entity_id": _role_entity_id("decision_lead"),
                "name": roles["decision_lead"].name,
                "type": "person",
                "aliases": [roles["decision_lead"].name.lower(), "decision lead"],
            },
            {
                "entity_id": risk_asset_entity_id,
                "name": spec.risk_asset_name,
                "type": "infrastructure",
                "aliases": [spec.risk_asset_name.lower(), "risk asset"],
            },
            {
                "entity_id": evidence_document_entity_id,
                "name": spec.evidence_document_name,
                "type": "document",
                "aliases": [spec.evidence_document_name.lower(), "evidence document"],
            },
            {
                "entity_id": public_event_entity_id,
                "name": spec.public_event_name,
                "type": "event",
                "aliases": [spec.public_event_name.lower(), "public event"],
            },
            {
                "entity_id": response_location_entity_id,
                "name": spec.response_location_name,
                "type": "location",
                "aliases": [spec.response_location_name.lower(), "response location"],
            },
        ],
        "relations": [
            {
                "relation_id": "relation_records_controls_document",
                "source_entity_id": _role_entity_id("records_lead"),
                "relation_type": "controls",
                "target_entity_id": evidence_document_entity_id,
                "match": {
                    "all": [roles["records_lead"].name.lower(), spec.evidence_document_name.lower()],
                    "any": ["publish", "copy", "evidence document"],
                },
            },
            {
                "relation_id": "relation_field_inspects_asset",
                "source_entity_id": _role_entity_id("field_operator"),
                "relation_type": "inspects",
                "target_entity_id": risk_asset_entity_id,
                "match": {
                    "all": [roles["field_operator"].name.lower(), spec.risk_asset_name.lower()],
                    "any": ["inspect", "risk", "failure"],
                },
            },
            {
                "relation_id": "relation_decision_protects_event",
                "source_entity_id": _role_entity_id("decision_lead"),
                "relation_type": "protects",
                "target_entity_id": public_event_entity_id,
                "match": {
                    "all": [roles["decision_lead"].name.lower(), spec.public_event_name.lower()],
                    "any": ["schedule", "protects", "public event"],
                },
            },
            {
                "relation_id": "relation_observer_tracks_response",
                "source_entity_id": _role_entity_id("observer"),
                "relation_type": "observes",
                "target_entity_id": response_location_entity_id,
                "match": {
                    "all": [roles["observer"].name.lower(), spec.response_location_name.lower()],
                    "any": ["warning", "response location", "queue"],
                },
            },
        ],
        "events": [
            {
                "event_id": "event_asset_risk",
                "name": f"{spec.risk_asset_name} risk escalates",
                "kind": "risk_escalation",
                "participant_entity_ids": [
                    _role_entity_id("field_operator"),
                    _role_entity_id("observer"),
                    risk_asset_entity_id,
                    response_location_entity_id,
                ],
                "match": {
                    "any": [spec.risk_asset_name.lower(), "risk", "failure", "warning"],
                },
            },
            {
                "event_id": "event_document_delay",
                "name": f"{spec.evidence_document_name} delay slows review",
                "kind": "document_delay",
                "participant_entity_ids": [
                    _role_entity_id("records_lead"),
                    evidence_document_entity_id,
                    response_location_entity_id,
                ],
                "match": {
                    "any": [spec.evidence_document_name.lower(), "delay", "copy", "publication"],
                },
            },
            {
                "event_id": "event_schedule_pressure",
                "name": f"{spec.public_event_name} schedule pressure",
                "kind": "schedule_pressure",
                "participant_entity_ids": [
                    _role_entity_id("decision_lead"),
                    public_event_entity_id,
                ],
                "match": {
                    "any": [spec.public_event_name.lower(), "schedule", "opening", "public event"],
                },
            },
            {
                "event_id": "event_response_bottleneck",
                "name": f"{spec.response_location_name} bottleneck raises a response decision",
                "kind": "queue_pressure",
                "participant_entity_ids": [
                    _role_entity_id("observer"),
                    _role_entity_id("decision_lead"),
                    response_location_entity_id,
                    public_event_entity_id,
                ],
                "match": {
                    "any": [spec.response_location_name.lower(), "response", "queue", "hold"],
                },
            },
        ],
        "personas": [
            {
                "persona_id": _role_persona_id("records_lead"),
                "entity_id": _role_entity_id("records_lead"),
                "public_role": {
                    "text": roles["records_lead"].public_role,
                    "evidence": {
                        "entity_ids": [_role_entity_id("records_lead"), evidence_document_entity_id],
                        "relation_ids": ["relation_records_controls_document"],
                    },
                },
                "goals": [
                    {
                        "text": f"Surface {spec.evidence_document_name} before the response decision hardens.",
                        "evidence": {
                            "event_ids": ["event_document_delay", "event_response_bottleneck"],
                        },
                    }
                ],
                "constraints": [
                    {
                        "text": "Needs another operator to amplify the documentary evidence.",
                        "evidence": {
                            "relation_ids": ["relation_records_controls_document"],
                            "event_ids": ["event_document_delay"],
                        },
                    }
                ],
                "known_facts": [
                    {
                        "text": f"The document trail matters for what happens around {spec.response_location_name}.",
                        "evidence": {
                            "event_ids": ["event_document_delay", "event_response_bottleneck"],
                        },
                    }
                ],
                "private_info": [
                    {
                        "text": f"{roles['records_lead'].name} keeps a durable copy ready for a trusted handoff.",
                        "evidence": {
                            "relation_ids": ["relation_records_controls_document"],
                        },
                    }
                ],
                "relationships": [
                    {
                        "target_id": _role_persona_id("decision_lead"),
                        "kind": "needs_to_convince",
                        "evidence": {
                            "event_ids": ["event_schedule_pressure"],
                        },
                    }
                ],
            },
            {
                "persona_id": _role_persona_id("field_operator"),
                "entity_id": _role_entity_id("field_operator"),
                "public_role": {
                    "text": roles["field_operator"].public_role,
                    "evidence": {
                        "entity_ids": [_role_entity_id("field_operator"), risk_asset_entity_id],
                        "relation_ids": ["relation_field_inspects_asset"],
                    },
                },
                "goals": [
                    {
                        "text": f"Keep the risk around {spec.risk_asset_name} explicit before the public event starts.",
                        "evidence": {"event_ids": ["event_asset_risk", "event_schedule_pressure"]},
                    }
                ],
                "constraints": [
                    {
                        "text": "Needs the documentary trail to align before the response becomes unavoidable.",
                        "evidence": {"event_ids": ["event_document_delay", "event_asset_risk"]},
                    }
                ],
                "known_facts": [
                    {
                        "text": f"The operational condition of {spec.risk_asset_name} shapes the response window.",
                        "evidence": {"event_ids": ["event_asset_risk"]},
                    }
                ],
                "private_info": [],
                "relationships": [
                    {
                        "target_id": _role_persona_id("observer"),
                        "kind": "coordinates_with",
                        "evidence": {"event_ids": ["event_response_bottleneck"]},
                    }
                ],
            },
            {
                "persona_id": _role_persona_id("observer"),
                "entity_id": _role_entity_id("observer"),
                "public_role": {
                    "text": roles["observer"].public_role,
                    "evidence": {
                        "entity_ids": [_role_entity_id("observer"), response_location_entity_id],
                        "relation_ids": ["relation_observer_tracks_response"],
                    },
                },
                "goals": [
                    {
                        "text": f"Send the first credible warning before pressure builds at {spec.response_location_name}.",
                        "evidence": {"event_ids": ["event_response_bottleneck", "event_asset_risk"]},
                    }
                ],
                "constraints": [
                    {
                        "text": "A communication break can delay the escalation path.",
                        "evidence": {"event_ids": ["event_response_bottleneck"]},
                    }
                ],
                "known_facts": [
                    {
                        "text": f"A response shift around {spec.response_location_name} will be visible immediately.",
                        "evidence": {"event_ids": ["event_response_bottleneck"]},
                    }
                ],
                "private_info": [],
                "relationships": [
                    {
                        "target_id": _role_persona_id("decision_lead"),
                        "kind": "warns",
                        "evidence": {"event_ids": ["event_response_bottleneck"]},
                    }
                ],
            },
            {
                "persona_id": _role_persona_id("decision_lead"),
                "entity_id": _role_entity_id("decision_lead"),
                "public_role": {
                    "text": roles["decision_lead"].public_role,
                    "evidence": {
                        "entity_ids": [_role_entity_id("decision_lead"), public_event_entity_id],
                        "relation_ids": ["relation_decision_protects_event"],
                    },
                },
                "goals": [
                    {
                        "text": f"Keep {spec.public_event_name} credible without ignoring avoidable operational risk.",
                        "evidence": {"event_ids": ["event_schedule_pressure", "event_response_bottleneck"]},
                    }
                ],
                "constraints": [
                    {
                        "text": "Will delay the public event only when warning signals and documentary evidence align.",
                        "evidence": {"event_ids": ["event_document_delay", "event_asset_risk"]},
                    }
                ],
                "known_facts": [
                    {
                        "text": f"{spec.public_event_name} is under schedule pressure.",
                        "evidence": {"event_ids": ["event_schedule_pressure"]},
                    }
                ],
                "private_info": [],
                "relationships": [
                    {
                        "target_id": _role_persona_id("records_lead"),
                        "kind": "awaits_evidence_from",
                        "evidence": {"event_ids": ["event_document_delay"]},
                    }
                ],
            },
        ],
    }
    _write_yaml(world_root / "config" / "world_model.yaml", world_model)

    tracked_outcomes_payload = []
    for outcome in outcomes:
        action_types = {
            "evidence_public_turn": ["publish"],
            "response_turn": ["move"],
            "public_event_status": ["hide", "move"],
            "response_triggered": ["move"],
            "risk_known_by": ["inspect", "inform"],
        }[outcome.field]
        tracked_outcomes_payload.append(
            {
                "field": outcome.field,
                "label": outcome.label,
                "action_types": action_types,
            }
        )

    simulation_rules = {
        "world_id": world_id,
        "compare_id": f"scenario_{world_id}_template_matrix",
        "default_report_scenario": "baseline",
        "communications_down_field": "communications_down_until",
        "blocked_contacts_field": "blocked_contacts",
        "turn_sequence": [
            _role_persona_id("field_operator"),
            _role_persona_id("observer"),
            _role_persona_id("records_lead"),
            _role_persona_id("decision_lead"),
            _role_persona_id("observer"),
            _role_persona_id("records_lead"),
            _role_persona_id("decision_lead"),
            _role_persona_id("observer"),
        ],
        "initial_state": {
            "public_event_status": "scheduled",
            "evidence_public": False,
            "evidence_public_turn": None,
            "response_requested": False,
            "response_triggered": False,
            "response_turn": None,
            "evidence_available_turn": 3,
            "risk_known_by": [],
            "communications_status": "stable",
            "communications_down_until": 0,
            "blocked_contacts": [],
        },
        "tracked_outcomes": tracked_outcomes_payload,
        "injection_rules": [
            {
                "kind": "delay_document",
                "operation": "add_int",
                "field": "evidence_available_turn",
                "param": "delay_turns",
                "note_template": "{injection_id}: evidence availability delayed by {delay_turns} turn(s).",
            },
            {
                "kind": "resource_failure",
                "operation": "max_int",
                "field": "communications_down_until",
                "param": "duration_turns",
                "note_template": "{injection_id}: communications degraded for {duration_turns} turn(s).",
            },
            {
                "kind": "block_contact",
                "operation": "append_contact",
                "field": "blocked_contacts",
                "note_template": "{injection_id}: contact blocked between {actor_id} and {target_id}.",
            },
        ],
        "steps": [
            {
                "turn_index": 1,
                "choices": [
                    {
                        "action": {
                            "action_type": "inspect",
                            "target_id": risk_asset_entity_id,
                            "rationale": f"{roles['field_operator'].name} inspects {spec.risk_asset_name} before conditions worsen.",
                            "updates": [{"kind": "union_actor_entity", "field": "risk_known_by"}],
                        }
                    }
                ],
            },
            {
                "turn_index": 2,
                "choices": [
                    {
                        "when": [{"kind": "communication_available", "target_id": _role_persona_id("decision_lead")}],
                        "action": {
                            "action_type": "inform",
                            "target_id": _role_persona_id("decision_lead"),
                            "rationale": f"{roles['observer'].name} escalates the first warning toward {roles['decision_lead'].name}.",
                            "updates": [{"kind": "union_actor_entity", "field": "risk_known_by"}],
                        },
                    },
                    {
                        "action": {
                            "action_type": "delay",
                            "target_id": _role_persona_id("decision_lead"),
                            "rationale": "The warning is delayed by a communication problem.",
                            "updates": [{"kind": "set", "field": "communications_status", "value": "degraded"}],
                        }
                    },
                ],
            },
            {
                "turn_index": 3,
                "choices": [
                    {
                        "when": [{"kind": "turn_gte_state", "field": "evidence_available_turn"}],
                        "action": {
                            "action_type": "publish",
                            "target_id": evidence_document_entity_id,
                            "rationale": f"{roles['records_lead'].name} publishes {spec.evidence_document_name} into the decision loop.",
                            "updates": [
                                {"kind": "set", "field": "evidence_public", "value": True},
                                {"kind": "set_current_turn", "field": "evidence_public_turn"},
                            ],
                        },
                    },
                    {
                        "action": {
                            "action_type": "delay",
                            "target_id": evidence_document_entity_id,
                            "rationale": f"{roles['records_lead'].name} cannot surface {spec.evidence_document_name} yet.",
                        }
                    },
                ],
            },
            {
                "turn_index": 4,
                "choices": [
                    {
                        "when": [{"kind": "state_truthy", "field": "evidence_public"}],
                        "action": {
                            "action_type": "request",
                            "target_id": response_location_entity_id,
                            "rationale": f"{roles['decision_lead'].name} requests a response once warning and evidence align.",
                            "updates": [{"kind": "set", "field": "response_requested", "value": True}],
                        },
                    },
                    {
                        "action": {
                            "action_type": "request",
                            "target_id": evidence_document_entity_id,
                            "rationale": f"{roles['decision_lead'].name} asks for the missing evidence before changing course.",
                        }
                    },
                ],
            },
            {
                "turn_index": 5,
                "choices": [
                    {
                        "when": [{"kind": "state_truthy", "field": "response_requested"}],
                        "action": {
                            "action_type": "move",
                            "target_id": response_location_entity_id,
                            "rationale": f"{roles['observer'].name} shifts the response posture at {spec.response_location_name}.",
                            "updates": [
                                {"kind": "set", "field": "response_triggered", "value": True},
                                {"kind": "set_current_turn", "field": "response_turn"},
                                {"kind": "set", "field": "public_event_status", "value": "paused"},
                            ],
                        },
                    },
                    {
                        "action": {
                            "action_type": "hide",
                            "target_id": public_event_entity_id,
                            "rationale": f"{roles['observer'].name} keeps {spec.public_event_name} on schedule while evidence stays incomplete.",
                            "updates": [{"kind": "set", "field": "public_event_status", "value": "scheduled"}],
                        }
                    },
                ],
            },
            {
                "turn_index": 6,
                "choices": [
                    {
                        "when": [
                            {"kind": "state_falsy", "field": "evidence_public"},
                            {"kind": "turn_gte_state", "field": "evidence_available_turn"},
                        ],
                        "action": {
                            "action_type": "publish",
                            "target_id": evidence_document_entity_id,
                            "rationale": f"{roles['records_lead'].name} surfaces the evidence after the delay clears.",
                            "updates": [
                                {"kind": "set", "field": "evidence_public", "value": True},
                                {"kind": "set_current_turn", "field": "evidence_public_turn"},
                            ],
                        },
                    },
                    {
                        "action": {
                            "action_type": "inform",
                            "target_id": _role_persona_id("decision_lead"),
                            "rationale": f"{roles['records_lead'].name} keeps the evidence circulating among trusted allies.",
                        }
                    },
                ],
            },
            {
                "turn_index": 7,
                "choices": [
                    {
                        "when": [
                            {"kind": "state_truthy", "field": "evidence_public"},
                            {"kind": "state_falsy", "field": "response_requested"},
                        ],
                        "action": {
                            "action_type": "request",
                            "target_id": response_location_entity_id,
                            "rationale": f"{roles['decision_lead'].name} renews the response request once the evidence becomes public.",
                            "updates": [{"kind": "set", "field": "response_requested", "value": True}],
                        },
                    },
                    {
                        "action": {
                            "action_type": "inspect",
                            "target_id": risk_asset_entity_id,
                            "rationale": f"{roles['decision_lead'].name} keeps checking {spec.risk_asset_name} while the public event remains in motion.",
                        }
                    },
                ],
            },
            {
                "turn_index": 8,
                "choices": [
                    {
                        "when": [
                            {"kind": "state_truthy", "field": "response_requested"},
                            {"kind": "state_falsy", "field": "response_triggered"},
                        ],
                        "action": {
                            "action_type": "move",
                            "target_id": response_location_entity_id,
                            "rationale": f"{roles['observer'].name} triggers the response at the last safe moment.",
                            "updates": [
                                {"kind": "set", "field": "response_triggered", "value": True},
                                {"kind": "set_current_turn", "field": "response_turn"},
                                {"kind": "set", "field": "public_event_status", "value": "paused"},
                            ],
                        },
                    },
                    {
                        "action": {
                            "action_type": "hide",
                            "target_id": public_event_entity_id,
                            "rationale": f"{roles['observer'].name} preserves the scheduled path after the risk window closes.",
                            "updates": [{"kind": "set", "field": "public_event_status", "value": "scheduled"}],
                        }
                    },
                ],
            },
        ],
    }
    _write_yaml(world_root / "config" / "simulation_rules.yaml", simulation_rules)

    decision_schema = {
        "world_id": world_id,
        "schema_version": "2026-04-22",
        "allowed_action_types": ["inspect", "inform", "delay", "publish", "request", "hide", "move"],
        "timing_tokens": ["early_failure_window", "first_warning_attempt", "before_publication"],
        "perturbations": [
            {
                "kind": "delay_document",
                "target_sources": ["document"],
                "actor_sources": ["persona", "entity"],
                "timing_tokens": ["before_publication"],
                "required_parameters": {"delay_turns": "int"},
                "optional_parameters": {"cause": "str"},
            },
            {
                "kind": "block_contact",
                "target_sources": ["persona"],
                "actor_sources": ["persona"],
                "timing_tokens": ["first_warning_attempt"],
                "required_parameters": {},
                "optional_parameters": {"cause": "str"},
            },
            {
                "kind": "resource_failure",
                "target_sources": ["entity"],
                "actor_sources": ["persona", "entity"],
                "timing_tokens": ["early_failure_window"],
                "required_parameters": {"duration_turns": "int"},
                "optional_parameters": {"cause": "str"},
            },
        ],
        "decision_kernel": {
            "prompt_version": "rule-bounded-v1",
            "max_attempts": 2,
            "fallback_strategy": "first_legal_choice",
            "model_env_var": "MIRROR_DECISION_MODEL",
        },
    }
    _write_yaml(world_root / "config" / "decision_schema.yaml", decision_schema)

    baseline_scenario_id = f"scenario_{world_id}_baseline"
    baseline_scenario = {
        "scenario_id": baseline_scenario_id,
        "world_id": world_id,
        "title": _baseline_title(spec),
        "description": spec.world_summary,
        "seed": 7,
        "turn_budget": 8,
        "branch_count": 1,
        "evaluation_questions": _evaluation_questions(spec),
        "injections": [],
    }
    _write_yaml(world_root / "scenarios" / "baseline.yaml", baseline_scenario)

    product_payload = {
        "world_id": world_id,
        "world_name": spec.world_name,
        "world_summary": spec.world_summary,
        "baseline_scenario_id": baseline_scenario_id,
        "baseline_title": baseline_scenario["title"],
        "baseline_description": spec.world_summary,
        "decision_defaults": {
            "provider": "openai_compatible",
            "model": "",
        },
        "outcome_labels": {
            outcome.field: outcome.label for outcome in outcomes
        },
        "perturbation_options": [
            {
                "key": "delay_document",
                "title": f"延迟{spec.evidence_document_name}" if _is_chinese(spec) else f"Delay {spec.evidence_document_name}",
                "description": (
                    f"让{spec.evidence_document_name}第一次进入公开决策链的时间往后拖。"
                    if _is_chinese(spec)
                    else f"Delay the first public appearance of {spec.evidence_document_name}."
                ),
                "kind": "文档延迟" if _is_chinese(spec) else "Document delay",
                "target": spec.evidence_document_name,
                "timing": "公开之前" if _is_chinese(spec) else "Before publication",
                "summary": (
                    f"让{spec.evidence_document_name}晚一点进入决策链。"
                    if _is_chinese(spec)
                    else f"Delay {spec.evidence_document_name} before it reaches the decision loop."
                ),
                "runtime": {
                    "kind": "delay_document",
                    "targetId": "doc_user_01",
                    "actorId": _role_entity_id("records_lead"),
                    "timing": "before_publication",
                    "parameters": {
                        "delay_turns": 2,
                        "cause": "routing_delay",
                    },
                },
            },
            {
                "key": "block_contact",
                "title": (
                    f"阻断通往{roles['decision_lead'].name}的第一条预警"
                    if _is_chinese(spec)
                    else f"Block first warning to {roles['decision_lead'].name}"
                ),
                "description": (
                    "阻断第一条直接升级路径。"
                    if _is_chinese(spec)
                    else "Block the first direct escalation path."
                ),
                "kind": "联系阻断" if _is_chinese(spec) else "Contact block",
                "target": roles["decision_lead"].name,
                "timing": "第一次预警尝试" if _is_chinese(spec) else "First warning attempt",
                "summary": (
                    f"阻断通往{roles['decision_lead'].name}的第一条预警路径。"
                    if _is_chinese(spec)
                    else f"Block the first warning path toward {roles['decision_lead'].name}."
                ),
                "runtime": {
                    "kind": "block_contact",
                    "targetId": _role_persona_id("decision_lead"),
                    "actorId": _role_persona_id("observer"),
                    "timing": "first_warning_attempt",
                    "parameters": {
                        "cause": "signal_scramble",
                    },
                },
            },
            {
                "key": "resource_failure",
                "title": (
                    f"削弱{spec.risk_asset_name}周边响应"
                    if _is_chinese(spec)
                    else f"Degrade response around {spec.risk_asset_name}"
                ),
                "description": (
                    "在第一次预警窗口制造一次短暂的通信/资源故障。"
                    if _is_chinese(spec)
                    else "Create a temporary communication/resource failure during the first warning window."
                ),
                "kind": "资源故障" if _is_chinese(spec) else "Resource failure",
                "target": spec.risk_asset_name,
                "timing": "早期故障窗口" if _is_chinese(spec) else "Early failure window",
                "summary": (
                    f"让{spec.risk_asset_name}周边的第一响应窗口变得更脆弱。"
                    if _is_chinese(spec)
                    else f"Degrade the first response window around {spec.risk_asset_name}."
                ),
                "runtime": {
                    "kind": "resource_failure",
                    "targetId": risk_asset_entity_id,
                    "actorId": _role_persona_id("observer"),
                    "timing": "early_failure_window",
                    "parameters": {
                        "duration_turns": 2,
                        "cause": "relay_failure",
                    },
                },
            },
        ],
    }
    write_json(world_root / "config" / "product.json", product_payload)

    ingest_dir = ensure_dir(artifacts_root / "ingest")
    graph_dir = ensure_dir(artifacts_root / "graph")
    personas_dir = ensure_dir(artifacts_root / "personas")
    ingest_manifest(world_root / "corpus" / "manifest.yaml", ingest_dir)
    build_graph(
        ingest_dir / "chunks.jsonl",
        graph_dir,
        world_model_path=world_root / "config" / "world_model.yaml",
    )
    build_personas(
        graph_dir / "graph.json",
        personas_dir,
        world_model_path=world_root / "config" / "world_model.yaml",
    )

    return CreatedWorldResult(
        world_id=world_id,
        world_root=str(world_root),
        artifacts_root=str(artifacts_root),
        product_path=str((world_root / "config" / "product.json")),
        baseline_scenario_id=baseline_scenario_id,
    )
