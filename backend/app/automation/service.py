from __future__ import annotations

import json
import subprocess
from dataclasses import asdict, dataclass, field
from pathlib import Path

from backend.app.config import Settings, get_settings
from backend.app.utils import read_json
from backend.app.world_query import inspect_world


REQUIRED_PERSONA_FIELDS = (
    "public_role",
    "goals",
    "constraints",
    "known_facts",
    "private_info",
    "relationships",
)


@dataclass(frozen=True)
class LaneDecision:
    lane: str
    labels: list[str]
    blocking_labels: list[str]
    protected_hits: list[str]

    def as_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class AuditCheck:
    name: str
    passed: bool
    details: str

    def as_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class PhaseAudit:
    phase: str
    status: str
    checks: list[AuditCheck] = field(default_factory=list)
    failures: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "phase": self.phase,
            "status": self.status,
            "checks": [check.as_dict() for check in self.checks],
            "failures": self.failures,
            "notes": self.notes,
        }


def _repo_root_from_path(path: Path | None = None) -> Path:
    if path is not None:
        return path
    return Path(__file__).resolve().parents[3]


def load_lane_policy(policy_path: Path | None = None) -> dict:
    path = policy_path or (_repo_root_from_path() / ".github" / "automation" / "lane-policy.json")
    return json.loads(path.read_text(encoding="utf-8"))


def classify_paths(paths: list[str], policy_path: Path | None = None) -> LaneDecision:
    policy = load_lane_policy(policy_path)
    protected_hits = sorted(
        {
            path
            for path in paths
            for prefix in policy["protected_core_prefixes"]
            if path.startswith(prefix)
        }
    )
    if protected_hits:
        return LaneDecision(
            lane=policy["protected_core_label"],
            labels=policy["protected_core_labels"],
            blocking_labels=policy["automerge_blocking_labels"],
            protected_hits=protected_hits,
        )
    return LaneDecision(
        lane=policy["autonomous_safe_label"],
        labels=[policy["autonomous_safe_label"]],
        blocking_labels=[],
        protected_hits=[],
    )


def classify_git_refs(base: str, head: str, repo_root: Path | None = None, policy_path: Path | None = None) -> LaneDecision:
    root = _repo_root_from_path(repo_root)
    result = subprocess.run(
        [
            "git",
            "-c",
            f"safe.directory={root}",
            "diff",
            "--name-only",
            f"{base}...{head}",
        ],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    )
    paths = [line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()]
    return classify_paths(paths, policy_path=policy_path)


def _make_check(name: str, passed: bool, details: str) -> AuditCheck:
    return AuditCheck(name=name, passed=passed, details=details)


def _phase1_checks(settings: Settings, artifacts_root: Path) -> list[AuditCheck]:
    graph_path = artifacts_root / "graph" / "graph.json"
    personas_path = artifacts_root / "personas" / "personas.json"
    ingest_documents = artifacts_root / "ingest" / "documents.jsonl"
    ingest_chunks = artifacts_root / "ingest" / "chunks.jsonl"
    checks: list[AuditCheck] = [
        _make_check(
            "artifacts_exist",
            all(path.exists() for path in (ingest_documents, ingest_chunks, graph_path, personas_path)),
            f"Expected ingest, graph, and persona artifacts under {artifacts_root}.",
        ),
        _make_check(
            "world_model_config_exists",
            settings.world_model_path.exists(),
            f"Expected config-driven world model at {settings.world_model_path}.",
        ),
    ]
    if not graph_path.exists() or not personas_path.exists():
        return checks

    graph_payload = read_json(graph_path)
    persona_payload = read_json(personas_path)
    world_objects = graph_payload.get("entities", []) + graph_payload.get("relations", []) + graph_payload.get("events", [])
    checks.extend(
        [
            _make_check(
                "events_present",
                bool(graph_payload.get("events")),
                "graph.json must include non-empty events[].",
            ),
            _make_check(
                "world_objects_have_evidence",
                all(item.get("evidence_ids") for item in world_objects),
                "entities, relations, and events must all carry evidence_ids.",
            ),
        ]
    )
    persona_failures: list[str] = []
    for persona in persona_payload.get("personas", []):
        provenance = persona.get("field_provenance", {})
        for field_name in REQUIRED_PERSONA_FIELDS:
            if persona.get(field_name) and not provenance.get(field_name):
                persona_failures.append(f"{persona['persona_id']}.{field_name}")
    checks.append(
        _make_check(
            "persona_field_provenance",
            not persona_failures,
            "Missing provenance: " + (", ".join(persona_failures) if persona_failures else "none"),
        )
    )
    try:
        inspect_world("entity", "entity_east_gate", graph_path, personas_path)
        inspect_world("persona", "persona_su_he", graph_path, personas_path)
        inspect_world("event", "event_gate_failure_risk", graph_path, personas_path)
    except ValueError as exc:
        checks.append(_make_check("query_surface", False, str(exc)))
    else:
        checks.append(
            _make_check(
                "query_surface",
                True,
                "inspect-world can query entity_east_gate, persona_su_he, and event_gate_failure_risk.",
            )
        )

    graph_service_text = (settings.repo_root / "backend" / "app" / "graph" / "service.py").read_text(encoding="utf-8")
    persona_service_text = (settings.repo_root / "backend" / "app" / "personas" / "service.py").read_text(encoding="utf-8")
    checks.append(
        _make_check(
            "hardcoded_world_model_removed",
            "ENTITY_DEFINITIONS" not in graph_service_text and "PERSONA_BLUEPRINTS" not in persona_service_text,
            "Legacy hardcoded graph/persona constants should not remain in service modules.",
        )
    )
    return checks


