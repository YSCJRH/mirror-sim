from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest


PLUGIN_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PLUGIN_ROOT))

from mirror_codex_mcp import server


def as_text(payload: object) -> str:
    return json.dumps(payload, ensure_ascii=False)


def test_manifest_uses_logical_artifact_ids_only() -> None:
    manifest = server.get_demo_manifest()

    assert manifest["mode"] == "deterministic-only"
    assert {artifact["id"] for artifact in manifest["artifacts"]} >= {
        "demo.claims",
        "demo.eval_summary",
        "demo.compare",
    }
    assert "relativePath" not in as_text(manifest)
    assert "artifacts/demo" not in as_text(manifest)


def test_artifact_sanitizers_match_public_api_boundary() -> None:
    eval_payload = server.get_eval_summary()
    compare_payload = server.get_demo_artifact("demo.compare")
    documents_payload = server.get_demo_artifact("demo.documents")

    combined = as_text(
        {
            "eval": eval_payload,
            "compare": compare_payload,
            "documents": documents_payload,
        }
    )
    assert "artifact_paths" not in combined
    assert "summary_path" not in combined
    assert "trace_path" not in combined
    assert "snapshot_dir" not in combined
    assert "source_path" not in combined
    assert "D:/mirror" not in combined


def test_rejects_path_like_artifact_ids() -> None:
    with pytest.raises(server.ToolInputError):
        server.get_demo_artifact("artifacts/demo/report/claims.json")

    result = server.call_tool(
        "get_demo_artifact",
        {"artifact_id": "artifacts\\demo\\report\\claims.json"},
    )
    assert result["isError"] is True
    assert "not a filesystem path" in result["structuredContent"]["error"]

    extra_arg_result = server.call_tool(
        "get_demo_artifact",
        {"artifact_id": "demo.claims", "path": "artifacts/demo/report/claims.json"},
    )
    assert extra_arg_result["isError"] is True
    assert "Unsupported argument" in extra_arg_result["structuredContent"]["error"]


def test_explain_demo_claim_preserves_claim_integrity() -> None:
    payload = server.explain_demo_claim("claim_evacuation_turn")

    claim = payload["claim"]
    assert claim["claim_id"] == "claim_evacuation_turn"
    assert claim["label"] == "evidence_backed"
    assert claim["evidence_ids"]
    assert payload["evidence_chunks"]
    assert payload["evidence_documents"]


def test_compare_demo_branches_returns_sanitized_delta() -> None:
    payload = server.compare_demo_branches("branch_reporter_detained")

    assert payload["reference_branch_id"] == "branch_baseline"
    assert payload["candidate_branch"]["branch_id"] == "branch_reporter_detained"
    assert payload["delta"]["divergent_turn_count"] == 6
    assert "summary_path" not in as_text(payload)


def test_json_rpc_tools_list_and_call() -> None:
    list_response = server.handle_request({"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
    assert list_response is not None
    tool_names = {tool["name"] for tool in list_response["result"]["tools"]}
    assert {
        "get_demo_manifest",
        "get_demo_artifact",
        "get_eval_summary",
        "explain_demo_claim",
        "compare_demo_branches",
    } <= tool_names

    call_response = server.handle_request(
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "get_demo_artifact",
                "arguments": {"artifact_id": "demo.claims"},
            },
        }
    )
    assert call_response is not None
    assert call_response["result"]["isError"] is False
    assert call_response["result"]["structuredContent"]["id"] == "demo.claims"


