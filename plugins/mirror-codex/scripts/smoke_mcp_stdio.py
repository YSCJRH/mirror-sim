from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any


sys.dont_write_bytecode = True
PLUGIN_ROOT = Path(__file__).resolve().parents[1]
ENTRYPOINT = PLUGIN_ROOT / "scripts" / "run_mcp.py"
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
FORBIDDEN_OUTPUT_FIELDS = {
    "artifact_paths",
    "summary_path",
    "trace_path",
    "snapshot_dir",
    "source_path",
}


def request(request_id: int, method: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"jsonrpc": "2.0", "id": request_id, "method": method}
    if params is not None:
        payload["params"] = params
    return payload


def run_smoke() -> list[dict[str, Any]]:
    messages = [
        request(1, "initialize", {"protocolVersion": "2025-06-18"}),
        request(2, "tools/list"),
        request(3, "tools/call", {"name": "get_demo_manifest", "arguments": {}}),
        request(4, "tools/call", {"name": "get_eval_summary", "arguments": {}}),
        request(
            5,
            "tools/call",
            {"name": "explain_demo_claim", "arguments": {"claim_id": "claim_evacuation_turn"}},
        ),
        request(
            6,
            "tools/call",
            {
                "name": "compare_demo_branches",
                "arguments": {"candidate_branch_id": "branch_reporter_detained"},
            },
        ),
        request(
            7,
            "tools/call",
            {
                "name": "get_demo_artifact",
                "arguments": {"artifact_id": "demo.claims", "path": "artifacts/demo/report/claims.json"},
            },
        ),
        request(8, "resources/list"),
        request(
            9,
            "resources/read",
            {"uri": "mirror-demo://artifact/demo.eval_summary"},
        ),
        request(
            10,
            "resources/read",
            {"uri": "file:///D:/mirror/artifacts/demo/report/claims.json"},
        ),
        request(11, "prompts/list"),
        request(12, "prompts/get", {"name": "compare-demo-branches"}),
        request(13, "prompts/get", {"name": "inspect-public-demo", "arguments": {"path": "secret"}}),
    ]
    stdin = "\n".join(json.dumps(message, separators=(",", ":")) for message in messages) + "\n"
    completed = subprocess.run(
        [sys.executable, str(ENTRYPOINT)],
        cwd=PLUGIN_ROOT,
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
        raise AssertionError(f"Expected {len(messages)} responses, got {len(responses)}.")
    return responses


def result_for(responses: list[dict[str, Any]], request_id: int) -> dict[str, Any]:
    response = next((item for item in responses if item.get("id") == request_id), None)
    if response is None:
        raise AssertionError(f"Missing response id {request_id}.")
    if "error" in response:
        raise AssertionError(f"Response id {request_id} returned JSON-RPC error: {response['error']}")
    result = response.get("result")
    if not isinstance(result, dict):
        raise AssertionError(f"Response id {request_id} result must be an object.")
    return result


def structured_tool_result(responses: list[dict[str, Any]], request_id: int) -> dict[str, Any]:
    result = result_for(responses, request_id)
    if result.get("isError") is not False:
        raise AssertionError(f"Tool response id {request_id} unexpectedly failed: {result}")
    content = result.get("structuredContent")
    if not isinstance(content, dict):
        raise AssertionError(f"Tool response id {request_id} must include structuredContent.")
    return content


def assert_no_forbidden_output(payload: Any) -> None:
    text = json.dumps(payload, ensure_ascii=False)
    leaked = sorted(field for field in FORBIDDEN_OUTPUT_FIELDS if field in text)
    if leaked:
        raise AssertionError(f"MCP output leaked internal field(s): {', '.join(leaked)}.")
    if "D:/mirror" in text or "D:\\mirror" in text or "artifacts/demo" in text:
        raise AssertionError("MCP output leaked a local filesystem path.")


def validate_responses(responses: list[dict[str, Any]]) -> None:
    initialize = result_for(responses, 1)
    if initialize.get("serverInfo", {}).get("name") != "mirror-codex":
        raise AssertionError("initialize response did not identify mirror-codex.")

    tools = result_for(responses, 2).get("tools")
    if not isinstance(tools, list):
        raise AssertionError("tools/list response must include tools list.")
    if {tool.get("name") for tool in tools} != EXPECTED_TOOLS:
        raise AssertionError("tools/list response drifted from the expected tool allowlist.")
    for tool in tools:
        if tool.get("annotations", {}).get("readOnlyHint") is not True:
            raise AssertionError(f"{tool.get('name')} is missing readOnlyHint.")
        if tool.get("inputSchema", {}).get("additionalProperties") is not False:
            raise AssertionError(f"{tool.get('name')} schema is not closed.")

    manifest = structured_tool_result(responses, 3)
    if manifest.get("mode") != "deterministic-only" or manifest.get("mutation") != "disabled":
        raise AssertionError("manifest did not preserve deterministic read-only mode.")
    assert_no_forbidden_output(manifest)

    eval_summary = structured_tool_result(responses, 4)
    if eval_summary.get("data", {}).get("status") != "pass":
        raise AssertionError("eval summary did not report pass.")
    assert_no_forbidden_output(eval_summary)

    claim = structured_tool_result(responses, 5).get("claim", {})
    if not claim.get("label") or not claim.get("evidence_ids"):
        raise AssertionError("claim explanation must preserve label and evidence_ids.")

    branch_compare = structured_tool_result(responses, 6)
    if branch_compare.get("reference_branch_id") != "branch_baseline":
        raise AssertionError("branch comparison did not use the baseline reference branch.")
    assert_no_forbidden_output(branch_compare)

    negative = result_for(responses, 7)
    if negative.get("isError") is not True:
        raise AssertionError("path-bearing extra argument must be rejected.")
    if "Unsupported argument" not in negative.get("structuredContent", {}).get("error", ""):
        raise AssertionError("negative path-like smoke did not fail for the expected reason.")

    resources = result_for(responses, 8).get("resources")
    if not isinstance(resources, list):
        raise AssertionError("resources/list response must include resources list.")
    if {resource.get("uri") for resource in resources} != EXPECTED_RESOURCES:
        raise AssertionError("resources/list response drifted from the expected resource allowlist.")

    eval_resource = result_for(responses, 9)
    assert_no_forbidden_output(eval_resource)
    contents = eval_resource.get("contents")
    if not isinstance(contents, list) or not contents:
        raise AssertionError("resources/read must return contents.")
    if contents[0].get("uri") != "mirror-demo://artifact/demo.eval_summary":
        raise AssertionError("resources/read returned the wrong URI.")

    invalid_resource = next((item for item in responses if item.get("id") == 10), None)
    if not invalid_resource or invalid_resource.get("error", {}).get("code") != -32602:
        raise AssertionError("invalid resource URI must be rejected.")

    prompts = result_for(responses, 11).get("prompts")
    if not isinstance(prompts, list):
        raise AssertionError("prompts/list response must include prompts list.")
    if {prompt.get("name") for prompt in prompts} != EXPECTED_PROMPTS:
        raise AssertionError("prompts/list response drifted from the expected prompt allowlist.")
    if any(prompt.get("arguments") != [] for prompt in prompts):
        raise AssertionError("v1 prompts must not accept arguments.")

    prompt_payload = result_for(responses, 12)
    prompt_text = json.dumps(prompt_payload, ensure_ascii=False)
    if "branch_reporter_detained" not in prompt_text or "real-world" not in prompt_text:
        raise AssertionError("branch comparison prompt did not preserve bounded guidance.")

    invalid_prompt = next((item for item in responses if item.get("id") == 13), None)
    if not invalid_prompt or invalid_prompt.get("error", {}).get("code") != -32602:
        raise AssertionError("prompt arguments must be rejected.")


def main() -> int:
    try:
        validate_responses(run_smoke())
    except (AssertionError, json.JSONDecodeError) as exc:
        print(f"Mirror Codex MCP stdio smoke failed: {exc}", file=sys.stderr)
        return 1
    print("Mirror Codex MCP stdio smoke passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
