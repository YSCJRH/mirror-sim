from __future__ import annotations

import argparse
import base64
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
from typing import Any


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


def request_headers(auth_header: str | None, *, json_body: bool = False) -> dict[str, str]:
    headers = {"Accept-Language": "en-US"}
    if json_body:
        headers["Content-Type"] = "application/json"
    if auth_header:
        headers["Authorization"] = auth_header
    return headers


def wait_for_ready(base_url: str, timeout_seconds: int, auth_header: str | None) -> None:
    deadline = time.time() + timeout_seconds
    last_error = "no response"
    while time.time() < deadline:
        try:
            request = urllib.request.Request(f"{base_url}/", headers=request_headers(auth_header))
            with urllib.request.urlopen(request, timeout=5) as response:
                body = response.read().decode("utf-8", errors="replace")
                if response.status == 200 and "Mirror" in body:
                    return
                last_error = f"status {response.status}"
        except urllib.error.HTTPError as error:
            last_error = f"status {error.code}"
        except Exception as error:
            last_error = str(error)
        time.sleep(1)
    raise RuntimeError(
        f"Mirror public demo did not become ready within {timeout_seconds} seconds at "
        f"{display_url(base_url)} ({last_error})."
    )


def http_json(base_url: str, path: str, auth_header: str | None, payload: dict[str, Any] | None = None):
    data = None
    method = "GET"
    if payload is not None:
        method = "POST"
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"{base_url}{path}",
        data=data,
        headers=request_headers(auth_header, json_body=payload is not None),
        method=method,
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        raw = response.read().decode("utf-8")
        if "application/json" in response.headers.get("Content-Type", ""):
            return json.loads(raw)
        return {"status": response.status, "body": raw}


def expect_http_status(
    base_url: str,
    path: str,
    auth_header: str | None,
    expected_status: int,
    payload: dict[str, Any] | None = None,
) -> None:
    try:
        http_json(base_url, path, auth_header, payload)
    except urllib.error.HTTPError as error:
        if error.code == expected_status:
            return
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Expected {expected_status} for {path}, got {error.code}: {body}") from error
    raise RuntimeError(f"Expected {expected_status} for {path}, got success.")


