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
from backend.app.simulation.rules import SimulationPlan, load_simulation_plan
from backend.app.simulation.service import (
    BranchRunArtifacts,
    load_run_artifacts,
    simulate_branching_scenario,
    simulate_scenario,
    write_compare_artifact,
)
from backend.app.utils import ensure_dir, load_yaml, read_json, read_jsonl, write_json
from backend.app.world_query import inspect_world
from backend.app.worlds import CANONICAL_DEMO_WORLD_ID, WorldPaths, resolve_world_paths


DEFAULT_TRANSFER_WORLD_IDS = [CANONICAL_DEMO_WORLD_ID, "museum-night"]


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


def _artifact_paths(artifacts_root: Path) -> dict[str, str]:
    return {
        "ingest": str((artifacts_root / "ingest").as_posix()),
        "graph": str((artifacts_root / "graph" / "graph.json").as_posix()),
        "personas": str((artifacts_root / "personas" / "personas.json").as_posix()),
        "scenario": str((artifacts_root / "scenario").as_posix()),
        "run": str((artifacts_root / "run").as_posix()),
        "compare": str((artifacts_root / "compare").as_posix()),
        "report": str((artifacts_root / "report" / "report.md").as_posix()),
        "claims": str((artifacts_root / "report" / "claims.json").as_posix()),
        "eval": str((artifacts_root / "eval" / "summary.json").as_posix()),
    }


def _load_run_payloads(artifacts_root: Path) -> dict[str, dict[str, Any]]:
    run_payloads: dict[str, dict[str, Any]] = {}
    for run_dir in sorted((artifacts_root / "run").iterdir()):
        summary_path = run_dir / "summary.json"
        if run_dir.is_dir() and summary_path.exists():
            run_payloads[run_dir.name] = read_json(summary_path)
    return run_payloads


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


def _evaluate_redlines_texts(redlines_path: Path, texts: dict[str, str]) -> list[str]:
    rules = load_yaml(redlines_path)
    failures: list[str] = []
    for label, text in texts.items():
        topic_hits = _scan_terms(text, rules["blocked_topics"])
        if topic_hits:
            failures.append(f"redlines[{label}]: blocked topics {topic_hits}")
        phrase_hits = _scan_terms(text, rules["blocked_phrases"])
        if phrase_hits:
            failures.append(f"redlines[{label}]: blocked phrases {phrase_hits}")
    return failures


def _evaluate_redlines(redlines_path: Path, artifacts_root: Path) -> list[str]:
    return _evaluate_redlines_texts(redlines_path, _redline_texts(artifacts_root))


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
        world_id=graph_payload.get("world_id"),
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
        artifact_paths=_artifact_paths(artifacts_root),
    )
    write_json(out_dir / "summary.json", result.model_dump())
    return result


def _reset_artifacts_root(artifacts_root: Path) -> None:
    for name in ("ingest", "graph", "personas", "scenario", "run", "compare", "report", "eval"):
        target = artifacts_root / name
        if target.is_dir():
            shutil.rmtree(target)
        elif target.exists():
            target.unlink()


def _load_plan(world_paths: WorldPaths) -> SimulationPlan:
    plan = load_simulation_plan(world_paths.simulation_rules_path)
    if plan.world_id != world_paths.world_id:
        raise ValueError(
            f"World path resolver expected {world_paths.world_id}, "
            f"but simulation rules declare {plan.world_id}."
        )
    return plan


def _materialize_world(world_paths: WorldPaths) -> SimulationPlan:
    _reset_artifacts_root(world_paths.artifacts_root)
    ingest_manifest(world_paths.manifest_path, world_paths.artifacts_root / "ingest")
    build_graph(
        world_paths.artifacts_root / "ingest" / "chunks.jsonl",
        world_paths.artifacts_root / "graph",
        world_paths.world_model_path,
    )
    build_personas(
        world_paths.artifacts_root / "graph" / "graph.json",
        world_paths.artifacts_root / "personas",
        world_paths.world_model_path,
    )

    plan = _load_plan(world_paths)
    scenario_out_dir = world_paths.artifacts_root / "scenario"
    run_root = world_paths.artifacts_root / "run"
    scenario_payloads: dict[str, Any] = {}
    for scenario_path in world_paths.scenario_paths():
        stem = scenario_path.stem
        scenario = validate_scenario(scenario_path, scenario_out_dir / f"{stem}.json")
        scenario_payloads[stem] = scenario
        if scenario.branch_count > 1:
            simulate_branching_scenario(
                scenario_path,
                world_paths.artifacts_root / "graph" / "graph.json",
                world_paths.artifacts_root / "personas" / "personas.json",
                run_root / stem,
                world_paths.artifacts_root,
                compare_dir=world_paths.artifacts_root / "compare" / scenario.scenario_id,
            )
        else:
            simulate_scenario(
                scenario_path,
                world_paths.artifacts_root / "graph" / "graph.json",
                world_paths.artifacts_root / "personas" / "personas.json",
                run_root / stem,
            )

    matrix_branch_runs: list[BranchRunArtifacts] = []
    for scenario_path in world_paths.scenario_paths():
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
            world_paths.artifacts_root,
            world_paths.artifacts_root / "compare" / plan.compare_id,
            scenario_id=plan.compare_id,
            seed=matrix_branch_runs[0].summary.seed,
            branch_runs=matrix_branch_runs,
            reference_branch_id="branch_baseline",
            tracked_outcomes=plan.tracked_outcomes,
        )

    report_run_dir = run_root / plan.default_report_scenario
    if not report_run_dir.exists():
        raise ValueError(
            f"Default report scenario `{plan.default_report_scenario}` is missing under {run_root}."
        )
    generate_report(
        report_run_dir,
        world_paths.artifacts_root / "report",
        baseline_dir=run_root / "baseline",
        simulation_rules_path=world_paths.simulation_rules_path,
    )
    return plan


