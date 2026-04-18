from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from backend.app.config import Settings, get_settings
from backend.app.domain.models import EvalResult
from backend.app.graph.service import build_graph
from backend.app.ingest.service import ingest_manifest
from backend.app.personas.service import build_personas
from backend.app.reports.service import generate_report
from backend.app.scenarios.service import validate_scenario
from backend.app.simulation.service import (
    BranchRunArtifacts,
    load_run_artifacts,
    simulate_branching_scenario,
    simulate_scenario,
    write_compare_artifact,
)
from backend.app.utils import load_yaml, read_json, write_json
from backend.app.world_query import inspect_world

DEMO_MATRIX_COMPARE_SCENARIO_ID = "scenario_fog_harbor_phase44_matrix"


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
    texts = {
        "report": (artifacts_root / "report" / "report.md").read_text(encoding="utf-8"),
        "claims": json.dumps(read_json(artifacts_root / "report" / "claims.json"), ensure_ascii=False),
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
    for scenario_path in sorted((artifacts_root / "scenario").glob("*.json")):
        texts[f"scenario_{scenario_path.stem}"] = json.dumps(read_json(scenario_path), ensure_ascii=False)
    return texts


def _load_run_payloads(artifacts_root: Path) -> dict[str, dict[str, Any]]:
    run_payloads: dict[str, dict[str, Any]] = {}
    for run_dir in sorted((artifacts_root / "run").iterdir()):
        summary_path = run_dir / "summary.json"
        if run_dir.is_dir() and summary_path.exists():
            run_payloads[run_dir.name] = read_json(summary_path)
    return run_payloads


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
    summary_payloads = _load_run_payloads(artifacts_root)
    baseline_summary = summary_payloads["baseline"]
    graph_payload = read_json(artifacts_root / "graph" / "graph.json")
    persona_payload = read_json(artifacts_root / "personas" / "personas.json")
    claims = read_json(artifacts_root / "report" / "claims.json")
    runs = {name: {**summary, **summary["final_state"]} for name, summary in summary_payloads.items()}

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
            "scenario_count": len(runs),
            "event_count": graph_payload["stats"]["event_count"],
            **{
                f"{name}_evacuation_turn": summary["evacuation_turn"]
                for name, summary in summary_payloads.items()
            },
            **{
                f"{name}_ledger_public_turn": summary["ledger_public_turn"]
                for name, summary in summary_payloads.items()
            },
        },
        failures=failures,
        notes=["Phase 1 eval covers deterministic demo behavior, world-model provenance, and redline checks."],
    )
    write_json(out_dir / "summary.json", result.model_dump())
    return result


def run_phase0_demo(settings: Settings | None = None, artifacts_root: Path | None = None) -> EvalResult:
    settings = settings or get_settings()
    artifacts_root = artifacts_root or settings.artifacts_root
    scenario_paths = [settings.baseline_scenario_path] + sorted(
        path for path in settings.scenario_dir.glob("*.yaml") if path != settings.baseline_scenario_path
    )

    ingest_manifest(settings.manifest_path, artifacts_root / "ingest")
    build_graph(artifacts_root / "ingest" / "chunks.jsonl", artifacts_root / "graph", settings.world_model_path)
    build_personas(artifacts_root / "graph" / "graph.json", artifacts_root / "personas", settings.world_model_path)
    scenario_out_dir = artifacts_root / "scenario"
    run_root = artifacts_root / "run"
    compare_root = artifacts_root / "compare"
    scenario_out_dir.mkdir(parents=True, exist_ok=True)
    run_root.mkdir(parents=True, exist_ok=True)
    compare_root.mkdir(parents=True, exist_ok=True)
    for scenario_json in scenario_out_dir.glob("*.json"):
        scenario_json.unlink()
    for run_dir in run_root.iterdir():
        if run_dir.is_dir():
            shutil.rmtree(run_dir)
    for compare_dir in compare_root.iterdir():
        if compare_dir.is_dir():
            shutil.rmtree(compare_dir)

    scenario_payloads: dict[str, Any] = {}
    for scenario_path in scenario_paths:
        stem = scenario_path.stem
        scenario = validate_scenario(scenario_path, scenario_out_dir / f"{stem}.json")
        scenario_payloads[stem] = scenario
        if scenario.branch_count > 1:
            simulate_branching_scenario(
                scenario_path,
                artifacts_root / "graph" / "graph.json",
                artifacts_root / "personas" / "personas.json",
                run_root / stem,
                artifacts_root,
                compare_dir=compare_root / scenario.scenario_id,
            )
        else:
            simulate_scenario(
                scenario_path,
                artifacts_root / "graph" / "graph.json",
                artifacts_root / "personas" / "personas.json",
                run_root / stem,
            )

    matrix_branch_runs: list[BranchRunArtifacts] = []
    for scenario_path in scenario_paths:
        stem = scenario_path.stem
        run_dir = run_root / stem
        if not (run_dir / "summary.json").exists():
            continue
        summary, actions = load_run_artifacts(run_dir)
        matrix_branch_runs.append(
            BranchRunArtifacts(
                branch_id="branch_baseline" if stem == "baseline" else f"branch_{stem}",
                label="Baseline" if stem == "baseline" else scenario_payloads[stem].title,
                summary=summary,
                actions=actions,
                run_dir=run_dir,
            )
        )
    if matrix_branch_runs:
        write_compare_artifact(
            artifacts_root,
            compare_root / DEMO_MATRIX_COMPARE_SCENARIO_ID,
            scenario_id=DEMO_MATRIX_COMPARE_SCENARIO_ID,
            seed=matrix_branch_runs[0].summary.seed,
            branch_runs=matrix_branch_runs,
            reference_branch_id="branch_baseline",
        )
    generate_report(
        run_root / settings.intervention_scenario_path.stem,
        artifacts_root / "report",
        baseline_dir=run_root / "baseline",
    )
    return evaluate_runs(settings.expectations_path, artifacts_root, artifacts_root / "eval", settings.redlines_path)