def test_json_rpc_resources_and_prompts_are_read_only_allowlists() -> None:
    resources_response = server.handle_request(
        {"jsonrpc": "2.0", "id": 3, "method": "resources/list"}
    )
    assert resources_response is not None
    resource_uris = {item["uri"] for item in resources_response["result"]["resources"]}
    assert resource_uris == {
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

    read_response = server.handle_request(
        {
            "jsonrpc": "2.0",
            "id": 4,
            "method": "resources/read",
            "params": {"uri": "mirror-demo://artifact/demo.eval_summary"},
        }
    )
    assert read_response is not None
    contents = read_response["result"]["contents"]
    assert contents[0]["uri"] == "mirror-demo://artifact/demo.eval_summary"
    assert "artifact_paths" not in contents[0]["text"]
    assert "D:/mirror" not in contents[0]["text"]

    invalid_resource = server.handle_request(
        {
            "jsonrpc": "2.0",
            "id": 5,
            "method": "resources/read",
            "params": {"uri": "file:///D:/mirror/artifacts/demo/report/claims.json"},
        }
    )
    assert invalid_resource is not None
    assert invalid_resource["error"]["code"] == -32602

    resource_extra_arg = server.handle_request(
        {
            "jsonrpc": "2.0",
            "id": 9,
            "method": "resources/read",
            "params": {"uri": "mirror-demo://manifest", "path": "artifacts/demo"},
        }
    )
    assert resource_extra_arg is not None
    assert resource_extra_arg["error"]["code"] == -32602

    prompts_response = server.handle_request(
        {"jsonrpc": "2.0", "id": 6, "method": "prompts/list"}
    )
    assert prompts_response is not None
    prompts = {item["name"]: item for item in prompts_response["result"]["prompts"]}
    assert set(prompts) == {
        "inspect-public-demo",
        "review-claim-evidence",
        "compare-demo-branches",
    }
    assert all(item["arguments"] == [] for item in prompts.values())

    prompt_response = server.handle_request(
        {
            "jsonrpc": "2.0",
            "id": 7,
            "method": "prompts/get",
            "params": {"name": "compare-demo-branches"},
        }
    )
    assert prompt_response is not None
    text = prompt_response["result"]["messages"][0]["content"]["text"]
    assert "branch_reporter_detained" in text
    assert "real-world" in text

    prompt_with_args = server.handle_request(
        {
            "jsonrpc": "2.0",
            "id": 8,
            "method": "prompts/get",
            "params": {"name": "inspect-public-demo", "arguments": {"path": "secret"}},
        }
    )
    assert prompt_with_args is not None
    assert prompt_with_args["error"]["code"] == -32602


def test_tool_schemas_match_read_only_contract() -> None:
    tools = {tool["name"]: tool for tool in server.tool_definitions()}
    expected_properties = {
        "get_demo_manifest": set(),
        "get_demo_artifact": {"artifact_id"},
        "get_eval_summary": set(),
        "explain_demo_claim": {"claim_id"},
        "compare_demo_branches": {"candidate_branch_id", "reference_branch_id"},
    }
    expected_required = {
        "get_demo_manifest": set(),
        "get_demo_artifact": {"artifact_id"},
        "get_eval_summary": set(),
        "explain_demo_claim": {"claim_id"},
        "compare_demo_branches": {"candidate_branch_id"},
    }
    forbidden = {
        "path",
        "file",
        "filepath",
        "filename",
        "url",
        "command",
        "args",
        "api_key",
        "provider",
        "model",
    }

    assert set(tools) == {
        "get_demo_manifest",
        "get_demo_artifact",
        "get_eval_summary",
        "explain_demo_claim",
        "compare_demo_branches",
    }
    for name, tool in tools.items():
        schema = tool["inputSchema"]
        properties = schema["properties"]
        assert tool["annotations"]["readOnlyHint"] is True
        assert schema["additionalProperties"] is False
        assert set(properties) == expected_properties[name]
        assert set(schema.get("required", [])) == expected_required[name]
        assert forbidden.isdisjoint(properties)

    artifact_enum = tools["get_demo_artifact"]["inputSchema"]["properties"]["artifact_id"]["enum"]
    assert set(artifact_enum) == set(server.PUBLIC_DEMO_ARTIFACTS)

    compare_schema = tools["compare_demo_branches"]["inputSchema"]["properties"]
    assert compare_schema["candidate_branch_id"]["enum"] == [
        "branch_harbor_comms_failure",
        "branch_mayor_signal_blocked",
        "branch_reporter_detained",
    ]
    assert compare_schema["reference_branch_id"]["enum"] == ["branch_baseline"]