def _transfer_redline_texts(artifacts_root: Path) -> dict[str, str]:
    graph_path = artifacts_root / "graph" / "graph.json"
    personas_path = artifacts_root / "personas" / "personas.json"
    graph_payload = read_json(graph_path)
    personas_payload = read_json(personas_path)
    texts = {
        "report": (artifacts_root / "report" / "report.md").read_text(encoding="utf-8"),
        "claims": json.dumps(read_json(artifacts_root / "report" / "claims.json"), ensure_ascii=False),
        "graph": json.dumps(graph_payload, ensure_ascii=False),
        "personas": json.dumps(personas_payload, ensure_ascii=False),
    }
    if graph_payload.get("entities"):
        texts["inspect_entity"] = json.dumps(
            inspect_world(
                "entity",
                graph_payload["entities"][0]["entity_id"],
                graph_path,
                personas_path,
            ),
            ensure_ascii=False,
        )
    if personas_payload.get("personas"):
        texts["inspect_persona"] = json.dumps(
            inspect_world(
                "persona",
                personas_payload["personas"][0]["persona_id"],
                graph_path,
                personas_path,
            ),
            ensure_ascii=False,
        )
    if graph_payload.get("events"):
        texts["inspect_event"] = json.dumps(
            inspect_world(
                "event",
                graph_payload["events"][0]["event_id"],
                graph_path,
                personas_path,
            ),
            ensure_ascii=False,
        )
    for scenario_path in sorted((artifacts_root / "scenario").glob("*.json")):
        texts[f"scenario_{scenario_path.stem}"] = json.dumps(read_json(scenario_path), ensure_ascii=False)
    return texts


def evaluate_transfer_world(world_paths: WorldPaths) -> EvalResult:
    artifacts_root = world_paths.artifacts_root
    graph_path = artifacts_root / "graph" / "graph.json"
    personas_path = artifacts_root / "personas" / "personas.json"
    chunks_path = artifacts_root / "ingest" / "chunks.jsonl"
    claims_path = artifacts_root / "report" / "claims.json"
    report_path = artifacts_root / "report" / "report.md"
    compare_root = artifacts_root / "compare"
    eval_out_dir = artifacts_root / "eval"

    graph_payload = read_json(graph_path)
    persona_payload = read_json(personas_path)
    claims = read_json(claims_path)
    chunks = read_jsonl(artifacts_root / "ingest" / "chunks.jsonl")
    scenario_json_paths = sorted((artifacts_root / "scenario").glob("*.json"))
    run_summary_paths = sorted((artifacts_root / "run").glob("*/summary.json"))
    compare_json_paths = sorted(compare_root.glob("*/compare.json"))

    failures: list[str] = []
    checks_total = 0
    checks_passed = 0

    def record(name: str, passed: bool, details: str) -> None:
        nonlocal checks_total, checks_passed
        checks_total += 1
        if passed:
            checks_passed += 1
        else:
            failures.append(f"{name}: {details}")

    record("ingest_exists", chunks_path.exists(), f"Missing {chunks_path}")
    record("graph_exists", graph_path.exists(), f"Missing {graph_path}")
    record("graph_entities_nonempty", len(graph_payload.get("entities", [])) > 0, "graph entities must be non-empty")
    record("graph_relations_nonempty", len(graph_payload.get("relations", [])) > 0, "graph relations must be non-empty")
    record("graph_events_nonempty", len(graph_payload.get("events", [])) > 0, "graph events must be non-empty")
    record("personas_exist", personas_path.exists(), f"Missing {personas_path}")

    provenance_missing: list[str] = []
    for persona in persona_payload.get("personas", []):
        provenance = persona.get("field_provenance", {})
        for field_name in ("public_role", "goals", "constraints", "known_facts", "private_info", "relationships"):
            if persona.get(field_name) and not provenance.get(field_name):
                provenance_missing.append(f"{persona['persona_id']}.{field_name}")
    record(
        "persona_provenance_complete",
        not provenance_missing,
        "Missing provenance for " + ", ".join(provenance_missing),
    )

    record("scenario_json_written", len(scenario_json_paths) >= 2, "Expected baseline and injected scenario JSON artifacts.")
    record("run_summaries_written", len(run_summary_paths) >= 2, "Expected baseline and injected run summaries.")
    record("report_exists", report_path.exists(), f"Missing {report_path}")
    record("claims_exist", claims_path.exists(), f"Missing {claims_path}")
    record("compare_exists", len(compare_json_paths) >= 1, "Expected at least one compare artifact.")
    record("claims_labeled", all(claim.get("label") for claim in claims), "Every claim must carry a label.")
    record(
        "claims_have_evidence",
        all(claim.get("evidence_ids") for claim in claims),
        "Every claim must carry evidence_ids.",
    )

    valid_evidence_ids = {chunk["chunk_id"] for chunk in chunks}
    invalid_evidence_ids = sorted(
        {
            evidence_id
            for claim in claims
            for evidence_id in claim.get("evidence_ids", [])
            if evidence_id not in valid_evidence_ids
        }
    )
    record(
        "claim_evidence_resolves",
        not invalid_evidence_ids,
        "Unresolved evidence_ids: " + ", ".join(invalid_evidence_ids),
    )

    redline_failures = _evaluate_redlines_texts(
        world_paths.repo_root / "evals" / "assertions" / "redlines.yaml",
        _transfer_redline_texts(artifacts_root),
    )
    record("redlines_pass", not redline_failures, "; ".join(redline_failures) if redline_failures else "ok")

    result = EvalResult(
        eval_name=f"transfer_{world_paths.world_id}",
        world_id=world_paths.world_id,
        status="pass" if not failures else "fail",
        metrics={
            "scenario_count": len(scenario_json_paths),
            "checks_total": checks_total,
            "checks_passed": checks_passed,
            "failed_checks": len(failures),
        },
        failures=failures,
        notes=[
            "Transfer eval validates that the constrained deterministic pipeline can ingest, simulate, report, and evaluate this world without world-specific Python constants."
        ],
        artifact_paths=_artifact_paths(artifacts_root),
    )
    write_json(eval_out_dir / "summary.json", result.model_dump())
    return result


