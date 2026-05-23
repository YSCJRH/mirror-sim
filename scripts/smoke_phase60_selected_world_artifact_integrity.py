from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.evals.service import run_transfer_eval
from backend.app.utils import read_json, read_jsonl


SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]
EXPECTED_ARTIFACT_ROOTS = {
    "fog-harbor-east-gate": Path("artifacts/demo"),
    "museum-night": Path("artifacts/worlds/museum-night"),
    "library-rain": Path("artifacts/worlds/library-rain"),
}
EXPECTED_TRANSFER_METRICS = {
    "world_count": 3,
    "scenario_count": 8,
    "tracked_outcome_count": 18,
    "transfer_worlds_with_default_report_delta": 3,
    "transfer_proof_world_local": True,
}


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


def _normalize_artifact_paths(paths: dict[str, str], repo_root: Path) -> dict[str, str]:
    return {name: _repo_relative(path, repo_root) for name, path in paths.items()}


def _claim_evidence_status(claims: list[dict[str, Any]], chunks_path: Path) -> tuple[bool, list[str]]:
    valid_evidence_ids = {chunk["chunk_id"] for chunk in read_jsonl(chunks_path)}
    invalid_evidence_ids = sorted(
        {
            evidence_id
            for claim in claims
            for evidence_id in claim.get("evidence_ids", [])
            if evidence_id not in valid_evidence_ids
        }
    )
    return not invalid_evidence_ids, invalid_evidence_ids


def _world_integrity_row(world_id: str, repo_root: Path) -> dict[str, Any]:
    artifact_root = EXPECTED_ARTIFACT_ROOTS[world_id]
    artifact_root_path = repo_root / artifact_root
    eval_summary_path = artifact_root_path / "eval" / "summary.json"
    claims_path = artifact_root_path / "report" / "claims.json"
    chunks_path = artifact_root_path / "ingest" / "chunks.jsonl"

    eval_summary = read_json(eval_summary_path)
    claims = read_json(claims_path)
    claim_evidence_resolves, invalid_evidence_ids = _claim_evidence_status(claims, chunks_path)

    return {
        "world_id": world_id,
        "artifact_root": artifact_root.as_posix(),
        "eval_summary_path": _repo_relative(eval_summary_path, repo_root),
        "eval_status": eval_summary["status"],
        "artifact_paths": _normalize_artifact_paths(eval_summary.get("artifact_paths", {}), repo_root),
        "claim_count": len(claims),
        "claims_labeled": all(claim.get("label") for claim in claims),
        "claims_have_evidence_ids": all(claim.get("evidence_ids") for claim in claims),
        "claim_evidence_resolves": claim_evidence_resolves,
        "invalid_evidence_ids": invalid_evidence_ids,
    }


def collect_selected_world_artifact_integrity(repo_root: Path | None = None) -> dict[str, Any]:
    root = _repo_root(repo_root)
    transfer_summary_path = root / "artifacts" / "transfer" / "summary.json"
    transfer_summary = read_json(transfer_summary_path)
    return {
        "selected_world_ids": SELECTED_WORLD_IDS,
        "expected_artifact_roots": {
            world_id: path.as_posix() for world_id, path in EXPECTED_ARTIFACT_ROOTS.items()
        },
        "transfer_summary_path": _repo_relative(transfer_summary_path, root),
        "transfer_summary": {
            **transfer_summary,
            "artifact_paths": _normalize_artifact_paths(
                transfer_summary.get("artifact_paths", {}),
                root,
            ),
        },
        "worlds": [_world_integrity_row(world_id, root) for world_id in SELECTED_WORLD_IDS],
    }


def validate_selected_world_artifact_integrity(evidence: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    transfer_summary = evidence["transfer_summary"]
    if transfer_summary.get("status") != "pass":
        failures.append("transfer_summary.status must be pass")
    for metric, expected in EXPECTED_TRANSFER_METRICS.items():
        observed = transfer_summary.get("metrics", {}).get(metric)
        if observed != expected:
            failures.append(f"transfer_summary.metrics.{metric} expected {expected!r}, got {observed!r}")

    observed_world_ids = [world["world_id"] for world in evidence["worlds"]]
    if observed_world_ids != SELECTED_WORLD_IDS:
        failures.append(f"selected world ids expected {SELECTED_WORLD_IDS!r}, got {observed_world_ids!r}")

    for world in evidence["worlds"]:
        world_id = world["world_id"]
        expected_root = EXPECTED_ARTIFACT_ROOTS[world_id].as_posix()
        if world["artifact_root"] != expected_root:
            failures.append(f"{world_id}: artifact_root expected {expected_root}")
        if world["eval_status"] != "pass":
            failures.append(f"{world_id}: eval_status must be pass")
        if world["claim_count"] <= 0:
            failures.append(f"{world_id}: expected at least one report claim")
        for flag_name in ("claims_labeled", "claims_have_evidence_ids", "claim_evidence_resolves"):
            if world[flag_name] is not True:
                failures.append(f"{world_id}: {flag_name} must be true")
    return failures


def run_selected_world_artifact_integrity_smoke(repo_root: Path | None = None) -> dict[str, Any]:
    root = _repo_root(repo_root)
    run_transfer_eval(repo_root=root)
    evidence = collect_selected_world_artifact_integrity(repo_root=root)
    failures = validate_selected_world_artifact_integrity(evidence)
    return {**evidence, "status": "pass" if not failures else "fail", "failures": failures}


def main() -> int:
    evidence = run_selected_world_artifact_integrity_smoke()
    print(json.dumps(evidence, indent=2, ensure_ascii=False))
    return 0 if evidence["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
