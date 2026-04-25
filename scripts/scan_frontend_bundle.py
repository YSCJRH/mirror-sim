from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


SECRET_PATTERNS = [
    re.compile(r"sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}"),
    re.compile(r"NEXT_PUBLIC_[A-Z_]*OPENAI_API_KEY\s*[:=]\s*['\"][^'\"\s]+['\"]"),
    re.compile(r"OPENAI_API_KEY\s*[:=]\s*['\"]sk-[^'\"\s]+['\"]"),
    re.compile(r"MIRROR_HOSTED_OPENAI_API_KEY\s*[:=]\s*['\"]sk-[^'\"\s]+['\"]"),
]


def iter_files(root: Path):
    for path in root.rglob("*"):
        if path.is_file():
            yield path


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan generated files for accidental provider secret exposure.")
    parser.add_argument(
        "--path",
        type=Path,
        default=Path("frontend/.next/static"),
        help="Directory to scan. Defaults to browser-delivered frontend bundle output.",
    )
    args = parser.parse_args()
    root = args.path

    if not root.exists():
        print(f"Bundle path does not exist, skipping scan: {root}")
        return 0

    findings: list[str] = []
    for path in iter_files(root):
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                findings.append(str(path))
                break

    if findings:
        print("Potential secret exposure in frontend bundle:", file=sys.stderr)
        for finding in findings:
            print(f"  {finding}", file=sys.stderr)
        return 1

    print(f"Provider secret scan passed: {root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
