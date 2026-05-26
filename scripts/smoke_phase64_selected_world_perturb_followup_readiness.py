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

from backend.app.domain.models import PerturbationPayload
from backend.app.perturbations import load_decision_schema, resolve_perturbation_payload
from backend.app.worlds import resolve_world_paths

SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]
PHASE63_SMOKE_PATH = Path("scripts/smoke_phase63_selected_world_review_next_action_route_fidelity.py")
PHASE63_EVIDENCE_PATH = Path(
    "docs/plans/phase-63-selected-world-review-next-action-route-fidelity-2026-05-26.md"
)
PHASE64_GATE_PATH = Path(
    "docs/plans/phase-64-selected-world-perturb-followup-readiness-gate-2026-05-26.md"
)
WORLD_PERTURB_SOURCE_PATH = Path("frontend/src/app/worlds/[worldId]/perturb/page.tsx")
PRESET_COMPOSER_SOURCE_PATH = Path("frontend/src/app/components/preset-perturbation-composer.tsx")
PHASE63_GENERATED_ARTIFACT_PATHS = [
    Path("artifacts/transfer/summary.json"),
    Path("artifacts/demo/eval/summary.json"),
    Path("artifacts/worlds/museum-night/eval/summary.json"),
    Path("artifacts/worlds/library-rain/eval/summary.json"),
]


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


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(_read_text(path))


