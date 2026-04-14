from __future__ import annotations

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


def _compare(op: str, left: Any, right: Any) -> bool:
    if op == "gt":
        return left > right
    if op == "lt":
        return left < right
    if op == "eq":
        return left == right
    raise ValueError(f"Unsupported comparison op: {op}")


def evaluate_runs(expectations_path: Path, artifacts_root: Path, out_dir: Path) -> EvalResult:
    expectations = load_yaml(expectations_path)
    baseline_summary = read_json(artifacts_root / "run" / "baseline" / "summary.json")
    intervention_summary = read_json(artifacts_root / "run" / "reporter_detained" / "summary.json")
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
        else:
            failures.append(f"{check['name']}: unsupported check kind {kind}")

    result = EvalResult(
        eval_name=expectations["eval_name"],
        status="pass" if not failures else "fail",
        metrics={
            "checks_total": len(expectations["checks"]),
            "checks_passed": passed,
            "baseline_evacuation_turn": baseline_summary["evacuation_turn"],
            "intervention_evacuation_turn": intervention_summary["evacuation_turn"],
        },
        failures=failures,
        notes=["Phase 0 eval covers deterministic demo behavior and claim provenance."],
    )
    write_json(out_dir / "summary.json", result.model_dump())
    return result


def run_phase0_demo(settings: Settings | None = None, artifacts_root: Path | None = None) -> EvalResult:
    settings = settings or get_settings()
    artifacts_root = artifacts_root or settings.artifacts_root

    ingest_manifest(settings.manifest_path, artifacts_root / "ingest")
    build_graph(artifacts_root / "ingest" / "chunks.jsonl", artifacts_root / "graph")
    build_personas(artifacts_root / "graph" / "graph.json", artifacts_root / "personas")
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
    return evaluate_runs(settings.expectations_path, artifacts_root, artifacts_root / "eval")
