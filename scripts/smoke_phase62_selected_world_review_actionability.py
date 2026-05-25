from __future__ import annotations

import argparse
import base64
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
PHASE61_SMOKE_PATH = Path("scripts/smoke_phase61_selected_world_review_surface_binding.py")
PHASE61_EVIDENCE_PATH = Path(
    "docs/plans/phase-61-selected-world-review-surface-evidence-binding-2026-05-23.md"
)
PHASE62_GATE_PATH = Path(
    "docs/plans/phase-62-selected-world-review-evidence-actionability-gate-2026-05-25.md"
)
WORLD_REVIEW_SOURCE_PATH = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")
SELECTED_WORLD_REVIEW_EVIDENCE_SOURCE_PATH = Path(
    "frontend/src/app/lib/selected-world-review-evidence.ts"
)
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


def _load_phase61_smoke(repo_root: Path) -> ModuleType:
    smoke_path = repo_root / PHASE61_SMOKE_PATH
    spec = importlib.util.spec_from_file_location("phase61_review_surface_binding_smoke", smoke_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {smoke_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def basic_auth_header(user: str | None, password: str | None) -> str | None:
    if not user and not password:
        return None
    if not user or password is None:
        raise ValueError("Both --basic-auth-user and --basic-auth-password are required for Basic Auth.")
    token = base64.b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def _source_actionability_signals(repo_root: Path) -> dict[str, bool]:
    review_source = _read_text(repo_root / WORLD_REVIEW_SOURCE_PATH)
    review_evidence_source = _read_text(repo_root / SELECTED_WORLD_REVIEW_EVIDENCE_SOURCE_PATH)
    read_only_forbidden_markers = [
        "start-session",
        "generate-branch",
        "rollback-session",
        "BYOK is enabled",
    ]
    return {
        "review_surface_renders_readiness_panel": all(
            marker in review_source
            for marker in [
                'data-review-evidence-actionability="selected-world-review-readiness"',
                "Review readiness",
                "Next action",
                "read-only review readiness",
                "evidence.reviewReadiness",
                "evidence.nextAction",
                "evidence.nextActionReason",
                "readinessSignals",
            ]
        ),
        "loader_derives_actionability_from_evidence_binding": all(
            marker in review_evidence_source
            for marker in [
                "buildReviewEvidenceActionability",
                "reviewReadiness",
                "nextAction",
                "nextActionReason",
                "readinessSignals",
                'evalStatus === "pass"',
                "claimCount > 0",
                "claimsLabeled",
                "claimsHaveEvidenceIds",
                "claimEvidenceResolves",
                '"select-or-generate-runtime-branch"',
                '"repair-selected-world-evidence"',
            ]
        ),
        "actionability_stays_read_only": all(
            marker.lower() not in review_source.lower()
            and marker.lower() not in review_evidence_source.lower()
            for marker in read_only_forbidden_markers
        ),
    }


def _derive_readiness(world: dict[str, Any]) -> dict[str, Any]:
    readiness_signals = {
        "artifact_root_available": bool(world.get("artifact_root")),
        "eval_passed": world.get("eval_status") == "pass",
        "report_claims_present": int(world.get("claim_count") or 0) > 0,
        "claims_labeled": world.get("claims_labeled") is True,
        "claims_have_evidence_ids": world.get("claims_have_evidence_ids") is True,
        "evidence_ids_resolve": world.get("claim_evidence_resolves") is True,
    }
    review_readiness = "ready" if all(readiness_signals.values()) else "blocked"
    next_action = (
        "select-or-generate-runtime-branch"
        if review_readiness == "ready"
        else "repair-selected-world-evidence"
    )
    next_action_reason = (
        "Evidence binding is ready; select an existing runtime branch or generate one live branch before deeper review."
        if review_readiness == "ready"
        else "Repair selected-world evidence artifacts before relying on the review surface."
    )
    return {
        "review_readiness": review_readiness,
        "next_action": next_action,
        "next_action_reason": next_action_reason,
        "readiness_signals": readiness_signals,
    }


def _route_expectation(world: dict[str, Any]) -> dict[str, list[str]]:
    return {
        "required": [
            "Selected-world evidence binding",
            "Review readiness",
            "Next action",
            "read-only review readiness",
            world["artifact_root"],
            "Claims keep labels and evidence ids",
        ],
        "forbidden": [
            "advanced-analyst-mode",
            "Launch Hub now",
            "Private Beta Launch Hub",
            "Hosted GPT is enabled",
            "BYOK is enabled",
        ],
    }


def collect_selected_world_review_evidence_actionability(
    repo_root: Path | None = None,
    *,
    include_route_smoke: bool = False,
    base_url: str | None = None,
    auth_header: str | None = None,
    attempts: int = 5,
    retry_delay: float = 2.0,
) -> dict[str, Any]:
    root = _repo_root(repo_root)
    phase61 = _load_phase61_smoke(root)
    surface_evidence = phase61.collect_selected_world_review_surface_binding(
        repo_root=root,
        include_route_smoke=False,
    )
    surface_failures = phase61.validate_selected_world_review_surface_binding(surface_evidence)
    actionability_signals = _source_actionability_signals(root)

    worlds: list[dict[str, Any]] = []
    for source_world in surface_evidence["worlds"]:
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
            ]
        }
        world.update(_derive_readiness(world))
        world["actionability_signals"] = actionability_signals
        if include_route_smoke:
            if not base_url:
                raise ValueError("base_url is required when include_route_smoke is True")
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
            "phase62_selected_world_review_evidence_actionability_get_only"
            if include_route_smoke
            else "phase62_selected_world_review_evidence_actionability_source"
        ),
        "selected_world_ids": SELECTED_WORLD_IDS,
        "phase61_evidence_path": PHASE61_EVIDENCE_PATH.as_posix(),
        "phase62_gate_path": PHASE62_GATE_PATH.as_posix(),
        "phase61_surface_failures": surface_failures,
        "source_paths": {
            "world_review_page": WORLD_REVIEW_SOURCE_PATH.as_posix(),
            "selected_world_review_evidence": SELECTED_WORLD_REVIEW_EVIDENCE_SOURCE_PATH.as_posix(),
        },
        "expected_artifact_roots": {
            world_id: path.as_posix() for world_id, path in EXPECTED_ARTIFACT_ROOTS.items()
        },
        "worlds": worlds,
        "route_smoke_enabled": include_route_smoke,
    }
    failures = validate_selected_world_review_evidence_actionability(evidence)
    return {**evidence, "status": "pass" if not failures else "fail", "failures": failures}