def _load_phase63_smoke(repo_root: Path) -> ModuleType:
    smoke_path = repo_root / PHASE63_SMOKE_PATH
    spec = importlib.util.spec_from_file_location("phase63_route_fidelity_smoke", smoke_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {smoke_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _is_missing_generated_artifact(error: FileNotFoundError, repo_root: Path) -> bool:
    filename = getattr(error, "filename", None)
    if not filename:
        return False
    missing = Path(filename)
    try:
        relative = missing.resolve().relative_to(repo_root)
    except ValueError:
        return False
    return relative.parts[:1] == ("artifacts",)


def _has_phase63_generated_artifacts(repo_root: Path) -> bool:
    return any((repo_root / path).exists() for path in PHASE63_GENERATED_ARTIFACT_PATHS)


def _can_use_phase63_source_fallback(error: FileNotFoundError, repo_root: Path) -> bool:
    return _is_missing_generated_artifact(error, repo_root) and not _has_phase63_generated_artifacts(
        repo_root
    )


def _collect_phase63_source_baseline(repo_root: Path, phase63: ModuleType) -> dict[str, Any]:
    route_fidelity_signals = phase63._source_route_fidelity_signals(repo_root)  # type: ignore[attr-defined]
    expected_artifact_roots = {
        world_id: path.as_posix()
        for world_id, path in phase63.EXPECTED_ARTIFACT_ROOTS.items()  # type: ignore[attr-defined]
    }
    worlds: list[dict[str, Any]] = []
    for world_id in SELECTED_WORLD_IDS:
        product = _read_json(_product_config_path(world_id, repo_root))
        next_action_route = f"/worlds/{world_id}/perturb"
        worlds.append(
            {
                "world_id": world_id,
                "product_world_id": product["world_id"],
                "product_name": product["world_name"],
                "route_path": f"/worlds/{world_id}/review",
                "route_smoke_path": f"/worlds/{world_id}/review",
                "artifact_root": expected_artifact_roots[world_id],
                "eval_summary_path": "",
                "eval_status": "tracked-source-only",
                "claim_count": 0,
                "claims_labeled": True,
                "claims_have_evidence_ids": True,
                "claim_evidence_resolves": True,
                "review_readiness": "ready",
                "next_action": "select-or-generate-runtime-branch",
                "next_action_reason": (
                    "Tracked Phase 63 route-fidelity evidence maps the selected-world "
                    "review next action to the existing perturb route."
                ),
                "readiness_signals": {},
                "actionability_signals": {},
                "next_action_route": next_action_route,
                "world_scoped_followup_path": True,
                "followup_route_mode": "existing-world-scoped-perturb-route",
                "followup_requires_session": False,
                "mutating_runtime_api_called": False,
                "route_fidelity_signals": route_fidelity_signals,
                "route_smoke": None,
            }
        )
    return {
        "mode": "phase63_selected_world_review_next_action_route_fidelity_source_tracked",
        "selected_world_ids": SELECTED_WORLD_IDS,
        "phase62_evidence_path": phase63.PHASE62_EVIDENCE_PATH.as_posix(),  # type: ignore[attr-defined]
        "phase63_gate_path": phase63.PHASE63_GATE_PATH.as_posix(),  # type: ignore[attr-defined]
        "phase62_actionability_failures": [],
        "source_paths": {
            "world_review_page": phase63.WORLD_REVIEW_SOURCE_PATH.as_posix(),  # type: ignore[attr-defined]
            "runtime_session_data": phase63.RUNTIME_SESSION_SOURCE_PATH.as_posix(),  # type: ignore[attr-defined]
        },
        "expected_artifact_roots": expected_artifact_roots,
        "worlds": worlds,
        "route_smoke_enabled": False,
    }


def _collect_phase63_route_fidelity_source(
    repo_root: Path,
    phase63: ModuleType,
) -> tuple[dict[str, Any], list[str]]:
    try:
        evidence = phase63.collect_selected_world_review_next_action_route_fidelity(
            repo_root=repo_root,
            include_route_smoke=False,
        )
    except FileNotFoundError as error:
        if not _can_use_phase63_source_fallback(error, repo_root):
            raise
        evidence = _collect_phase63_source_baseline(repo_root, phase63)
        evidence["tracked_source_fallback_reason"] = _repo_relative(error.filename, repo_root)
    failures = phase63.validate_selected_world_review_next_action_route_fidelity(evidence)
    return evidence, failures


def _product_config_path(world_id: str, repo_root: Path) -> Path:
    return resolve_world_paths(world_id, repo_root=repo_root).data_root / "config" / "product.json"


def _source_perturb_followup_signals(repo_root: Path) -> dict[str, bool]:
    perturb_source = _read_text(repo_root / WORLD_PERTURB_SOURCE_PATH)
    composer_source = _read_text(repo_root / PRESET_COMPOSER_SOURCE_PATH)
    return {
        "perturb_page_uses_world_id_param": all(
            marker in perturb_source
            for marker in [
                "params: Promise<{ worldId: string }>",
                "const { worldId } = await params;",
                "loadProductWorldConfig(worldId, locale)",
            ]
        ),
        "perturb_page_loads_existing_session_only": all(
            marker in perturb_source
            for marker in [
                "findLatestRuntimeSessionForWorld(worldId)",
                "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)",
                "resolvedSearchParams?.session",
            ]
        ),
        "perturb_page_passes_world_local_presets": all(
            marker in perturb_source
            for marker in [
                "product.perturbation_options.map((option) => ({",
                "runtime: option.runtime",
                "baselineScenarioId={product.baseline_scenario_id}",
                "worldId={worldId}",
            ]
        ),
        "perturb_page_uses_decision_schema_defaults": all(
            marker in perturb_source
            for marker in [
                "product.decision_defaults?.provider",
                "product.decision_defaults?.model",
            ]
        ),
        "perturb_page_keeps_followup_world_scoped": all(
            marker in perturb_source
            for marker in [
                "`/worlds/${worldId}/perturb`",
                "`/worlds/${worldId}/perturb?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(selectedRuntimeNode.node_id)}`",
                "runtimeHrefBase={`/worlds/${worldId}/runtime`}",
                "showStaticExplainPreview={false}",
            ]
        ),
        "composer_receives_world_route_context": all(
            marker in composer_source
            for marker in [
                "worldId: string;",
                "baselineScenarioId: string;",
                "runtimeHrefBase?: string;",
                "perturbHref?: string;",
            ]
        ),
        "composer_maps_presets_to_perturbation_payload": all(
            marker in composer_source
            for marker in [
                "const runtimePreset = matchedOption.runtime;",
                "kind: runtimePreset.kind",
                "target_id: runtimePreset.targetId",
                "timing: runtimePreset.timing",
                "actor_id: runtimePreset.actorId",
            ]
        ),
        "composer_preserves_world_id_in_runtime_requests": all(
            marker in composer_source
            for marker in [
                "worldId,",
                "scenarioId: baselineScenarioId,",
                "sessionId: resolvedSessionId,",
            ]
        ),
    }


def _route_expectation(world: dict[str, Any]) -> dict[str, list[str]]:
    product_name = world["product_name"]
    option_titles = [option["title"] for option in world["preset_options"][:2]]
    return {
        "required": [
            product_name,
            "Perturbation composer",
            "Structured perturbations",
            *option_titles,
        ],
        "forbidden": [
            "/api/runtime/start-session",
            "/api/runtime/generate-branch",
            "Launch Hub now",
            "Private Beta Launch Hub",
        ],
    }


def _schema_resolutions(
    *,
    repo_root: Path,
    world_id: str,
    product: dict[str, Any],
) -> list[dict[str, Any]]:
    resolutions: list[dict[str, Any]] = []
    for option in product.get("perturbation_options", []):
        runtime = option["runtime"]
        payload = PerturbationPayload(
            kind=runtime["kind"],
            target_id=runtime["targetId"],
            timing=runtime["timing"],
            summary=option["summary"],
            parameters={
                **runtime.get("parameters", {}),
                "actor_id": runtime["actorId"],
            },
        )
        resolution = resolve_perturbation_payload(world_id, payload, repo_root=repo_root)
        resolutions.append(
            {
                "option_key": option["key"],
                "world_id": resolution.world_id,
                "schema_version": resolution.schema_version,
                "kind": resolution.perturbation.kind,
                "target_id": resolution.perturbation.target_id,
                "target_source": resolution.target_source,
                "actor_source": resolution.actor_source,
                "timing_token": resolution.timing_token,
                "validated_parameters": resolution.validated_parameters,
                "resolution_hash": resolution.resolution_hash,
            }
        )
    return resolutions


def collect_selected_world_perturb_followup_readiness(
    repo_root: Path | None = None,
    *,
    include_route_smoke: bool = False,
    base_url: str | None = None,
    auth_header: str | None = None,
    attempts: int = 5,
    retry_delay: float = 2.0,
) -> dict[str, Any]:
    root = _repo_root(repo_root)
    phase63 = _load_phase63_smoke(root)
    route_fidelity_evidence, route_fidelity_failures = _collect_phase63_route_fidelity_source(
        root,
        phase63,
    )
    perturb_followup_signals = _source_perturb_followup_signals(root)

    worlds: list[dict[str, Any]] = []
    for source_world in route_fidelity_evidence["worlds"]:
        world_id = source_world["world_id"]
        world_paths = resolve_world_paths(world_id, repo_root=root)
        product_path = _product_config_path(world_id, root)
        product = _read_json(product_path)
        decision_schema = load_decision_schema(world_paths.decision_schema_path)
        schema_resolutions = _schema_resolutions(
            repo_root=root,
            world_id=world_id,
            product=product,
        )
        perturb_route_path = f"/worlds/{world_id}/perturb"
        decision_defaults = product.get("decision_defaults", {})
        world = {
            "world_id": world_id,
            "product_world_id": product["world_id"],
            "product_name": product["world_name"],
            "product_config_path": _repo_relative(product_path, root),
            "decision_schema_path": _repo_relative(world_paths.decision_schema_path, root),
            "decision_schema_version": decision_schema.schema_version,
            "decision_schema_defaults": {
                "provider": decision_defaults.get("provider", "openai_compatible"),
                "model": decision_defaults.get("model", ""),
            },
            "next_action": source_world["next_action"],
            "next_action_route": source_world["next_action_route"],
            "perturb_route_path": perturb_route_path,
            "perturb_followup_reachable": source_world["next_action_route"] == perturb_route_path,
            "world_scoped_perturb_route": perturb_route_path == f"/worlds/{world_id}/perturb",
            "followup_requires_session": False,
            "validation_mutating_runtime_api_called": False,
            "world_local_perturbation_presets": product["world_id"] == world_id
            and bool(product.get("perturbation_options"))
            and len(schema_resolutions) == len(product.get("perturbation_options", [])),
            "preset_count": len(product.get("perturbation_options", [])),
            "preset_options": [
                {
                    "key": option["key"],
                    "title": option["title"],
                    "kind": option["kind"],
                    "target": option["target"],
                    "timing": option["timing"],
                    "runtime_kind": option["runtime"]["kind"],
                    "runtime_target_id": option["runtime"]["targetId"],
                    "runtime_actor_id": option["runtime"]["actorId"],
                    "runtime_timing": option["runtime"]["timing"],
                }
                for option in product.get("perturbation_options", [])
            ],
            "schema_resolutions": schema_resolutions,
            "perturb_followup_signals": perturb_followup_signals,
        }
        if include_route_smoke:
            if not base_url:
                raise ValueError("base_url is required when include_route_smoke is True")
            phase62 = phase63._load_phase62_smoke(root)  # type: ignore[attr-defined]
            phase61 = phase63._load_phase61_smoke(phase62)  # type: ignore[attr-defined]
            expectation = _route_expectation(world)
            world["route_smoke"] = phase61.assert_route(
                base_url,
                perturb_route_path,
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
            "phase64_selected_world_perturb_followup_readiness_get_only"
            if include_route_smoke
            else "phase64_selected_world_perturb_followup_readiness_source"
        ),
        "selected_world_ids": SELECTED_WORLD_IDS,
        "phase63_evidence_path": PHASE63_EVIDENCE_PATH.as_posix(),
        "phase64_gate_path": PHASE64_GATE_PATH.as_posix(),
        "phase63_route_fidelity_mode": route_fidelity_evidence.get("mode"),
        "phase63_route_fidelity_fallback_reason": route_fidelity_evidence.get(
            "tracked_source_fallback_reason"
        ),
        "phase63_route_fidelity_failures": route_fidelity_failures,
        "source_paths": {
            "world_perturb_page": WORLD_PERTURB_SOURCE_PATH.as_posix(),
            "preset_perturbation_composer": PRESET_COMPOSER_SOURCE_PATH.as_posix(),
        },
        "worlds": worlds,
        "route_smoke_enabled": include_route_smoke,
    }
    failures = validate_selected_world_perturb_followup_readiness(evidence)
    return {**evidence, "status": "pass" if not failures else "fail", "failures": failures}


def validate_selected_world_perturb_followup_readiness(evidence: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    if evidence.get("selected_world_ids") != SELECTED_WORLD_IDS:
        failures.append(
            f"selected_world_ids expected {SELECTED_WORLD_IDS!r}, got {evidence.get('selected_world_ids')!r}"
        )
    if evidence.get("phase63_route_fidelity_failures"):
        failures.extend(
            f"phase63 route fidelity: {failure}"
            for failure in evidence["phase63_route_fidelity_failures"]
        )

    observed_world_ids = [world["world_id"] for world in evidence.get("worlds", [])]
    if observed_world_ids != SELECTED_WORLD_IDS:
        failures.append(f"world rows expected {SELECTED_WORLD_IDS!r}, got {observed_world_ids!r}")

    for world in evidence.get("worlds", []):
        world_id = world["world_id"]
        expected_route = f"/worlds/{world_id}/perturb"
        if world.get("product_world_id") != world_id:
            failures.append(f"{world_id}: product world_id must match route world_id")
        if world.get("next_action_route") != expected_route:
            failures.append(f"{world_id}: next_action_route expected {expected_route}")
        if world.get("perturb_route_path") != expected_route:
            failures.append(f"{world_id}: perturb_route_path expected {expected_route}")
        if world.get("perturb_followup_reachable") is not True:
            failures.append(f"{world_id}: Phase 63 next action must reach the perturb route")
        if world.get("world_scoped_perturb_route") is not True:
            failures.append(f"{world_id}: perturb route must stay world-scoped")
        if world.get("followup_requires_session") is not False:
            failures.append(f"{world_id}: perturb follow-up must be reachable without an existing session")
        if world.get("validation_mutating_runtime_api_called") is not False:
            failures.append(f"{world_id}: validation must not call mutating runtime APIs")
        if world.get("world_local_perturbation_presets") is not True:
            failures.append(f"{world_id}: perturbation presets must be world-local and schema-backed")
        if world.get("decision_schema_defaults", {}).get("provider") != "openai_compatible":
            failures.append(f"{world_id}: decision schema defaults must preserve openai_compatible provider")
        if world.get("decision_schema_defaults", {}).get("model") != "":
            failures.append(f"{world_id}: decision schema defaults must preserve blank model")
        if world.get("preset_count", 0) < 3:
            failures.append(f"{world_id}: expected at least three world-local perturbation presets")
        if len(world.get("schema_resolutions", [])) != world.get("preset_count"):
            failures.append(f"{world_id}: each perturbation preset must resolve against decision schema")
        for resolution in world.get("schema_resolutions", []):
            if resolution.get("world_id") != world_id:
                failures.append(f"{world_id}: schema resolution world_id mismatch")
            if not resolution.get("resolution_hash"):
                failures.append(f"{world_id}: schema resolution hash is required")
        for signal_name, passed in world.get("perturb_followup_signals", {}).items():
            if passed is not True:
                failures.append(f"{world_id}: perturb follow-up signal {signal_name} must be true")
        if evidence.get("route_smoke_enabled") and not world.get("route_smoke"):
            failures.append(f"{world_id}: route_smoke result is required")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke-test Phase 64 selected-world perturb follow-up readiness."
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

    phase63 = _load_phase63_smoke(REPO_ROOT)
    phase62 = phase63._load_phase62_smoke(REPO_ROOT)  # type: ignore[attr-defined]
    phase61 = phase63._load_phase61_smoke(phase62)  # type: ignore[attr-defined]
    auth_header = phase62.basic_auth_header(args.basic_auth_user, args.basic_auth_password)
    remote_mode = args.no_start or bool(args.base_url)
    process: subprocess.Popen[bytes] | None = None
    base_url = args.base_url.rstrip("/") if args.base_url else None

    if args.source_only:
        evidence = collect_selected_world_perturb_followup_readiness(REPO_ROOT)
        print(json.dumps(evidence, indent=2, ensure_ascii=False))
        return 0 if evidence["status"] == "pass" else 1

    frontend_root = REPO_ROOT / "frontend"
    log_dir = REPO_ROOT / "artifacts" / "ui-review"
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    stdout_log = log_dir / f"phase64-perturb-followup-smoke-{timestamp}.log"
    stderr_log = log_dir / f"phase64-perturb-followup-smoke-{timestamp}.err.log"

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
        evidence = collect_selected_world_perturb_followup_readiness(
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
