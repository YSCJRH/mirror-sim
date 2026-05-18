from __future__ import annotations

from pathlib import Path


PHASE52_GATE_PATH = Path("docs/plans/phase-52-successor-gate-2026-05-18.md")


def test_phase52_successor_gate_exists_with_required_sections() -> None:
    assert PHASE52_GATE_PATH.exists()

    gate = PHASE52_GATE_PATH.read_text(encoding="utf-8")
    required_sections = [
        "# Phase 52 Successor Gate",
        "Issue: `#411` `Phase 52: sync repo truth after Phase 51 closeout and define successor gate`",
        "Current work item: `#411` `Phase 52: sync repo truth after Phase 51 closeout and define successor gate`",
        "## Phase 51 Closeout Evidence",
        "## Phase 52 Operational Queue",
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
        "Status: blocked closeout gate for Phase 52.",
        "Status: current ready work item.",
        "Status: blocked until the repo-truth sync lands.",
        "Status: blocked until the legacy route audit lands.",
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
        assert "`#410`" in text
        assert "`#411`" in text
        assert "`#412`" in text
        assert "`#413`" in text
        assert "legacy top-level runtime routes" in text
        assert "runtime mutation guard regression" in text
        assert (
            "public/plugin/async" in text
            or "public demo, plugin, Hosted GPT/BYOK, or async" in text
        )
