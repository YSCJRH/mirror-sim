from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

MUTATION_ROUTE_FILES = [
    REPO_ROOT / "frontend/src/app/api/runtime/start-session/route.ts",
    REPO_ROOT / "frontend/src/app/api/runtime/generate-branch/route.ts",
    REPO_ROOT / "frontend/src/app/api/runtime/rollback-session/route.ts",
    REPO_ROOT / "frontend/src/app/api/worlds/create/route.ts",
]

FORBIDDEN_RAW_ERROR_PATTERNS = [
    "error.message",
    "String(error)",
    "error.cause",
]

FORBIDDEN_CLIENT_ERROR_PHRASES = [
    "Hosted model access is disabled.",
    "Hosted model access is missing a server-side API key.",
    "Hosted model access is missing a configured model.",
    "Hosted model access requires a configured beta access code.",
    "Hosted model access code is invalid.",
    "decisionApiKey is required for openai_compatible sessions.",
    "server-side API key",
    "configured model",
    "beta access code",
]


def _catch_block(source: str) -> str:
    marker = "} catch (error) {"
    assert marker in source
    return source.split(marker, maxsplit=1)[1]


def test_private_beta_mutation_routes_do_not_return_raw_errors() -> None:
    for route_path in MUTATION_ROUTE_FILES:
        source = route_path.read_text(encoding="utf-8")
        catch_block = _catch_block(source)

        for raw_error_pattern in FORBIDDEN_RAW_ERROR_PATTERNS:
            assert raw_error_pattern not in catch_block, route_path.as_posix()


def test_private_beta_routes_do_not_expose_provider_config_in_client_errors() -> None:
    client_error_route_files = [
        REPO_ROOT / "frontend/src/app/api/runtime/start-session/route.ts",
        REPO_ROOT / "frontend/src/app/api/runtime/generate-branch/route.ts",
    ]

    for route_path in client_error_route_files:
        source = route_path.read_text(encoding="utf-8")
        for phrase in FORBIDDEN_CLIENT_ERROR_PHRASES:
            assert phrase not in source, f"{phrase} leaked in {route_path.as_posix()}"


def test_openai_compatible_preflight_does_not_branch_on_server_provider_env() -> None:
    start_route = (REPO_ROOT / "frontend/src/app/api/runtime/start-session/route.ts").read_text(
        encoding="utf-8"
    )
    generate_route = (REPO_ROOT / "frontend/src/app/api/runtime/generate-branch/route.ts").read_text(
        encoding="utf-8"
    )

    assert "!process.env.MIRROR_DECISION_MODEL" not in start_route
    assert "!process.env.OPENAI_API_KEY" not in generate_route


def test_openai_compatible_preflight_rejects_whitespace_only_request_values() -> None:
    start_route = (REPO_ROOT / "frontend/src/app/api/runtime/start-session/route.ts").read_text(
        encoding="utf-8"
    )
    generate_route = (REPO_ROOT / "frontend/src/app/api/runtime/generate-branch/route.ts").read_text(
        encoding="utf-8"
    )

    assert "body.decisionModel?.trim()" in start_route
    assert "body.decisionApiKey?.trim()" in generate_route


def test_runtime_routes_normalize_provider_before_preflight() -> None:
    start_route = (REPO_ROOT / "frontend/src/app/api/runtime/start-session/route.ts").read_text(
        encoding="utf-8"
    )
    generate_route = (REPO_ROOT / "frontend/src/app/api/runtime/generate-branch/route.ts").read_text(
        encoding="utf-8"
    )

    assert "body.decisionProvider?.trim()" in start_route
    assert "body.decisionProvider?.trim()" in generate_route
    assert "decisionProvider === \"openai_compatible\"" in start_route
    assert "decisionProvider === \"openai_compatible\"" in generate_route


def test_runtime_cli_clears_request_scoped_provider_env_when_missing() -> None:
    source = (REPO_ROOT / "frontend/src/app/lib/runtime-cli.ts").read_text(encoding="utf-8")

    assert "OPENAI_API_KEY: credentials?.apiKey ?? \"\"" in source
    assert "OPENAI_BASE_URL: credentials?.baseUrl ?? \"\"" in source
    assert ".filter((entry): entry is [string, string] => entry[1] !== undefined)" in source


def test_runtime_cli_wrapper_does_not_rethrow_raw_exec_error_message() -> None:
    source = (REPO_ROOT / "frontend/src/app/lib/runtime-cli.ts").read_text(encoding="utf-8")

    assert "throw new Error(message)" not in source
