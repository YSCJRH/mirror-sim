from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from types import ModuleType
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]
ALLOWED_DECISION_TRACE_PROVIDER_MODES = {
    "deterministic_fallback",
    "replay_cache",
    "single_choice",
}
PROVIDER_BACKED_DECISION_TRACE_MODES = {
    "hosted_openai",
    "openai_compatible",
}
PHASE65_SMOKE_PATH = Path("scripts/smoke_phase65_selected_world_runtime_generation.py")
PHASE65_EVIDENCE_PATH = Path(
    "docs/plans/phase-65-selected-world-runtime-generation-evidence-2026-06-01.md"
)
PHASE66_GATE_PATH = Path(
    "docs/plans/phase-66-selected-world-generated-runtime-surface-continuity-gate-2026-06-04.md"
)
RUNTIME_SESSION_SOURCE_PATH = Path("frontend/src/app/lib/runtime-session-data.ts")
WORLD_RUNTIME_SOURCE_PATH = Path("frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx")
WORLD_RUNTIME_EXPLAIN_SOURCE_PATH = Path(
    "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/explain/page.tsx"
)
WORLD_RUNTIME_REPORT_SOURCE_PATH = Path(
    "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/report/page.tsx"
)
WORLD_REVIEW_SOURCE_PATH = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")


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


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _read_json(path: Path) -> Any:
    return json.loads(_read_text(path))


def _read_jsonl(path: Path) -> list[Any]:
    return [json.loads(line) for line in _read_text(path).splitlines() if line.strip()]


