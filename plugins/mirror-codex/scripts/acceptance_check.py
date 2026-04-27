from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any


sys.dont_write_bytecode = True
PLUGIN_NAME = "mirror-codex"
MCP_SERVER_NAME = "mirror-demo"
REPO_ROOT = Path(__file__).resolve().parents[3]
EXPECTED_TOOLS = {
    "get_demo_manifest",
    "get_demo_artifact",
    "get_eval_summary",
    "explain_demo_claim",
    "compare_demo_branches",
}
EXPECTED_RESOURCES = {
    "mirror-demo://manifest",
    "mirror-demo://artifact/demo.report",
    "mirror-demo://artifact/demo.claims",
    "mirror-demo://artifact/demo.eval_summary",
    "mirror-demo://artifact/demo.compare",
    "mirror-demo://artifact/demo.documents",
    "mirror-demo://artifact/demo.chunks",
    "mirror-demo://artifact/demo.graph",
    "mirror-demo://artifact/demo.rubric",
}
EXPECTED_PROMPTS = {
    "inspect-public-demo",
    "review-claim-evidence",
    "compare-demo-branches",
}
EXPECTED_EVIDENCE_IDS = {
    "chunk_doc_budget_minutes_002",
    "chunk_doc_budget_minutes_003",
    "chunk_doc_engineering_inspection_002",
}
FORBIDDEN_OUTPUT_FIELDS = {
    "artifact_paths",
    "summary_path",
    "trace_path",
    "snapshot_dir",
    "source_path",
}


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise AssertionError(f"{path} must contain a JSON object.")
    return payload


def assert_inside(base: Path, candidate: Path) -> None:
    try:
        candidate.resolve().relative_to(base.resolve())
    except ValueError as exc:
        raise AssertionError(f"Path escapes repository root: {candidate}") from exc


def marketplace_plugin_root() -> Path:
    marketplace = load_json(REPO_ROOT / ".agents" / "plugins" / "marketplace.json")
    plugins = marketplace.get("plugins")
    if not isinstance(plugins, list):
        raise AssertionError("marketplace plugins must be a list.")

    entry = next((item for item in plugins if isinstance(item, dict) and item.get("name") == PLUGIN_NAME), None)
    if entry is None:
        raise AssertionError("marketplace does not include mirror-codex.")
    if entry.get("policy") != {"installation": "AVAILABLE", "authentication": "ON_INSTALL"}:
        raise AssertionError("marketplace policy must keep mirror-codex available and on-install authenticated.")
    if entry.get("category") != "Engineering":
        raise AssertionError("marketplace category must remain Engineering.")

    source = entry.get("source")
    if source != {"source": "local", "path": "./plugins/mirror-codex"}:
        raise AssertionError("marketplace source must be the fixed repo-local plugin path.")

    source_path = Path(source["path"])
    if source_path.is_absolute() or ".." in source_path.parts:
        raise AssertionError("marketplace plugin path must be a repository-relative local path.")

    plugin_root = (REPO_ROOT / source_path).resolve()
    assert_inside(REPO_ROOT, plugin_root)
    if not plugin_root.is_dir():
        raise AssertionError(f"marketplace plugin path does not exist: {plugin_root}")
    return plugin_root


def validate_plugin_shell(plugin_root: Path) -> dict[str, Any]:
    manifest = load_json(plugin_root / ".codex-plugin" / "plugin.json")
    if manifest.get("name") != PLUGIN_NAME:
        raise AssertionError("plugin manifest name must match mirror-codex.")
    if manifest.get("skills") != "./skills/":
        raise AssertionError("plugin manifest must expose ./skills/.")
    if manifest.get("mcpServers") != "./.mcp.json":
        raise AssertionError("plugin manifest must point to ./.mcp.json.")
    if "hooks" in manifest or "apps" in manifest:
        raise AssertionError("v1 install acceptance forbids hooks and apps.")
    if manifest.get("interface", {}).get("capabilities") != ["Read"]:
        raise AssertionError("plugin manifest capability must be Read only.")

    skills_path = (plugin_root / manifest["skills"]).resolve()
    assert_inside(plugin_root, skills_path)
    if not (skills_path / "mirror-demo" / "SKILL.md").is_file():
        raise AssertionError("mirror-demo skill is missing from plugin skills path.")

    mcp_path = (plugin_root / manifest["mcpServers"]).resolve()
    assert_inside(plugin_root, mcp_path)
    mcp_config = load_json(mcp_path)
    servers = mcp_config.get("mcpServers")
    if not isinstance(servers, dict) or set(servers) != {MCP_SERVER_NAME}:
        raise AssertionError(".mcp.json must register only mirror-demo.")
    server = servers[MCP_SERVER_NAME]
    if server != {"command": "python", "args": ["./scripts/run_mcp.py"]}:
        raise AssertionError(".mcp.json must use the fixed local python entrypoint.")
    if not (plugin_root / "scripts" / "run_mcp.py").is_file():
        raise AssertionError("MCP entrypoint is missing.")
    return server


def request(request_id: int, method: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"jsonrpc": "2.0", "id": request_id, "method": method}
    if params is not None:
        payload["params"] = params
    return payload


