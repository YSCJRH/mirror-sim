from __future__ import annotations

from datetime import UTC, datetime
import os
from pathlib import Path
from uuid import uuid4

from backend.app.domain.models import (
    Injection,
    PerturbationPayload,
    Scenario,
    SessionDecisionConfig,
    SessionNodeManifest,
    SessionNodeRecord,
    SimulationSessionManifest,
)
from backend.app.model_access import (
    HOSTED_PROVIDER,
    enforce_hosted_quota,
    hosted_model_id,
    validate_hosted_model_access,
)
from backend.app.reports.service import generate_report
from backend.app.perturbations import resolve_perturbation_payload
from backend.app.scenarios.service import load_scenario
from backend.app.simulation.service import (
    BranchRunArtifacts,
    load_run_artifacts,
    simulate_runtime_scenario,
    write_compare_artifact,
)
from backend.app.simulation.rules import load_simulation_plan
from backend.app.utils import ensure_dir, read_json, read_json_arg, slugify, write_json
from backend.app.worlds import list_world_ids, resolve_world_paths


def _created_at() -> str:
    return datetime.now(UTC).isoformat()


def _session_id(world_id: str, scenario_id: str) -> str:
    return f"session_{slugify(world_id)}_{slugify(scenario_id)}_{uuid4().hex[:8]}"


def _find_scenario_path(world_id: str, scenario_id: str, repo_root: Path | None = None) -> tuple[Path, Scenario]:
    world_paths = resolve_world_paths(world_id, repo_root=repo_root)
    for path in sorted(world_paths.scenario_dir.glob("*.yaml")):
        scenario = load_scenario(path)
        if scenario.scenario_id == scenario_id:
            return path, scenario

    raise ValueError(f"Unknown scenario_id `{scenario_id}` for world `{world_id}`.")


def _session_root(session_id: str, artifacts_root: Path) -> Path:
    return artifacts_root / "sessions" / session_id


def _session_path(session_id: str, artifacts_root: Path) -> Path:
    return _session_root(session_id, artifacts_root) / "session.json"


def _node_dir(session_id: str, node_id: str, artifacts_root: Path) -> Path:
    return _session_root(session_id, artifacts_root) / "nodes" / node_id


def _node_path(session_id: str, node_id: str, artifacts_root: Path) -> Path:
    return _node_dir(session_id, node_id, artifacts_root) / "node.json"


def _child_node_id(payload: PerturbationPayload) -> str:
    return f"node_{slugify(payload.kind)}_{uuid4().hex[:8]}"


def _scenario_path_for_session(
    session: SimulationSessionManifest, *, repo_root: Path | None
) -> Path:
    world_paths = resolve_world_paths(session.world_id, repo_root=repo_root)
    if session.scenario_path:
        return world_paths.repo_root / session.scenario_path
    return world_paths.baseline_scenario_path


def _load_session_manifest(session_id: str, artifacts_root: Path) -> SimulationSessionManifest:
    path = _session_path(session_id, artifacts_root)
    if not path.exists():
        raise ValueError(f"Unknown session_id `{session_id}` under `{artifacts_root}`.")
    return SimulationSessionManifest.model_validate(read_json(path))


def _write_session_manifest(session: SimulationSessionManifest, artifacts_root: Path) -> None:
    write_json(_session_path(session.session_id, artifacts_root), session.model_dump())


def _load_node_manifest(session_id: str, node_id: str, artifacts_root: Path) -> SessionNodeManifest:
    path = _node_path(session_id, node_id, artifacts_root)
    if not path.exists():
        raise ValueError(f"Unknown node_id `{node_id}` in session `{session_id}`.")
    return SessionNodeManifest.model_validate(read_json(path))


def _write_node_manifest(node: SessionNodeManifest, artifacts_root: Path) -> None:
    write_json(_node_path(node.session_id, node.node_id, artifacts_root), node.model_dump())


def _record_for_node(node: SessionNodeManifest, artifacts_root: Path) -> SessionNodeRecord:
    return SessionNodeRecord(
        node_id=node.node_id,
        parent_node_id=node.parent_node_id,
        status=node.status,
        label=node.label,
        node_path=_node_path(node.session_id, node.node_id, artifacts_root).relative_to(artifacts_root).as_posix(),
    )


