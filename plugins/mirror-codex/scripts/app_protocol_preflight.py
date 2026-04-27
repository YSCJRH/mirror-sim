from __future__ import annotations

import argparse
import json
import os
import queue
import shutil
import subprocess
import sys
import tempfile
import threading
import time
from pathlib import Path
from typing import Any


sys.dont_write_bytecode = True

REPO_ROOT = Path(__file__).resolve().parents[3]
PLUGIN_NAME = "mirror-codex"
PLUGIN_ID = "mirror-codex@mirror-local"
MARKETPLACE_NAME = "mirror-local"
MCP_SERVER_NAME = "mirror-demo"
SKILL_NAME = "mirror-codex:mirror-demo"
SECRET_ENV_MARKERS = ("API_KEY", "TOKEN", "SECRET")


class AppServerClient:
    def __init__(self, codex_command: str, keep_temp: bool, timeout: float) -> None:
        codex_path = shutil.which(codex_command)
        if codex_path is None:
            raise AssertionError(f"Codex CLI was not found on PATH: {codex_command}")

        self.codex_path = codex_path
        self.timeout = timeout
        self.keep_temp = keep_temp
        self.temp_context: tempfile.TemporaryDirectory[str] | None = None
        if keep_temp:
            self.temp_home = Path(tempfile.mkdtemp(prefix="mirror-codex-app-home-"))
        else:
            self.temp_context = tempfile.TemporaryDirectory(
                prefix="mirror-codex-app-home-",
                ignore_cleanup_errors=True,
            )
            self.temp_home = Path(self.temp_context.name)

        self._write_temp_config()
        self.process: subprocess.Popen[str] | None = None
        self.stdout_queue: queue.Queue[str] = queue.Queue()
        self.notifications: list[dict[str, Any]] = []
        self.next_id = 1

    def _write_temp_config(self) -> None:
        config = self.temp_home / "config.toml"
        config.write_text(
            "[projects.'D:\\\\mirror']\ntrust_level = \"trusted\"\n",
            encoding="utf-8",
            newline="\n",
        )

    def _env(self) -> dict[str, str]:
        env = dict(os.environ)
        env["CODEX_HOME"] = str(self.temp_home)
        for key in list(env):
            if key.upper() in {"CODEX_THREAD_ID", "CODEX_INTERNAL_ORIGINATOR_OVERRIDE"}:
                env.pop(key, None)
                continue
            if any(marker in key.upper() for marker in SECRET_ENV_MARKERS):
                env.pop(key, None)
        return env

    def __enter__(self) -> "AppServerClient":
        self.process = subprocess.Popen(
            [self.codex_path, "app-server", "--listen", "stdio://"],
            cwd=REPO_ROOT,
            env=self._env(),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        if self.process.stdout is None:
            raise AssertionError("Failed to open app-server stdout.")
        threading.Thread(target=self._read_stdout, args=(self.process.stdout,), daemon=True).start()
        return self

    def __exit__(self, exc_type: object, exc: object, tb: object) -> None:
        if self.process is not None and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
        if self.temp_context is not None:
            self.temp_context.cleanup()

    def _read_stdout(self, stream: Any) -> None:
        for line in iter(stream.readline, ""):
            self.stdout_queue.put(line)

    def request(self, method: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        if self.process is None or self.process.stdin is None:
            raise AssertionError("app-server process is not running.")
        request_id = self.next_id
        self.next_id += 1
        payload: dict[str, Any] = {"jsonrpc": "2.0", "id": request_id, "method": method}
        if params is not None:
            payload["params"] = params
        self.process.stdin.write(json.dumps(payload, separators=(",", ":")) + "\n")
        self.process.stdin.flush()
        return self._wait_for_response(request_id)

    def _wait_for_response(self, request_id: int) -> dict[str, Any]:
        deadline = time.time() + self.timeout
        while time.time() < deadline:
            if self.process is not None and self.process.poll() is not None:
                stderr = self._stderr_excerpt()
                raise AssertionError(f"app-server exited before response {request_id}.\n{stderr}")
            try:
                line = self.stdout_queue.get(timeout=0.25)
            except queue.Empty:
                continue
            try:
                message = json.loads(line)
            except json.JSONDecodeError:
                continue
            if message.get("id") == request_id:
                if "error" in message:
                    raise AssertionError(f"{request_id} returned error: {message['error']}")
                return message.get("result", {})
            if "method" in message:
                self.notifications.append(message)
        raise AssertionError(f"Timed out waiting for app-server response {request_id}.")

    def _stderr_excerpt(self, limit: int = 1200) -> str:
        if self.process is None or self.process.stderr is None:
            return ""
        try:
            text = self.process.stderr.read(limit)
        except ValueError:
            return ""
        return text[:limit]


def same_path(left: str | Path, right: str | Path) -> bool:
    def clean(path: str | Path) -> str:
        value = os.fspath(path)
        if value.startswith("\\\\?\\"):
            value = value[4:]
        return os.path.normcase(os.path.abspath(value))

    return clean(left) == clean(right)


def find_marketplace(plugin_list: dict[str, Any]) -> dict[str, Any]:
    marketplaces = plugin_list.get("marketplaces")
    if not isinstance(marketplaces, list):
        raise AssertionError("plugin/list result must include marketplaces.")
    for marketplace in marketplaces:
        plugins = marketplace.get("plugins", [])
        if marketplace.get("name") == MARKETPLACE_NAME and any(
            plugin.get("name") == PLUGIN_NAME for plugin in plugins
        ):
            return marketplace
    raise AssertionError("plugin/list did not expose the mirror-local marketplace.")


def find_plugin_summary(marketplace: dict[str, Any]) -> dict[str, Any]:
    for plugin in marketplace.get("plugins", []):
        if plugin.get("name") == PLUGIN_NAME:
            return plugin
    raise AssertionError("mirror-local marketplace did not include mirror-codex.")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def validate_plugin_summary(summary: dict[str, Any], *, installed: bool, enabled: bool) -> None:
    require(summary.get("id") == PLUGIN_ID, "plugin id must remain mirror-codex@mirror-local.")
    require(summary.get("installed") is installed, "plugin installed state did not match expectation.")
    require(summary.get("enabled") is enabled, "plugin enabled state did not match expectation.")
    require(summary.get("installPolicy") == "AVAILABLE", "plugin install policy must remain AVAILABLE.")
    require(summary.get("authPolicy") == "ON_INSTALL", "plugin auth policy must remain ON_INSTALL.")
    require(summary.get("source", {}).get("type") == "local", "plugin source must remain local.")
    interface = summary.get("interface") or {}
    require(interface.get("capabilities") == ["Read"], "plugin interface capabilities must remain Read only.")


def run_preflight(codex_command: str, keep_temp: bool, timeout: float) -> dict[str, Any]:
    checks: dict[str, Any] = {}
    marketplace_path = REPO_ROOT / ".agents" / "plugins" / "marketplace.json"

    with AppServerClient(codex_command, keep_temp, timeout) as client:
        initialize = client.request(
            "initialize",
            {
                "clientInfo": {"name": "mirror-codex-app-preflight", "title": None, "version": "0.1.0"},
                "capabilities": {"experimentalApi": True},
            },
        )
        require(same_path(initialize.get("codexHome", ""), client.temp_home), "initialize codexHome must use temp CODEX_HOME.")
        checks["initialize"] = {
            "passed": True,
            "platformOs": initialize.get("platformOs"),
            "userAgent": initialize.get("userAgent"),
        }

        before = client.request("plugin/list", {"cwds": [str(REPO_ROOT)], "forceRemoteSync": False})
        marketplace = find_marketplace(before)
        require(same_path(marketplace.get("path", ""), marketplace_path), "mirror-local path drifted.")
        before_summary = find_plugin_summary(marketplace)
        validate_plugin_summary(before_summary, installed=False, enabled=False)
        checks["plugin_list_before_install"] = {
            "passed": True,
            "marketplace": marketplace.get("name"),
            "marketplacePath": marketplace.get("path"),
            "pluginId": before_summary.get("id"),
            "installed": before_summary.get("installed"),
            "enabled": before_summary.get("enabled"),
        }

        detail = client.request(
            "plugin/read",
            {"marketplacePath": marketplace.get("path"), "pluginName": PLUGIN_NAME},
        )
        plugin = detail.get("plugin", {})
        detail_summary = plugin.get("summary", {})
        validate_plugin_summary(detail_summary, installed=False, enabled=False)
        skill_names = {skill.get("name") for skill in plugin.get("skills", [])}
        require(skill_names == {SKILL_NAME}, "plugin/read must expose only mirror-demo skill.")
        require(plugin.get("mcpServers") == [MCP_SERVER_NAME], "plugin/read must expose mirror-demo MCP server.")
        require(plugin.get("apps") == [], "V1 plugin must not expose apps.")
        checks["plugin_read"] = {
            "passed": True,
            "displayName": (detail_summary.get("interface") or {}).get("displayName"),
            "skills": sorted(skill_names),
            "mcpServers": plugin.get("mcpServers"),
            "apps": plugin.get("apps"),
        }

        install = client.request(
            "plugin/install",
            {"marketplacePath": marketplace.get("path"), "pluginName": PLUGIN_NAME, "forceRemoteSync": False},
        )
        require(install.get("authPolicy") == "ON_INSTALL", "plugin install auth policy drifted.")
        require(install.get("appsNeedingAuth") == [], "V1 plugin install must not require app auth.")
        checks["plugin_install"] = {"passed": True, **install}

        after = client.request("plugin/list", {"cwds": [str(REPO_ROOT)], "forceRemoteSync": False})
        after_summary = find_plugin_summary(find_marketplace(after))
        validate_plugin_summary(after_summary, installed=True, enabled=True)
        checks["plugin_list_after_install"] = {
            "passed": True,
            "installed": after_summary.get("installed"),
            "enabled": after_summary.get("enabled"),
        }

        skills = client.request("skills/list", {"cwds": [str(REPO_ROOT)], "forceReload": True})
        found_skills: list[dict[str, Any]] = []
        for entry in skills.get("data", []):
            for skill in entry.get("skills", []):
                if skill.get("name") == SKILL_NAME:
                    found_skills.append(skill)
        require(len(found_skills) == 1, "skills/list must expose exactly one mirror-codex:mirror-demo skill.")
        skill = found_skills[0]
        require(skill.get("enabled") is True, "mirror-demo skill must be enabled after plugin install.")
        checks["skills_list_after_install"] = {
            "passed": True,
            "skill": skill.get("name"),
            "enabled": skill.get("enabled"),
            "scope": skill.get("scope"),
        }

        reload_result = client.request("config/mcpServer/reload")
        require(reload_result == {}, "MCP config reload should return an empty object.")
        mcp_status = client.request(
            "mcpServerStatus/list",
            {"detail": "full", "limit": 50, "cursor": None},
        )
        servers = mcp_status.get("data", [])
        mirror_server = next((server for server in servers if server.get("name") == MCP_SERVER_NAME), None)
        require(mirror_server is not None, "mcpServerStatus/list must expose mirror-demo.")
        require(mirror_server.get("authStatus") == "unsupported", "mirror-demo auth status must remain unsupported.")
        checks["mcp_status_after_install"] = {
            "passed": True,
            "server": mirror_server.get("name"),
            "authStatus": mirror_server.get("authStatus"),
        }

        temp_home_value = str(client.temp_home) if keep_temp else "<temporary>"
        codex_path = client.codex_path

    return {
        "repo_root": str(REPO_ROOT),
        "codex_command": codex_path,
        "temp_home": temp_home_value,
        "kept_temp_home": keep_temp,
        "uses_app_server_protocol": True,
        "calls_model_provider": False,
        "ui_todo_closed": False,
        "checks": checks,
        "notes": [
            "TODO[verify]: This app protocol preflight does not inspect interactive Codex app UI labels or controls.",
            "Direct evidence: app-server plugin/list, plugin/read, plugin/install, skills/list, and mcpServerStatus/list accepted the repo-local mirror-codex plugin in an isolated CODEX_HOME.",
            "Reasonable inference: this exercises the same plugin inventory and install protocol used by Codex app surfaces, but it is not a screenshot or click-path acceptance.",
        ],
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a Codex app-server protocol preflight for the Mirror Codex plugin.",
    )
    parser.add_argument("--codex", default="codex", help="Codex CLI command to execute.")
    parser.add_argument("--keep-temp", action="store_true", help="Keep the isolated CODEX_HOME.")
    parser.add_argument("--timeout", type=float, default=30.0, help="Seconds to wait per app-server request.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        result = run_preflight(args.codex, args.keep_temp, args.timeout)
    except AssertionError as exc:
        print(f"Mirror Codex app protocol preflight failed: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2, sort_keys=True))
    print("Mirror Codex app protocol preflight passed.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
