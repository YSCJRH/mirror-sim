from __future__ import annotations

import argparse
import base64
import importlib.util
import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from types import ModuleType
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

SELECTED_WORLD_IDS = ["fog-harbor-east-gate", "museum-night", "library-rain"]
EXPECTED_ARTIFACT_ROOTS = {
    "fog-harbor-east-gate": Path("artifacts/demo"),
    "museum-night": Path("artifacts/worlds/museum-night"),
    "library-rain": Path("artifacts/worlds/library-rain"),
}
PRODUCT_PATHS = {
    "fog-harbor-east-gate": Path("data/demo/config/product.json"),
    "museum-night": Path("data/worlds/museum-night/config/product.json"),
    "library-rain": Path("data/worlds/library-rain/config/product.json"),
}
PHASE60_SMOKE_PATH = Path("scripts/smoke_phase60_selected_world_artifact_integrity.py")
PHASE60_EVIDENCE_PATH = Path(
    "docs/plans/phase-60-selected-world-artifact-integrity-evidence-2026-05-23.md"
)
PHASE61_GATE_PATH = Path(
    "docs/plans/phase-61-selected-world-review-surface-evidence-binding-gate-2026-05-23.md"
)
WORLD_REVIEW_SOURCE_PATH = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")
RUNTIME_SESSION_SOURCE_PATH = Path("frontend/src/app/lib/runtime-session-data.ts")
SELECTED_WORLD_REVIEW_EVIDENCE_SOURCE_PATH = Path(
    "frontend/src/app/lib/selected-world-review-evidence.ts"
)
TRANSIENT_HTTP_STATUSES = {408, 425, 429, 500, 502, 503, 504}


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


