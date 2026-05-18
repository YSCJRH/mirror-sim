from __future__ import annotations

from pathlib import Path


NOTE_PATH = Path("docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md")


def test_phase52_runtime_guard_regression_note_exists_with_required_sections() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 52 Runtime Mutation Guard Regression Baseline",
        "Issue: `#413`",
        "## Decision",
        "## Existing Guard Inventory",
        "## Regression Locks",
        "## Follow-Up Gate",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in note


def test_phase52_runtime_guard_regression_note_records_guard_posture() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Public-demo mutation routes stay disabled when `MIRROR_PUBLIC_DEMO_MODE=1` and `MIRROR_ALLOW_ANONYMOUS_RUNS` is not `1`",
        "`/api/runtime/start-session`, `/api/runtime/generate-branch`, `/api/runtime/rollback-session`, and `/api/worlds/create` remain private-beta mutation APIs",
        "Product and web-wrapper mutation calls must pass route-derived `worldId` or an equivalent reviewed scope guard",
        "Direct local CLI calls may omit `--world` for compatibility when the operator provides an explicit artifacts root",
        "backend session services must reject expected-world mismatches before branch generation or rollback",
        "`RuntimeSessionActions` sends `worldId` with rollback requests",
        "`scripts/smoke_public_demo_web.py` keeps live public-demo `403` coverage",
        "No new mutating runtime API is added in `#413`",
        "No public demo, plugin, Hosted GPT, BYOK, upload, auth, billing, database, object storage, quota, or async contract is widened",
        "Do not implement async workers, queues, `task_id`, retry, status, cleanup",
        "TODO[verify]: require a reviewed scope guard before adding any new mutating runtime API",
    ]
    for phrase in required_phrases:
        assert phrase in note


def test_architecture_contract_records_phase52_runtime_guard_baseline() -> None:
    contract = Path("docs/architecture/contracts.md").read_text(encoding="utf-8")

    required_phrases = [
        "Product and web-wrapper mutation calls must pass route-derived `worldId` or an equivalent reviewed scope guard.",
        "Every new mutating runtime API must include public-demo blocking and a reviewed world/session scope guard before it is implemented.",
        "The Phase 52 runtime mutation guard regression baseline lives in `docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md`.",
    ]
    for phrase in required_phrases:
        assert phrase in contract


def test_runtime_mutation_api_routes_keep_public_demo_blocking_before_cli_calls() -> None:
    route_invocations = {
        Path("frontend/src/app/api/runtime/start-session/route.ts"): "startRuntimeSession(",
        Path("frontend/src/app/api/runtime/generate-branch/route.ts"): "generateRuntimeBranch(",
        Path("frontend/src/app/api/runtime/rollback-session/route.ts"): "rollbackRuntimeSession(",
        Path("frontend/src/app/api/worlds/create/route.ts"): "createRuntimeWorld(",
    }

    for path, invocation in route_invocations.items():
        source = path.read_text(encoding="utf-8")
        guard_index = source.index("if (publicDemoMutationsDisabled())")
        invocation_index = source.index(invocation)

        assert "publicDemoDisabledMessage" in source, path.as_posix()
        assert "{ status: 403 }" in source, path.as_posix()
        assert guard_index < invocation_index, path.as_posix()


def test_runtime_session_mutation_api_routes_require_and_pass_world_id() -> None:
    route_requirements = {
        Path("frontend/src/app/api/runtime/start-session/route.ts"): "startRuntimeSession(\n      body.worldId,",
        Path("frontend/src/app/api/runtime/generate-branch/route.ts"): "generateRuntimeBranch(body.worldId,",
        Path("frontend/src/app/api/runtime/rollback-session/route.ts"): "rollbackRuntimeSession(body.worldId,",
    }

    for path, invocation in route_requirements.items():
        source = path.read_text(encoding="utf-8")
        assert "worldId?: string;" in source, path.as_posix()
        assert "if (!body.worldId" in source, path.as_posix()
        assert invocation in source, path.as_posix()


