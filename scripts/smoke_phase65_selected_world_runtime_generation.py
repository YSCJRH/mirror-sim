from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.graph.service import build_graph
from backend.app.ingest.service import ingest_manifest
from backend.app.personas.service import build_personas
from backend.app.worlds import resolve_world_paths


SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]
ALLOWED_CLAIM_LABELS = {"evidence_backed", "inferred", "speculative"}
PHASE65_GATE_PATH = Path(
    "docs/plans/phase-65-selected-world-deterministic-runtime-generation-gate-2026-06-01.md"
)
PHASE64_EVIDENCE_PATH = Path(
    "docs/plans/phase-64-selected-world-perturb-followup-readiness-2026-05-26.md"
)


def _repo_root(repo_root: Path | None = None) -> Path:
    return (repo_root or REPO_ROOT).resolve()


def _repo_relative(path: Path | str, repo_root: Path) -> str:
    value = Path(path)
    if not value.is_absolute():
        return value.as_posix()
    try:
        return value.resolve().relative_to(repo_root).as_posix()
    except ValueError:
        return value.as_posix()


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _run_cli(repo_root: Path, args: list[str], *, expect_success: bool = True) -> subprocess.CompletedProcess[str]:
    completed = subprocess.run(
        [sys.executable, "-m", "backend.app.cli", *args],
        cwd=repo_root,
        check=False,
        capture_output=True,
        text=True,
    )
    if expect_success and completed.returncode != 0:
        raise RuntimeError(
            "CLI command failed: "
            f"{' '.join(args)}\nstdout:\n{completed.stdout}\nstderr:\n{completed.stderr}"
        )
    if not expect_success and completed.returncode == 0:
        raise RuntimeError(
            "CLI command unexpectedly succeeded: "
            f"{' '.join(args)}\nstdout:\n{completed.stdout}\nstderr:\n{completed.stderr}"
        )
    return completed


def _run_cli_json(repo_root: Path, args: list[str]) -> dict[str, Any]:
    completed = _run_cli(repo_root, args)
    return json.loads(completed.stdout)


def _build_runtime_artifact_inputs(repo_root: Path, world_id: str, artifacts_root: Path) -> None:
    world_paths = resolve_world_paths(world_id, repo_root=repo_root)
    ingest_root = artifacts_root / "ingest"
    graph_root = artifacts_root / "graph"
    personas_root = artifacts_root / "personas"

    ingest_manifest(world_paths.manifest_path, ingest_root)
    build_graph(ingest_root / "chunks.jsonl", graph_root, world_paths.world_model_path)
    build_personas(graph_root / "graph.json", personas_root, world_paths.world_model_path)


def _perturbation_from_product(repo_root: Path, world_id: str) -> dict[str, Any]:
    world_paths = resolve_world_paths(world_id, repo_root=repo_root)
    product = _read_json(world_paths.data_root / "config" / "product.json")
    option = product["perturbation_options"][0]
    runtime = option["runtime"]
    return {
        "kind": runtime["kind"],
        "target_id": runtime["targetId"],
        "timing": runtime["timing"],
        "summary": option["summary"],
        "parameters": {
            **runtime.get("parameters", {}),
            "actor_id": runtime["actorId"],
        },
    }


def _mismatched_world_id(world_id: str) -> str:
    for candidate in SELECTED_WORLD_IDS:
        if candidate != world_id:
            return candidate
    raise ValueError(f"No mismatch candidate for `{world_id}`.")


def _path_exists(artifacts_root: Path, relative: str | None) -> bool:
    if not relative:
        return False
    return (artifacts_root / relative).exists()


def _claim_integrity_status(claims_path: Path, chunks_path: Path) -> dict[str, Any]:
    claims = _read_json(claims_path)
    if not isinstance(claims, list):
        return {
            "claims_have_labels_and_evidence_ids": False,
            "claims_use_allowed_labels": False,
            "claim_evidence_ids_resolve": False,
            "invalid_claim_labels": [],
            "invalid_evidence_ids": [],
            "claim_count": 0,
        }

    valid_evidence_ids = {
        json.loads(line)["chunk_id"]
        for line in chunks_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    }
    invalid_claim_labels = sorted(
        {
            str(claim.get("label")) if isinstance(claim, dict) else "<non-dict-claim>"
            for claim in claims
            if not isinstance(claim, dict) or claim.get("label") not in ALLOWED_CLAIM_LABELS
        }
    )
    invalid_evidence_ids = sorted(
        {
            evidence_id
            for claim in claims
            if isinstance(claim, dict)
            for evidence_id in claim.get("evidence_ids", [])
            if evidence_id not in valid_evidence_ids
        }
    )
    return {
        "claims_have_labels_and_evidence_ids": all(
            isinstance(claim, dict)
            and bool(claim.get("label"))
            and isinstance(claim.get("evidence_ids"), list)
            and bool(claim.get("evidence_ids"))
            for claim in claims
        ),
        "claims_use_allowed_labels": not invalid_claim_labels,
        "claim_evidence_ids_resolve": not invalid_evidence_ids,
        "invalid_claim_labels": invalid_claim_labels,
        "invalid_evidence_ids": invalid_evidence_ids,
        "claim_count": len(claims),
    }