def _load_phase60_smoke(repo_root: Path) -> ModuleType:
    smoke_path = repo_root / PHASE60_SMOKE_PATH
    spec = importlib.util.spec_from_file_location("phase60_artifact_integrity_smoke", smoke_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {smoke_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def pick_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def display_url(url: str) -> str:
    parsed = urllib.parse.urlsplit(url)
    if parsed.username is None and parsed.password is None:
        return url
    host = parsed.hostname or ""
    if parsed.port:
        host = f"{host}:{parsed.port}"
    return urllib.parse.urlunsplit((parsed.scheme, host, parsed.path, parsed.query, parsed.fragment))


def basic_auth_header(user: str | None, password: str | None) -> str | None:
    if not user and not password:
        return None
    if not user or password is None:
        raise ValueError("Both --basic-auth-user and --basic-auth-password are required for Basic Auth.")
    token = base64.b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
    return f"Basic {token}"


def request_headers(auth_header: str | None) -> dict[str, str]:
    headers = {"Accept-Language": "en"}
    if auth_header:
        headers["Authorization"] = auth_header
    return headers


def describe_url_error(error: BaseException) -> str:
    if isinstance(error, urllib.error.URLError):
        return f"{type(error.reason).__name__}: {error.reason}"
    return f"{type(error).__name__}: {error}"


def read_route(
    base_url: str,
    path: str,
    auth_header: str | None,
    *,
    attempts: int,
    retry_delay: float,
) -> tuple[int, str]:
    request = urllib.request.Request(f"{base_url}{path}", headers=request_headers(auth_header))
    last_error = "no response"
    for attempt in range(1, max(1, attempts) + 1):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.status, response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            last_error = f"status {error.code}: {body[:240]}"
            if error.code not in TRANSIENT_HTTP_STATUSES or attempt >= attempts:
                raise RuntimeError(
                    f"GET {display_url(request.full_url)} failed after {attempt} attempt(s): {last_error}"
                ) from error
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            last_error = describe_url_error(error)
            if attempt >= attempts:
                raise RuntimeError(
                    f"GET {display_url(request.full_url)} failed after {attempt} attempt(s): {last_error}"
                ) from error
        time.sleep(retry_delay)
    raise RuntimeError(f"GET {display_url(request.full_url)} failed: {last_error}")


def wait_for_ready(base_url: str, timeout_seconds: int, auth_header: str | None) -> None:
    deadline = time.time() + timeout_seconds
    last_error = "no response"
    while time.time() < deadline:
        try:
            status, body = read_route(base_url, "/", auth_header, attempts=1, retry_delay=0)
            if status == 200 and "Mirror" in body:
                return
            last_error = f"status {status}"
        except Exception as error:
            last_error = describe_url_error(error)
        time.sleep(1)
    raise RuntimeError(
        f"Mirror web did not become ready within {timeout_seconds} seconds at "
        f"{display_url(base_url)} ({last_error}). Run `npm run build --prefix frontend` first."
    )


def assert_route(
    base_url: str,
    path: str,
    auth_header: str | None,
    *,
    required_markers: list[str],
    forbidden_markers: list[str],
    attempts: int,
    retry_delay: float,
) -> dict[str, Any]:
    status, body = read_route(
        base_url,
        path,
        auth_header,
        attempts=attempts,
        retry_delay=retry_delay,
    )
    missing = [marker for marker in required_markers if marker not in body]
    leaked = [marker for marker in forbidden_markers if marker in body]
    if status != 200 or missing or leaked:
        raise RuntimeError(
            f"{path} route smoke failed: status={status}, missing={missing}, leaked={leaked}"
        )
    return {
        "status": status,
        "required_markers": required_markers,
        "forbidden_markers": forbidden_markers,
    }


def _source_binding_signals(repo_root: Path) -> dict[str, bool]:
    review_source = _read_text(repo_root / WORLD_REVIEW_SOURCE_PATH)
    runtime_source = _read_text(repo_root / RUNTIME_SESSION_SOURCE_PATH)
    review_evidence_source = _read_text(repo_root / SELECTED_WORLD_REVIEW_EVIDENCE_SOURCE_PATH)
    return {
        "review_route_uses_world_id": all(
            marker in review_source
            for marker in [
                "params: Promise<{ worldId: string }>",
                "const { worldId } = await params;",
                "loadProductWorldConfig(worldId, locale)",
                "findLatestRuntimeSessionForWorld(worldId)",
                "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)",
                "loadSelectedWorldReviewEvidenceBinding(worldId)",
                "claimCount={runtimeWorkspace.relevantClaims.length}",
            ]
        ),
        "review_surface_renders_artifact_evidence_panel": all(
            marker in review_source
            for marker in [
                'data-review-evidence-binding="selected-world-review-surface"',
                "Selected-world evidence binding",
                "Artifact root",
                "Eval status",
                "Claims keep labels and evidence ids",
            ]
        ),
        "review_surface_keeps_world_scoped_links": all(
            marker in review_source
            for marker in [
                "`/worlds/${worldId}/review",
                "`/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}",
                "`/worlds/${worldId}/perturb",
            ]
        ),
        "review_surface_stays_distinct_from_public_review": all(
            marker not in review_source
            for marker in [
                "loadAnalystReview",
                "buildMainPathNavigation",
                'href="/review"',
                "`/review?session=${",
            ]
        ),
        "review_evidence_loader_binds_artifact_claims_and_chunks": all(
            marker in review_evidence_source
            for marker in [
                "export async function loadSelectedWorldReviewEvidenceBinding",
                "resolveProductWorldPaths(worldId)",
                'path.join(paths.artifactsRoot, "eval", "summary.json")',
                'path.join(paths.artifactsRoot, "report", "claims.json")',
                'path.join(paths.artifactsRoot, "ingest", "chunks.jsonl")',
                "claim.evidence_ids",
                "validEvidenceIds",
                "claimEvidenceResolves",
            ]
        ),
        "runtime_loader_uses_world_artifact_root": all(
            marker in runtime_source
            for marker in [
                "const artifactsRoot = resolveProductWorldPaths(worldId).artifactsRoot;",
                "if (session.world_id !== worldId)",
                "if (selectedNode.world_id !== worldId || rootNode.world_id !== worldId)",
            ]
        ),
        "runtime_claims_bind_to_evidence_chunks": all(
            marker in runtime_source
            for marker in [
                "loadRuntimeClaimDrilldowns",
                "claim.evidence_ids",
                "chunks.jsonl",
                "documents.jsonl",
            ]
        ),
    }


def _route_expectation(product: dict[str, Any], artifact_root: str) -> dict[str, list[str]]:
    return {
        "required": [
            str(product["world_name"]),
            "Mirror Engine / Private Beta",
            "Selected-world evidence binding",
            "Artifact root",
            artifact_root,
            "Eval status",
            "Report claims",
            "Claims keep labels and evidence ids",
            "Generate one live branch first, then come back for advanced review",
        ],
        "forbidden": [
            "advanced-analyst-mode",
            "Launch Hub now",
            "Private Beta Launch Hub",
            "Hosted GPT is enabled",
            "BYOK is enabled",
            "task_id",
            "async worker",
        ],
    }


def collect_selected_world_review_surface_binding(
    repo_root: Path | None = None,
    *,
    include_route_smoke: bool = False,
    base_url: str | None = None,
    auth_header: str | None = None,
    attempts: int = 5,
    retry_delay: float = 2.0,
) -> dict[str, Any]:
    root = _repo_root(repo_root)
    phase60 = _load_phase60_smoke(root)
    artifact_evidence = phase60.collect_selected_world_artifact_integrity(repo_root=root)
    artifact_failures = phase60.validate_selected_world_artifact_integrity(artifact_evidence)
    source_signals = _source_binding_signals(root)
    artifact_rows = {world["world_id"]: world for world in artifact_evidence["worlds"]}

    worlds: list[dict[str, Any]] = []
    for world_id in SELECTED_WORLD_IDS:
        product = _read_json(root / PRODUCT_PATHS[world_id])
        artifact_row = artifact_rows[world_id]
        route_path = f"/worlds/{world_id}/review"
        route_smoke_path = f"{route_path}?session="
        route_smoke = None
        if include_route_smoke:
            if not base_url:
                raise ValueError("base_url is required when include_route_smoke is True")
            expectation = _route_expectation(product, artifact_row["artifact_root"])
            route_smoke = assert_route(
                base_url,
                route_smoke_path,
                auth_header,
                required_markers=expectation["required"],
                forbidden_markers=expectation["forbidden"],
                attempts=attempts,
                retry_delay=retry_delay,
            )

        worlds.append(
            {
                "world_id": world_id,
                "product_world_id": product.get("world_id"),
                "product_name": product.get("world_name"),
                "route_path": route_path,
                "route_smoke_path": route_smoke_path,
                "artifact_root": artifact_row["artifact_root"],
                "eval_summary_path": artifact_row["eval_summary_path"],
                "eval_status": artifact_row["eval_status"],
                "claim_count": artifact_row["claim_count"],
                "claims_labeled": artifact_row["claims_labeled"],
                "claims_have_evidence_ids": artifact_row["claims_have_evidence_ids"],
                "claim_evidence_resolves": artifact_row["claim_evidence_resolves"],
                "binding_signals": source_signals,
                "route_smoke": route_smoke,
            }
        )

    evidence = {
        "mode": (
            "phase61_selected_world_review_surface_binding_get_only"
            if include_route_smoke
            else "phase61_selected_world_review_surface_binding_source"
        ),
        "selected_world_ids": SELECTED_WORLD_IDS,
        "phase60_evidence_path": PHASE60_EVIDENCE_PATH.as_posix(),
        "phase61_gate_path": PHASE61_GATE_PATH.as_posix(),
        "phase60_artifact_failures": artifact_failures,
        "source_paths": {
            "world_review_page": WORLD_REVIEW_SOURCE_PATH.as_posix(),
            "runtime_session_data": RUNTIME_SESSION_SOURCE_PATH.as_posix(),
            "selected_world_review_evidence": SELECTED_WORLD_REVIEW_EVIDENCE_SOURCE_PATH.as_posix(),
        },
        "expected_artifact_roots": {
            world_id: path.as_posix() for world_id, path in EXPECTED_ARTIFACT_ROOTS.items()
        },
        "worlds": worlds,
        "route_smoke_enabled": include_route_smoke,
    }
    failures = validate_selected_world_review_surface_binding(evidence)
    return {**evidence, "status": "pass" if not failures else "fail", "failures": failures}


def validate_selected_world_review_surface_binding(evidence: dict[str, Any]) -> list[str]:
    failures: list[str] = []
    if evidence.get("selected_world_ids") != SELECTED_WORLD_IDS:
        failures.append(
            f"selected_world_ids expected {SELECTED_WORLD_IDS!r}, got {evidence.get('selected_world_ids')!r}"
        )
    if evidence.get("phase60_artifact_failures"):
        failures.extend(f"phase60 artifact integrity: {failure}" for failure in evidence["phase60_artifact_failures"])

    observed_world_ids = [world["world_id"] for world in evidence.get("worlds", [])]
    if observed_world_ids != SELECTED_WORLD_IDS:
        failures.append(f"world rows expected {SELECTED_WORLD_IDS!r}, got {observed_world_ids!r}")

    for world in evidence.get("worlds", []):
        world_id = world["world_id"]
        expected_root = EXPECTED_ARTIFACT_ROOTS[world_id].as_posix()
        if world.get("product_world_id") != world_id:
            failures.append(f"{world_id}: product_world_id must match route world_id")
        if world.get("artifact_root") != expected_root:
            failures.append(f"{world_id}: artifact_root expected {expected_root}")
        if world.get("route_path") != f"/worlds/{world_id}/review":
            failures.append(f"{world_id}: route_path must stay world-scoped")
        if world.get("eval_status") != "pass":
            failures.append(f"{world_id}: eval_status must be pass")
        for flag_name in ("claims_labeled", "claims_have_evidence_ids", "claim_evidence_resolves"):
            if world.get(flag_name) is not True:
                failures.append(f"{world_id}: {flag_name} must be true")
        binding_signals = world.get("binding_signals", {})
        for signal_name, passed in binding_signals.items():
            if passed is not True:
                failures.append(f"{world_id}: binding signal {signal_name} must be true")
        if evidence.get("route_smoke_enabled") and not world.get("route_smoke"):
            failures.append(f"{world_id}: route_smoke result is required")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke-test Phase 61 selected-world review surface evidence binding."
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
        evidence = collect_selected_world_review_surface_binding(REPO_ROOT)
        print(json.dumps(evidence, indent=2, ensure_ascii=False))
        return 0 if evidence["status"] == "pass" else 1

    frontend_root = REPO_ROOT / "frontend"
    log_dir = REPO_ROOT / "artifacts" / "ui-review"
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    stdout_log = log_dir / f"phase61-review-surface-binding-smoke-{timestamp}.log"
    stderr_log = log_dir / f"phase61-review-surface-binding-smoke-{timestamp}.err.log"

    if remote_mode:
        if not base_url:
            parser.error("--base-url is required when --no-start is set.")
    else:
        port = args.port or pick_free_port()
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
        wait_for_ready(base_url, args.timeout, auth_header)
        evidence = collect_selected_world_review_surface_binding(
            REPO_ROOT,
            include_route_smoke=True,
            base_url=base_url,
            auth_header=auth_header,
            attempts=max(1, args.http_retries),
            retry_delay=max(0.0, args.retry_delay),
        )
        evidence["base_url"] = display_url(base_url)
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