def assert_status_200(url: str, auth_header: str | None) -> int:
    request = urllib.request.Request(url, headers=request_headers(auth_header))
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke-test the read-only Phase 1 public demo web path.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int)
    parser.add_argument("--timeout", type=int, default=30)
    parser.add_argument("--base-url", help="Use an already-running Mirror web base URL.")
    parser.add_argument("--no-start", action="store_true", help="Do not start a local Next server.")
    parser.add_argument("--basic-auth-user", default=os.environ.get("MIRROR_SMOKE_BASIC_AUTH_USER"))
    parser.add_argument("--basic-auth-password", default=os.environ.get("MIRROR_SMOKE_BASIC_AUTH_PASSWORD"))
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    frontend_root = repo_root / "frontend"
    log_dir = repo_root / "artifacts" / "ui-review"
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    stdout_log = log_dir / f"public-demo-http-smoke-{timestamp}.log"
    stderr_log = log_dir / f"public-demo-http-smoke-{timestamp}.err.log"

    auth_header = basic_auth_header(args.basic_auth_user, args.basic_auth_password)
    remote_mode = args.no_start or bool(args.base_url)
    process: subprocess.Popen[bytes] | None = None

    if remote_mode:
        if not args.base_url:
            parser.error("--base-url is required when --no-start is set.")
        base_url = args.base_url.rstrip("/")
    else:
        port = args.port or pick_free_port()
        base_url = f"http://{args.host}:{port}"
        env = os.environ.copy()
        env["MIRROR_PUBLIC_DEMO_MODE"] = "1"
        env["MIRROR_ALLOW_ANONYMOUS_RUNS"] = "0"
        env["MIRROR_HOSTED_MODEL_ENABLED"] = "0"
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
            env=env,
        )

    try:
        wait_for_ready(base_url, args.timeout, auth_header)
        health_payload = http_json(base_url, "/api/health", auth_header)
        ready_payload = http_json(base_url, "/api/ready", auth_header)
        manifest_payload = http_json(base_url, "/api/public-demo/manifest", auth_header)

        if health_payload.get("status") != "ok":
            raise RuntimeError(f"Unexpected health payload: {health_payload}")
        if health_payload.get("publicDemoMode") is not True:
            raise RuntimeError(f"Health endpoint is not in public demo mode: {health_payload}")
        if ready_payload.get("status") != "ready":
            raise RuntimeError(f"Unexpected readiness payload: {ready_payload}")
        if ready_payload.get("publicDemoMode") is not True:
            raise RuntimeError(f"Readiness endpoint is not in public demo mode: {ready_payload}")
        if ready_payload.get("workbench", {}).get("status") != "ok":
            raise RuntimeError(f"Readiness endpoint did not validate workbench artifacts: {ready_payload}")

        artifact_ids = {entry["id"] for entry in manifest_payload.get("artifacts", [])}
        expected_ids = {"demo.claims", "demo.eval_summary", "demo.compare", "demo.documents", "demo.chunks"}
        if not expected_ids.issubset(artifact_ids):
            raise RuntimeError(f"Manifest missing expected ids: {expected_ids - artifact_ids}")

        claims_payload = http_json(base_url, "/api/public-demo/artifacts/demo.claims", auth_header)
        eval_payload = http_json(base_url, "/api/public-demo/artifacts/demo.eval_summary", auth_header)
        compare_payload = http_json(base_url, "/api/public-demo/artifacts/demo.compare", auth_header)
        report_payload = http_json(base_url, "/api/public-demo/artifacts/demo.report", auth_header)
        documents_payload = http_json(base_url, "/api/public-demo/artifacts/demo.documents", auth_header)
        chunks_payload = http_json(base_url, "/api/public-demo/artifacts/demo.chunks", auth_header)
        graph_payload = http_json(base_url, "/api/public-demo/artifacts/demo.graph", auth_header)
        rubric_payload = http_json(base_url, "/api/public-demo/artifacts/demo.rubric", auth_header)

        public_payload_text = json.dumps(
            {
                "manifest": manifest_payload,
                "claims": claims_payload,
                "eval": eval_payload,
                "compare": compare_payload,
                "report": report_payload,
                "documents": documents_payload,
                "chunks": chunks_payload,
                "graph": graph_payload,
                "rubric": rubric_payload,
            },
            ensure_ascii=False,
        )
        if (
            "D:/" in public_payload_text
            or "\\mirror\\" in public_payload_text
            or "/app/mirror" in public_payload_text
            or "artifact_paths" in public_payload_text
            or "summary_path" in public_payload_text
            or "trace_path" in public_payload_text
            or "snapshot_dir" in public_payload_text
            or "source_path" in public_payload_text
            or "OPENAI_API_KEY" in public_payload_text
            or "MIRROR_HOSTED_OPENAI_API_KEY" in public_payload_text
        ):
            raise RuntimeError("Public demo API leaked local artifact path or provider secret metadata.")

        branch_id = next(
            branch["branch_id"]
            for branch in compare_payload["data"]["branches"]
            if not branch.get("is_reference")
        )

        expect_http_status(
            base_url,
            "/api/runtime/start-session",
            auth_header,
            403,
            {
                "worldId": "fog-harbor-east-gate",
                "scenarioId": "scenario_baseline",
                "decisionProvider": "deterministic_only",
            },
        )
        expect_http_status(
            base_url,
            "/api/runtime/generate-branch",
            auth_header,
            403,
            {
                "worldId": "fog-harbor-east-gate",
                "sessionId": "public-demo-disabled",
                "fromNode": "node_root",
                "decisionProvider": "deterministic_only",
                "perturbation": {"kind": "blocked_public_demo"},
            },
        )
        expect_http_status(
            base_url,
            "/api/runtime/rollback-session",
            auth_header,
            403,
            {
                "worldId": "fog-harbor-east-gate",
                "sessionId": "public-demo-disabled",
                "toNode": "node_root",
            },
        )
        expect_http_status(base_url, "/api/worlds/create", auth_header, 403, {"name": "blocked"})

        page_statuses = {
            "/": assert_status_200(f"{base_url}/", auth_header),
            "/review": assert_status_200(f"{base_url}/review", auth_header),
            f"/changes/{branch_id}": assert_status_200(f"{base_url}/changes/{branch_id}", auth_header),
            f"/explain/{branch_id}": assert_status_200(f"{base_url}/explain/{branch_id}", auth_header),
            "/worlds/new": assert_status_200(f"{base_url}/worlds/new", auth_header),
        }

        claims = claims_payload.get("data", [])
        if not claims or any("label" not in claim or "evidence_ids" not in claim for claim in claims):
            raise RuntimeError("Claims payload must preserve label and evidence_ids.")

        result = {
            "base_url": display_url(base_url),
            "health": health_payload,
            "ready": ready_payload,
            "artifact_count": len(artifact_ids),
            "claims": len(claims),
            "eval_status": eval_payload.get("data", {}).get("status"),
            "branch_id": branch_id,
            "page_statuses": page_statuses,
        }
        if not remote_mode:
            result["stdout_log"] = str(stdout_log)
            result["stderr_log"] = str(stderr_log)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
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
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        print(body, file=sys.stderr)
        raise