def validate_selected_world_review_evidence_actionability(evidence: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    if evidence.get("selected_world_ids") != SELECTED_WORLD_IDS:
        failures.append(
            f"selected_world_ids expected {SELECTED_WORLD_IDS!r}, got {evidence.get('selected_world_ids')!r}"
        )
    if evidence.get("phase61_surface_failures"):
        failures.extend(
            f"phase61 review surface binding: {failure}"
            for failure in evidence["phase61_surface_failures"]
        )

    observed_world_ids = [world["world_id"] for world in evidence.get("worlds", [])]
    if observed_world_ids != SELECTED_WORLD_IDS:
        failures.append(f"world rows expected {SELECTED_WORLD_IDS!r}, got {observed_world_ids!r}")

    for world in evidence.get("worlds", []):
        world_id = world["world_id"]
        expected_root = EXPECTED_ARTIFACT_ROOTS[world_id].as_posix()
        if world.get("artifact_root") != expected_root:
            failures.append(f"{world_id}: artifact_root expected {expected_root}")
        for flag_name in ("claims_labeled", "claims_have_evidence_ids", "claim_evidence_resolves"):
            if world.get(flag_name) is not True:
                failures.append(f"{world_id}: {flag_name} must be true")
        if world.get("eval_status") != "pass":
            failures.append(f"{world_id}: eval_status must be pass")
        if world.get("review_readiness") != "ready":
            failures.append(f"{world_id}: review_readiness must be ready")
        if world.get("next_action") != "select-or-generate-runtime-branch":
            failures.append(f"{world_id}: next_action must be select-or-generate-runtime-branch")
        for signal_name, passed in world.get("readiness_signals", {}).items():
            if passed is not True:
                failures.append(f"{world_id}: readiness signal {signal_name} must be true")
        for signal_name, passed in world.get("actionability_signals", {}).items():
            if passed is not True:
                failures.append(f"{world_id}: actionability signal {signal_name} must be true")
        if evidence.get("route_smoke_enabled") and not world.get("route_smoke"):
            failures.append(f"{world_id}: route_smoke result is required")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke-test Phase 62 selected-world review evidence actionability."
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

    auth_header = basic_auth_header(args.basic_auth_user, args.basic_auth_password)
    remote_mode = args.no_start or bool(args.base_url)
    process: subprocess.Popen[bytes] | None = None
    base_url = args.base_url.rstrip("/") if args.base_url else None

    if args.source_only:
        evidence = collect_selected_world_review_evidence_actionability(REPO_ROOT)
        print(json.dumps(evidence, indent=2, ensure_ascii=False))
        return 0 if evidence["status"] == "pass" else 1

    phase61 = _load_phase61_smoke(REPO_ROOT)
    frontend_root = REPO_ROOT / "frontend"
    log_dir = REPO_ROOT / "artifacts" / "ui-review"
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    stdout_log = log_dir / f"phase62-review-actionability-smoke-{timestamp}.log"
    stderr_log = log_dir / f"phase62-review-actionability-smoke-{timestamp}.err.log"

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
        evidence = collect_selected_world_review_evidence_actionability(
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
