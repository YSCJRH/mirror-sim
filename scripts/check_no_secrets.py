from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


OPENAI_KEY_PATTERN = re.compile(r"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b")
NONEMPTY_SECRET_ASSIGNMENT = re.compile(
    r"(?im)^[ \t]*(OPENAI_API_KEY|MIRROR_HOSTED_OPENAI_API_KEY|MIRROR_BETA_ACCESS_CODE|NEXT_PUBLIC_[A-Z_]*OPENAI_API_KEY)[ \t]*=[ \t]*['\"]?([^#\s'\"]+)"
)
PLACEHOLDER_VALUES = {
    "your-api-key",
    "your-openai-api-key",
    "example",
    "placeholder",
    "<secret>",
}


def candidate_files(repo_root: Path) -> list[Path]:
    output = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
        cwd=repo_root,
        text=True,
    )
    return [repo_root / line.strip() for line in output.splitlines() if line.strip()]


def is_placeholder(value: str) -> bool:
    normalized = value.strip().strip("\"'").lower()
    return (
        not normalized
        or normalized in PLACEHOLDER_VALUES
        or normalized.startswith("${{")
        or normalized.startswith("$")
    )


def scan_file(path: Path) -> list[str]:
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return []

    findings: list[str] = []
    for match in OPENAI_KEY_PATTERN.finditer(text):
        findings.append(f"{path}: possible OpenAI API key at offset {match.start()}")
    for match in NONEMPTY_SECRET_ASSIGNMENT.finditer(text):
        name, value = match.groups()
        if not is_placeholder(value):
            findings.append(f"{path}: non-empty tracked secret assignment for {name}")
    return findings


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    findings: list[str] = []
    for path in candidate_files(repo_root):
        findings.extend(scan_file(path))

    if findings:
        print("Secret scan failed:", file=sys.stderr)
        for finding in findings:
            print(f"- {finding}", file=sys.stderr)
        return 1

    print("Secret scan passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