def run_world_eval(
    world_id: str,
    *,
    repo_root: Path | None = None,
    artifacts_root: Path | None = None,
) -> EvalResult:
    world_paths = resolve_world_paths(world_id, repo_root=repo_root)
    if artifacts_root is not None:
        world_paths = WorldPaths(
            repo_root=world_paths.repo_root,
            world_id=world_paths.world_id,
            data_root=world_paths.data_root,
            artifacts_root=artifacts_root,
            manifest_path=world_paths.manifest_path,
            world_model_path=world_paths.world_model_path,
            simulation_rules_path=world_paths.simulation_rules_path,
            scenario_dir=world_paths.scenario_dir,
            baseline_scenario_path=world_paths.baseline_scenario_path,
            expectations_path=world_paths.expectations_path,
        )
    _materialize_world(world_paths)
    return evaluate_transfer_world(world_paths)


def run_transfer_eval(world_ids: list[str] | None = None, *, repo_root: Path | None = None) -> EvalResult:
    root = repo_root or get_settings().repo_root
    selected_world_ids = world_ids or DEFAULT_TRANSFER_WORLD_IDS
    world_results = [run_world_eval(world_id, repo_root=root) for world_id in selected_world_ids]
    failures = [
        f"{result.world_id}: {failure}"
        for result in world_results
        for failure in result.failures
    ]
    summary = EvalResult(
        eval_name="transfer_eval",
        world_id="transfer",
        status="pass" if not failures else "fail",
        metrics={
            "world_count": len(world_results),
            "scenario_count": sum(result.metrics.get("scenario_count", 0) for result in world_results),
            "checks_total": sum(result.metrics.get("checks_total", 0) for result in world_results),
            "checks_passed": sum(result.metrics.get("checks_passed", 0) for result in world_results),
            "failed_checks": len(failures),
        },
        failures=failures,
        notes=[f"{result.world_id}: {result.status}" for result in world_results],
        artifact_paths={
            result.world_id or "unknown": result.artifact_paths.get("eval", "")
            for result in world_results
        },
    )
    write_json(root / "artifacts" / "transfer" / "summary.json", summary.model_dump())
    return summary


def run_phase0_demo(settings: Settings | None = None, artifacts_root: Path | None = None) -> EvalResult:
    settings = settings or get_settings()
    if artifacts_root is not None and artifacts_root != settings.artifacts_root:
        world_paths = WorldPaths(
            repo_root=settings.repo_root,
            world_id=settings.world_id,
            data_root=settings.data_root,
            artifacts_root=artifacts_root,
            manifest_path=settings.manifest_path,
            world_model_path=settings.world_model_path,
            simulation_rules_path=settings.simulation_rules_path,
            scenario_dir=settings.scenario_dir,
            baseline_scenario_path=settings.baseline_scenario_path,
            expectations_path=settings.expectations_path,
        )
    else:
        world_paths = resolve_world_paths(settings.world_id, repo_root=settings.repo_root)

    _materialize_world(world_paths)
    return evaluate_runs(
        settings.expectations_path,
        world_paths.artifacts_root,
        world_paths.artifacts_root / "eval",
        settings.redlines_path,
    )
