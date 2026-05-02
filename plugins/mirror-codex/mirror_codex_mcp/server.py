from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Callable


SERVER_NAME = "mirror-codex"
SERVER_VERSION = "0.1.0"
PROTOCOL_VERSION = "2025-06-18"
REFERENCE_BRANCH_ID = "branch_baseline"
PUBLIC_DEMO_ARTIFACTS: dict[str, dict[str, Any]] = {
    "demo.report": {
        "label": "Canonical report",
        "kind": "text",
        "mediaType": "text/markdown; charset=utf-8",
        "root": "artifacts",
        "path": ("report", "report.md"),
    },
    "demo.claims": {
        "label": "Claims",
        "kind": "json",
        "mediaType": "application/json; charset=utf-8",
        "root": "artifacts",
        "path": ("report", "claims.json"),
    },
    "demo.eval_summary": {
        "label": "Evaluation summary",
        "kind": "json",
        "mediaType": "application/json; charset=utf-8",
        "root": "artifacts",
        "path": ("eval", "summary.json"),
    },
    "demo.compare": {
        "label": "Branch comparison",
        "kind": "json",
        "mediaType": "application/json; charset=utf-8",
        "root": "artifacts",
        "path": ("compare", "scenario_fog_harbor_phase44_matrix", "compare.json"),
    },
    "demo.documents": {
        "label": "Evidence documents",
        "kind": "jsonl",
        "mediaType": "application/x-ndjson; charset=utf-8",
        "root": "artifacts",
        "path": ("ingest", "documents.jsonl"),
    },
    "demo.chunks": {
        "label": "Evidence chunks",
        "kind": "jsonl",
        "mediaType": "application/x-ndjson; charset=utf-8",
        "root": "artifacts",
        "path": ("ingest", "chunks.jsonl"),
    },
    "demo.graph": {
        "label": "World graph",
        "kind": "json",
        "mediaType": "application/json; charset=utf-8",
        "root": "artifacts",
        "path": ("graph", "graph.json"),
    },
    "demo.rubric": {
        "label": "Human review rubric",
        "kind": "text",
        "mediaType": "text/markdown; charset=utf-8",
        "root": "repo",
        "path": ("docs", "rubrics", "human-review.md"),
    },
}
BRANCH_IDS = (
    "branch_baseline",
    "branch_harbor_comms_failure",
    "branch_mayor_signal_blocked",
    "branch_reporter_detained",
)
RESOURCE_URI_PREFIX = "mirror-demo://artifact/"
RESOURCE_URIS = {
    "mirror-demo://manifest": "demo.manifest",
    **{
        f"{RESOURCE_URI_PREFIX}{artifact_id}": artifact_id
        for artifact_id in PUBLIC_DEMO_ARTIFACTS
    },
}
PROMPT_NAMES = (
    "inspect-public-demo",
    "review-claim-evidence",
    "compare-demo-branches",
)
REPO_ROOT_SENTINELS = (
    "AGENTS.md",
    "mirror.md",
    ".agents/plugins/marketplace.json",
)


class ToolInputError(ValueError):
    """Raised when a tool input violates the logical-id contract."""


class ToolDataError(RuntimeError):
    """Raised when canonical demo artifacts are missing or invalid."""


def looks_like_repo_root(path: Path) -> bool:
    return all(path.joinpath(sentinel).exists() for sentinel in REPO_ROOT_SENTINELS)


def repo_root() -> Path:
    cwd = Path.cwd().resolve()
    for candidate in (cwd, *cwd.parents):
        if looks_like_repo_root(candidate):
            return candidate
    return Path(__file__).resolve().parents[3]


def artifacts_root() -> Path:
    return repo_root() / "artifacts" / "demo"


def reject_path_like(value: str, field_name: str) -> None:
    if any(part in value for part in ("/", "\\", ":", "..")) or value.startswith("."):
        raise ToolInputError(
            f"{field_name} must be a logical Mirror demo id, not a filesystem path or URL."
        )


def parse_jsonl(text: str) -> list[Any]:
    return [json.loads(line) for line in text.splitlines() if line.strip()]


def sanitize_public_artifact(artifact_id: str, data: Any) -> Any:
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


