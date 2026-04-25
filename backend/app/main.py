from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Response

from backend.app.config import get_settings

app = FastAPI(title="Mirror Engine", version="0.1.0")

PUBLIC_DEMO_ARTIFACTS = {
    "demo.report": {
        "label": "Canonical report",
        "kind": "text",
        "media_type": "text/markdown; charset=utf-8",
        "root": "artifacts",
        "path": ("report", "report.md"),
    },
    "demo.claims": {
        "label": "Claims",
        "kind": "json",
        "media_type": "application/json; charset=utf-8",
        "root": "artifacts",
        "path": ("report", "claims.json"),
    },
    "demo.eval_summary": {
        "label": "Evaluation summary",
        "kind": "json",
        "media_type": "application/json; charset=utf-8",
        "root": "artifacts",
        "path": ("eval", "summary.json"),
    },
    "demo.compare": {
        "label": "Branch comparison",
        "kind": "json",
        "media_type": "application/json; charset=utf-8",
        "root": "artifacts",
        "path": ("compare", "scenario_fog_harbor_phase44_matrix", "compare.json"),
    },
    "demo.documents": {
        "label": "Evidence documents",
        "kind": "jsonl",
        "media_type": "application/x-ndjson; charset=utf-8",
        "root": "artifacts",
        "path": ("ingest", "documents.jsonl"),
    },
    "demo.chunks": {
        "label": "Evidence chunks",
        "kind": "jsonl",
        "media_type": "application/x-ndjson; charset=utf-8",
        "root": "artifacts",
        "path": ("ingest", "chunks.jsonl"),
    },
    "demo.graph": {
        "label": "World graph",
        "kind": "json",
        "media_type": "application/json; charset=utf-8",
        "root": "artifacts",
        "path": ("graph", "graph.json"),
    },
    "demo.rubric": {
        "label": "Human review rubric",
        "kind": "text",
        "media_type": "text/markdown; charset=utf-8",
        "root": "repo",
        "path": ("docs", "rubrics", "human-review.md"),
    },
}


def _artifact_path(artifact_id: str) -> Path:
    artifact = PUBLIC_DEMO_ARTIFACTS.get(artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="The requested demo artifact is not allowlisted.")
    settings = get_settings()
    root = settings.repo_root if artifact["root"] == "repo" else settings.artifacts_root
    return root.joinpath(*artifact["path"])


def _parse_jsonl(text: str) -> list[Any]:
    return [json.loads(line) for line in text.splitlines() if line.strip()]


def _sanitize_public_artifact(artifact_id: str, data: Any) -> Any:
    if artifact_id == "demo.eval_summary" and isinstance(data, dict):
        return {key: value for key, value in data.items() if key != "artifact_paths"}

    if artifact_id == "demo.compare" and isinstance(data, dict):
        public_compare = dict(data)
        public_branches = []
        for branch in public_compare.get("branches", []):
            if isinstance(branch, dict):
                public_branches.append(
                    {
                        key: value
                        for key, value in branch.items()
                        if key not in {"summary_path", "trace_path", "snapshot_dir"}
                    }
                )
            else:
                public_branches.append(branch)
        public_compare["branches"] = public_branches
        return public_compare

    if artifact_id == "demo.documents" and isinstance(data, list):
        return [
            {key: value for key, value in row.items() if key != "source_path"}
            if isinstance(row, dict)
            else row
            for row in data
        ]

    return data


def _read_public_artifact(artifact_id: str) -> tuple[str, Any]:
    artifact = PUBLIC_DEMO_ARTIFACTS.get(artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="The requested demo artifact is not allowlisted.")

    try:
        text = _artifact_path(artifact_id).read_text(encoding="utf-8")
        if artifact["kind"] == "json":
            return "data", _sanitize_public_artifact(artifact_id, json.loads(text))
        if artifact["kind"] == "jsonl":
            return "rows", _sanitize_public_artifact(artifact_id, _parse_jsonl(text))
        return "content", text
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=503, detail="The requested demo artifact is unavailable.") from exc


def _manifest_entry(artifact_id: str, artifact: dict[str, Any]) -> dict[str, str]:
    return {
        "id": artifact_id,
        "label": artifact["label"],
        "kind": artifact["kind"],
        "mediaType": artifact["media_type"],
    }


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "mirror-engine", "version": app.version}


@app.get("/readyz")
def readyz(response: Response) -> dict[str, object]:
    settings = get_settings()
    checks = [
        (
            artifact_id,
            (settings.repo_root if artifact["root"] == "repo" else settings.artifacts_root).joinpath(
                *artifact["path"]
            ),
            artifact["kind"],
        )
        for artifact_id, artifact in PUBLIC_DEMO_ARTIFACTS.items()
    ]
    artifacts: list[dict[str, str]] = []

    for artifact_id, artifact_path, artifact_kind in checks:
        status = "ok"
        try:
            text = artifact_path.read_text(encoding="utf-8")
            if artifact_kind == "json":
                json.loads(text)
            elif artifact_kind == "jsonl":
                for line in text.splitlines():
                    if line.strip():
                        json.loads(line)
        except (OSError, json.JSONDecodeError):
            status = "missing"
        artifacts.append({"id": artifact_id, "kind": artifact_kind, "status": status})

    ready = all(artifact["status"] == "ok" for artifact in artifacts)
    if not ready:
        response.status_code = 503
    return {"status": "ready" if ready else "degraded", "world_id": settings.world_id, "artifacts": artifacts}


@app.get("/public-demo/manifest")
def public_demo_manifest() -> dict[str, object]:
    return {
        "demo": "fog-harbor",
        "mode": "deterministic-only",
        "mutation": "disabled",
        "artifacts": [
            _manifest_entry(artifact_id, artifact)
            for artifact_id, artifact in PUBLIC_DEMO_ARTIFACTS.items()
        ],
    }


@app.get("/public-demo/artifacts/{artifact_id}")
def public_demo_artifact(artifact_id: str) -> dict[str, object]:
    artifact = PUBLIC_DEMO_ARTIFACTS.get(artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail="The requested demo artifact is not allowlisted.")

    payload_key, payload = _read_public_artifact(artifact_id)
    return {"id": artifact_id, "kind": artifact["kind"], payload_key: payload}


@app.get("/demo/report")
def demo_report() -> dict[str, str]:
    try:
        _, content = _read_public_artifact("demo.report")
    except HTTPException as exc:
        if exc.status_code == 503:
            return {"status": "missing", "message": "Run `make eval-demo` first."}
        raise
    return {
        "status": "ok",
        "artifact_id": "demo.report",
        "media_type": "text/markdown; charset=utf-8",
        "content": content,
    }