def test_product_web_wrappers_keep_route_derived_world_id_on_mutations() -> None:
    composer = Path("frontend/src/app/components/preset-perturbation-composer.tsx").read_text(
        encoding="utf-8"
    )
    minimal_home = Path("frontend/src/app/components/minimal-home-shell.tsx").read_text(
        encoding="utf-8"
    )
    runtime_actions = Path("frontend/src/app/components/runtime-session-actions.tsx").read_text(
        encoding="utf-8"
    )
    world_runtime_page = Path(
        "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx"
    ).read_text(encoding="utf-8")
    runtime_cli = Path("frontend/src/app/lib/runtime-cli.ts").read_text(encoding="utf-8")

    start_body = composer.split('fetch("/api/runtime/start-session"', maxsplit=1)[1].split(
        "scenarioId:", maxsplit=1
    )[0]
    generate_body = composer.split('fetch("/api/runtime/generate-branch"', maxsplit=1)[1].split(
        "sessionId:", maxsplit=1
    )[0]
    minimal_generate_body = minimal_home.split(
        'fetch("/api/runtime/generate-branch"', maxsplit=1
    )[1].split("sessionId:", maxsplit=1)[0]
    minimal_rollback_body = minimal_home.split(
        'fetch("/api/runtime/rollback-session"', maxsplit=1
    )[1].split("sessionId:", maxsplit=1)[0]

    for body in [start_body, generate_body, minimal_generate_body, minimal_rollback_body]:
        assert "worldId," in body

    runtime_action_rollback_body = runtime_actions.split(
        'fetch("/api/runtime/rollback-session"', maxsplit=1
    )[1].split("sessionId,", maxsplit=1)[0]
    assert "worldId," in runtime_action_rollback_body
    assert "worldId={worldId}" in world_runtime_page
    assert "returnHref={`/worlds/${worldId}/perturb" in world_runtime_page

    start_args = runtime_cli.split('    "start-session",', maxsplit=1)[1].split("  ];", maxsplit=1)[0]
    generate_args = runtime_cli.split('    "generate-branch",', maxsplit=1)[1].split("  ];", maxsplit=1)[0]
    rollback_args = runtime_cli.split('    "rollback-session",', maxsplit=1)[1].split("  ]);", maxsplit=1)[0]

    for command_args in [start_args, generate_args, rollback_args]:
        assert '"--world"' in command_args
        assert "worldId" in command_args


def test_backend_expected_world_guard_regressions_remain_tracked() -> None:
    cli_tests = Path("backend/tests/test_cli.py").read_text(encoding="utf-8")
    required_tests = [
        "def test_generate_branch_rejects_expected_world_mismatch",
        "def test_rollback_session_rejects_expected_world_mismatch",
        "def test_cli_generate_branch_passes_expected_world_guard",
        "def test_cli_rollback_session_passes_expected_world_guard",
    ]
    for test_name in required_tests:
        assert test_name in cli_tests


def test_public_demo_smoke_keeps_mutation_403_checks() -> None:
    smoke = Path("scripts/smoke_public_demo_web.py").read_text(encoding="utf-8")
    required_endpoints = [
        '"/api/runtime/start-session"',
        '"/api/runtime/generate-branch"',
        '"/api/runtime/rollback-session"',
        '"/api/worlds/create"',
    ]

    for endpoint in required_endpoints:
        endpoint_block = smoke.split(endpoint, maxsplit=1)[1].split(")", maxsplit=1)[0]
        assert "403" in endpoint_block


def test_active_phase52_docs_point_to_runtime_guard_regression_work() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-52-successor-gate-2026-05-18.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "`#410`" in text
        assert "`#411`" in text
        assert "`#412`" in text
        assert "`#413`" in text
        assert "Phase 52 Runtime Mutation Guard Regression Baseline" in text
        assert "`docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md`" in text
        assert "runtime mutation guard regression" in text
        assert "route-derived `worldId`" in text
        assert "legacy top-level runtime routes" in text
        assert (
            "public/plugin/async" in text
            or "public demo, plugin, Hosted GPT/BYOK, or async" in text
        )