def manifest_entry(artifact_id: str, artifact: dict[str, Any]) -> dict[str, str]:
    return {
        "id": artifact_id,
        "label": str(artifact["label"]),
        "kind": str(artifact["kind"]),
        "mediaType": str(artifact["mediaType"]),
    }


def get_demo_manifest() -> dict[str, Any]:
    return {
        "demo": "fog-harbor",
        "mode": "deterministic-only",
        "mutation": "disabled",
        "artifacts": [
            manifest_entry(artifact_id, artifact)
            for artifact_id, artifact in PUBLIC_DEMO_ARTIFACTS.items()
        ],
    }


def artifact_path(artifact_id: str) -> Path:
    reject_path_like(artifact_id, "artifact_id")
    artifact = PUBLIC_DEMO_ARTIFACTS.get(artifact_id)
    if not artifact:
        raise ToolInputError(f"Artifact id `{artifact_id}` is not in the public demo allowlist.")
    root = repo_root() if artifact["root"] == "repo" else artifacts_root()
    return root.joinpath(*artifact["path"])


def read_demo_artifact_payload(artifact_id: str) -> tuple[str, Any]:
    path = artifact_path(artifact_id)
    artifact = PUBLIC_DEMO_ARTIFACTS[artifact_id]
    try:
        text = path.read_text(encoding="utf-8")
        if artifact["kind"] == "json":
            return "data", sanitize_public_artifact(artifact_id, json.loads(text))
        if artifact["kind"] == "jsonl":
            return "rows", sanitize_public_artifact(artifact_id, parse_jsonl(text))
        return "content", text
    except (OSError, json.JSONDecodeError) as exc:
        raise ToolDataError(
            f"Canonical demo artifact `{artifact_id}` is unavailable. Run `python -m backend.app.cli eval-demo` first."
        ) from exc


def get_demo_artifact(artifact_id: str) -> dict[str, Any]:
    payload_key, payload = read_demo_artifact_payload(artifact_id)
    return {
        "id": artifact_id,
        "kind": PUBLIC_DEMO_ARTIFACTS[artifact_id]["kind"],
        payload_key: payload,
    }


def get_eval_summary() -> dict[str, Any]:
    return get_demo_artifact("demo.eval_summary")


def resource_definitions() -> list[dict[str, str]]:
    resources = [
        {
            "uri": "mirror-demo://manifest",
            "name": "Mirror public demo manifest",
            "description": "Allowlisted logical artifact ids for the deterministic public demo.",
            "mimeType": "application/json; charset=utf-8",
        }
    ]
    resources.extend(
        {
            "uri": f"{RESOURCE_URI_PREFIX}{artifact_id}",
            "name": str(artifact["label"]),
            "description": f"Read-only Mirror public demo artifact `{artifact_id}`.",
            "mimeType": str(artifact["mediaType"]),
        }
        for artifact_id, artifact in PUBLIC_DEMO_ARTIFACTS.items()
    )
    return resources


def read_resource(uri: str) -> dict[str, Any]:
    if uri not in RESOURCE_URIS:
        raise ToolInputError(f"Resource uri `{uri}` is not in the Mirror demo allowlist.")
    if uri == "mirror-demo://manifest":
        return {
            "contents": [
                {
                    "uri": uri,
                    "mimeType": "application/json; charset=utf-8",
                    "text": json.dumps(get_demo_manifest(), ensure_ascii=False, indent=2),
                }
            ]
        }

    artifact_id = RESOURCE_URIS[uri]
    artifact = get_demo_artifact(artifact_id)
    media_type = str(PUBLIC_DEMO_ARTIFACTS[artifact_id]["mediaType"])
    if "content" in artifact:
        text = str(artifact["content"])
    else:
        text = json.dumps(artifact, ensure_ascii=False, indent=2)
    return {"contents": [{"uri": uri, "mimeType": media_type, "text": text}]}