def _resolve_session_artifacts_root(
    session_id: str,
    *,
    repo_root: Path | None,
    artifacts_root: Path | None,
) -> Path:
    if artifacts_root is not None:
        return artifacts_root

    for world_id in list_world_ids(repo_root=repo_root):
        world_paths = resolve_world_paths(world_id, repo_root=repo_root)
        candidate = world_paths.artifacts_root / "sessions" / session_id / "session.json"
        if candidate.exists():
            return world_paths.artifacts_root

    raise ValueError(f"Unknown session_id `{session_id}`.")


def _write_root_node(
    *,
    session_id: str,
    world_id: str,
    scenario_id: str,
    artifacts_root: Path,
) -> tuple[str, SessionNodeManifest, SessionNodeRecord]:
    node_id = "node_root"
    created_at = _created_at()
    node_path = _session_root(session_id, artifacts_root) / "nodes" / node_id / "node.json"
    node_manifest = SessionNodeManifest(
        node_id=node_id,
        session_id=session_id,
        parent_node_id=None,
        status="succeeded",
        world_id=world_id,
        scenario_id=scenario_id,
        label="Baseline checkpoint",
        perturbation=None,
        run_id=None,
        summary_path=None,
        trace_path=None,
        snapshot_dir=None,
        compare_path=None,
        report_path=None,
        claims_path=None,
        resolution_path=None,
        decision_trace_path=None,
        created_at=created_at,
        notes=[
            "Session root node created from baseline scenario.",
            "No generated branch artifacts exist yet for this node.",
        ],
    )
    write_json(node_path, node_manifest.model_dump())
    node_record = _record_for_node(node_manifest, artifacts_root)
    return node_id, node_manifest, node_record


def _parse_perturbation_payload(raw: str) -> PerturbationPayload:
    payload = read_json_arg(raw)
    return PerturbationPayload.model_validate(payload)


def _graph_and_personas_paths(world_id: str, *, repo_root: Path | None, artifacts_root: Path) -> tuple[Path, Path]:
    world_paths = resolve_world_paths(world_id, repo_root=repo_root)
    graph_path = artifacts_root / "graph" / "graph.json"
    personas_path = artifacts_root / "personas" / "personas.json"
    if graph_path.exists() and personas_path.exists():
        return graph_path, personas_path

    fallback_graph = world_paths.artifacts_root / "graph" / "graph.json"
    fallback_personas = world_paths.artifacts_root / "personas" / "personas.json"
    if fallback_graph.exists() and fallback_personas.exists():
        return fallback_graph, fallback_personas

    raise ValueError(
        f"Missing graph/persona artifacts for world `{world_id}`. Expected either "
        f"`{graph_path}` and `{personas_path}` or canonical world artifacts."
    )


def _payload_to_injection(payload: PerturbationPayload, *, suffix: str) -> Injection:
    parameters = dict(payload.parameters)
    actor_id = parameters.pop("actor_id", None)
    return Injection(
        injection_id=f"inj_{slugify(payload.kind)}_{suffix}",
        kind=payload.kind,
        target_id=payload.target_id,
        actor_id=actor_id,
        params=parameters,
        rationale=payload.summary,
    )


def _load_node_lineage(
    session: SimulationSessionManifest, node_id: str, artifacts_root: Path
) -> list[SessionNodeManifest]:
    lineage: list[SessionNodeManifest] = []
    current_node_id = node_id
    visited: set[str] = set()

    while True:
        if current_node_id in visited:
            raise ValueError(
                f"Detected a cycle while resolving lineage for node `{node_id}` in session `{session.session_id}`."
            )
        visited.add(current_node_id)
        node = _load_node_manifest(session.session_id, current_node_id, artifacts_root)
        lineage.append(node)
        if node.parent_node_id is None:
            break
        current_node_id = node.parent_node_id

    lineage.reverse()
    if not lineage or lineage[0].node_id != session.root_node_id:
        raise ValueError(
            f"Node lineage for `{node_id}` does not resolve back to root `{session.root_node_id}`."
        )
    return lineage


