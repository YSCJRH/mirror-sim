from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import PurePosixPath


sys.dont_write_bytecode = True

ALLOWED_EXACT_PATHS = {
    ".agents/plugins/marketplace.json",
    ".github/pull_request_template.md",
    ".github/workflows/deploy-web.yml",
    ".github/workflows/phase0.yml",
    "Makefile",
    "README.md",
    "docs/decisions/ADR-0010-mirror-codex-plugin-mcp-contract.md",
    "docs/deploy/mirror-codex-plugin.md",
    "docs/deploy/render-public-demo.md",
    "docs/releases/mirror-codex-plugin-v1.md",
    "make.ps1",
    "scripts/smoke_public_demo_web.py",
}
ALLOWED_PREFIXES = {
    "plugins/mirror-codex/",
}
LOCAL_ONLY_UNTRACKED_PREFIXES = {
    "backend/mirror_engine.egg-info/",
    "docs/plans/",
}


def normalize_path(path: str) -> str:
    return path.replace("\\", "/").strip("/")


def is_allowed_scope(path: str) -> bool:
    normalized = normalize_path(path)
    return normalized in ALLOWED_EXACT_PATHS or any(
        normalized.startswith(prefix) for prefix in ALLOWED_PREFIXES
    )


def is_local_only_untracked(path: str) -> bool:
    normalized = normalize_path(path)
    return any(normalized.startswith(prefix) for prefix in LOCAL_ONLY_UNTRACKED_PREFIXES)


def tracked_or_untracked_status() -> list[tuple[str, str]]:
    completed = subprocess.run(
        ["git", "status", "--porcelain=v1", "--untracked-files=all"],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise AssertionError(f"git status failed:\n{completed.stderr}")

    entries: list[tuple[str, str]] = []
    for line in completed.stdout.splitlines():
        if not line:
            continue
        status = line[:2]
        raw_path = line[3:]
        if " -> " in raw_path:
            _, raw_path = raw_path.rsplit(" -> ", 1)
        entries.append((status, normalize_path(raw_path)))
    return entries


def sort_key(item: tuple[str, str]) -> str:
    return PurePosixPath(item[1]).as_posix()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Check that the workspace only contains the Mirror Codex Plugin V1 PR scope.",
    )
    parser.add_argument(
        "--stage-list",
        action="store_true",
        help="Print only in-scope paths, one per line, for git add --pathspec-from-file=-.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        entries = tracked_or_untracked_status()
    except AssertionError as exc:
        print(f"Mirror Codex plugin PR scope check failed: {exc}", file=sys.stderr)
        return 1

    in_scope: list[tuple[str, str]] = []
    ignored_local: list[tuple[str, str]] = []
    unexpected: list[tuple[str, str]] = []

    for status, path in entries:
        if is_allowed_scope(path):
            in_scope.append((status, path))
            continue
        if status == "??" and is_local_only_untracked(path):
            ignored_local.append((status, path))
            continue
        unexpected.append((status, path))

    if unexpected:
        print("Mirror Codex plugin PR scope check failed: unexpected workspace paths:", file=sys.stderr)
        for status, path in sorted(unexpected, key=sort_key):
            print(f"  {status} {path}", file=sys.stderr)
        if ignored_local:
            print("\nAllowed local-only untracked paths excluded from plugin PR:", file=sys.stderr)
            for status, path in sorted(ignored_local, key=sort_key):
                print(f"  {status} {path}", file=sys.stderr)
        return 1

    if args.stage_list:
        for _, path in sorted(in_scope, key=sort_key):
            print(path)
        return 0

    print("Mirror Codex plugin PR scope check passed.")
    if in_scope:
        print("Plugin V1 scoped workspace paths:")
        for status, path in sorted(in_scope, key=sort_key):
            print(f"  {status} {path}")
    if ignored_local:
        print("Local-only untracked paths excluded from plugin PR:")
        for status, path in sorted(ignored_local, key=sort_key):
            print(f"  {status} {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
