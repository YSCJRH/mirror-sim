from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


sys.dont_write_bytecode = True
PLUGIN_NAME = "mirror-codex"
REQUIRED_ARTIFACT_IDS = {
    "demo.report",
    "demo.claims",
    "demo.eval_summary",
    "demo.compare",
    "demo.documents",
    "demo.chunks",
    "demo.graph",
    "demo.rubric",
}
REQUIRED_TOOL_NAMES = {
    "get_demo_manifest",
    "get_demo_artifact",
    "get_eval_summary",
    "explain_demo_claim",
    "compare_demo_branches",
}
REQUIRED_RESOURCE_URIS = {
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
REQUIRED_PROMPT_NAMES = {
    "inspect-public-demo",
    "review-claim-evidence",
    "compare-demo-branches",
}
FORBIDDEN_TOOL_INPUTS = {
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
SECRET_PATTERNS = [
    re.compile(r"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b"),
    re.compile(r"(?im)^\s*NEXT_PUBLIC_[A-Z_]*OPENAI_API_KEY\s*[:=]\s*['\"]?[^#\s'\"]+"),
    re.compile(r"(?im)^\s*(OPENAI_API_KEY|MIRROR_HOSTED_OPENAI_API_KEY)\s*[:=]\s*['\"]?sk-"),
]
CONTRACT_ADR = "docs/decisions/ADR-0010-mirror-codex-plugin-mcp-contract.md"


def load_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise AssertionError(f"{path} must contain a JSON object.")
    return payload


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def plugin_root() -> Path:
    return Path(__file__).resolve().parents[1]


def validate_plugin_manifest(root: Path) -> None:
    manifest_path = root / ".codex-plugin" / "plugin.json"
    manifest = load_json(manifest_path)
    manifest_text = manifest_path.read_text(encoding="utf-8")

    assert_true(manifest.get("name") == PLUGIN_NAME, "plugin name must match folder name.")
    assert_true(manifest.get("version") == "0.1.0", "plugin version must be 0.1.0.")
    assert_true(manifest.get("skills") == "./skills/", "plugin must expose ./skills/.")
    assert_true(manifest.get("mcpServers") == "./.mcp.json", "plugin must point at ./.mcp.json.")
    assert_true("hooks" not in manifest, "V1 must not register hooks.")
    assert_true("apps" not in manifest, "V1 must not register apps.")
    assert_true("[TODO:" not in manifest_text, "plugin manifest must not contain TODO placeholders.")

    interface = manifest.get("interface")
    assert_true(isinstance(interface, dict), "plugin interface must be an object.")
    assert_true(interface.get("capabilities") == ["Read"], "V1 plugin capability must be Read only.")

    prompts = interface.get("defaultPrompt")
    assert_true(isinstance(prompts, list) and 1 <= len(prompts) <= 3, "defaultPrompt must include 1-3 prompts.")
    for prompt in prompts:
        assert_true(isinstance(prompt, str) and len(prompt) <= 128, "default prompts must be short strings.")


def validate_mcp_placeholder(root: Path) -> None:
    payload = load_json(root / ".mcp.json")
    servers = payload.get("mcpServers")
    assert_true(isinstance(servers, dict), ".mcp.json must contain mcpServers object.")
    assert_true(set(servers) == {"mirror-demo"}, ".mcp.json must register only mirror-demo.")
    server = servers["mirror-demo"]
    assert_true(server == {"command": "python", "args": ["./scripts/run_mcp.py"]}, ".mcp.json must use one fixed local python entrypoint.")
    assert_true((root / "scripts" / "run_mcp.py").exists(), "MCP entrypoint must exist.")
    assert_true((root / "scripts" / "smoke_mcp_stdio.py").exists(), "MCP stdio smoke script must exist.")
    assert_true((root / "scripts" / "acceptance_check.py").exists(), "plugin install acceptance script must exist.")
    assert_true((root / "scripts" / "cli_marketplace_preflight.py").exists(), "Codex CLI marketplace preflight script must exist.")
    assert_true((root / "scripts" / "check_pr_scope.py").exists(), "plugin PR scope check script must exist.")
    assert_true((root / "mirror_codex_mcp" / "server.py").exists(), "MCP server module must exist.")


def validate_skill(root: Path) -> None:
    skill_path = root / "skills" / "mirror-demo" / "SKILL.md"
    assert_true(skill_path.exists(), "mirror-demo skill must exist.")
    text = skill_path.read_text(encoding="utf-8")
    assert_true(text.startswith("---\n"), "skill must start with YAML frontmatter.")
    assert_true("name: mirror-demo" in text, "skill frontmatter must name mirror-demo.")
    assert_true("description:" in text, "skill frontmatter must include a description.")
    for artifact_id in REQUIRED_ARTIFACT_IDS:
        assert_true(artifact_id in text, f"skill must mention logical artifact id {artifact_id}.")
    assert_true("Do not use `NEXT_PUBLIC_OPENAI_API_KEY`" in text, "skill must forbid public provider keys.")
    for tool_name in REQUIRED_TOOL_NAMES:
        assert_true(tool_name in text, f"skill must mention MCP tool {tool_name}.")
    for resource_uri in REQUIRED_RESOURCE_URIS:
        if resource_uri in {"mirror-demo://artifact/demo.report", "mirror-demo://artifact/demo.documents", "mirror-demo://artifact/demo.chunks", "mirror-demo://artifact/demo.graph", "mirror-demo://artifact/demo.rubric"}:
            continue
        assert_true(resource_uri in text, f"skill must mention MCP resource {resource_uri}.")
    for prompt_name in REQUIRED_PROMPT_NAMES:
        assert_true(prompt_name in text, f"skill must mention MCP prompt {prompt_name}.")
    assert_true("Do not add mutating tools" in text, "skill must preserve the read-only MCP boundary.")
    assert_true(CONTRACT_ADR in text, "skill must point to the MCP contract ADR.")
    assert_true("smoke_mcp_stdio.py" in text, "skill must mention the MCP stdio smoke.")


def validate_plugin_readme(root: Path) -> None:
    readme_path = root / "README.md"
    text = readme_path.read_text(encoding="utf-8")
    assert_true(CONTRACT_ADR in text, "plugin README must point to the MCP contract ADR.")
    assert_true("additionalProperties: false" in text, "plugin README must document closed MCP schemas.")
    assert_true("annotations.readOnlyHint: true" in text, "plugin README must document read-only MCP annotations.")
    assert_true("smoke_mcp_stdio.py" in text, "plugin README must document the MCP stdio smoke.")
    assert_true("acceptance_check.py" in text, "plugin README must document the install acceptance check.")
    assert_true("cli_marketplace_preflight.py" in text, "plugin README must document the Codex CLI marketplace preflight.")
    assert_true("check_pr_scope.py" in text, "plugin README must document the PR scope check.")
    for tool_name in REQUIRED_TOOL_NAMES:
        assert_true(tool_name in text, f"plugin README must mention MCP tool {tool_name}.")
    assert_true("mirror-demo://manifest" in text, "plugin README must document MCP resources.")
    for prompt_name in REQUIRED_PROMPT_NAMES:
        assert_true(prompt_name in text, f"plugin README must mention MCP prompt {prompt_name}.")


def validate_contract_adr(root: Path) -> None:
    adr_path = root / CONTRACT_ADR
    assert_true(adr_path.exists(), "MCP contract ADR must exist.")
    text = adr_path.read_text(encoding="utf-8")
    assert_true("# ADR-0010: Mirror Codex Plugin MCP Contract" in text, "ADR title must be stable.")
    assert_true("Accepted" in text, "ADR must be accepted.")
    assert_true("annotations.readOnlyHint: true" in text, "ADR must require read-only tool annotations.")
    assert_true("additionalProperties: false" in text, "ADR must require closed tool schemas.")
    for artifact_id in REQUIRED_ARTIFACT_IDS:
        assert_true(artifact_id in text, f"ADR must mention artifact id {artifact_id}.")
    for tool_name in REQUIRED_TOOL_NAMES:
        assert_true(tool_name in text, f"ADR must mention MCP tool {tool_name}.")
    for resource_uri in REQUIRED_RESOURCE_URIS:
        assert_true(resource_uri in text, f"ADR must mention MCP resource {resource_uri}.")
    for prompt_name in REQUIRED_PROMPT_NAMES:
        assert_true(prompt_name in text, f"ADR must mention MCP prompt {prompt_name}.")
    for forbidden in FORBIDDEN_TOOL_INPUTS:
        assert_true(f"`{forbidden}`" in text, f"ADR must mention forbidden input `{forbidden}`.")


def validate_mcp_static_contract(root: Path) -> None:
    server_text = (root / "mirror_codex_mcp" / "server.py").read_text(encoding="utf-8")
    run_text = (root / "scripts" / "run_mcp.py").read_text(encoding="utf-8")

    assert_true("subprocess" not in server_text, "MCP server must not shell out.")
    assert_true("OPENAI_API_KEY" not in server_text, "MCP server must not reference provider secrets.")
    assert_true("MIRROR_HOSTED_OPENAI_API_KEY" not in server_text, "MCP server must not reference hosted provider secrets.")
    assert_true("mcp.server" not in server_text, "MCP server must avoid new SDK dependency in this slice.")
    assert_true("subprocess" not in run_text, "MCP entrypoint must not shell out.")
    for tool_name in REQUIRED_TOOL_NAMES:
        assert_true(tool_name in server_text, f"MCP server must implement {tool_name}.")
    for prompt_name in REQUIRED_PROMPT_NAMES:
        assert_true(prompt_name in server_text, f"MCP server must allowlist prompt {prompt_name}.")

    sys.path.insert(0, str(root))
    from mirror_codex_mcp import server as mcp_server  # noqa: PLC0415

    tools = mcp_server.tool_definitions()
    assert_true({tool["name"] for tool in tools} == REQUIRED_TOOL_NAMES, "MCP tool set must match the PR 2 allowlist.")
    for tool in tools:
        assert_true(tool.get("annotations", {}).get("readOnlyHint") is True, f"{tool['name']} must be annotated read-only.")
        schema = tool.get("inputSchema")
        assert_true(isinstance(schema, dict), f"{tool['name']} must have an input schema.")
        assert_true(schema.get("additionalProperties") is False, f"{tool['name']} schema must be closed.")
        properties = schema.get("properties", {})
        assert_true(isinstance(properties, dict), f"{tool['name']} input properties must be an object.")
        forbidden = FORBIDDEN_TOOL_INPUTS.intersection(properties)
        assert_true(not forbidden, f"{tool['name']} must not expose forbidden inputs: {sorted(forbidden)}")

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
    for tool in tools:
        schema = tool["inputSchema"]
        properties = schema.get("properties", {})
        assert_true(set(properties) == expected_properties[tool["name"]], f"{tool['name']} properties drifted from ADR.")
        assert_true(set(schema.get("required", [])) == expected_required[tool["name"]], f"{tool['name']} required fields drifted from ADR.")

    resources = mcp_server.resource_definitions()
    assert_true({resource["uri"] for resource in resources} == REQUIRED_RESOURCE_URIS, "MCP resource set must match ADR allowlist.")
    for resource in resources:
        uri = resource["uri"]
        assert_true(isinstance(uri, str) and uri.startswith("mirror-demo://"), f"resource uri must be logical: {uri}")
        assert_true("/.." not in uri and "\\" not in uri, f"resource uri must not look path-like: {uri}")

    prompts = mcp_server.prompt_definitions()
    assert_true({prompt["name"] for prompt in prompts} == REQUIRED_PROMPT_NAMES, "MCP prompt set must match ADR allowlist.")
    for prompt in prompts:
        assert_true(prompt.get("arguments") == [], f"{prompt['name']} must not accept prompt arguments in v1.")


def validate_marketplace(root: Path) -> None:
    marketplace = load_json(root / ".agents" / "plugins" / "marketplace.json")
    plugins = marketplace.get("plugins")
    assert_true(isinstance(plugins, list), "marketplace plugins must be a list.")
    entry = next((item for item in plugins if isinstance(item, dict) and item.get("name") == PLUGIN_NAME), None)
    assert_true(entry is not None, "marketplace must include mirror-codex.")
    assert_true(entry.get("source") == {"source": "local", "path": "./plugins/mirror-codex"}, "marketplace source must be repo-local.")
    assert_true(entry.get("policy") == {"installation": "AVAILABLE", "authentication": "ON_INSTALL"}, "marketplace policy must match V1 defaults.")
    assert_true(entry.get("category") == "Engineering", "marketplace category must be Engineering.")


def validate_no_secret_shapes(root: Path) -> None:
    findings: list[str] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                findings.append(str(path))
                break
    assert_true(not findings, "plugin contains possible provider secret exposure:\n" + "\n".join(findings))


def main() -> int:
    root = repo_root()
    p_root = plugin_root()

    try:
        validate_plugin_manifest(p_root)
        validate_mcp_placeholder(p_root)
        validate_skill(p_root)
        validate_plugin_readme(p_root)
        validate_contract_adr(root)
        validate_mcp_static_contract(p_root)
        validate_marketplace(root)
        validate_no_secret_shapes(p_root)
    except AssertionError as error:
        print(f"Mirror Codex plugin validation failed: {error}", file=sys.stderr)
        return 1

    print("Mirror Codex plugin validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
