from __future__ import annotations

import argparse
from pathlib import Path

from backend.app.config import get_settings
from backend.app.evals.service import run_phase0_demo
from backend.app.graph.service import build_graph
from backend.app.ingest.service import ingest_manifest
from backend.app.personas.service import build_personas
from backend.app.reports.service import generate_report
from backend.app.scenarios.service import validate_scenario
from backend.app.simulation.service import simulate_scenario


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Mirror Engine Phase 0 CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    ingest = subparsers.add_parser("ingest", help="Ingest a manifest-backed corpus")
    ingest.add_argument("manifest")
    ingest.add_argument("--out", required=True)

    graph = subparsers.add_parser("build-graph", help="Build the evidence-backed graph")
    graph.add_argument("chunks")
    graph.add_argument("--out", required=True)

    personas = subparsers.add_parser("personas", help="Build persona cards from graph")
    personas.add_argument("graph")
    personas.add_argument("--out", required=True)

    validate = subparsers.add_parser("validate-scenario", help="Validate and normalize a scenario")
    validate.add_argument("scenario")
    validate.add_argument("--out")

    simulate = subparsers.add_parser("simulate", help="Run the deterministic simulation")
    simulate.add_argument("scenario")
    simulate.add_argument("--graph", required=True)
    simulate.add_argument("--personas", required=True)
    simulate.add_argument("--out", required=True)

    report = subparsers.add_parser("report", help="Generate a report from run artifacts")
    report.add_argument("run")
    report.add_argument("--baseline")
    report.add_argument("--out", required=True)

    subparsers.add_parser("eval-demo", help="Run the full Phase 0 demo pipeline")
    subparsers.add_parser("smoke", help="Run the end-to-end smoke pipeline")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    settings = get_settings()

    if args.command == "ingest":
        documents, chunks = ingest_manifest(Path(args.manifest), Path(args.out))
        print(f"Ingested {len(documents)} documents and {len(chunks)} chunks.")
        return 0

    if args.command == "build-graph":
        payload = build_graph(Path(args.chunks), Path(args.out))
        print(f"Built graph with {payload['stats']['entity_count']} entities and {payload['stats']['relation_count']} relations.")
        return 0

    if args.command == "personas":
        personas = build_personas(Path(args.graph), Path(args.out))
        print(f"Built {len(personas)} persona cards.")
        return 0

    if args.command == "validate-scenario":
        scenario = validate_scenario(Path(args.scenario), Path(args.out) if args.out else None)
        print(f"Validated scenario {scenario.scenario_id}.")
        return 0

    if args.command == "simulate":
        summary = simulate_scenario(Path(args.scenario), Path(args.graph), Path(args.personas), Path(args.out))
        print(f"Simulated {summary.scenario_id}; evacuation_turn={summary.evacuation_turn}.")
        return 0

    if args.command == "report":
        claims = generate_report(Path(args.run), Path(args.out), baseline_dir=Path(args.baseline) if args.baseline else None)
        print(f"Generated report with {len(claims)} claims.")
        return 0

    if args.command in {"eval-demo", "smoke"}:
        result = run_phase0_demo(settings=settings)
        print(f"{args.command} status: {result.status} ({result.metrics['checks_passed']}/{result.metrics['checks_total']} checks passed)")
        return 0 if result.status == "pass" else 1

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
