from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


sys.dont_write_bytecode = True

REPO_ROOT = Path(__file__).resolve().parents[3]
PLUGIN_KEY = 'mirror-codex@mirror-local'
MARKETPLACE_SECTION = "[marketplaces.mirror-local]"
DEBUG_PROMPT = "Inspect the Mirror public demo claims."
SECRET_ENV_MARKERS = ("API_KEY", "TOKEN", "SECRET")


def redact_env(env: dict[str, str]) -> dict[str, str]:
    sanitized = dict(env)
    sanitized["CODEX_HOME"] = sanitized["CODEX_HOME"]
    for key in list(sanitized):
        if key.upper() in {"CODEX_THREAD_ID", "CODEX_INTERNAL_ORIGINATOR_OVERRIDE"}:
            sanitized.pop(key, None)
            continue
        if any(marker in key.upper() for marker in SECRET_ENV_MARKERS):
            sanitized.pop(key, None)
    return sanitized


def run_command(command: list[str], *, env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=REPO_ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


def short_text(text: str, limit: int = 800) -> str:
    collapsed = "\n".join(line.rstrip() for line in text.splitlines() if line.strip())
    if len(collapsed) <= limit:
        return collapsed
    return collapsed[: limit - 3] + "..."


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def skill_visible_in_prompt(prompt_json: str) -> bool:
    try:
        payload = json.loads(prompt_json)
    except json.JSONDecodeError:
        return False
    text = json.dumps(payload, ensure_ascii=False)
    return "- mirror-demo:" in text or "skills/mirror-demo/SKILL.md" in text


def append_manual_plugin_enable(config_path: Path) -> None:
    with config_path.open("a", encoding="utf-8", newline="\n") as handle:
        handle.write(f'\n[plugins."{PLUGIN_KEY}"]\n')
        handle.write("enabled = true\n")


def run_preflight(codex_command: str, keep_temp: bool) -> dict[str, Any]:
    temp_context: tempfile.TemporaryDirectory[str] | None = None
    if keep_temp:
        temp_home = Path(tempfile.mkdtemp(prefix="mirror-codex-home-"))
    else:
        temp_context = tempfile.TemporaryDirectory(prefix="mirror-codex-home-")
        temp_home = Path(temp_context.name)

    env = dict(os.environ)
    env["CODEX_HOME"] = str(temp_home)
    env = redact_env(env)

    codex_path = shutil.which(codex_command)
    if codex_path is None:
        if temp_context is not None:
            temp_context.cleanup()
        raise AssertionError(f"Codex CLI was not found on PATH: {codex_command}")

    result: dict[str, Any] = {
        "repo_root": str(REPO_ROOT),
        "codex_command": codex_path,
        "temp_home": str(temp_home) if keep_temp else "<temporary>",
        "kept_temp_home": keep_temp,
        "calls_model_provider": False,
        "ui_todo_closed": False,
        "checks": {},
        "notes": [
            "TODO[verify]: This CLI preflight does not inspect interactive Codex app UI controls.",
        ],
    }

    add_repo = run_command([codex_path, "marketplace", "add", str(REPO_ROOT)], env=env)
    config_path = temp_home / "config.toml"
    config_text = read_text(config_path)
    result["checks"]["marketplace_add_repo_root"] = {
        "passed": add_repo.returncode == 0,
        "returncode": add_repo.returncode,
        "stdout": short_text(add_repo.stdout),
        "stderr": short_text(add_repo.stderr),
    }
    result["checks"]["temp_config_contains_marketplace"] = {
        "passed": MARKETPLACE_SECTION in config_text and 'source_type = "local"' in config_text,
    }

    wrong_root = run_command([codex_path, "marketplace", "add", str(REPO_ROOT / ".agents" / "plugins")], env=env)
    result["checks"]["marketplace_add_agents_plugins_subdir"] = {
        "passed": wrong_root.returncode != 0,
        "returncode": wrong_root.returncode,
        "stdout": short_text(wrong_root.stdout),
        "stderr": short_text(wrong_root.stderr),
        "interpretation": "Expected failure: the CLI treats the argument as the marketplace root.",
    }

    prompt_after_add = run_command(
        [codex_path, "-C", str(REPO_ROOT), "debug", "prompt-input", DEBUG_PROMPT],
        env=env,
    )
    result["checks"]["debug_prompt_after_marketplace_add"] = {
        "passed": prompt_after_add.returncode == 0,
        "returncode": prompt_after_add.returncode,
        "mirror_demo_skill_visible": skill_visible_in_prompt(prompt_after_add.stdout),
        "stderr": short_text(prompt_after_add.stderr),
    }

    if not config_path.exists():
        raise AssertionError("Codex CLI did not create a temp config.toml after marketplace add.")
    append_manual_plugin_enable(config_path)
    prompt_after_manual_enable = run_command(
        [codex_path, "-C", str(REPO_ROOT), "debug", "prompt-input", DEBUG_PROMPT],
        env=env,
    )
    result["checks"]["debug_prompt_after_manual_plugin_enable"] = {
        "passed": prompt_after_manual_enable.returncode == 0,
        "returncode": prompt_after_manual_enable.returncode,
        "mirror_demo_skill_visible": skill_visible_in_prompt(prompt_after_manual_enable.stdout),
        "stderr": short_text(prompt_after_manual_enable.stderr),
        "interpretation": "Manual config editing is only a troubleshooting probe, not UI install acceptance.",
    }

    if temp_context is not None:
        temp_context.cleanup()
    return result


def preflight_passed(result: dict[str, Any]) -> bool:
    checks = result.get("checks", {})
    required = {
        "marketplace_add_repo_root",
        "temp_config_contains_marketplace",
        "marketplace_add_agents_plugins_subdir",
        "debug_prompt_after_marketplace_add",
        "debug_prompt_after_manual_plugin_enable",
    }
    return all(checks.get(name, {}).get("passed") is True for name in required)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a local Codex CLI marketplace preflight for the Mirror Codex plugin.",
    )
    parser.add_argument(
        "--codex",
        default="codex",
        help="Codex CLI command to execute. Defaults to 'codex'.",
    )
    parser.add_argument(
        "--keep-temp",
        action="store_true",
        help="Keep the isolated CODEX_HOME for manual inspection.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        result = run_preflight(args.codex, args.keep_temp)
    except AssertionError as exc:
        print(f"Mirror Codex CLI marketplace preflight failed: {exc}", file=sys.stderr)
        return 1

    print(json.dumps(result, indent=2, sort_keys=True))
    if not preflight_passed(result):
        print("Mirror Codex CLI marketplace preflight failed one or more required checks.", file=sys.stderr)
        return 1
    print("Mirror Codex CLI marketplace preflight passed.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