def explain_demo_claim(claim_id: str) -> dict[str, Any]:
    reject_path_like(claim_id, "claim_id")
    claims = get_demo_artifact("demo.claims")["data"]
    chunks = get_demo_artifact("demo.chunks")["rows"]
    documents = get_demo_artifact("demo.documents")["rows"]
    claim = next((item for item in claims if item.get("claim_id") == claim_id), None)
    if claim is None:
        raise ToolInputError(f"Claim id `{claim_id}` is not present in demo.claims.")

    evidence_ids = set(claim.get("evidence_ids", []))
    evidence_chunks = [chunk for chunk in chunks if chunk.get("chunk_id") in evidence_ids]
    document_ids = {chunk.get("document_id") for chunk in evidence_chunks}
    evidence_documents = [
        document for document in documents if document.get("document_id") in document_ids
    ]

    return {
        "claim": claim,
        "evidence_chunks": evidence_chunks,
        "evidence_documents": evidence_documents,
        "notes": [
            "This explanation is bounded to the canonical deterministic Fog Harbor demo artifacts.",
            "The claim keeps both label and evidence_ids for reviewability.",
        ],
    }


def compare_demo_branches(candidate_branch_id: str, reference_branch_id: str = REFERENCE_BRANCH_ID) -> dict[str, Any]:
    reject_path_like(candidate_branch_id, "candidate_branch_id")
    reject_path_like(reference_branch_id, "reference_branch_id")
    if reference_branch_id != REFERENCE_BRANCH_ID:
        raise ToolInputError(f"Only `{REFERENCE_BRANCH_ID}` is supported as the reference branch.")

    compare = get_demo_artifact("demo.compare")["data"]
    branches = compare.get("branches", [])
    branch = next((item for item in branches if item.get("branch_id") == candidate_branch_id), None)
    if branch is None:
        raise ToolInputError(f"Branch id `{candidate_branch_id}` is not present in demo.compare.")
    if branch.get("is_reference"):
        raise ToolInputError("Choose a non-reference candidate branch.")

    delta = next(
        (item for item in compare.get("reference_deltas", []) if item.get("branch_id") == candidate_branch_id),
        None,
    )
    if delta is None:
        raise ToolDataError(f"No reference delta exists for `{candidate_branch_id}`.")

    return {
        "compare_id": compare.get("compare_id"),
        "scenario_id": compare.get("scenario_id"),
        "seed": compare.get("seed"),
        "reference_branch_id": reference_branch_id,
        "candidate_branch": branch,
        "delta": delta,
        "notes": [
            "This is a deterministic branch comparison, not a real-world prediction.",
            "Path-bearing branch fields are removed from public MCP output.",
        ],
    }


def schema_string(description: str, enum: tuple[str, ...] | None = None) -> dict[str, Any]:
    schema: dict[str, Any] = {"type": "string", "description": description}
    if enum:
        schema["enum"] = list(enum)
    return schema


def prompt_definitions() -> list[dict[str, Any]]:
    return [
        {
            "name": "inspect-public-demo",
            "title": "Inspect Public Demo",
            "description": "Guide a read-only inspection of the deterministic Fog Harbor public demo.",
            "arguments": [],
        },
        {
            "name": "review-claim-evidence",
            "title": "Review Claim Evidence",
            "description": "Guide claim and evidence review while preserving label and evidence_ids.",
            "arguments": [],
        },
        {
            "name": "compare-demo-branches",
            "title": "Compare Demo Branches",
            "description": "Guide deterministic branch comparison against the baseline branch.",
            "arguments": [],
        },
    ]


def prompt_messages(name: str, arguments: Any | None = None) -> dict[str, Any]:
    if name not in PROMPT_NAMES:
        raise ToolInputError(f"Prompt `{name}` is not in the Mirror demo allowlist.")
    if arguments not in (None, {}):
        raise ToolInputError(f"Prompt `{name}` does not accept arguments.")

    prompts = {
        "inspect-public-demo": (
            "Inspect Mirror's deterministic Phase 1 public demo in read-only mode. "
            "Use logical artifact ids or mirror-demo:// resources only. Summarize the manifest, "
            "eval status, and safety boundary without presenting the demo as a real-world prediction."
        ),
        "review-claim-evidence": (
            "Review demo.claims and explain claim_evacuation_turn with its evidence. "
            "Keep both label and evidence_ids in the answer, cite bounded deterministic-demo context, "
            "and do not use filesystem paths or provider calls."
        ),
        "compare-demo-branches": (
            "Compare branch_reporter_detained against branch_baseline using the deterministic demo compare artifact. "
            "Describe branch deltas as scenario-bounded what-if output, not certain real-world conclusions."
        ),
    }
    return {
        "description": prompt_definitions()[PROMPT_NAMES.index(name)]["description"],
        "messages": [
            {
                "role": "user",
                "content": {
                    "type": "text",
                    "text": prompts[name],
                },
            }
        ],
    }


