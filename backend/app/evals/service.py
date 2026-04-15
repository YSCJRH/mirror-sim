from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.app.config import Settings, get_settings
from backend.app.domain.models import EvalResult
from backend.app.graph.service import build_graph
from backend.app.ingest.service import ingest_manifest
from backend.app.personas.service import build_personas
from backend.app.reports.service import generate_report
from backend.app.scenarios.service import validate_scenario
from backend.app.simulation.service import simulate_scenario
from backend.app.utils import load_yaml, read_json, write_json
from backend.app.world_query import inspect_world


def _compare(op: str, left: Any, right: Any) -> bool:
    if op == "gt":
        return left > right
    if op == "lt":
        return left < right
    if op == "eq":
        return left == right
    raise ValueError(f"Unsupported comparison op: {op}")


def _scan_terms(text: str, terms: list[str]) -> list[str]:
    lowered = text.lower()
    return [term for term in terms if term.lower() in lowered]


def _graph_collection_id_field(collection: str) -> str:
    if collection == "entities":
        return "entity_id"
    if collection == "relations":
        return "relation_id"
    if collection == "events":
        return "event_id"
    raise ValueError(f"Unsupported graph collection: {collection}")


def _redline_texts(artifacts_root: Path) -> dict[str, str]:
    graph_path = artifacts_root / "graph" / "graph.json"
    personas_path = artifacts_root / "personas" / "personas.json"
    return {
        "report": (artifacts_root / "report" / "report.md").read_text(encoding="utf-8"),
        "claims": json.dumps(read_json(artifacts_root / "report" / "claims.json"), ensure_ascii=False),
        "baseline_scenario": json.dumps(read_json(artifacts_root / "scenario" / "baseline.json"), ensure_ascii=False),
        "intervention_scenario": json.dumps(
            read_json(artifacts_root / "scenario" / "reporter_detained.json"),
            ensure_ascii=False,
        ),
        "query_entity_east_gate": json.dumps(
            inspect_world("entity", "entity_east_gate", graph_path, personas_path),
            ensure_ascii=False,
        ),
        "query_persona_su_he": json.dumps(
            inspect_world("persona", "persona_su_he", graph_path, personas_path),
            ensure_ascii=False,
        ),
        "query_event_gate_failure_risk": json.dumps(
            inspect_world("event", "event_gate_failure_risk", graph_path, personas_path),
            ensure_ascii=False,
        ),
    }


def _evaluate_redlines(redlines_path: Path, artifacts_root: Path) -> list[str]:
    rules = load_yaml(redlines_path)
    texts = _redline_texts(artifacts_root)
    failures: list[str] = []
    for label, text in texts.items():
        topic_hits = _scan_terms(text, rules["blocked_topics"])
        if topic_hits:
            failures.append(f"redlines[{label}]: blocked topics {topic_hits}")
        phrase_hits = _scan_terms(text, rules["blocked_phrases"])
        if phrase_hits:
            failures.append(f"redlines[{label}]: blocked phrases {phrase_hits}")
    return failures