def run_mcp_from_config(plugin_root: Path, server: dict[str, Any]) -> list[dict[str, Any]]:
    messages = [
        request(1, "initialize", {"protocolVersion": "2025-06-18"}),
        request(2, "tools/list"),
        request(3, "resources/list"),
        request(4, "prompts/list"),
        request(
            5,
            "tools/call",
            {"name": "explain_demo_claim", "arguments": {"claim_id": "claim_evacuation_turn"}},
        ),
        request(
            6,
            "resources/read",
            {"uri": "mirror-demo://artifact/demo.documents"},
        ),
        request(
            7,
            "tools/call",
            {
                "name": "get_demo_artifact",
                "arguments": {"artifact_id": "demo.claims", "path": "artifacts/demo/report/claims.json"},
            },
        ),
    ]
    stdin = "\n".join(json.dumps(message, separators=(",", ":")) for message in messages) + "\n"

    command = [sys.executable if server["command"] == "python" else server["command"], *server["args"]]
    completed = subprocess.run(
        command,
        cwd=plugin_root,
        input=stdin,
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise AssertionError(
            f"MCP stdio server exited {completed.returncode}.\nSTDERR:\n{completed.stderr}"
        )
    responses = [json.loads(line) for line in completed.stdout.splitlines() if line.strip()]
    if len(responses) != len(messages):
        raise AssertionError(f"Expected {len(messages)} JSON-RPC responses, got {len(responses)}.")
    return responses


def get_response(responses: list[dict[str, Any]], request_id: int) -> dict[str, Any]:
    response = next((item for item in responses if item.get("id") == request_id), None)
    if response is None:
        raise AssertionError(f"Missing JSON-RPC response id {request_id}.")
    return response


def result_for(responses: list[dict[str, Any]], request_id: int) -> dict[str, Any]:
    response = get_response(responses, request_id)
    if "error" in response:
        raise AssertionError(f"Response id {request_id} returned JSON-RPC error: {response['error']}")
    result = response.get("result")
    if not isinstance(result, dict):
        raise AssertionError(f"Response id {request_id} result must be an object.")
    return result


def assert_no_forbidden_output(payload: Any) -> None:
    text = json.dumps(payload, ensure_ascii=False)
    leaked = sorted(field for field in FORBIDDEN_OUTPUT_FIELDS if field in text)
    if leaked:
        raise AssertionError(f"MCP output leaked internal field(s): {', '.join(leaked)}.")
    if "D:/mirror" in text or "D:\\mirror" in text or "artifacts/demo" in text:
        raise AssertionError("MCP output leaked a local filesystem path.")


def validate_mcp_responses(responses: list[dict[str, Any]]) -> None:
    initialize = result_for(responses, 1)
    capabilities = initialize.get("capabilities", {})
    if not {"tools", "resources", "prompts"}.issubset(capabilities):
        raise AssertionError("initialize response must advertise tools, resources, and prompts.")

    tools = result_for(responses, 2).get("tools")
    if not isinstance(tools, list) or {tool.get("name") for tool in tools} != EXPECTED_TOOLS:
        raise AssertionError("tools/list response drifted from the v1 allowlist.")
    for tool in tools:
        if tool.get("annotations", {}).get("readOnlyHint") is not True:
            raise AssertionError(f"{tool.get('name')} must be annotated read-only.")
        if tool.get("inputSchema", {}).get("additionalProperties") is not False:
            raise AssertionError(f"{tool.get('name')} must use a closed input schema.")

    resources = result_for(responses, 3).get("resources")
    if not isinstance(resources, list) or {resource.get("uri") for resource in resources} != EXPECTED_RESOURCES:
        raise AssertionError("resources/list response drifted from the v1 allowlist.")

    prompts = result_for(responses, 4).get("prompts")
    if not isinstance(prompts, list) or {prompt.get("name") for prompt in prompts} != EXPECTED_PROMPTS:
        raise AssertionError("prompts/list response drifted from the v1 allowlist.")
    if any(prompt.get("arguments") != [] for prompt in prompts):
        raise AssertionError("v1 prompts must not accept arguments.")

    claim_result = result_for(responses, 5)
    if claim_result.get("isError") is not False:
        raise AssertionError(f"claim explanation unexpectedly failed: {claim_result}")
    claim = claim_result.get("structuredContent", {}).get("claim", {})
    if claim.get("claim_id") != "claim_evacuation_turn":
        raise AssertionError("claim explanation returned the wrong claim id.")
    if claim.get("label") != "evidence_backed":
        raise AssertionError("claim explanation must preserve the claim label.")
    if set(claim.get("evidence_ids", [])) != EXPECTED_EVIDENCE_IDS:
        raise AssertionError("claim explanation evidence_ids drifted from the canonical demo.")
    assert_no_forbidden_output(claim_result)

    documents_result = result_for(responses, 6)
    assert_no_forbidden_output(documents_result)
    contents = documents_result.get("contents")
    if not isinstance(contents, list) or not contents:
        raise AssertionError("document resource read must return contents.")
    if contents[0].get("uri") != "mirror-demo://artifact/demo.documents":
        raise AssertionError("document resource read returned the wrong URI.")

    negative = result_for(responses, 7)
    if negative.get("isError") is not True:
        raise AssertionError("path-bearing extra tool argument must be rejected.")
    if "Unsupported argument" not in negative.get("structuredContent", {}).get("error", ""):
        raise AssertionError("path-bearing extra tool argument failed with an unexpected message.")


def main() -> int:
    try:
        plugin_root = marketplace_plugin_root()
        server = validate_plugin_shell(plugin_root)
        validate_mcp_responses(run_mcp_from_config(plugin_root, server))
    except (AssertionError, json.JSONDecodeError) as exc:
        print(f"Mirror Codex plugin install acceptance failed: {exc}", file=sys.stderr)
        return 1

    print("Mirror Codex plugin install acceptance passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