def tool_definitions() -> list[dict[str, Any]]:
    return [
        {
            "name": "get_demo_manifest",
            "title": "Get Demo Manifest",
            "description": "Return the allowlisted logical artifact ids for the deterministic Mirror public demo.",
            "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
            "annotations": {"readOnlyHint": True},
        },
        {
            "name": "get_demo_artifact",
            "title": "Get Demo Artifact",
            "description": "Return one allowlisted public demo artifact by logical artifact id.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "artifact_id": schema_string(
                        "Logical public demo artifact id, never a filesystem path.",
                        tuple(PUBLIC_DEMO_ARTIFACTS.keys()),
                    )
                },
                "required": ["artifact_id"],
                "additionalProperties": False,
            },
            "annotations": {"readOnlyHint": True},
        },
        {
            "name": "get_eval_summary",
            "title": "Get Eval Summary",
            "description": "Return the sanitized deterministic eval summary for the canonical public demo.",
            "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
            "annotations": {"readOnlyHint": True},
        },
        {
            "name": "explain_demo_claim",
            "title": "Explain Demo Claim",
            "description": "Return a demo claim with its evidence chunks and document metadata by claim id.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "claim_id": schema_string("Claim id from demo.claims, never a path or query.")
                },
                "required": ["claim_id"],
                "additionalProperties": False,
            },
            "annotations": {"readOnlyHint": True},
        },
        {
            "name": "compare_demo_branches",
            "title": "Compare Demo Branches",
            "description": "Return the deterministic delta between the baseline and one candidate demo branch.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "candidate_branch_id": schema_string(
                        "Candidate branch id from demo.compare.",
                        tuple(branch for branch in BRANCH_IDS if branch != REFERENCE_BRANCH_ID),
                    ),
                    "reference_branch_id": schema_string(
                        "Reference branch id. Only branch_baseline is supported.",
                        (REFERENCE_BRANCH_ID,),
                    ),
                },
                "required": ["candidate_branch_id"],
                "additionalProperties": False,
            },
            "annotations": {"readOnlyHint": True},
        },
    ]


def require_string(arguments: dict[str, Any], name: str) -> str:
    value = arguments.get(name)
    if not isinstance(value, str) or not value:
        raise ToolInputError(f"`{name}` must be a non-empty string.")
    return value


TOOL_HANDLERS: dict[str, Callable[[dict[str, Any]], dict[str, Any]]] = {
    "get_demo_manifest": lambda _arguments: get_demo_manifest(),
    "get_demo_artifact": lambda arguments: get_demo_artifact(require_string(arguments, "artifact_id")),
    "get_eval_summary": lambda _arguments: get_eval_summary(),
    "explain_demo_claim": lambda arguments: explain_demo_claim(require_string(arguments, "claim_id")),
}
TOOL_ALLOWED_ARGUMENTS: dict[str, set[str]] = {
    "get_demo_manifest": set(),
    "get_demo_artifact": {"artifact_id"},
    "get_eval_summary": set(),
    "explain_demo_claim": {"claim_id"},
    "compare_demo_branches": {"candidate_branch_id", "reference_branch_id"},
}


def handle_compare_demo_branches(arguments: dict[str, Any]) -> dict[str, Any]:
    reference_branch_id = arguments.get("reference_branch_id", REFERENCE_BRANCH_ID)
    if not isinstance(reference_branch_id, str):
        raise ToolInputError("`reference_branch_id` must be a string when provided.")
    return compare_demo_branches(
        require_string(arguments, "candidate_branch_id"),
        reference_branch_id,
    )


TOOL_HANDLERS["compare_demo_branches"] = handle_compare_demo_branches


def tool_result(payload: dict[str, Any], *, is_error: bool = False) -> dict[str, Any]:
    return {
        "content": [
            {
                "type": "text",
                "text": json.dumps(payload, ensure_ascii=False, indent=2),
            }
        ],
        "structuredContent": payload,
        "isError": is_error,
    }