def evaluate_runs(expectations_path: Path, artifacts_root: Path, out_dir: Path, redlines_path: Path) -> EvalResult:
    expectations = load_yaml(expectations_path)
    baseline_summary = read_json(artifacts_root / "run" / "baseline" / "summary.json")
    intervention_summary = read_json(artifacts_root / "run" / "reporter_detained" / "summary.json")
    graph_payload = read_json(artifacts_root / "graph" / "graph.json")
    persona_payload = read_json(artifacts_root / "personas" / "personas.json")
    claims = read_json(artifacts_root / "report" / "claims.json")
    runs = {
        "baseline": {**baseline_summary, **baseline_summary["final_state"]},
        "reporter_detained": {**intervention_summary, **intervention_summary["final_state"]},
    }

    failures: list[str] = []
    passed = 0
    for check in expectations["checks"]:
        kind = check["kind"]
        if kind == "run_field":
            observed = runs[check["run"]][check["field"]]
            if observed != check["equals"]:
                failures.append(f"{check['name']}: expected {check['field']} == {check['equals']}, got {observed}")
            else:
                passed += 1
        elif kind == "compare_runs":
            left = runs[check["left_run"]][check["left_field"]]
            right = runs[check["right_run"]][check["right_field"]]
            if not _compare(check["op"], left, right):
                failures.append(f"{check['name']}: expected {left} {check['op']} {right}")
            else:
                passed += 1
        elif kind == "claim_labels_complete":
            if not all(claim.get("label") for claim in claims):
                failures.append(f"{check['name']}: at least one claim is missing a label")
            else:
                passed += 1
        elif kind == "claim_evidence_complete":
            if not all(claim.get("evidence_ids") for claim in claims):
                failures.append(f"{check['name']}: at least one claim is missing evidence_ids")
            else:
                passed += 1
        elif kind == "graph_events_nonempty":
            if not graph_payload.get("events"):
                failures.append(f"{check['name']}: graph.json did not contain any events")
            else:
                passed += 1
        elif kind == "world_evidence_complete":
            collections = ("entities", "relations", "events")
            if not all(item.get("evidence_ids") for collection in collections for item in graph_payload[collection]):
                failures.append(f"{check['name']}: at least one world object is missing evidence_ids")
            else:
                passed += 1
        elif kind == "world_object_ids_present":
            collection = check["collection"]
            id_field = _graph_collection_id_field(collection)
            observed_ids = {item[id_field] for item in graph_payload[collection]}
            missing = [object_id for object_id in check["ids"] if object_id not in observed_ids]
            if missing:
                failures.append(f"{check['name']}: missing {collection} ids {missing}")
            else:
                passed += 1
        elif kind == "persona_field_provenance_complete":
            required_fields = check["fields"]
            missing: list[str] = []
            for persona in persona_payload["personas"]:
                field_provenance = persona.get("field_provenance", {})
                for field_name in required_fields:
                    if persona.get(field_name) and not field_provenance.get(field_name):
                        missing.append(f"{persona['persona_id']}.{field_name}")
            if missing:
                failures.append(f"{check['name']}: missing provenance for {missing}")
            else:
                passed += 1
        elif kind == "inspect_world":
            try:
                payload = inspect_world(
                    check["object_kind"],
                    check["object_id"],
                    artifacts_root / "graph" / "graph.json",
                    artifacts_root / "personas" / "personas.json",
                )
            except ValueError as exc:
                failures.append(f"{check['name']}: {exc}")
            else:
                if not payload["object"].get("evidence_ids"):
                    failures.append(f"{check['name']}: inspected object is missing evidence_ids")
                else:
                    passed += 1
        else:
            failures.append(f"{check['name']}: unsupported check kind {kind}")

    redline_failures = _evaluate_redlines(redlines_path, artifacts_root)
    if not redline_failures:
        passed += 1
    failures.extend(redline_failures)

    result = EvalResult(
        eval_name=expectations["eval_name"],
        status="pass" if not failures else "fail",
        metrics={
            "checks_total": len(expectations["checks"]) + 1,
            "checks_passed": passed,
            "baseline_evacuation_turn": baseline_summary["evacuation_turn"],
            "intervention_evacuation_turn": intervention_summary["evacuation_turn"],
            "event_count": graph_payload["stats"]["event_count"],
        },
        failures=failures,
        notes=["Phase 1 eval covers deterministic demo behavior, world-model provenance, and redline checks."],
    )
    write_json(out_dir / "summary.json", result.model_dump())
    return result


def run_phase0_demo(settings: Settings | None = None, artifacts_root: Path | None = None) -> EvalResult:
    settings = settings or get_settings()
    artifacts_root = artifacts_root or settings.artifacts_root

    ingest_manifest(settings.manifest_path, artifacts_root / "ingest")
    build_graph(artifacts_root / "ingest" / "chunks.jsonl", artifacts_root / "graph", settings.world_model_path)
    build_personas(artifacts_root / "graph" / "graph.json", artifacts_root / "personas", settings.world_model_path)
    validate_scenario(settings.baseline_scenario_path, artifacts_root / "scenario" / "baseline.json")
    validate_scenario(settings.intervention_scenario_path, artifacts_root / "scenario" / "reporter_detained.json")
    simulate_scenario(
        settings.baseline_scenario_path,
        artifacts_root / "graph" / "graph.json",
        artifacts_root / "personas" / "personas.json",
        artifacts_root / "run" / "baseline",
    )
    simulate_scenario(
        settings.intervention_scenario_path,
        artifacts_root / "graph" / "graph.json",
        artifacts_root / "personas" / "personas.json",
        artifacts_root / "run" / "reporter_detained",
    )
    generate_report(
        artifacts_root / "run" / "reporter_detained",
        artifacts_root / "report",
        baseline_dir=artifacts_root / "run" / "baseline",
    )
    return evaluate_runs(settings.expectations_path, artifacts_root, artifacts_root / "eval", settings.redlines_path)
