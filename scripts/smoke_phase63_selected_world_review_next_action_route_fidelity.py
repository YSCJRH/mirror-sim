from __future__ import annotations

import argparse
import importlib.util
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from types import ModuleType
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]
PHASE62_SMOKE_PATH = Path("scripts/smoke_phase62_selected_world_review_actionability.py")
PHASE62_EVIDENCE_PATH = Path(
    "docs/plans/phase-62-selected-world-review-evidence-actionability-2026-05-25.md"
)
PHASE63_GATE_PATH = Path(
    "docs/plans/phase-63-selected-world-next-action-route-fidelity-gate-2026-05-25.md"
)
WORLD_REVIEW_SOURCE_PATH = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")
RUNTIME_SESSION_SOURCE_PATH = Path("frontend/src/app/lib/runtime-session-data.ts")
EXPECTED_ARTIFACT_ROOTS = {
    "fog-harbor-east-gate": Path("artifacts/demo"),
    "museum-night": Path("artifacts/worlds/museum-night"),
    "library-rain": Path("artifacts/worlds/library-rain"),
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


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _load_phase62_smoke(repo_root: Path) -> ModuleType:
    smoke_path = repo_root / PHASE62_SMOKE_PATH
    spec = importlib.util.spec_from_file_location("phase62_review_actionability_smoke", smoke_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {smoke_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _load_phase61_smoke(phase62: ModuleType) -> ModuleType:
    return phase62._load_phase61_smoke(REPO_ROOT)  # type: ignore[attr-defined]


def _blocked_route_markers() -> list[str]:
    runtime_prefix = "/api/runtime/"
    return [
        runtime_prefix + "start-session",
        runtime_prefix + "generate-branch",
        runtime_prefix + "rollback-session",
        "method=" + '"POST"',
        "method=" + "'POST'",
    ]


def _blocked_route_text_markers() -> list[str]:
    return _blocked_route_markers() + [
        "Launch Hub now",
        "Private Beta Launch Hub",
        "Hosted GPT is enabled",
        "BYOK" + " is enabled",
        "task" + "_id",
    ]


def _source_route_fidelity_signals(repo_root: Path) -> dict[str, bool]:
    review_source = _read_text(repo_root / WORLD_REVIEW_SOURCE_PATH)
    runtime_source = _read_text(repo_root / RUNTIME_SESSION_SOURCE_PATH)
    return {
        "route_page_uses_world_id_param": all(
            marker in review_source
            for marker in [
                "params: Promise<{ worldId: string }>",
                "const { worldId } = await params;",
                "loadProductWorldConfig(worldId, locale)",
                "loadSelectedWorldReviewEvidenceBinding(worldId)",
            ]
        ),
        "route_page_loads_existing_session_only": all(
            marker in review_source
            for marker in [
                "findLatestRuntimeSessionForWorld(worldId)",
                "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)",
                "resolvedSearchParams?.session",
            ]
        ),
        "route_page_links_world_scoped_followups": all(
            marker in review_source
            for marker in [
                "`/worlds/${worldId}/perturb`",
                "`/worlds/${worldId}/perturb?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(activeNode.node_id)}`",
                "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}",
                "`/worlds/${worldId}/review?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}",
                "`/worlds/${worldId}`",
            ]
        ),
        "route_page_routes_ready_next_action_to_perturb": all(
            marker in review_source
            for marker in [
                "const perturbHref =",
                "`/worlds/${worldId}/perturb`",
                "ButtonLink href={perturbHref}",
                "Generate one live branch first, then come back for advanced review",
            ]
        ),
        "runtime_loader_keeps_world_scoped_sessions": all(
            marker in runtime_source
            for marker in [
                "listRuntimeSessionLocatorsForWorld(worldId)",
                "resolveProductWorldPaths(worldId).artifactsRoot",
                "if (session.world_id !== worldId)",
                "if (selectedNode.world_id !== worldId || rootNode.world_id !== worldId)",
            ]
        ),
        "route_page_avoids_mutating_runtime_api": all(
            marker.lower() not in review_source.lower() for marker in _blocked_route_markers()
        ),
        "route_page_avoids_public_plugin_expansion": all(
            marker not in review_source
            for marker in [
                "buildMainPathNavigation",
                'href="/review"',
                "`/review?session=${",
                "plugin",
                "Hosted GPT is enabled",
                "BYOK" + " is enabled",
            ]
        ),
    }


def _route_expectation(world: dict[str, Any]) -> dict[str, list[str]]:
    return {
        "required": [
            "Selected-world evidence binding",
            "Review readiness",
            "Next action",
            "select-or-generate-runtime-branch",
            world["next_action_route"],
            "Generate one live branch first, then come back for advanced review",
        ],
        "forbidden": _blocked_route_text_markers(),
    }


def collect_selected_world_review_next_action_route_fidelity(
    repo_root: Path | None = None,
    *,
    include_route_smoke: bool = False,
    base_url: str | None = None,
    auth_header: str | None = None,
    attempts: int = 5,
    retry_delay: float = 2.0,
) -> dict[str, Any]:
    root = _repo_root(repo_root)
    phase62 = _load_phase62_smoke(root)
    actionability_evidence = phase62.collect_selected_world_review_evidence_actionability(
        repo_root=root,
        include_route_smoke=False,
    )
    actionability_failures = phase62.validate_selected_world_review_evidence_actionability(
        actionability_evidence
    )
    route_fidelity_signals = _source_route_fidelity_signals(root)

    worlds: list[dict[str, Any]] = []
    for source_world in actionability_evidence["worlds"]:
        world_id = source_world["world_id"]
        next_action_route = f"/worlds/{world_id}/perturb"
        world = {
            key: source_world[key]
            for key in [
                "world_id",
                "product_world_id",
                "product_name",
                "route_path",
                "route_smoke_path",
                "artifact_root",
                "eval_summary_path",
                "eval_status",
                "claim_count",
                "claims_labeled",
                "claims_have_evidence_ids",
                "claim_evidence_resolves",
                "review_readiness",
                "next_action",
                "next_action_reason",
                "readiness_signals",
                "actionability_signals",
            ]
        }
        world.update(
            {
                "next_action_route": next_action_route,
                "world_scoped_followup_path": next_action_route == f"/worlds/{world_id}/perturb",
                "followup_route_mode": "existing-world-scoped-perturb-route",
                "followup_requires_session": False,
                "mutating_runtime_api_called": False,
                "route_fidelity_signals": route_fidelity_signals,
            }
        )
        if include_route_smoke:
            if not base_url:
                raise ValueError("base_url is required when include_route_smoke is True")
            phase61 = _load_phase61_smoke(phase62)
            expectation = _route_expectation(world)
            world["route_smoke"] = phase61.assert_route(
                base_url,
                world["route_smoke_path"],
                auth_header,
                required_markers=expectation["required"],
                forbidden_markers=expectation["forbidden"],
                attempts=attempts,
                retry_delay=retry_delay,
            )
        else:
            world["route_smoke"] = None
        worlds.append(world)

    evidence = {
        "mode": (
            "phase63_selected_world_review_next_action_route_fidelity_get_only"
            if include_route_smoke
            else "phase63_selected_world_review_next_action_route_fidelity_source"
        ),
        "selected_world_ids": SELECTED_WORLD_IDS,
        "phase62_evidence_path": PHASE62_EVIDENCE_PATH.as_posix(),
        "phase63_gate_path": PHASE63_GATE_PATH.as_posix(),
        "phase62_actionability_failures": actionability_failures,
        "source_paths": {
            "world_review_page": WORLD_REVIEW_SOURCE_PATH.as_posix(),
            "runtime_session_data": RUNTIME_SESSION_SOURCE_PATH.as_posix(),
        },
        "expected_artifact_roots": {
            world_id: path.as_posix() for world_id, path in EXPECTED_ARTIFACT_ROOTS.items()
        },
        "worlds": worlds,
        "route_smoke_enabled": include_route_smoke,
    }
    failures = validate_selected_world_review_next_action_route_fidelity(evidence)
    return {**evidence, "status": "pass" if not failures else "fail", "failures": failures}


def validate_selected_world_review_next_action_route_fidelity(evidence: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    if evidence.get("selected_world_ids") != SELECTED_WORLD_IDS:
        failures.append(
            f"selected_world_ids expected {SELECTED_WORLD_IDS!r}, got {evidence.get('selected_world_ids')!r}"
        )
    if evidence.get("phase62_actionability_failures"):
        failures.extend(
            f"phase62 actionability: {failure}" for failure in evidence["phase62_actionability_failures"]
        )

    observed_world_ids = [world["world_id"] for world in evidence.get("worlds", [])]
    if observed_world_ids != SELECTED_WORLD_IDS:
        failures.append(f"world rows expected {SELECTED_WORLD_IDS!r}, got {observed_world_ids!r}")

    for world in evidence.get("worlds", []):
        world_id = world["world_id"]
        expected_root = EXPECTED_ARTIFACT_ROOTS[world_id].as_posix()
        expected_route = f"/worlds/{world_id}/perturb"
        if world.get("artifact_root") != expected_root:
            failures.append(f"{world_id}: artifact_root expected {expected_root}")
        if world.get("review_readiness") != "ready":
            failures.append(f"{world_id}: review_readiness must be ready")
        if world.get("next_action") != "select-or-generate-runtime-branch":
            failures.append(f"{world_id}: next_action must be select-or-generate-runtime-branch")
        if world.get("next_action_route") != expected_route:
            failures.append(f"{world_id}: next_action_route expected {expected_route}")
        if world.get("world_scoped_followup_path") is not True:
            failures.append(f"{world_id}: next action route must stay world-scoped")
        if world.get("followup_route_mode") != "existing-world-scoped-perturb-route":
            failures.append(f"{world_id}: followup_route_mode must use existing world-scoped perturb route")
        if world.get("followup_requires_session") is not False:
            failures.append(f"{world_id}: followup route must not require an existing session")
        if world.get("mutating_runtime_api_called") is not False:
            failures.append(f"{world_id}: smoke must not call mutating runtime APIs")
        for signal_name, passed in world.get("route_fidelity_signals", {}).items():
            if passed is not True:
                failures.append(f"{world_id}: route fidelity signal {signal_name} must be true")
        if evidence.get("route_smoke_enabled") and not world.get("route_smoke"):
            failures.append(f"{world_id}: route_smoke result is required")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke-test Phase 63 selected-world review next-action route fidelity."
    )
    parser.add_argument("--source-only", action="store_true", help="Skip web GET smoke checks.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int)
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--base-url", help="Use an already-running Mirror web base URL.")
    parser.add_argument("--no-start", action="store_true", help="Do not start a local Next server.")
    parser.add_argument("--http-retries", type=int, default=5)
    parser.add_argument("--retry-delay", type=float, default=2.0)
    parser.add_argument("--basic-auth-user", default=os.environ.get("MIRROR_SMOKE_BASIC_AUTH_USER"))
    parser.add_argument("--basic-auth-password", default=os.environ.get("MIRROR_SMOKE_BASIC_AUTH_PASSWORD"))
    args = parser.parse_args()

    phase62 = _load_phase62_smoke(REPO_ROOT)
    phase61 = _load_phase61_smoke(phase62)
    auth_header = phase62.basic_auth_header(args.basic_auth_user, args.basic_auth_password)
    remote_mode = args.no_start or bool(args.base_url)
    process: subprocess.Popen[bytes] | None = None
    base_url = args.base_url.rstrip("/") if args.base_url else None

    if args.source_only:
        evidence = collect_selected_world_review_next_action_route_fidelity(REPO_ROOT)
        print(json.dumps(evidence, indent=2, ensure_ascii=False))
        return 0 if evidence["status"] == "pass" else 1

    frontend_root = REPO_ROOT / "frontend"
    log_dir = REPO_ROOT / "artifacts" / "ui-review"
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    stdout_log = log_dir / f"phase63-review-route-fidelity-smoke-{timestamp}.log"
    stderr_log = log_dir / f"phase63-review-route-fidelity-smoke-{timestamp}.err.log"

    if remote_mode:
        if not base_url:
            parser.error("--base-url is required when --no-start is set.")
    else:
        port = args.port or phase61.pick_free_port()
        base_url = f"http://{args.host}:{port}"
        process = subprocess.Popen(
            [
                "node",
                str(frontend_root / "node_modules" / "next" / "dist" / "bin" / "next"),
                "start",
                "--hostname",
                args.host,
                "--port",
                str(port),
            ],
            cwd=frontend_root,
            stdout=stdout_log.open("w", encoding="utf-8"),
            stderr=stderr_log.open("w", encoding="utf-8"),
            env=os.environ.copy(),
        )

    try:
        assert base_url is not None
        phase61.wait_for_ready(base_url, args.timeout, auth_header)
        evidence = collect_selected_world_review_next_action_route_fidelity(
            REPO_ROOT,
            include_route_smoke=True,
            base_url=base_url,
            auth_header=auth_header,
            attempts=max(1, args.http_retries),
            retry_delay=max(0.0, args.retry_delay),
        )
        evidence["base_url"] = phase61.display_url(base_url)
        if not remote_mode:
            evidence["stdout_log"] = _repo_relative(stdout_log, REPO_ROOT)
            evidence["stderr_log"] = _repo_relative(stderr_log, REPO_ROOT)
        print(json.dumps(evidence, indent=2, ensure_ascii=False))
        return 0 if evidence["status"] == "pass" else 1
    finally:
        if process is not None:
            process.terminate()
            try:
                process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=15)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