def _decision_trace_is_deterministic_only(trace_path: Path) -> bool:
    rows = [
        json.loads(line)
        for line in trace_path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    return bool(rows) and all(
        row.get("provider_mode") != "openai_compatible" and row.get("model_id") is None
        for row in rows
    )


def _collect_world_runtime_generation(
    *,
    repo_root: Path,
    temp_root: Path,
    world_id: str,
) -> dict[str, Any]:
    world_paths = resolve_world_paths(world_id, repo_root=repo_root)
    artifacts_root = temp_root / world_id
    artifacts_root.mkdir(parents=True, exist_ok=True)
    _build_runtime_artifact_inputs(repo_root, world_id, artifacts_root)

    scenario_id = _read_json(world_paths.data_root / "config" / "product.json")[
        "baseline_scenario_id"
    ]
    session = _run_cli_json(
        repo_root,
        [
            "start-session",
            "--world",
            world_id,
            "--scenario",
            scenario_id,
            "--artifacts-root",
            str(artifacts_root),
            "--decision-provider",
            "deterministic_only",
        ],
    )
    perturbation = _perturbation_from_product(repo_root, world_id)

    mismatch = _run_cli(
        repo_root,
        [
            "generate-branch",
            "--world",
            _mismatched_world_id(world_id),
            "--session",
            session["session_id"],
            "--from",
            "node_root",
            "--perturbation",
            json.dumps(perturbation),
            "--artifacts-root",
            str(artifacts_root),
        ],
        expect_success=False,
    )

    generated = _run_cli_json(
        repo_root,
        [
            "generate-branch",
            "--world",
            world_id,
            "--session",
            session["session_id"],
            "--from",
            "node_root",
            "--perturbation",
            json.dumps(perturbation),
            "--artifacts-root",
            str(artifacts_root),
        ],
    )

    session_id = session["session_id"]
    root_node_path = artifacts_root / "sessions" / session_id / "nodes" / "node_root" / "node.json"
    generated_node_id = generated["active_node_id"]
    generated_node_path = (
        artifacts_root / "sessions" / session_id / "nodes" / generated_node_id / "node.json"
    )
    root_node = _read_json(root_node_path)
    generated_node = _read_json(generated_node_path)
    claims_path = artifacts_root / generated_node["claims_path"]
    claim_integrity = _claim_integrity_status(claims_path, artifacts_root / "ingest" / "chunks.jsonl")
    decision_trace_path = artifacts_root / generated_node["decision_trace_path"]

    artifact_integrity = {
        "summary": _path_exists(artifacts_root, generated_node.get("summary_path")),
        "trace": _path_exists(artifacts_root, generated_node.get("trace_path")),
        "snapshots": _path_exists(artifacts_root, generated_node.get("snapshot_dir")),
        "compare": _path_exists(artifacts_root, generated_node.get("compare_path")),
        "report": _path_exists(artifacts_root, generated_node.get("report_path")),
        "claims": claims_path.exists(),
        "resolution": _path_exists(artifacts_root, generated_node.get("resolution_path")),
        "decision_trace": decision_trace_path.exists(),
    }
    return {
        "world_id": world_id,
        "scenario_id": scenario_id,
        "temporary_artifacts_root": artifacts_root.as_posix(),
        "manifest_path": _repo_relative(world_paths.manifest_path, repo_root),
        "session_id": session_id,
        "session_world_id": session["world_id"],
        "session_decision_config": session["decision_config"],
        "root_node_id": session["root_node_id"],
        "root_node_world_id": root_node["world_id"],
        "active_node_id": generated["active_node_id"],
        "generated_node_id": generated_node_id,
        "generated_node_world_id": generated_node["world_id"],
        "generated_scenario_id": generated_node["scenario_id"],
        "perturbation_kind": perturbation["kind"],
        "artifact_integrity": artifact_integrity,
        **claim_integrity,
        "generated_decision_trace_provider_only": _decision_trace_is_deterministic_only(
            decision_trace_path
        ),
        "mismatch_rejection": {
            "status": "rejected",
            "expected_world_id": _mismatched_world_id(world_id),
            "returncode": mismatch.returncode,
            "stderr": mismatch.stderr,
        },
        "provider_or_model_calls": False,
        "async_task_or_worker_behavior": False,
    }


def collect_selected_world_runtime_generation(
    repo_root: Path | None = None,
    *,
    artifacts_parent: Path | None = None,
) -> dict[str, Any]:
    root = _repo_root(repo_root)

    def collect(temp_root: Path) -> dict[str, Any]:
        worlds = [
            _collect_world_runtime_generation(
                repo_root=root,
                temp_root=temp_root,
                world_id=world_id,
            )
            for world_id in SELECTED_WORLD_IDS
        ]
        evidence = {
            "mode": "phase65_selected_world_runtime_generation",
            "selected_world_ids": SELECTED_WORLD_IDS,
            "phase65_gate_path": PHASE65_GATE_PATH.as_posix(),
            "phase64_evidence_path": PHASE64_EVIDENCE_PATH.as_posix(),
            "temporary_local_artifacts": True,
            "temporary_artifacts_policy": (
                "caller-managed" if artifacts_parent else "TemporaryDirectory cleanup after validation"
            ),
            "provider_or_model_calls": False,
            "async_task_or_worker_behavior": False,
            "new_route_or_api_added": False,
            "worlds": worlds,
        }
        failures = validate_selected_world_runtime_generation(evidence)
        return {**evidence, "status": "pass" if not failures else "fail", "failures": failures}

    if artifacts_parent:
        artifacts_parent.mkdir(parents=True, exist_ok=True)
        return collect(artifacts_parent)

    with TemporaryDirectory(prefix="mirror-phase65-runtime-") as temp_dir:
        return collect(Path(temp_dir))


def validate_selected_world_runtime_generation(evidence: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    if evidence.get("selected_world_ids") != SELECTED_WORLD_IDS:
        failures.append(
            f"selected_world_ids expected {SELECTED_WORLD_IDS!r}, got {evidence.get('selected_world_ids')!r}"
        )
    if evidence.get("temporary_local_artifacts") is not True:
        failures.append("temporary local artifacts are required")
    if evidence.get("provider_or_model_calls") is not False:
        failures.append("provider/model calls are not allowed")
    if evidence.get("async_task_or_worker_behavior") is not False:
        failures.append("async task or worker behavior is not allowed")
    if evidence.get("new_route_or_api_added") is not False:
        failures.append("new routes or APIs are not allowed")

    observed_world_ids = [world["world_id"] for world in evidence.get("worlds", [])]
    if observed_world_ids != SELECTED_WORLD_IDS:
        failures.append(f"world rows expected {SELECTED_WORLD_IDS!r}, got {observed_world_ids!r}")

    for world in evidence.get("worlds", []):
        world_id = world["world_id"]
        if world.get("session_world_id") != world_id:
            failures.append(f"{world_id}: session world_id mismatch")
        if world.get("root_node_world_id") != world_id:
            failures.append(f"{world_id}: root node world_id mismatch")
        if world.get("generated_node_world_id") != world_id:
            failures.append(f"{world_id}: generated node world_id mismatch")
        if world.get("generated_node_id") == "node_root":
            failures.append(f"{world_id}: generated node must not be the root node")
        if world.get("active_node_id") != world.get("generated_node_id"):
            failures.append(f"{world_id}: active node must be the generated node")
        decision_config = world.get("session_decision_config", {})
        if decision_config.get("provider") != "deterministic_only":
            failures.append(f"{world_id}: session must use deterministic_only provider")
        if decision_config.get("model_id") is not None:
            failures.append(f"{world_id}: deterministic session must not keep a model id")
        if world.get("generated_decision_trace_provider_only") is not True:
            failures.append(f"{world_id}: generated branch must avoid provider/model trace rows")
        if world.get("mismatch_rejection", {}).get("status") != "rejected":
            failures.append(f"{world_id}: mismatch guard must reject the wrong expected world")
        if "belongs to world" not in world.get("mismatch_rejection", {}).get("stderr", ""):
            failures.append(f"{world_id}: mismatch guard stderr must explain world ownership")
        if world.get("provider_or_model_calls") is not False:
            failures.append(f"{world_id}: provider/model calls are not allowed")
        if world.get("async_task_or_worker_behavior") is not False:
            failures.append(f"{world_id}: async task or worker behavior is not allowed")
        for name, exists in world.get("artifact_integrity", {}).items():
            if exists is not True:
                failures.append(f"{world_id}: artifact `{name}` is missing")
        if world.get("claims_have_labels_and_evidence_ids") is not True:
            failures.append(
                f"{world_id}: every report claim must keep non-empty label and evidence_ids"
            )
        if world.get("claims_use_allowed_labels") is not True:
            failures.append(f"{world_id}: report claim labels must use the allowed contract labels")
        if world.get("claim_evidence_ids_resolve") is not True:
            failures.append(f"{world_id}: report claim evidence_ids must resolve to ingest chunks")
        if world.get("claim_count", 0) <= 0:
            failures.append(f"{world_id}: generated report must emit claims")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke-test Phase 65 selected-world deterministic runtime generation."
    )
    parser.add_argument(
        "--artifacts-parent",
        help="Optional caller-managed directory for temporary runtime artifacts.",
    )
    args = parser.parse_args()

    evidence = collect_selected_world_runtime_generation(
        REPO_ROOT,
        artifacts_parent=Path(args.artifacts_parent) if args.artifacts_parent else None,
    )
    print(json.dumps(evidence, indent=2, ensure_ascii=False))
    return 0 if evidence["status"] == "pass" else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
