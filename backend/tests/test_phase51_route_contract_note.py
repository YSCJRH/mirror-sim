from __future__ import annotations

from pathlib import Path


NOTE_PATH = Path("docs/plans/phase-51-private-beta-route-contract-2026-05-18.md")


def test_phase51_route_contract_note_exists_with_required_sections() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 51 Private-Beta Route Ownership Contract",
        "Issue: `#405`",
        "## Decision",
        "## Evidence",
        "## Route Ownership Table",
        "## Launch Hub Contract",
        "## Public Demo Boundary",
        "## Plugin Boundary",
        "## Private-Beta Boundary",
        "## Follow-Up Gate",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in note


def test_phase51_route_contract_records_public_private_and_plugin_boundaries() -> None:
    assert NOTE_PATH.exists()

    note = NOTE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "`/` remains the guided Phase 1 public Fog Harbor demo",
        "`/review` remains the advanced read-only public-demo review surface",
        "`/worlds/<world_id>` remains the private-beta candidate world home",
        "`/worlds/new` remains a private-beta candidate creation route",
        "`/worlds/<world_id>/perturb` remains the main private-beta operator path",
        "`/worlds/<world_id>/runtime/<session_id>` remains the world-scoped runtime workspace",
        "`/worlds/<world_id>/runtime/<session_id>/explain` remains the world-scoped explain workspace",
        "`/worlds/<world_id>/runtime/<session_id>/report` remains the world-scoped report workspace",
        "`/worlds/<world_id>/review` remains the world-scoped private-beta review surface",
        "The private-beta launch hub remains planning-only in Phase 51",
        "A future launch hub must not replace `/`",
        "must not start sessions, generate branches, create worlds, upload corpora, enable Hosted GPT, accept BYOK, or call model providers from the public path",
        "`/changes/<branch_id>`",
        "`/perturb`",
        "`/runtime/<session_id>`",
        "`docs/architecture/contracts.md`",
        "`docs/decisions/ADR-0011-private-beta-route-ownership.md`",
        "Mirror Codex plugin remains read-only",
        "Do not add Hosted GPT, BYOK, upload, auth, billing, database, object storage, or quota behavior to the public path or plugin path",
        "Do not implement async workers, queues, `task_id`, retry, status, or cleanup semantics",
        "TODO[verify]: verify that private-beta composer requests pass route-derived `worldId`",
        "TODO[verify]: if a launch hub becomes an implementation target, open a new reviewed work item",
    ]
    for phrase in required_phrases:
        assert phrase in note


def test_architecture_and_adr_record_route_ownership_contract() -> None:
    contract = Path("docs/architecture/contracts.md").read_text(encoding="utf-8")
    adr = Path("docs/decisions/ADR-0011-private-beta-route-ownership.md").read_text(encoding="utf-8")

    required_contract_phrases = [
        "## Route Ownership Contract",
        "`/` remains the guided Phase 1 public Fog Harbor demo",
        "`/review` remains the advanced read-only public-demo review surface",
        "`/worlds/<world_id>` remains the private-beta candidate world home",
        "`/api/runtime/generate-branch`",
        "The private-beta launch hub remains planning-only in Phase 51",
        "Top-level `/perturb`, `/runtime/<session_id>`, and child runtime routes are legacy",
        "TODO[verify]: verify that private-beta composer requests pass route-derived `worldId`",
    ]
    for phrase in required_contract_phrases:
        assert phrase in contract

    required_adr_phrases = [
        "# ADR-0011: Private-Beta Route Ownership",
        "Accepted",
        "Mirror keeps `/` owned by the guided Phase 1 public Fog Harbor demo",
        "The private-beta launch hub remains planning-only in Phase 51",
        "Top-level `/perturb`, `/runtime/<session_id>`, and child runtime routes remain legacy",
        "This decision does not add or alter public demo endpoints",
    ]
    for phrase in required_adr_phrases:
        assert phrase in adr


def test_world_scoped_navigation_does_not_label_public_demo_as_launch_hub() -> None:
    world_route_expectations = {
        Path("frontend/src/app/worlds/new/page.tsx"): '{ href: "/", label: "Public Demo", active: false }',
        Path("frontend/src/app/worlds/[worldId]/page.tsx"): '{ href: "/", label: locale === "zh-CN" ? "公开演示" : "Public Demo", active: false }',
        Path("frontend/src/app/worlds/[worldId]/perturb/page.tsx"): '{ href: "/", label: locale === "zh-CN" ? "公开演示" : "Public Demo", active: false }',
        Path("frontend/src/app/worlds/[worldId]/review/page.tsx"): '{ href: "/", label: locale === "zh-CN" ? "公开演示" : "Public Demo", active: false }',
        Path("frontend/src/app/worlds/[worldId]/runtime/[sessionId]/page.tsx"): '{ href: "/", label: locale === "zh-CN" ? "公开演示" : "Public Demo", active: false }',
        Path(
            "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/explain/page.tsx"
        ): '{ href: "/", label: locale === "zh-CN" ? "公开演示" : "Public Demo", active: false }',
        Path(
            "frontend/src/app/worlds/[worldId]/runtime/[sessionId]/report/page.tsx"
        ): '{ href: "/", label: locale === "zh-CN" ? "公开演示" : "Public Demo", active: false }',
    }

    for path, expected_public_demo_link in world_route_expectations.items():
        text = path.read_text(encoding="utf-8")
        assert expected_public_demo_link in text
        assert '"Launch Hub"' not in text
        assert '"世界入口"' not in text


def test_active_phase51_docs_point_to_route_contract_work() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/phase-51-successor-gate-2026-05-18.md"),
        Path("docs/plans/automation-roadmap.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "`#405`" in text
        assert "`#406`" in text
        assert "Phase 51 Private-Beta Route Ownership Contract" in text
        assert "private-beta launch hub remains planning-only" in text
        assert "`docs/plans/phase-51-private-beta-route-contract-2026-05-18.md`" in text
        assert "`docs/architecture/contracts.md`" in text
        assert "`docs/decisions/ADR-0011-private-beta-route-ownership.md`" in text