def call_tool(name: str, arguments: Any | None) -> dict[str, Any]:
    if name not in TOOL_HANDLERS:
        raise KeyError(name)
    if arguments is None:
        arguments = {}
    if not isinstance(arguments, dict):
        return tool_result({"error": "arguments must be an object"}, is_error=True)
    try:
        extra_arguments = set(arguments) - TOOL_ALLOWED_ARGUMENTS[name]
        if extra_arguments:
            raise ToolInputError(
                f"Unsupported argument(s) for `{name}`: {', '.join(sorted(extra_arguments))}."
            )
        return tool_result(TOOL_HANDLERS[name](arguments))
    except (ToolInputError, ToolDataError) as exc:
        return tool_result({"error": str(exc)}, is_error=True)


def success_response(request_id: Any, result: dict[str, Any]) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def error_response(request_id: Any, code: int, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}}


def handle_request(message: dict[str, Any]) -> dict[str, Any] | None:
    request_id = message.get("id")
    method = message.get("method")
    is_notification = "id" not in message

    if method == "notifications/initialized":
        return None
    if is_notification:
        return None
    if method == "initialize":
        params = message.get("params")
        client_protocol = params.get("protocolVersion") if isinstance(params, dict) else None
        return success_response(
            request_id,
            {
                "protocolVersion": client_protocol if isinstance(client_protocol, str) else PROTOCOL_VERSION,
                "capabilities": {
                    "tools": {"listChanged": False},
                    "resources": {"listChanged": False},
                    "prompts": {"listChanged": False},
                },
                "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
            },
        )
    if method == "ping":
        return success_response(request_id, {})
    if method == "resources/list":
        return success_response(request_id, {"resources": resource_definitions()})
    if method == "resources/read":
        params = message.get("params")
        if not isinstance(params, dict) or not isinstance(params.get("uri"), str):
            return error_response(request_id, -32602, "resources/read requires params.uri.")
        extra_params = set(params) - {"uri"}
        if extra_params:
            return error_response(
                request_id,
                -32602,
                f"Unsupported resources/read parameter(s): {', '.join(sorted(extra_params))}.",
            )
        try:
            return success_response(request_id, read_resource(params["uri"]))
        except (ToolInputError, ToolDataError) as exc:
            return error_response(request_id, -32602, str(exc))
    if method == "prompts/list":
        return success_response(request_id, {"prompts": prompt_definitions()})
    if method == "prompts/get":
        params = message.get("params")
        if not isinstance(params, dict) or not isinstance(params.get("name"), str):
            return error_response(request_id, -32602, "prompts/get requires params.name.")
        extra_params = set(params) - {"name", "arguments"}
        if extra_params:
            return error_response(
                request_id,
                -32602,
                f"Unsupported prompts/get parameter(s): {', '.join(sorted(extra_params))}.",
            )
        try:
            return success_response(
                request_id,
                prompt_messages(params["name"], params.get("arguments")),
            )
        except ToolInputError as exc:
            return error_response(request_id, -32602, str(exc))
    if method == "tools/list":
        return success_response(request_id, {"tools": tool_definitions()})
    if method == "tools/call":
        params = message.get("params")
        if not isinstance(params, dict) or not isinstance(params.get("name"), str):
            return error_response(request_id, -32602, "tools/call requires params.name.")
        try:
            return success_response(request_id, call_tool(params["name"], params.get("arguments")))
        except KeyError:
            return error_response(request_id, -32601, f"Unknown tool: {params['name']}")

    return error_response(request_id, -32601, f"Unknown method: {method}")


def write_message(message: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(message, ensure_ascii=False, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def serve_stdio() -> int:
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            write_message(error_response(None, -32700, "Parse error"))
            continue
        if isinstance(payload, list):
            responses = []
            for item in payload:
                if isinstance(item, dict):
                    response = handle_request(item)
                    if response is not None:
                        responses.append(response)
                else:
                    responses.append(error_response(None, -32600, "Invalid Request"))
            if responses:
                write_message(responses)  # type: ignore[arg-type]
            continue
        if not isinstance(payload, dict):
            write_message(error_response(None, -32600, "Invalid Request"))
            continue
        response = handle_request(payload)
        if response is not None:
            write_message(response)
    return 0


def main() -> int:
    return serve_stdio()


if __name__ == "__main__":
    raise SystemExit(main())
