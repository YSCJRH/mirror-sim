from __future__ import annotations

from pathlib import Path


NOTE_PATH = Path("docs/plans/phase-56-candidate-source-verification-2026-05-20.md")
HOME_PAGE = Path("frontend/src/app/page.tsx")
PUBLIC_REVIEW_PAGE = Path("frontend/src/app/review/page.tsx")
WORLD_REVIEW_PAGE = Path("frontend/src/app/worlds/[worldId]/review/page.tsx")


def _read(path: Path) -> str:
    assert path.exists()
    return path.read_text(encoding="utf-8")


def _assert_in_order(source: str, markers: list[str]) -> None:
    cursor = -1
    for marker in markers:
        next_position = source.find(marker, cursor + 1)
        assert next_position > cursor, marker
        cursor = next_position


def test_current_frontend_source_facts_back_phase56_candidate_classification() -> None:
    home = _read(HOME_PAGE)
    assert 'title: "Mirror Public Demo"' in home
    assert "Deterministic-only Phase 1" in home
    assert "Replay a bounded what-if world without accounts, uploads, or model calls." in home
    assert "Runtime mutation, create-world, corpus upload, Hosted GPT, BYOK" in home
    assert '<ButtonLink href="/review" variant="ghost">' in home
    assert "launch hub" not in home.lower()

    public_review = _read(PUBLIC_REVIEW_PAGE)
    assert 'data-review-surface="advanced-analyst-mode"' in public_review
    assert "Advanced Analyst Mode" in public_review
    _assert_in_order(
        public_review,
        [
            "<ReviewRubricPanel",
            'id="trace-claims"',
            'id="claims"',
            'id="reference"',
            'id="advanced-operations"',
            "<LegacyOperationsPanel",
        ],
    )

    world_review = _read(WORLD_REVIEW_PAGE)
    assert "const { worldId } = await params;" in world_review
    assert "loadProductWorldConfig(worldId, locale)" in world_review
    assert "loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)" in world_review
    assert "This is the world-scoped advanced review surface" in world_review
    assert "Generate one live branch first, then come back for advanced review" in world_review
    _assert_in_order(
        world_review,
        [
            "const runtimeWorkspace = sessionId",
            "runtimeWorkspace ? (",
            "<ReviewRubricPanel",
            "<RuntimeReviewBrief",
            "<RuntimeLineagePanel",
            "Generate one live branch first, then come back for advanced review",
        ],
    )
    assert "<ReviewRubricPanel" in world_review
    assert "<RuntimeReviewBrief" in world_review
    assert "<RuntimeLineagePanel" in world_review


def test_phase56_candidate_source_verification_note_exists_with_required_sections() -> None:
    note = _read(NOTE_PATH)
    required_sections = [
        "# Phase 56 Candidate Source Verification",
        "Issue: `#442` `Phase 56: source-verify candidate planning signals against current frontend`",
        "## Current Frontend Source Evidence",
        "## Candidate Signal Classification",
        "## Promoted Signals",
        "## Rejected Signals",
        "## Deferred Signals",
        "## Durable Truth Guardrails",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in note


def test_phase56_candidate_source_verification_classifies_signals_with_source_evidence() -> None:
    note = _read(NOTE_PATH)
    required_phrases = [
        "frontend/src/app/page.tsx",
        "`/` remains the guided Phase 1 public demo, not a launch hub",
        "frontend/src/app/review/page.tsx",
        "scorecard -> trace/claims -> claims -> reference -> legacy operations",
        "frontend/src/app/worlds/[worldId]/review/page.tsx",
        "`/worlds/<world_id>/review` is promoted only as an existing world-scoped private-beta review surface",
        "docs/plans/private-alpha-baseline-2026-04-22.md:9",
        "docs/plans/private-beta-readiness-2026-04-23.md:24",
        "docs/plans/hybrid-linear-main-path-manual-review.md",
        "docs/plans/interactive-perturbation-simulator-2026-04/README.md",
        "Promote: analysis-first public review ordering",
        "Promote: existing world-scoped review entrypoint",
        "when a runtime workspace exists",
        "The no-session state remains an explicit prompt to generate one live branch first",
        "Reject: April launch-hub replacement signal",
        "Reject: Hosted GPT/BYOK availability signal",
        "Defer: private-beta readiness snapshots",
        "Defer: Figma/design-system synchronization claims",
        "Defer: interactive simulator and kernel contract claims",
        "candidate-only until a reviewed PR promotes a specific source-verified signal",
        "No ADR or `docs/architecture/contracts.md` update is made by #442",
        "does not claim broad or future-world readiness",
    ]
    for phrase in required_phrases:
        assert phrase in note


def test_phase56_candidate_source_verification_blocks_candidate_claim_leakage() -> None:
    durable_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/architecture/contracts.md"),
        Path("docs/plans/phase-56-successor-gate-2026-05-20.md"),
        NOTE_PATH,
    ]
    forbidden_phrases = [
        "`/` is now the launch hub",
        "Launch Hub: /",
        "Launch Hub now surfaces each world's latest live node",
        "hosted_openai is now available as a private-beta hosted GPT path",
        "Hosted GPT/BYOK readiness is promoted",
        "BYO LLM is now browser-session-only",
        "Phase 56 promotes private-beta readiness",
        "Phase 56 ratifies Hosted GPT",
        "Phase 56 ratifies BYOK",
        "Phase 56 replaces `/`",
        "Phase 56 implements launch hub",
        "Phase 56 implements Hosted GPT",
        "Phase 56 implements BYOK",
        "Phase 56 adds a new route",
        "Phase 56 changes backend APIs",
    ]

    for path in durable_docs:
        text = _read(path)
        for phrase in forbidden_phrases:
            assert phrase not in text, f"{path} leaked candidate claim: {phrase}"


def test_phase56_candidate_source_verification_labels_rejected_and_deferred_claims() -> None:
    note = _read(NOTE_PATH)
    required_rows = [
        ("April launch-hub replacement signal", "Reject"),
        ("Hosted GPT/BYOK availability signal", "Reject"),
        ("private-beta route readiness snapshots", "Defer"),
        ("Figma/design-system synchronization claims", "Defer"),
        ("interactive simulator and kernel contract claims", "Defer"),
    ]

    for signal, classification in required_rows:
        matching_lines = [line for line in note.splitlines() if signal in line]
        assert matching_lines, signal
        assert any(classification in line for line in matching_lines), signal


def test_phase56_candidate_source_verification_keeps_contract_boundaries() -> None:
    note = _read(NOTE_PATH)
    required_phrases = [
        "No ADR or `docs/architecture/contracts.md` update is made by #442",
        "No frontend route, backend API, artifact layout, data contract, or plugin MCP contract changes are made by #442",
        "Do not change the scenario DSL",
        "claim labels",
        "report claim `evidence_ids`",
        "run trace shape",
        "compare artifact shape",
        "public demo artifact layout",
        "runtime mutation semantics",
        "async/task_id",
        "Hosted GPT/BYOK",
        "does not claim broad or future-world readiness",
    ]
    for phrase in required_phrases:
        assert phrase in note