def _materialize_root_node(
    session: SimulationSessionManifest,
    *,
    repo_root: Path | None,
    artifacts_root: Path,
) -> SessionNodeManifest:
    root_node = _load_node_manifest(session.session_id, session.root_node_id, artifacts_root)
    if root_node.summary_path and root_node.trace_path and root_node.snapshot_dir:
        return root_node

    world_paths = resolve_world_paths(session.world_id, repo_root=repo_root)
    baseline_scenario = load_scenario(world_paths.baseline_scenario_path)
    graph_path, personas_path = _graph_and_personas_paths(session.world_id, repo_root=repo_root, artifacts_root=artifacts_root)
    run_dir = ensure_dir(_node_dir(session.session_id, root_node.node_id, artifacts_root) / "run")
    simulate_runtime_scenario(
        baseline_scenario,
        scenario_path=world_paths.baseline_scenario_path,
        graph_path=graph_path,
        personas_path=personas_path,
        out_dir=run_dir,
        run_id=f"run_{session.session_id}_{root_node.node_id}",
        branch_id="branch_reference",
        label="Reference",
        notes_prefix=["Session root baseline run materialized lazily."],
    )
    updated = root_node.model_copy(
        update={
            "summary_path": (run_dir.relative_to(artifacts_root) / "summary.json").as_posix(),
            "trace_path": (run_dir.relative_to(artifacts_root) / "run_trace.jsonl").as_posix(),
            "snapshot_dir": (run_dir.relative_to(artifacts_root) / "snapshots").as_posix(),
            "run_id": f"run_{session.session_id}_{root_node.node_id}",
            "report_path": None,
            "claims_path": None,
            "decision_trace_path": (_node_dir(session.session_id, root_node.node_id, artifacts_root).relative_to(artifacts_root) / "decision_trace.jsonl").as_posix(),
            "notes": [
                "Session root node created from baseline scenario.",
                "Baseline run artifacts materialized for parent-vs-child compare."
            ],
        }
    )
    _write_node_manifest(updated, artifacts_root)
    session.nodes = [_record_for_node(updated, artifacts_root) if node.node_id == updated.node_id else node for node in session.nodes]
    _write_session_manifest(session, artifacts_root)
    return updated


def _materialize_node(
    session: SimulationSessionManifest,
    node_id: str,
    *,
    repo_root: Path | None,
    artifacts_root: Path,
) -> SessionNodeManifest:
    if node_id == session.root_node_id:
        return _materialize_root_node(session, repo_root=repo_root, artifacts_root=artifacts_root)

    node = _load_node_manifest(session.session_id, node_id, artifacts_root)
    if not node.summary_path or not node.trace_path or not node.snapshot_dir:
        raise ValueError(
            f"Node `{node_id}` in session `{session.session_id}` is missing run artifacts and cannot be used as a parent checkpoint."
        )
    return node


def _load_branch_run_for_node(node: SessionNodeManifest, artifacts_root: Path) -> BranchRunArtifacts:
    if not node.summary_path:
        raise ValueError(f"Node `{node.node_id}` is missing summary_path.")

    run_dir = artifacts_root / Path(node.summary_path).parent
    summary, actions = load_run_artifacts(run_dir)
    return BranchRunArtifacts(
        branch_id=f"branch_{node.node_id}",
        label=node.label,
        summary=summary,
        actions=actions,
        run_dir=run_dir,
    )


def start_session(
    world_id: str,
    scenario_id: str,
    *,
    repo_root: Path | None = None,
    artifacts_root: Path | None = None,
    decision_provider: str | None = None,
    decision_model: str | None = None,
) -> SimulationSessionManifest:
    scenario_path, scenario = _find_scenario_path(world_id, scenario_id, repo_root=repo_root)

    if scenario.injections:
        raise ValueError("start-session requires a baseline scenario with no injections.")
    if scenario.branch_count != 1:
        raise ValueError("start-session requires a single-branch baseline scenario.")

    world_paths = resolve_world_paths(world_id, repo_root=repo_root)
    resolved_artifacts_root = artifacts_root or world_paths.artifacts_root
    session_id = _session_id(world_id, scenario_id)
    session_root = ensure_dir(_session_root(session_id, resolved_artifacts_root))
    resolved_provider = decision_provider or "openai_compatible"
    if resolved_provider not in {"openai_compatible", HOSTED_PROVIDER, "deterministic_only"}:
        raise ValueError(f"Unsupported decision provider `{resolved_provider}`.")
    resolved_decision_model = decision_model or os.environ.get("MIRROR_DECISION_MODEL")
    if resolved_provider == HOSTED_PROVIDER:
        resolved_decision_model = validate_hosted_model_access(
            model_id=decision_model or hosted_model_id()
        )
    if resolved_provider == "deterministic_only":
        resolved_decision_model = None
    root_node_id, _, root_record = _write_root_node(
        session_id=session_id,
        world_id=world_id,
        scenario_id=scenario_id,
        artifacts_root=resolved_artifacts_root,
    )
    session_manifest = SimulationSessionManifest(
        session_id=session_id,
        world_id=world_id,
        scenario_id=scenario_id,
        root_node_id=root_node_id,
        active_node_id=root_node_id,
        decision_config=SessionDecisionConfig(
            provider=resolved_provider,
            model_id=resolved_decision_model,
        ),
        created_at=_created_at(),
        nodes=[root_record],
    )
    payload = session_manifest.model_dump()
    payload["scenario_path"] = scenario_path.relative_to(world_paths.repo_root).as_posix()
    payload["session_path"] = (session_root / "session.json").relative_to(resolved_artifacts_root).as_posix()
    write_json(session_root / "session.json", payload)
    return SimulationSessionManifest.model_validate(payload)