def _load_phase65_smoke(repo_root: Path) -> ModuleType:
    smoke_path = repo_root / PHASE65_SMOKE_PATH
    spec = importlib.util.spec_from_file_location("phase65_runtime_generation_smoke", smoke_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {smoke_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _source_runtime_surface_signals(repo_root: Path) -> dict[str, bool]:
    runtime_loader = _read_text(repo_root / RUNTIME_SESSION_SOURCE_PATH)
    runtime_page = _read_text(repo_root / WORLD_RUNTIME_SOURCE_PATH)
    explain_page = _read_text(repo_root / WORLD_RUNTIME_EXPLAIN_SOURCE_PATH)
    report_page = _read_text(repo_root / WORLD_RUNTIME_REPORT_SOURCE_PATH)
    review_page = _read_text(repo_root / WORLD_REVIEW_SOURCE_PATH)

    page_loader_markers = [
        "params: Promise<{ worldId: string; sessionId: string }>",
        "const { worldId, sessionId } = await params;",
        "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, resolvedSearchParams?.node)",
    ]

    return {
        "loadRuntimeSessionWorkspaceForWorld": all(
            marker in runtime_loader
            for marker in [
                "listRuntimeSessionLocatorsForWorld(worldId)",
                "resolveProductWorldPaths(worldId).artifactsRoot",
                "if (session.world_id !== worldId)",
                "if (selectedNode.world_id !== worldId || rootNode.world_id !== worldId)",
                "lineage.some((entry) => entry.node.world_id !== worldId",
                "loadRuntimeDecisionSummary(artifactsRoot, selectedNode.decision_trace_path)",
            ]
        ),
        "findLatestRuntimeSessionForWorld": "findLatestRuntimeSessionForWorld" in runtime_loader
        and "sessions[0] ?? null" in runtime_loader,
        "runtime_page_uses_world_scoped_loader": all(
            marker in runtime_page for marker in page_loader_markers
        )
        and all(
            marker in runtime_page
            for marker in [
                "`/worlds/${worldId}/runtime/${sessionId}?node=${encodeURIComponent(activeNode.node_id)}`",
                "`/worlds/${worldId}/runtime/${sessionId}/explain?node=${encodeURIComponent(activeNode.node_id)}`",
                "`/worlds/${worldId}/runtime/${sessionId}/report?node=${encodeURIComponent(activeNode.node_id)}`",
                "`/worlds/${worldId}/review?session=${encodeURIComponent(sessionId)}",
            ]
        ),
        "explain_page_uses_world_scoped_loader": all(
            marker in explain_page for marker in page_loader_markers
        )
        and all(
            marker in explain_page
            for marker in [
                "`/worlds/${worldId}/runtime/${sessionId}/explain?node=${encodeURIComponent(activeNode.node_id)}`",
                "`/worlds/${worldId}/runtime/${sessionId}/report?node=${encodeURIComponent(activeNode.node_id)}`",
                "workspace.relevantClaims",
            ]
        )
        and (
            "`/worlds/${worldId}/review?session=${encodeURIComponent(activeNode.node_id)}`"
            not in explain_page
        ),
        "report_page_uses_world_scoped_loader": all(
            marker in report_page for marker in page_loader_markers
        )
        and all(
            marker in report_page
            for marker in [
                "`/worlds/${worldId}/runtime/${sessionId}/report?node=${encodeURIComponent(activeNode.node_id)}`",
                "`/worlds/${worldId}/runtime/${sessionId}/explain?node=${encodeURIComponent(activeNode.node_id)}`",
                "parseReport(workspace.reportText)",
            ]
        ),
        "review_page_uses_latest_world_session": all(
            marker in review_page
            for marker in [
                "params: Promise<{ worldId: string }>",
                "const { worldId } = await params;",
                "findLatestRuntimeSessionForWorld(worldId)",
                "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)",
                "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}?node=${encodeURIComponent(activeNode.node_id)}`",
                "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}/explain?node=${encodeURIComponent(activeNode.node_id)}`",
                "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}/report?node=${encodeURIComponent(activeNode.node_id)}`",
            ]
        ),
    }


def _load_runtime_node_lineage(
    session: dict[str, Any],
    node_id: str,
    artifacts_root: Path,
) -> list[dict[str, Any]]:
    records_by_id = {node["node_id"]: node for node in session["nodes"]}
    lineage: list[dict[str, Any]] = []
    visited: set[str] = set()
    current_node_id: str | None = node_id

    while current_node_id:
        if current_node_id in visited:
            raise RuntimeError(f"Cycle detected while loading runtime lineage for {current_node_id}.")
        visited.add(current_node_id)

        record = records_by_id.get(current_node_id)
        if not record:
            raise RuntimeError(f"Missing runtime node record for {current_node_id}.")

        node = _read_json(artifacts_root / record["node_path"])
        lineage.append(
            {
                "node": node,
                "depth": len(lineage),
                "isRoot": node["parent_node_id"] is None,
            }
        )
        current_node_id = node["parent_node_id"]

    ordered = list(reversed(lineage))
    return [{**entry, "depth": index} for index, entry in enumerate(ordered)]


def _load_runtime_decision_summary(
    artifacts_root: Path,
    decision_trace_path: str | None,
) -> dict[str, Any] | None:
    if not decision_trace_path:
        return None
    try:
        entries = _read_jsonl(artifacts_root / decision_trace_path)
    except FileNotFoundError:
        return None
    if not entries:
        return None
    return {
        "decisionCount": len(entries),
        "fallbackCount": len([entry for entry in entries if entry.get("fallback_used")]),
        "replayCount": len(
            [entry for entry in entries if entry.get("provider_mode") == "replay_cache"]
        ),
        "providerModes": sorted({entry.get("provider_mode") for entry in entries}),
        "modelId": next((entry.get("model_id") for entry in entries if entry.get("model_id")), None),
        "promptVersion": next(
            (entry.get("prompt_version") for entry in entries if entry.get("prompt_version")),
            None,
        ),
    }


def _load_run_payload(session_root: Path, branch: dict[str, Any]) -> dict[str, Any]:
    summary = _read_json(session_root / branch["summary_path"])
    actions = _read_jsonl(session_root / branch["trace_path"])
    snapshot_dir = branch.get("snapshot_dir") or ""
    snapshots = (
        [
            _read_json(session_root / snapshot_dir / f"turn-{str(index + 1).zfill(2)}.json")
            for index in range(summary["turn_budget"])
        ]
        if snapshot_dir
        else []
    )
    return {
        "branch": branch,
        "summary": summary,
        "actions": actions,
        "snapshots": snapshots,
    }


def _load_runtime_claim_drilldowns(
    artifacts_root: Path,
    candidate_entries: list[dict[str, Any]],
    claims_path: str | None,
) -> list[dict[str, Any]]:
    try:
        claims = _read_json(
            artifacts_root / claims_path
            if claims_path
            else artifacts_root / "report" / "claims.json"
        )
    except FileNotFoundError:
        return []

    documents = _read_jsonl(artifacts_root / "ingest" / "documents.jsonl")
    chunks = _read_jsonl(artifacts_root / "ingest" / "chunks.jsonl")
    documents_by_id = {document["document_id"]: document for document in documents}
    chunks_by_id = {chunk["chunk_id"]: chunk for chunk in chunks}
    candidate_evidence_ids = {
        evidence_id
        for entry in candidate_entries
        for evidence_id in entry["turn"].get("evidence_ids", [])
    }

    ranked = []
    for claim in claims:
        evidence_overlap = [
            chunk_id
            for chunk_id in claim.get("evidence_ids", [])
            if chunk_id in candidate_evidence_ids
        ]
        related_runtime_turns = [
            entry
            for entry in candidate_entries
            if any(
                chunk_id in claim.get("evidence_ids", [])
                for chunk_id in entry["turn"].get("evidence_ids", [])
            )
        ]
        evidence_chunks = [
            {
                "chunk": chunks_by_id[chunk_id],
                "document": documents_by_id.get(chunks_by_id[chunk_id]["document_id"]),
            }
            for chunk_id in claim.get("evidence_ids", [])
            if chunk_id in chunks_by_id
        ]
        ranked.append(
            {
                "claim": claim,
                "evidenceChunks": evidence_chunks,
                "relatedRuntimeTurns": related_runtime_turns,
                "score": len(evidence_overlap) * 3 + len(related_runtime_turns),
            }
        )

    ranked.sort(key=lambda row: row["score"], reverse=True)
    selected = (
        [row for row in ranked if row["score"] > 0][:3]
        if any(row["score"] > 0 for row in ranked)
        else ranked[:3]
    )
    return [
        {
            "claim": row["claim"],
            "evidenceChunks": row["evidenceChunks"],
            "relatedRuntimeTurns": row["relatedRuntimeTurns"],
        }
        for row in selected
    ]


def _parse_report_block_count(report_text: str) -> int:
    return len([line for line in report_text.splitlines() if line.strip()])


def _latest_runtime_session_locator(artifacts_root: Path) -> dict[str, Any] | None:
    sessions_root = artifacts_root / "sessions"
    locators: list[dict[str, Any]] = []
    for session_dir in sessions_root.iterdir():
        if not session_dir.is_dir():
            continue
        try:
            session = _read_json(session_dir / "session.json")
        except FileNotFoundError:
            continue
        locators.append(
            {
                "sessionId": session["session_id"],
                "activeNodeId": session["active_node_id"],
                "createdAt": session["created_at"],
                "lastActivityAt": session.get("last_activity_at") or session["created_at"],
            }
        )

    def sort_key(locator: dict[str, Any]) -> datetime:
        return datetime.fromisoformat(locator["lastActivityAt"].replace("Z", "+00:00"))

    return sorted(locators, key=sort_key, reverse=True)[0] if locators else None


def _collect_world_surface_continuity(world: dict[str, Any]) -> dict[str, Any]:
    world_id = world["world_id"]
    artifacts_root = Path(world["temporary_artifacts_root"])
    session_id = world["session_id"]
    active_node_id = world["active_node_id"]
    session_root = artifacts_root / "sessions" / session_id
    session = _read_json(session_root / "session.json")
    graph = _read_json(artifacts_root / "graph" / "graph.json")

    selected_node_id = (
        active_node_id
        if any(node["node_id"] == active_node_id for node in session["nodes"])
        else session["active_node_id"]
    )
    records_by_id = {node["node_id"]: node for node in session["nodes"]}
    selected_node = _read_json(artifacts_root / records_by_id[selected_node_id]["node_path"])
    root_node = _read_json(artifacts_root / records_by_id[session["root_node_id"]]["node_path"])
    lineage = _load_runtime_node_lineage(session, selected_node_id, artifacts_root)
    decision_summary = _load_runtime_decision_summary(
        artifacts_root,
        selected_node.get("decision_trace_path"),
    )
    report_text = (
        _read_text(artifacts_root / selected_node["report_path"])
        if selected_node.get("report_path")
        else ""
    )
    compare_artifact = _read_json(artifacts_root / selected_node["compare_path"])
    reference_branch = next(
        (branch for branch in compare_artifact["branches"] if branch.get("is_reference")),
        compare_artifact["branches"][0],
    )
    candidate_branch = next(
        (branch for branch in compare_artifact["branches"] if not branch.get("is_reference")),
        None,
    )
    compare_delta = (
        next(
            (
                delta
                for delta in compare_artifact.get("reference_deltas", [])
                if candidate_branch and delta["branch_id"] == candidate_branch["branch_id"]
            ),
            None,
        )
        if candidate_branch
        else None
    )
    reference_run = _load_run_payload(session_root, reference_branch) if reference_branch else None
    candidate_run = _load_run_payload(session_root, candidate_branch) if candidate_branch else None
    reference_turns = {
        turn["turn_id"]: {"turn": turn, "snapshot": reference_run["snapshots"][index] or None}
        for index, turn in enumerate(reference_run["actions"])
    } if reference_run else {}
    candidate_turns = {
        turn["turn_id"]: {"turn": turn, "snapshot": candidate_run["snapshots"][index] or None}
        for index, turn in enumerate(candidate_run["actions"])
    } if candidate_run else {}
    rows = [
        {
            "turnIndex": row["turn_index"],
            "reference": reference_turns.get(row["reference_turn_id"])
            if row.get("reference_turn_id")
            else None,
            "candidate": candidate_turns.get(row["candidate_turn_id"])
            if row.get("candidate_turn_id")
            else None,
        }
        for row in (compare_delta or {}).get("divergent_turns", [])
    ]
    relevant_claims = _load_runtime_claim_drilldowns(
        artifacts_root,
        [row["candidate"] for row in rows if row.get("candidate")],
        selected_node.get("claims_path"),
    )
    latest_session = _latest_runtime_session_locator(artifacts_root)

    world_scoped_loader_guard = (
        session["world_id"] == world_id
        and selected_node["world_id"] == world_id
        and root_node["world_id"] == world_id
        and selected_node["session_id"] == session_id
        and root_node["session_id"] == session_id
        and all(
            entry["node"]["world_id"] == world_id and entry["node"]["session_id"] == session_id
            for entry in lineage
        )
    )
    evidence_chunk_count = sum(len(row["evidenceChunks"]) for row in relevant_claims)
    related_runtime_turn_count = sum(len(row["relatedRuntimeTurns"]) for row in relevant_claims)
    runtime_surface_path = f"/worlds/{world_id}/runtime/{session_id}?node={active_node_id}"
    decision_provider_modes = decision_summary["providerModes"] if decision_summary else []
    provider_backed_decision_trace_modes = sorted(
        set(decision_provider_modes) & PROVIDER_BACKED_DECISION_TRACE_MODES
    )

    return {
        "world_id": world_id,
        "session_id": session_id,
        "active_node_id": active_node_id,
        "generated_node_id": world["generated_node_id"],
        "temporary_artifacts_root": world["temporary_artifacts_root"],
        "claims_have_labels_and_evidence_ids": world["claims_have_labels_and_evidence_ids"],
        "claim_evidence_ids_resolve": world["claim_evidence_ids_resolve"],
        "generated_decision_trace_provider_only": world["generated_decision_trace_provider_only"],
        "provider_or_model_calls": False,
        "async_task_or_worker_behavior": False,
        "runtime_surface": {
            "path": runtime_surface_path,
            "runtime_surface_loadable": bool(graph and selected_node and root_node),
            "world_scoped_loader_guard": world_scoped_loader_guard,
            "lineage_node_ids": [entry["node"]["node_id"] for entry in lineage],
            "decision_summary_ready": bool(
                decision_summary
                and decision_summary["decisionCount"] > 0
                and decision_summary["modelId"] is None
                and set(decision_provider_modes).issubset(ALLOWED_DECISION_TRACE_PROVIDER_MODES)
            ),
            "decision_provider_modes": decision_provider_modes,
            "provider_backed_decision_trace_modes": provider_backed_decision_trace_modes,
            "compare_delta_ready": bool(compare_delta and compare_delta.get("outcome_deltas")),
            "comparison_rows_ready": bool(rows),
            "comparison_row_count": len(rows),
            "compare_branch_count": len(compare_artifact.get("branches", [])),
        },
        "explain_surface": {
            "path": f"/worlds/{world_id}/runtime/{session_id}/explain?node={active_node_id}",
            "explain_surface_claim_drilldowns_ready": bool(
                relevant_claims and evidence_chunk_count > 0 and related_runtime_turn_count > 0
            ),
            "relevant_claim_count": len(relevant_claims),
            "evidence_chunk_count": evidence_chunk_count,
            "related_runtime_turn_count": related_runtime_turn_count,
        },
        "report_surface": {
            "path": f"/worlds/{world_id}/runtime/{session_id}/report?node={active_node_id}",
            "report_surface_report_text_ready": bool(report_text.strip()),
            "report_character_count": len(report_text),
            "parsed_report_block_count": _parse_report_block_count(report_text),
        },
        "review_surface": {
            "path": f"/worlds/{world_id}/review?session={session_id}&node={active_node_id}",
            "review_surface_latest_session_ready": bool(
                latest_session
                and latest_session["sessionId"] == session_id
                and latest_session["activeNodeId"] == active_node_id
            ),
            "latest_session_id": latest_session["sessionId"] if latest_session else None,
            "latest_active_node_id": latest_session["activeNodeId"] if latest_session else None,
            "runtime_workspace_path": runtime_surface_path,
        },
    }


def collect_selected_world_generated_runtime_surface_continuity(
    repo_root: Path | None = None,
    *,
    artifacts_parent: Path | None = None,
) -> dict[str, Any]:
    root = _repo_root(repo_root)

    def collect(temp_root: Path) -> dict[str, Any]:
        phase65 = _load_phase65_smoke(root)
        generation_evidence = phase65.collect_selected_world_runtime_generation(
            repo_root=root,
            artifacts_parent=temp_root,
        )
        phase65_failures = phase65.validate_selected_world_runtime_generation(generation_evidence)
        worlds = [
            _collect_world_surface_continuity(world)
            for world in generation_evidence.get("worlds", [])
        ]
        evidence = {
            "mode": "phase66_selected_world_generated_runtime_surface_continuity",
            "selected_world_ids": SELECTED_WORLD_IDS,
            "phase65_evidence_path": PHASE65_EVIDENCE_PATH.as_posix(),
            "phase66_gate_path": PHASE66_GATE_PATH.as_posix(),
            "phase65_runtime_generation_status": generation_evidence.get("status"),
            "phase65_runtime_generation_failures": phase65_failures,
            "temporary_local_artifacts": True,
            "temporary_artifacts_policy": (
                "caller-managed" if artifacts_parent else "TemporaryDirectory cleanup after validation"
            ),
            "provider_or_model_calls": False,
            "async_task_or_worker_behavior": False,
            "new_route_or_api_added": False,
            "route_ownership_changed": False,
            "surface_source_paths": {
                "runtime_session_data": RUNTIME_SESSION_SOURCE_PATH.as_posix(),
                "world_runtime_page": WORLD_RUNTIME_SOURCE_PATH.as_posix(),
                "world_runtime_explain_page": WORLD_RUNTIME_EXPLAIN_SOURCE_PATH.as_posix(),
                "world_runtime_report_page": WORLD_RUNTIME_REPORT_SOURCE_PATH.as_posix(),
                "world_review_page": WORLD_REVIEW_SOURCE_PATH.as_posix(),
            },
            "surface_source_signals": _source_runtime_surface_signals(root),
            "worlds": worlds,
        }
        failures = validate_selected_world_generated_runtime_surface_continuity(evidence)
        return {**evidence, "status": "pass" if not failures else "fail", "failures": failures}

    if artifacts_parent:
        artifacts_parent.mkdir(parents=True, exist_ok=True)
        return collect(artifacts_parent)

    with TemporaryDirectory(prefix="mirror-phase66-runtime-surface-") as temp_dir:
        return collect(Path(temp_dir))


def validate_selected_world_generated_runtime_surface_continuity(
    evidence: dict[str, Any],
) -> list[str]:
    failures: list[str] = []
    if evidence.get("selected_world_ids") != SELECTED_WORLD_IDS:
        failures.append(
            f"selected_world_ids expected {SELECTED_WORLD_IDS!r}, got {evidence.get('selected_world_ids')!r}"
        )
    if evidence.get("phase65_runtime_generation_status") != "pass":
        failures.append("Phase 65 runtime generation evidence must pass before surface continuity")
    failures.extend(
        f"phase65 runtime generation: {failure}"
        for failure in evidence.get("phase65_runtime_generation_failures", [])
    )
    if evidence.get("temporary_local_artifacts") is not True:
        failures.append("temporary local artifacts are required")
    if evidence.get("provider_or_model_calls") is not False:
        failures.append("provider/model calls are not allowed")
    if evidence.get("async_task_or_worker_behavior") is not False:
        failures.append("async task or worker behavior is not allowed")
    if evidence.get("new_route_or_api_added") is not False:
        failures.append("new routes or APIs are not allowed")
    if evidence.get("route_ownership_changed") is not False:
        failures.append("route ownership changes are not allowed")
    for signal_name, passed in evidence.get("surface_source_signals", {}).items():
        if passed is not True:
            failures.append(f"surface source signal {signal_name} must be true")

    observed_world_ids = [world["world_id"] for world in evidence.get("worlds", [])]
    if observed_world_ids != SELECTED_WORLD_IDS:
        failures.append(f"world rows expected {SELECTED_WORLD_IDS!r}, got {observed_world_ids!r}")

    for world in evidence.get("worlds", []):
        world_id = world["world_id"]
        active_node_id = world.get("active_node_id")
        runtime = world.get("runtime_surface", {})
        explain = world.get("explain_surface", {})
        report = world.get("report_surface", {})
        review = world.get("review_surface", {})
        if runtime.get("runtime_surface_loadable") is not True:
            failures.append(f"{world_id}: runtime surface must load generated session workspace")
        if runtime.get("world_scoped_loader_guard") is not True:
            failures.append(f"{world_id}: runtime loader world guard must accept only matching world/session nodes")
        if runtime.get("lineage_node_ids") != ["node_root", active_node_id]:
            failures.append(f"{world_id}: runtime lineage must include root then generated node")
        if runtime.get("decision_summary_ready") is not True:
            failures.append(f"{world_id}: decision summary must load from the generated decision trace")
        if runtime.get("provider_backed_decision_trace_modes"):
            failures.append(f"{world_id}: provider-backed decision trace modes are not allowed")
        provider_modes = set(runtime.get("decision_provider_modes", []))
        if not provider_modes.issubset(ALLOWED_DECISION_TRACE_PROVIDER_MODES):
            failures.append(f"{world_id}: provider-backed decision trace modes are not allowed")
        if runtime.get("compare_delta_ready") is not True:
            failures.append(f"{world_id}: compare delta must be available")
        if runtime.get("comparison_rows_ready") is not True:
            failures.append(f"{world_id}: comparison rows must be available")
        if explain.get("explain_surface_claim_drilldowns_ready") is not True:
            failures.append(f"{world_id}: explain surface claim drilldowns must be available")
        if explain.get("relevant_claim_count", 0) <= 0:
            failures.append(f"{world_id}: explain surface must have relevant claims")
        if explain.get("evidence_chunk_count", 0) <= 0:
            failures.append(f"{world_id}: explain surface must resolve evidence chunks")
        if explain.get("related_runtime_turn_count", 0) <= 0:
            failures.append(f"{world_id}: explain surface must link claims to runtime turns")
        if report.get("report_surface_report_text_ready") is not True:
            failures.append(f"{world_id}: report surface must load node-scoped report text")
        if report.get("parsed_report_block_count", 0) <= 0:
            failures.append(f"{world_id}: report surface must parse report blocks")
        if review.get("review_surface_latest_session_ready") is not True:
            failures.append(f"{world_id}: review surface latest-session lookup must resolve generated session")
        if world.get("claims_have_labels_and_evidence_ids") is not True:
            failures.append(f"{world_id}: every report claim must keep label and evidence_ids")
        if world.get("claim_evidence_ids_resolve") is not True:
            failures.append(f"{world_id}: report claim evidence_ids must resolve to ingest chunks")
        if world.get("generated_decision_trace_provider_only") is not True:
            failures.append(f"{world_id}: generated decision trace must avoid provider/model rows")
        if world.get("provider_or_model_calls") is not False:
            failures.append(f"{world_id}: provider/model calls are not allowed")
        if world.get("async_task_or_worker_behavior") is not False:
            failures.append(f"{world_id}: async task or worker behavior is not allowed")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke-test Phase 66 selected-world generated runtime surface continuity."
    )
    parser.add_argument(
        "--artifacts-parent",
        help="Optional caller-managed directory for temporary runtime artifacts.",
    )
    args = parser.parse_args()

    evidence = collect_selected_world_generated_runtime_surface_continuity(
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
