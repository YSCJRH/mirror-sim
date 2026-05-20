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


TRANSIENT_HTTP_STATUSES = {408, 425, 429, 500, 502, 503, 504}


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
) -> int:
    status, body = read_route(
        base_url,
        path,
        auth_header,
        attempts=attempts,
        retry_delay=retry_delay,
    )
    if status != 200:
        raise RuntimeError(f"Expected 200 for {path}, got {status}.")
    missing = [marker for marker in required_markers if marker not in body]
    if missing:
        raise RuntimeError(f"{path} is missing expected route markers: {missing}")
    leaked = [marker for marker in forbidden_markers if marker in body]
    if leaked:
        raise RuntimeError(f"{path} included forbidden route markers: {leaked}")
    return status


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke-test the narrow Phase 58 route-readiness candidate signal with GET-only checks."
    )
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

    repo_root = Path(__file__).resolve().parent.parent
    frontend_root = repo_root / "frontend"
    log_dir = repo_root / "artifacts" / "ui-review"
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    stdout_log = log_dir / f"phase58-route-readiness-smoke-{timestamp}.log"
    stderr_log = log_dir / f"phase58-route-readiness-smoke-{timestamp}.err.log"

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

    route_expectations = {
        "/": {
            "required": ["Mirror Public Demo", "Deterministic-only Phase 1"],
            "forbidden": ["Launch Hub now", "Private Beta Launch Hub"],
        },
        "/review": {
            "required": ["Advanced Analyst Mode", "advanced-analyst-mode"],
            "forbidden": ["Mirror Engine / Private Beta"],
        },
        "/worlds/fog-harbor-east-gate": {
            "required": ["Fog Harbor East Gate", "Open perturb"],
            "forbidden": ["Launch Hub now", "Private Beta Launch Hub"],
        },
        "/worlds/fog-harbor-east-gate/review": {
            "required": [
                "Fog Harbor East Gate",
                "Mirror Engine / Private Beta",
                "world-scoped advanced review surface",
            ],
            "forbidden": ["advanced-analyst-mode", "Launch Hub now"],
        },
    }

    attempts = max(1, args.http_retries)
    retry_delay = max(0.0, args.retry_delay)

    try:
        wait_for_ready(base_url, args.timeout, auth_header)
        page_statuses = {
            path: assert_route(
                base_url,
                path,
                auth_header,
                required_markers=expectation["required"],
                forbidden_markers=expectation["forbidden"],
                attempts=attempts,
                retry_delay=retry_delay,
            )
            for path, expectation in route_expectations.items()
        }
        result = {
            "base_url": display_url(base_url),
            "mode": "phase58_route_readiness_get_only",
            "page_statuses": page_statuses,
            "route_count": len(page_statuses),
            "boundary": "narrow route-readiness evidence only; no runtime mutation flow exercised",
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
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
