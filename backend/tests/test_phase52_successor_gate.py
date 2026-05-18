from __future__ import annotations

from pathlib import Path


PHASE52_GATE_PATH = Path("docs/plans/phase-52-successor-gate-2026-05-18.md")


def test_phase52_successor_gate_exists_with_required_sections() -> None:
    assert PHASE52_GATE_PATH.exists()

    gate = PHASE52_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 52 Successor Gate",
        "Issue: `#410` `Phase 52 exit gate`",
        "Current work item: none; Phase 52 is closed and the queue is in the formal paused stop-state.",
        "## Phase 51 Closeout Evidence",
        "## Phase 52 Operational Queue",
        "## Phase 52 Closeout Evidence",
        "## Protected-Core Lane Coverage",
        "## Carried Forward TODO[verify] Items",
        "## Phase 52 Work Package Map",
        "## Blueprint Boundary",
        "## Non-Goals",
        "## Validation Commands",
    ]
    for section in required_sections:
        assert section in gate


def test_phase52_successor_gate_records_queue_and_boundaries() -> None:
    assert PHASE52_GATE_PATH.exists()

    gate = PHASE52_GATE_PATH.read_text(encoding="utf-8")
    required_phrases = [
        "Phase 52 - Legacy Route Containment and Runtime Scope Audit",
        "`#410` `Phase 52 exit gate`",
        "`#411` `Phase 52: sync repo truth after Phase 51 closeout and define successor gate`",
        "`#412` `Phase 52: audit legacy top-level runtime routes and preserve boundary contract`",
        "`#413` `Phase 52: strengthen runtime mutation guard regression baseline`",
        "Status: closed after post-merge validation on `main`.",
        "Status: closed by PR",
        "Status: closed by PR `#416`.",
        "Phase 52 is closed after PR `#416`, issue `#410`, and milestone `Phase 52 - Legacy Route Containment and Runtime Scope Audit`",
        "formal paused stop-state",
        "Phase 52 Legacy Top-Level Runtime Route Audit",
        "Phase 52 Runtime Mutation Guard Regression Baseline",
        "Phase 51 is closed after PR `#409`, issue `#403`, and milestone `Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate`",
        "legacy top-level runtime routes",
        "route-derived `worldId`",
        "Keep synchronous generation for v1",
        "TODO[verify]: rerun hosted/private-beta model measurements before introducing async task semantics",
        "Every report claim must keep both `label` and `evidence_ids`",
        "Do not present Mirror as a real-world prediction machine",
        "Do not implement a launch hub",
        "Do not implement async workers, queues, `task_id`, retry, status, cleanup",
        "Do not change scenario DSL, claim labels, report claim `evidence_ids`, run trace shape",
        "compare artifact shape, session/node manifest shape, public demo artifact layout",
        "Do not recreate local Codex automations without a new explicit operator request",
        "`docs/plans/phase-51-runtime-readiness-guards-2026-05-18.md`",
        "`docs/plans/phase-52-legacy-runtime-route-audit-2026-05-18.md`",
        "`docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md`",
        "`docs/plans/phase-52-successor-gate-2026-05-18.md`",
    ]
    for phrase in required_phrases:
        assert phrase in gate


def test_active_state_docs_point_to_phase52_queue() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-51-successor-gate-2026-05-18.md"),
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        assert "Phase 51 - Private-Beta Route Contract and Runtime Readiness Gate" in text
        assert "Phase 52 - Legacy Route Containment and Runtime Scope Audit" in text
        assert "Phase 52 is closed after PR `#416`, issue `#410`" in text
        assert "`#410`" in text
        assert "`#411`" in text
        assert "`#412`" in text
        assert "`#413`" in text
        assert "closed by PR `#416`" in text
        assert "Phase 52 Legacy Top-Level Runtime Route Audit" in text
        assert "`docs/plans/phase-52-legacy-runtime-route-audit-2026-05-18.md`" in text
        assert "Phase 52 Runtime Mutation Guard Regression Baseline" in text
        assert "`docs/plans/phase-52-runtime-mutation-guard-regression-2026-05-18.md`" in text
        assert "legacy top-level runtime routes" in text
        assert "runtime mutation guard regression" in text
        assert (
            "public/plugin/async" in text
            or "public demo, plugin, Hosted GPT/BYOK, or async" in text
        )


def test_active_state_docs_do_not_keep_stale_phase52_ready_language() -> None:
    required_docs = [
        Path("README.md"),
        Path("docs/plans/current-state-baseline.md"),
        Path("docs/plans/phase-execution-queue.md"),
        Path("docs/plans/automation-roadmap.md"),
        Path("docs/plans/phase-51-successor-gate-2026-05-18.md"),
        Path("docs/plans/phase-52-successor-gate-2026-05-18.md"),
    ]
    stale_phrases = [
        "approved Phase 52 successor queue",
        "Phase 52 is the active approved successor queue",
        "active Phase 52 successor",
        "current ready Phase 52 Runtime Mutation Guard Regression Baseline",
        "current `status:ready` protected-core work item",
        "`#410` `Phase 52 exit gate` is `open`, `blocked`",
        "`#410` `Phase 52 exit gate` is open and blocked",
        "reports `ready` with Phase 52 as the active milestone",
        "reports `ready` with `Phase 52 - Legacy Route Containment and Runtime Scope Audit` as the active milestone",
    ]

    for path in required_docs:
        text = path.read_text(encoding="utf-8")
        for phrase in stale_phrases:
            assert phrase not in text, f"{path} still contains stale Phase 52 state: {phrase}"
