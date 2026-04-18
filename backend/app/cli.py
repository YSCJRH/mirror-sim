from __future__ import annotations

import argparse
import json
from pathlib import Path

from backend.app.automation.service import audit_github_queue, classify_git_refs, classify_paths, run_phase_audit
from backend.app.config import get_settings
from backend.app.evals.service import run_phase0_demo
from backend.app.graph.service import build_graph
from backend.app.ingest.service import ingest_manifest
from backend.app.personas.service import build_personas
from backend.app.reports.service import generate_report
from backend.app.scenarios.service import validate_scenario
from backend.app.simulation.service import simulate_branching_scenario, simulate_scenario
from backend.app.world_query import inspect_world


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

    inspect = subparsers.add_parser("inspect-world", help="Inspect a world object from graph/persona artifacts")
    inspect.add_argument("--kind", required=True, choices=["entity", "persona", "event"])
    inspect.add_argument("--id", required=True)
    inspect.add_argument("--graph", required=True)
    inspect.add_argument("--personas", required=True)

    classify = subparsers.add_parser("classify-lane", help="Classify a file set into the autonomous-safe or protected-core lane")
    classify_group = classify.add_mutually_exclusive_group(required=True)
    classify_group.add_argument("--files", nargs="+")
    classify_group.add_argument("--base")
    classify.add_argument("--head")

    audit = subparsers.add_parser("audit-phase", help="Run the local phase exit audit")
    audit.add_argument("phase", choices=["phase1", "phase2", "phase3"])
    audit.add_argument("--artifacts-root")

    queue = subparsers.add_parser("audit-github-queue", help="Audit whether the GitHub successor queue is paused, ready, or structurally invalid")
    queue.add_argument("--repo", required=True)

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
        scenario = validate_scenario(Path(args.scenario))
        if scenario.branch_count > 1:
            compare = simulate_branching_scenario(
                Path(args.scenario),
                Path(args.graph),
                Path(args.personas),
                Path(args.out),
                Path(args.out),
                compare_dir=Path(args.out) / "compare",
            )
            print(f"Simulated compare {compare.scenario_id}; branches={compare.branch_count}.")
        else:
            summary = simulate_scenario(Path(args.scenario), Path(args.graph), Path(args.personas), Path(args.out))
            print(f"Simulated {summary.scenario_id}; evacuation_turn={summary.evacuation_turn}.")
        return 0

    if args.command == "report":
        claims = generate_report(Path(args.run), Path(args.out), baseline_dir=Path(args.baseline) if args.baseline else None)
        print(f"Generated report with {len(claims)} claims.")
        return 0

    if args.command == "inspect-world":
        payload = inspect_world(args.kind, args.id, Path(args.graph), Path(args.personas))
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return 0

    if args.command == "classify-lane":
        if args.files:
            payload = classify_paths([path.replace("\\", "/") for path in args.files]).as_dict()
        else:
            if not args.head:
                raise ValueError("`classify-lane --base` also requires --head.")
            payload = classify_git_refs(args.base, args.head, repo_root=settings.repo_root).as_dict()
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return 0

    if args.command == "audit-phase":
        audit = run_phase_audit(
            args.phase,
            settings=settings,
            artifacts_root=Path(args.artifacts_root) if args.artifacts_root else None,
        )
        print(json.dumps(audit.as_dict(), indent=2, ensure_ascii=False))
        return 0 if audit.status == "pass" else 1

    if args.command == "audit-github-queue":
        audit = audit_github_queue(args.repo, repo_root=settings.repo_root)
        print(json.dumps(audit.as_dict(), indent=2, ensure_ascii=False))
        return 0 if audit.status in {"ready", "paused"} else 1

    if args.command in {"eval-demo", "smoke"}:
        result = run_phase0_demo(settings=settings)
        print(f"{args.command} status: {result.status} ({result.metrics['checks_passed']}/{result.metrics['checks_total']} checks passed)")
        return 0 if result.status == "pass" else 1

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