def inspect_session(
    session_id: str,
    *,
    repo_root: Path | None = None,
    artifacts_root: Path | None = None,
) -> SimulationSessionManifest:
    resolved_artifacts_root = _resolve_session_artifacts_root(
        session_id,
        repo_root=repo_root,
        artifacts_root=artifacts_root,
    )
    session_path = resolved_artifacts_root / "sessions" / session_id / "session.json"
    return SimulationSessionManifest.model_validate(read_json(session_path))


def generate_branch(
    session_id: str,
    node_id: str,
    perturbation: str,
    *,
    repo_root: Path | None = None,
    artifacts_root: Path | None = None,
    beta_user_id: str | None = None,
) -> SimulationSessionManifest:
    resolved_artifacts_root = _resolve_session_artifacts_root(
        session_id,
        repo_root=repo_root,
        artifacts_root=artifacts_root,
    )

    session = _load_session_manifest(session_id, resolved_artifacts_root)
    quota_note = None
    if session.decision_config.provider == HOSTED_PROVIDER:
        validate_hosted_model_access(model_id=session.decision_config.model_id)
        quota_note = enforce_hosted_quota(
            repo_root=repo_root or Path(__file__).resolve().parents[3],
            user_id=beta_user_id,
            session_id=session_id,
        ).as_note()
    parent_node = _materialize_node(session, node_id, repo_root=repo_root, artifacts_root=resolved_artifacts_root)
    payload = _parse_perturbation_payload(perturbation)
    resolution = resolve_perturbation_payload(session.world_id, payload, repo_root=repo_root)
    normalized_payload = resolution.perturbation
    lineage = _load_node_lineage(session, node_id, artifacts_root)
    world_paths = resolve_world_paths(session.world_id, repo_root=repo_root)
    graph_path, personas_path = _graph_and_personas_paths(session.world_id, repo_root=repo_root, artifacts_root=resolved_artifacts_root)
    scenario = load_scenario(_scenario_path_for_session(session, repo_root=repo_root))
    child_node_id = _child_node_id(normalized_payload)
    injections = [
        _payload_to_injection(ancestor.perturbation, suffix=ancestor.node_id)
        for ancestor in lineage[1:]
        if ancestor.perturbation is not None
    ]
    injections.append(_payload_to_injection(normalized_payload, suffix=child_node_id))
    generated_scenario = scenario.model_copy(
        update={
            "scenario_id": f"{scenario.scenario_id}_{session.session_id}_{child_node_id}",
            "title": f"{scenario.title}: {normalized_payload.summary}",
            "description": normalized_payload.summary,
            "branch_count": 1,
            "injections": injections,
        }
    )
    generated_scenario = Scenario.model_validate(generated_scenario.model_dump())

    child_run_dir = ensure_dir(_node_dir(session_id, child_node_id, resolved_artifacts_root) / "run")
    child_branch_id = f"branch_{slugify(normalized_payload.kind)}_{child_node_id.removeprefix('node_')}"
    child_run = simulate_runtime_scenario(
        generated_scenario,
        scenario_path=_scenario_path_for_session(session, repo_root=repo_root),
        graph_path=graph_path,
        personas_path=personas_path,
        out_dir=child_run_dir,
        run_id=f"run_{session_id}_{child_node_id}",
        branch_id=child_branch_id,
        label=normalized_payload.summary,
        notes_prefix=[
            f"Generated from session {session_id}.",
            f"Parent node: {node_id}.",
            f"Lineage depth before this node: {len(lineage) - 1}.",
            f"Timing token: {normalized_payload.timing}.",
            f"Resolution hash: {resolution.resolution_hash}.",
            *([quota_note] if quota_note else []),
        ],
        decision_provider=session.decision_config.provider,
        decision_model_id=session.decision_config.model_id,
    )

    parent_branch = _load_branch_run_for_node(parent_node, resolved_artifacts_root)

    session_root = _session_root(session_id, resolved_artifacts_root)
    compare_dir = session_root / "compare" / child_node_id
    plan = load_simulation_plan(world_paths.simulation_rules_path)
    write_compare_artifact(
        session_root,
        compare_dir,
        scenario_id=generated_scenario.scenario_id,
        seed=generated_scenario.seed,
        branch_runs=[parent_branch, child_run],
        reference_branch_id=parent_branch.branch_id,
        tracked_outcomes=plan.tracked_outcomes,
    )
    report_dir = ensure_dir(_node_dir(session_id, child_node_id, resolved_artifacts_root) / "report")
    resolution_path = _node_dir(session_id, child_node_id, resolved_artifacts_root) / "resolution.json"
    write_json(resolution_path, resolution.model_dump())
    generate_report(
        child_run_dir,
        report_dir,
        baseline_dir=parent_branch.run_dir,
        simulation_rules_path=world_paths.simulation_rules_path,
    )

    child_node = SessionNodeManifest(
        node_id=child_node_id,
        session_id=session_id,
        parent_node_id=node_id,
        status="succeeded",
        world_id=session.world_id,
        scenario_id=generated_scenario.scenario_id,
        label=normalized_payload.summary,
        perturbation=normalized_payload,
        run_id=child_run.summary.run_id,
        summary_path=(child_run_dir.relative_to(resolved_artifacts_root) / "summary.json").as_posix(),
        trace_path=(child_run_dir.relative_to(resolved_artifacts_root) / "run_trace.jsonl").as_posix(),
        snapshot_dir=(child_run_dir.relative_to(resolved_artifacts_root) / "snapshots").as_posix(),
        compare_path=(compare_dir.relative_to(resolved_artifacts_root) / "compare.json").as_posix(),
        report_path=(report_dir.relative_to(resolved_artifacts_root) / "report.md").as_posix(),
        claims_path=(report_dir.relative_to(resolved_artifacts_root) / "claims.json").as_posix(),
        resolution_path=resolution_path.relative_to(resolved_artifacts_root).as_posix(),
        decision_trace_path=(
            _node_dir(session_id, child_node_id, resolved_artifacts_root).relative_to(resolved_artifacts_root)
            / "decision_trace.jsonl"
        ).as_posix(),
        created_at=_created_at(),
        notes=[
            "Generated from baseline checkpoint."
            if parent_node.node_id == session.root_node_id
            else f"Generated from session node {parent_node.node_id}.",
            f"Lineage depth before this node: {len(lineage) - 1}.",
            f"Timing token: {normalized_payload.timing}.",
            f"Resolution hash: {resolution.resolution_hash}.",
            *([quota_note] if quota_note else []),
            "Runtime report artifacts materialized for this node.",
        ],
    )
    _write_node_manifest(child_node, resolved_artifacts_root)

    session.active_node_id = child_node.node_id
    session.nodes.append(_record_for_node(child_node, resolved_artifacts_root))
    _write_session_manifest(session, resolved_artifacts_root)
    return session


def rollback_session(
    session_id: str,
    node_id: str,
    *,
    repo_root: Path | None = None,
    artifacts_root: Path | None = None,
) -> SimulationSessionManifest:
    resolved_artifacts_root = _resolve_session_artifacts_root(
        session_id,
        repo_root=repo_root,
        artifacts_root=artifacts_root,
    )

    session = _load_session_manifest(session_id, resolved_artifacts_root)
    _ = repo_root
    if not any(node.node_id == node_id for node in session.nodes):
        raise ValueError(f"Unknown rollback target `{node_id}` in session `{session_id}`.")
    session.active_node_id = node_id
    _write_session_manifest(session, resolved_artifacts_root)
    return session
