from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path


def _gh_json(args: list[str], *, cwd: Path) -> object:
    try:
        result = subprocess.run(
            ["gh", *args],
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        stderr = exc.stderr.strip() if exc.stderr else "unknown gh failure"
        raise RuntimeError(
            "GitHub bootstrap requires an authenticated `gh` context with repo/workflow access. "
            f"Command failed: gh {' '.join(args)}. stderr: {stderr}"
        ) from exc
    return json.loads(result.stdout) if result.stdout.strip() else None


def _label_exists(existing: list[dict], name: str) -> bool:
    return any(label["name"] == name for label in existing)


def _milestone_by_title(existing: list[dict], title: str) -> dict | None:
    for milestone in existing:
        if milestone["title"] == title:
            return milestone
    return None


def _issue_exists(existing: list[dict], title: str) -> bool:
    return any(issue["title"] == title for issue in existing)


def bootstrap_github(repo: str, spec_path: Path, *, apply: bool) -> None:
    cwd = spec_path.resolve().parents[2]
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    existing_labels = _gh_json(["api", f"repos/{repo}/labels", "--paginate"], cwd=cwd)
    existing_milestones = _gh_json(["api", f"repos/{repo}/milestones?state=all", "--paginate"], cwd=cwd)
    existing_issues = _gh_json(["api", f"repos/{repo}/issues?state=all", "--paginate"], cwd=cwd)
    milestone_numbers: dict[str, int] = {}

    for milestone in spec["milestones"]:
        existing = _milestone_by_title(existing_milestones, milestone["title"])
        if existing:
            milestone_numbers[milestone["title"]] = existing["number"]
            print(f"[exists] milestone {milestone['title']}")
            continue
        print(f"[create] milestone {milestone['title']}")
        if apply:
            created = _gh_json(
                [
                    "api",
                    f"repos/{repo}/milestones",
                    "--method",
                    "POST",
                    "-f",
                    f"title={milestone['title']}",
                    "-f",
                    f"description={milestone['description']}",
                ],
                cwd=cwd,
            )
            milestone_numbers[milestone["title"]] = created["number"]

    if apply:
        refreshed_milestones = _gh_json(["api", f"repos/{repo}/milestones?state=all", "--paginate"], cwd=cwd)
        for milestone in refreshed_milestones:
            milestone_numbers[milestone["title"]] = milestone["number"]

    for label in spec["labels"]:
        if _label_exists(existing_labels, label["name"]):
            print(f"[exists] label {label['name']}")
            continue
        print(f"[create] label {label['name']}")
        if apply:
            _gh_json(
                [
                    "api",
                    f"repos/{repo}/labels",
                    "--method",
                    "POST",
                    "-f",
                    f"name={label['name']}",
                    "-f",
                    f"color={label['color']}",
                    "-f",
                    f"description={label['description']}",
                ],
                cwd=cwd,
            )

    for issue in spec["issues"]:
        if _issue_exists(existing_issues, issue["title"]):
            print(f"[exists] issue {issue['title']}")
            continue
        print(f"[create] issue {issue['title']}")
        if apply:
            args = [
                "issue",
                "create",
                "--repo",
                repo,
                "--title",
                issue["title"],
                "--body",
                issue["body"],
            ]
            if issue.get("milestone") and issue["milestone"] in milestone_numbers:
                args.extend(["--milestone", issue["milestone"]])
            for label in issue.get("labels", []):
                args.extend(["--label", label])
            subprocess.run(["gh", *args], cwd=cwd, check=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Bootstrap GitHub milestones, labels, and issues for Mirror automation.")
    parser.add_argument("--repo", required=True, help="GitHub repo in owner/name form.")
    parser.add_argument("--spec", default=".github/automation/bootstrap-spec.json", help="Path to the bootstrap JSON spec.")
    parser.add_argument("--apply", action="store_true", help="Actually create missing resources. Without this flag, run in dry-run mode.")
    args = parser.parse_args()

    bootstrap_github(args.repo, Path(args.spec), apply=args.apply)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