def _phase2_checks(artifacts_root: Path) -> list[AuditCheck]:
    baseline_dir = artifacts_root / "run" / "baseline"
    intervention_dir = artifacts_root / "run" / "reporter_detained"
    report_dir = artifacts_root / "report"
    eval_path = artifacts_root / "eval" / "summary.json"
    required_paths = (
        baseline_dir / "summary.json",
        intervention_dir / "summary.json",
        baseline_dir / "run_trace.jsonl",
        intervention_dir / "run_trace.jsonl",
        report_dir / "report.md",
        report_dir / "claims.json",
        eval_path,
    )
    checks: list[AuditCheck] = [
        _make_check(
            "phase2_artifacts_exist",
            all(path.exists() for path in required_paths),
            f"Expected baseline/intervention run outputs, report, and eval summary under {artifacts_root}.",
        )
    ]
    if not all(path.exists() for path in required_paths):
        return checks

    baseline_summary = read_json(baseline_dir / "summary.json")
    intervention_summary = read_json(intervention_dir / "summary.json")
    claims = read_json(report_dir / "claims.json")
    eval_summary = read_json(eval_path)
    checks.extend(
        [
            _make_check(
                "deterministic_seed_stable",
                baseline_summary["seed"] == intervention_summary["seed"],
                "Baseline and intervention summaries must use the same seed for branch comparison.",
            ),
            _make_check(
                "claims_labeled_and_grounded",
                all(claim.get("label") and claim.get("evidence_ids") for claim in claims),
                "All report claims must have labels and evidence_ids.",
            ),
            _make_check(
                "eval_demo_passes",
                eval_summary.get("status") == "pass",
                f"eval status was {eval_summary.get('status')}.",
            ),
            _make_check(
                "snapshots_present",
                all((run_dir / "snapshots").exists() for run_dir in (baseline_dir, intervention_dir)),
                "Each run directory must contain snapshots/ for replayability.",
            ),
        ]
    )
    return checks


def _phase3_checks(settings: Settings, artifacts_root: Path) -> list[AuditCheck]:
    frontend_root = settings.repo_root / "frontend"
    return [
        _make_check(
            "frontend_workbench_exists",
            (frontend_root / "src" / "app" / "page.tsx").exists(),
            "Phase 3 requires a concrete browser workbench entrypoint at frontend/src/app/page.tsx.",
        ),
        _make_check(
            "demo_command_ready",
            (settings.repo_root / "scripts" / "demo.ps1").exists() and (settings.repo_root / "scripts" / "demo.sh").exists(),
            "A one-command demo entrypoint should exist in scripts/demo.*.",
        ),
        _make_check(
            "eval_summary_available",
            (artifacts_root / "eval" / "summary.json").exists(),
            "Phase 3 still depends on a current eval summary artifact.",
        ),
        _make_check(
            "human_review_rubric_exists",
            (settings.repo_root / "docs" / "rubrics" / "human-review.md").exists(),
            "Human review rubric must remain available for Phase 3.",
        ),
    ]


def run_phase_audit(
    phase: str,
    *,
    settings: Settings | None = None,
    artifacts_root: Path | None = None,
) -> PhaseAudit:
    settings = settings or get_settings()
    artifacts_root = artifacts_root or settings.artifacts_root

    if phase == "phase1":
        checks = _phase1_checks(settings, artifacts_root)
        notes = ["TODO[verify]: GitHub milestone closure and protected-core PR state must still be checked by the orchestrator."]
    elif phase == "phase2":
        checks = _phase2_checks(artifacts_root)
        notes = ["TODO[verify]: Deterministic replay across independent reruns is enforced by eval-demo, not by this artifact-only audit."]
    elif phase == "phase3":
        checks = _phase3_checks(settings, artifacts_root)
        notes = ["TODO[verify]: Open a fresh GitHub milestone and exit-gate issue before resuming builder automation beyond the closed Phase 3 queue."]
    else:
        raise ValueError(f"Unsupported phase: {phase}")

    failures = [f"{check.name}: {check.details}" for check in checks if not check.passed]
    return PhaseAudit(
        phase=phase,
        status="pass" if not failures else "fail",
        checks=checks,
        failures=failures,
        notes=notes,
    )
