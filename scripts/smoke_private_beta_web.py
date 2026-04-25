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
    headers = {"Accept-Language": "zh-CN"}
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
        f"Mirror web did not become ready within {timeout_seconds} seconds at {display_url(base_url)} "
        f"({last_error})."
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


def assert_status_200(url: str, auth_header: str | None) -> int:
    request = urllib.request.Request(url, headers=request_headers(auth_header))
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke-test the private-beta web path.")
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
    product_path = repo_root / "data" / "demo" / "config" / "product.json"
    log_dir = repo_root / "artifacts" / "ui-review"
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    stdout_log = log_dir / f"private-beta-http-smoke-{timestamp}.log"
    stderr_log = log_dir / f"private-beta-http-smoke-{timestamp}.err.log"

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
        if health_payload.get("status") != "ok":
            raise RuntimeError(f"Unexpected health payload: {health_payload}")

        start_payload = http_json(
            base_url,
            "/api/runtime/start-session",
            auth_header,
            {
                "locale": "zh-CN",
                "worldId": "fog-harbor-east-gate",
                "scenarioId": "scenario_baseline",
                "decisionProvider": "deterministic_only",
            },
        )

        product = json.loads(product_path.read_text(encoding="utf-8"))
        runtime = product["perturbation_options"][0]["runtime"]
        generate_payload = http_json(
            base_url,
            "/api/runtime/generate-branch",
            auth_header,
            {
                "locale": "zh-CN",
                "worldId": "fog-harbor-east-gate",
                "sessionId": start_payload["session_id"],
                "fromNode": "node_root",
                "decisionProvider": "deterministic_only",
                "perturbation": {
                    "kind": runtime["kind"],
                    "target_id": runtime["targetId"],
                    "timing": runtime["timing"],
                    "summary": "beta smoke perturbation",
                    "parameters": {
                        **runtime["parameters"],
                        "actor_id": runtime["actorId"],
                    },
                },
            },
        )

        rollback_payload = http_json(
            base_url,
            "/api/runtime/rollback-session",
            auth_header,
            {
                "locale": "zh-CN",
                "worldId": "fog-harbor-east-gate",
                "sessionId": start_payload["session_id"],
                "toNode": "node_root",
            },
        )

        page_statuses = {
            "/": assert_status_200(f"{base_url}/", auth_header),
            "/worlds/new": assert_status_200(f"{base_url}/worlds/new", auth_header),
            "/worlds/fog-harbor-east-gate": assert_status_200(
                f"{base_url}/worlds/fog-harbor-east-gate",
                auth_header,
            ),
            "/worlds/fog-harbor-east-gate/perturb": assert_status_200(
                f"{base_url}/worlds/fog-harbor-east-gate/perturb",
                auth_header,
            ),
            "/worlds/fog-harbor-east-gate/runtime": assert_status_200(
                f"{base_url}/worlds/fog-harbor-east-gate/runtime/{start_payload['session_id']}?node={generate_payload['active_node_id']}",
                auth_header,
            ),
            "/worlds/fog-harbor-east-gate/runtime/explain": assert_status_200(
                f"{base_url}/worlds/fog-harbor-east-gate/runtime/{start_payload['session_id']}/explain?node={generate_payload['active_node_id']}",
                auth_header,
            ),
            "/worlds/fog-harbor-east-gate/runtime/report": assert_status_200(
                f"{base_url}/worlds/fog-harbor-east-gate/runtime/{start_payload['session_id']}/report?node={generate_payload['active_node_id']}",
                auth_header,
            ),
            "/worlds/fog-harbor-east-gate/review": assert_status_200(
                f"{base_url}/worlds/fog-harbor-east-gate/review?session={start_payload['session_id']}&node={generate_payload['active_node_id']}",
                auth_header,
            ),
        }

        result = {
            "base_url": display_url(base_url),
            "session_id": start_payload["session_id"],
            "generated_node": generate_payload["active_node_id"],
            "rollback_active_node": rollback_payload["active_node_id"],
            "health": health_payload,
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
