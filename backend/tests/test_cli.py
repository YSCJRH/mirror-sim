from __future__ import annotations

import json
from pathlib import Path
import pytest

import backend.app.cli as cli_module
from backend.app.cli import main
from backend.app.config import Settings
from backend.app.automation.service import GitHubQueueAudit, AuditCheck
from backend.app.config import get_settings
from backend.app.safety.service import ensure_safe_scenario


def test_cli_help_commands_execute(tmp_path: Path) -> None:
    settings = get_settings()
    assert main(["ingest", str(settings.manifest_path), "--out", str(tmp_path / "ingest")]) == 0
    assert main(["build-graph", str(tmp_path / "ingest" / "chunks.jsonl"), "--out", str(tmp_path / "graph")]) == 0
    assert main(["personas", str(tmp_path / "graph" / "graph.json"), "--out", str(tmp_path / "personas")]) == 0


def test_cli_validate_and_smoke(tmp_path: Path) -> None:
    settings = get_settings()
    assert main(["validate-scenario", str(settings.baseline_scenario_path), "--out", str(tmp_path / "baseline.json")]) == 0
    assert (tmp_path / "baseline.json").exists()


def test_cli_start_session_outputs_json_and_writes_artifacts(tmp_path: Path, capsys) -> None:
    result = main(
        [
            "start-session",
            "--world",
            "fog-harbor-east-gate",
            "--scenario",
            "scenario_baseline",
            "--artifacts-root",
            str(tmp_path),
        ]
    )
    payload = json.loads(capsys.readouterr().out)
    assert result == 0
    assert payload["world_id"] == "fog-harbor-east-gate"
    assert payload["scenario_id"] == "scenario_baseline"
    assert payload["root_node_id"] == "node_root"
    assert payload["active_node_id"] == "node_root"
    assert payload["decision_config"]["provider"] == "openai_compatible"
    session_id = payload["session_id"]
    assert (tmp_path / "sessions" / session_id / "session.json").exists()
    assert (tmp_path / "sessions" / session_id / "nodes" / "node_root" / "node.json").exists()


def test_cli_create_world_writes_runtime_world_pack(tmp_path: Path, capsys, monkeypatch) -> None:
    settings = get_settings()
    runtime_root = tmp_path / "repo"
    runtime_root.mkdir(parents=True, exist_ok=True)
    patched_settings = Settings(
        repo_root=runtime_root,
        world_id=settings.world_id,
        data_root=settings.data_root,
        artifacts_root=settings.artifacts_root,
        manifest_path=settings.manifest_path,
        world_model_path=settings.world_model_path,
        decision_schema_path=settings.decision_schema_path,
        simulation_rules_path=settings.simulation_rules_path,
        scenario_dir=settings.scenario_dir,
        baseline_scenario_path=settings.baseline_scenario_path,
        intervention_scenario_path=settings.intervention_scenario_path,
        expectations_path=settings.expectations_path,
        redlines_path=settings.redlines_path,
    )
    monkeypatch.setattr(cli_module, "get_settings", lambda: patched_settings)

    spec = {
        "world_name": "Harbor Night Drill",
        "world_summary": "A bounded drill world for private alpha.",
        "authorized_context": "This corpus is fictional and authorized for testing.",
        "authorization_confirmed": True,
        "documents": [
            {
                "title": "Ops note",
                "kind": "memo",
                "text": "A copied checklist is delayed while the response lead waits for evidence.",
            }
        ],
        "roles": [
            {"slot": "records_lead", "name": "Mina Cole", "public_role": "Records lead holding the copied checklist."},
            {"slot": "field_operator", "name": "Tao Reed", "public_role": "Field operator inspecting the flood gate."},
            {"slot": "observer", "name": "Iris Chen", "public_role": "Observer carrying the first warning toward the response desk."},
            {"slot": "decision_lead", "name": "Noa Vale", "public_role": "Decision lead protecting the opening drill."},
        ],
        "risk_asset_name": "East Flood Gate",
        "evidence_document_name": "Copied Checklist",
        "public_event_name": "Harbor Drill Opening",
        "response_location_name": "East Wharf",
        "tracked_outcomes": [
            {"field": "evidence_public_turn", "label": "Checklist publication turn"},
            {"field": "response_turn", "label": "Response turn"},
            {"field": "public_event_status", "label": "Opening status"},
            {"field": "response_triggered", "label": "Response trigger state"},
            {"field": "risk_known_by", "label": "Risk knowledge spread"},
        ],
    }

    assert main(["create-world", "--spec", json.dumps(spec)]) == 0
    payload = json.loads(capsys.readouterr().out)
    world_id = payload["world_id"]
    assert (runtime_root / "state" / "worlds" / world_id / "config" / "product.json").exists()
    assert (runtime_root / "state" / "worlds" / world_id / "config" / "world_model.yaml").exists()
    assert (runtime_root / "state" / "worlds" / world_id / "config" / "simulation_rules.yaml").exists()
    assert (runtime_root / "state" / "worlds" / world_id / "config" / "decision_schema.yaml").exists()
    assert (runtime_root / "state" / "artifacts" / "worlds" / world_id / "graph" / "graph.json").exists()
    assert (runtime_root / "state" / "artifacts" / "worlds" / world_id / "personas" / "personas.json").exists()

    assert (
        main(
            [
                "start-session",
                "--world",
                world_id,
                "--scenario",
                payload["baseline_scenario_id"],
            ]
        )
        == 0
    )
    session_payload = json.loads(capsys.readouterr().out)
    assert session_payload["world_id"] == world_id


def test_cli_create_world_uses_locale_for_generated_product_copy(
    tmp_path: Path, capsys, monkeypatch
) -> None:
    settings = get_settings()
    runtime_root = tmp_path / "repo"
    runtime_root.mkdir(parents=True, exist_ok=True)
    patched_settings = Settings(
        repo_root=runtime_root,
        world_id=settings.world_id,
        data_root=settings.data_root,
        artifacts_root=settings.artifacts_root,
        manifest_path=settings.manifest_path,
        world_model_path=settings.world_model_path,
        decision_schema_path=settings.decision_schema_path,
        simulation_rules_path=settings.simulation_rules_path,
        scenario_dir=settings.scenario_dir,
        baseline_scenario_path=settings.baseline_scenario_path,
        intervention_scenario_path=settings.intervention_scenario_path,
        expectations_path=settings.expectations_path,
        redlines_path=settings.redlines_path,
    )
    monkeypatch.setattr(cli_module, "get_settings", lambda: patched_settings)

    spec = {
        "locale": "zh-CN",
        "world_name": "港口夜间演练",
        "world_summary": "一个用于中文私有 alpha 测试的受约束演练世界。",
        "authorized_context": "全部为虚构测试文本，已明确允许用于建世界。",
        "authorization_confirmed": True,
        "documents": [
            {
                "title": "夜班摘记",
                "kind": "memo",
                "text": "一份账本副本被延迟，响应负责人正在等待证据进入决策链。",
            }
        ],
        "roles": [
            {"slot": "records_lead", "name": "陈宇", "public_role": "记录负责人，掌握账本副本。"},
            {"slot": "field_operator", "name": "苏和", "public_role": "现场负责人，检查风险设施。"},
            {"slot": "observer", "name": "林岚", "public_role": "观察员，传递第一轮预警。"},
            {"slot": "decision_lead", "name": "何砚", "public_role": "决策负责人，判断是否进入响应。"},
        ],
        "risk_asset_name": "东门潮位系统",
        "evidence_document_name": "账本副本",
        "public_event_name": "港口说明会",
        "response_location_name": "东门响应点",
        "tracked_outcomes": [],
    }

    assert main(["create-world", "--spec", json.dumps(spec, ensure_ascii=False)]) == 0
    payload = json.loads(capsys.readouterr().out)
    world_id = payload["world_id"]
    product_payload = json.loads(
        (runtime_root / "state" / "worlds" / world_id / "config" / "product.json").read_text(
            encoding="utf-8"
        )
    )
    assert product_payload["baseline_title"] == "港口夜间演练基线"
    assert product_payload["perturbation_options"][0]["title"].startswith("延迟")
    assert product_payload["perturbation_options"][1]["kind"] == "联系阻断"
    assert product_payload["outcome_labels"]["response_triggered"] == "是否进入响应"


def test_cli_start_session_persists_decision_model_override(tmp_path: Path, capsys) -> None:
    result = main(
        [
            "start-session",
            "--world",
            "fog-harbor-east-gate",
            "--scenario",
            "scenario_baseline",
            "--artifacts-root",
            str(tmp_path),
            "--decision-provider",
            "openai_compatible",
            "--decision-model",
            "gpt-5.4",
        ]
    )
    payload = json.loads(capsys.readouterr().out)
    assert result == 0
    assert payload["decision_config"]["provider"] == "openai_compatible"
    assert payload["decision_config"]["model_id"] == "gpt-5.4"


def test_cli_start_session_persists_deterministic_provider(tmp_path: Path, capsys) -> None:
    result = main(
        [
            "start-session",
            "--world",
            "fog-harbor-east-gate",
            "--scenario",
            "scenario_baseline",
            "--artifacts-root",
            str(tmp_path),
            "--decision-provider",
            "deterministic_only",
            "--decision-model",
            "gpt-5.4",
        ]
    )
    payload = json.loads(capsys.readouterr().out)
    assert result == 0
    assert payload["decision_config"]["provider"] == "deterministic_only"
    assert payload["decision_config"]["model_id"] is None


def test_cli_inspect_session_reads_written_manifest(tmp_path: Path, capsys) -> None:
    assert (
        main(
            [
                "start-session",
                "--world",
                "fog-harbor-east-gate",
                "--scenario",
                "scenario_baseline",
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    session_payload = json.loads(capsys.readouterr().out)
    session_id = session_payload["session_id"]

    assert main(["inspect-session", "--session", session_id, "--artifacts-root", str(tmp_path)]) == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["session_id"] == session_id
    assert payload["active_node_id"] == "node_root"
    assert payload["nodes"][0]["node_path"].endswith("node_root/node.json")


def test_cli_generate_branch_writes_child_node_and_compare(tmp_path: Path, capsys) -> None:
    settings = get_settings()
    assert main(["ingest", str(settings.manifest_path), "--out", str(tmp_path / "ingest")]) == 0
    assert main(["build-graph", str(tmp_path / "ingest" / "chunks.jsonl"), "--out", str(tmp_path / "graph")]) == 0
    assert main(["personas", str(tmp_path / "graph" / "graph.json"), "--out", str(tmp_path / "personas")]) == 0
    capsys.readouterr()

    assert (
        main(
            [
                "start-session",
                "--world",
                "fog-harbor-east-gate",
                "--scenario",
                "scenario_baseline",
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    session_payload = json.loads(capsys.readouterr().out)
    session_id = session_payload["session_id"]
    perturbation = json.dumps(
        {
            "kind": "delay_document",
            "target_id": "doc_ledger_copy",
            "timing": "before_publication",
            "summary": "Delay the copied ledger before it reaches the public decision loop.",
            "parameters": {
                "actor_id": "entity_lin_lan",
                "delay_turns": 2,
                "cause": "courier_interruption",
            },
        }
    )

    assert (
        main(
            [
                "generate-branch",
                "--session",
                session_id,
                "--from",
                "node_root",
                "--perturbation",
                perturbation,
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    payload = json.loads(capsys.readouterr().out)
    assert payload["active_node_id"] != "node_root"
    assert len(payload["nodes"]) == 2
    child_node_id = payload["active_node_id"]
    child_node = json.loads((tmp_path / "sessions" / session_id / "nodes" / child_node_id / "node.json").read_text(encoding="utf-8"))
    assert child_node["parent_node_id"] == "node_root"
    assert child_node["run_id"].startswith("run_")
    assert child_node["summary_path"].endswith("/summary.json")
    assert child_node["compare_path"].endswith("/compare.json")
    assert child_node["report_path"].endswith("/report.md")
    assert child_node["claims_path"].endswith("/claims.json")
    assert child_node["resolution_path"].endswith("/resolution.json")
    assert child_node["decision_trace_path"].endswith("/decision_trace.jsonl")
    assert (tmp_path / child_node["summary_path"]).exists()
    assert (tmp_path / child_node["compare_path"]).exists()
    assert (tmp_path / child_node["report_path"]).exists()
    assert (tmp_path / child_node["claims_path"]).exists()
    assert (tmp_path / child_node["resolution_path"]).exists()
    assert (tmp_path / child_node["decision_trace_path"]).exists()


def test_cli_generate_branch_uses_session_decision_model(tmp_path: Path, capsys) -> None:
    settings = get_settings()
    assert main(["ingest", str(settings.manifest_path), "--out", str(tmp_path / "ingest")]) == 0
    assert main(["build-graph", str(tmp_path / "ingest" / "chunks.jsonl"), "--out", str(tmp_path / "graph")]) == 0
    assert main(["personas", str(tmp_path / "graph" / "graph.json"), "--out", str(tmp_path / "personas")]) == 0
    capsys.readouterr()

    assert (
        main(
            [
                "start-session",
                "--world",
                "fog-harbor-east-gate",
                "--scenario",
                "scenario_baseline",
                "--artifacts-root",
                str(tmp_path),
                "--decision-provider",
                "openai_compatible",
                "--decision-model",
                "gpt-5.4",
            ]
        )
        == 0
    )
    session_payload = json.loads(capsys.readouterr().out)
    session_id = session_payload["session_id"]
    perturbation = json.dumps(
        {
            "kind": "delay_document",
            "target_id": "doc_ledger_copy",
            "timing": "before_publication",
            "summary": "Delay the copied ledger before it reaches the public decision loop.",
            "parameters": {
                "actor_id": "entity_lin_lan",
                "delay_turns": 2,
                "cause": "courier_interruption",
            },
        }
    )

    assert (
        main(
            [
                "generate-branch",
                "--session",
                session_id,
                "--from",
                "node_root",
                "--perturbation",
                perturbation,
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    payload = json.loads(capsys.readouterr().out)
    child_node_id = payload["active_node_id"]
    child_node = json.loads(
        (tmp_path / "sessions" / session_id / "nodes" / child_node_id / "node.json").read_text(
            encoding="utf-8"
        )
    )
    trace_rows = [
        json.loads(line)
        for line in (tmp_path / child_node["decision_trace_path"]).read_text(encoding="utf-8").splitlines()
        if line
    ]
    assert trace_rows
    assert all(row["model_id"] == "gpt-5.4" for row in trace_rows)


def test_cli_generate_branch_respects_deterministic_provider(tmp_path: Path, capsys) -> None:
    settings = get_settings()
    assert main(["ingest", str(settings.manifest_path), "--out", str(tmp_path / "ingest")]) == 0
    assert main(["build-graph", str(tmp_path / "ingest" / "chunks.jsonl"), "--out", str(tmp_path / "graph")]) == 0
    assert main(["personas", str(tmp_path / "graph" / "graph.json"), "--out", str(tmp_path / "personas")]) == 0
    capsys.readouterr()

    assert (
        main(
            [
                "start-session",
                "--world",
                "fog-harbor-east-gate",
                "--scenario",
                "scenario_baseline",
                "--artifacts-root",
                str(tmp_path),
                "--decision-provider",
                "deterministic_only",
            ]
        )
        == 0
    )
    session_payload = json.loads(capsys.readouterr().out)
    session_id = session_payload["session_id"]
    perturbation = json.dumps(
        {
            "kind": "delay_document",
            "target_id": "doc_ledger_copy",
            "timing": "before_publication",
            "summary": "Delay the copied ledger before it reaches the public decision loop.",
            "parameters": {
                "actor_id": "entity_lin_lan",
                "delay_turns": 2,
                "cause": "courier_interruption",
            },
        }
    )

    assert (
        main(
            [
                "generate-branch",
                "--session",
                session_id,
                "--from",
                "node_root",
                "--perturbation",
                perturbation,
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    payload = json.loads(capsys.readouterr().out)
    child_node_id = payload["active_node_id"]
    child_node = json.loads(
        (tmp_path / "sessions" / session_id / "nodes" / child_node_id / "node.json").read_text(
            encoding="utf-8"
        )
    )
    trace_rows = [
        json.loads(line)
        for line in (tmp_path / child_node["decision_trace_path"]).read_text(encoding="utf-8").splitlines()
        if line
    ]
    assert trace_rows
    assert all(row["provider_mode"] != "openai_compatible" for row in trace_rows)
    assert all(row["model_id"] is None for row in trace_rows)


def test_cli_generate_branch_from_existing_child_node(tmp_path: Path, capsys) -> None:
    settings = get_settings()
    assert main(["ingest", str(settings.manifest_path), "--out", str(tmp_path / "ingest")]) == 0
    assert main(["build-graph", str(tmp_path / "ingest" / "chunks.jsonl"), "--out", str(tmp_path / "graph")]) == 0
    assert main(["personas", str(tmp_path / "graph" / "graph.json"), "--out", str(tmp_path / "personas")]) == 0
    capsys.readouterr()

    assert (
        main(
            [
                "start-session",
                "--world",
                "fog-harbor-east-gate",
                "--scenario",
                "scenario_baseline",
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    session_payload = json.loads(capsys.readouterr().out)
    session_id = session_payload["session_id"]

    first_perturbation = json.dumps(
        {
            "kind": "delay_document",
            "target_id": "doc_ledger_copy",
            "timing": "before_publication",
            "summary": "Delay the copied ledger before it reaches the public decision loop.",
            "parameters": {
                "actor_id": "entity_lin_lan",
                "delay_turns": 2,
                "cause": "courier_interruption",
            },
        }
    )
    second_perturbation = json.dumps(
        {
            "kind": "block_contact",
            "target_id": "persona_zhao_ke",
            "timing": "first_warning_attempt",
            "summary": "Block the deputy-mayor escalation path after the first perturbation is already active.",
            "parameters": {
                "actor_id": "persona_chen_yu",
                "cause": "signal_scramble",
            },
        }
    )

    assert (
        main(
            [
                "generate-branch",
                "--session",
                session_id,
                "--from",
                "node_root",
                "--perturbation",
                first_perturbation,
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    first_payload = json.loads(capsys.readouterr().out)
    first_child_id = first_payload["active_node_id"]

    assert (
        main(
            [
                "generate-branch",
                "--session",
                session_id,
                "--from",
                first_child_id,
                "--perturbation",
                second_perturbation,
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    second_payload = json.loads(capsys.readouterr().out)
    second_child_id = second_payload["active_node_id"]
    assert second_child_id != first_child_id
    assert len(second_payload["nodes"]) == 3

    second_child = json.loads(
        (tmp_path / "sessions" / session_id / "nodes" / second_child_id / "node.json").read_text(
            encoding="utf-8"
        )
    )
    assert second_child["parent_node_id"] == first_child_id
    assert second_child["run_id"].startswith("run_")
    assert second_child["compare_path"].endswith("/compare.json")
    assert second_child["resolution_path"].endswith("/resolution.json")
    assert second_child["decision_trace_path"].endswith("/decision_trace.jsonl")

    compare_artifact = json.loads((tmp_path / second_child["compare_path"]).read_text(encoding="utf-8"))
    reference_branch = next(branch for branch in compare_artifact["branches"] if branch["is_reference"])
    assert f"nodes/{first_child_id}/run/summary.json" in reference_branch["summary_path"]
    assert (tmp_path / second_child["summary_path"]).exists()
    assert (tmp_path / second_child["report_path"]).exists()
    assert (tmp_path / second_child["claims_path"]).exists()
    assert (tmp_path / second_child["resolution_path"]).exists()
    assert (tmp_path / second_child["decision_trace_path"]).exists()


def test_cli_rollback_session_moves_active_pointer(tmp_path: Path, capsys) -> None:
    settings = get_settings()
    assert main(["ingest", str(settings.manifest_path), "--out", str(tmp_path / "ingest")]) == 0
    assert main(["build-graph", str(tmp_path / "ingest" / "chunks.jsonl"), "--out", str(tmp_path / "graph")]) == 0
    assert main(["personas", str(tmp_path / "graph" / "graph.json"), "--out", str(tmp_path / "personas")]) == 0
    capsys.readouterr()

    assert (
        main(
            [
                "start-session",
                "--world",
                "fog-harbor-east-gate",
                "--scenario",
                "scenario_baseline",
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    session_payload = json.loads(capsys.readouterr().out)
    session_id = session_payload["session_id"]
    perturbation = json.dumps(
        {
            "kind": "delay_document",
            "target_id": "doc_ledger_copy",
            "timing": "before_publication",
            "summary": "Delay the copied ledger before it reaches the public decision loop.",
            "parameters": {
                "actor_id": "entity_lin_lan",
                "delay_turns": 2,
                "cause": "courier_interruption",
            },
        }
    )
    assert (
        main(
            [
                "generate-branch",
                "--session",
                session_id,
                "--from",
                "node_root",
                "--perturbation",
                perturbation,
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    generated_payload = json.loads(capsys.readouterr().out)
    assert generated_payload["active_node_id"] != "node_root"

    assert (
        main(
            [
                "rollback-session",
                "--session",
                session_id,
                "--to",
                "node_root",
                "--artifacts-root",
                str(tmp_path),
            ]
        )
        == 0
    )
    rollback_payload = json.loads(capsys.readouterr().out)
    assert rollback_payload["active_node_id"] == "node_root"


def _load_fixture(name: str) -> dict:
    return json.loads((Path(__file__).parent / "fixtures" / name).read_text(encoding="utf-8"))


@pytest.mark.parametrize(
    ("kind", "object_id", "fixture_name"),
    [
        ("entity", "entity_east_gate", "inspect_world_entity_east_gate.json"),
        ("persona", "persona_su_he", "inspect_world_persona_su_he.json"),
        ("event", "event_gate_failure_risk", "inspect_world_event_gate_failure_risk.json"),
    ],
)
def test_cli_inspect_world_matches_golden_outputs(
    tmp_path: Path,
    capsys,
    kind: str,
    object_id: str,
    fixture_name: str,
) -> None:
    settings = get_settings()
    assert main(["ingest", str(settings.manifest_path), "--out", str(tmp_path / "ingest")]) == 0
    assert main(["build-graph", str(tmp_path / "ingest" / "chunks.jsonl"), "--out", str(tmp_path / "graph")]) == 0
    assert main(["personas", str(tmp_path / "graph" / "graph.json"), "--out", str(tmp_path / "personas")]) == 0
    capsys.readouterr()
    assert (
        main(
            [
                "inspect-world",
                "--kind",
                kind,
                "--id",
                object_id,
                "--graph",
                str(tmp_path / "graph" / "graph.json"),
                "--personas",
                str(tmp_path / "personas" / "personas.json"),
            ]
        )
        == 0
    )
    payload = json.loads(capsys.readouterr().out)
    assert payload == _load_fixture(fixture_name)


def test_cli_classify_lane_outputs_json(capsys) -> None:
    assert main(["classify-lane", "--files", "README.md", "backend/app/cli.py"]) == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["lane"] == "lane:auto-safe"


def test_cli_audit_phase_outputs_json(tmp_path: Path, capsys) -> None:
    settings = get_settings()
    assert main(["eval-demo"]) == 0
    capsys.readouterr()
    result = main(["audit-phase", "phase1", "--artifacts-root", str(settings.artifacts_root)])
    payload = json.loads(capsys.readouterr().out)
    assert result == 0
    assert payload["phase"] == "phase1"
    assert payload["status"] == "pass"


def test_cli_audit_github_queue_outputs_json(monkeypatch, capsys) -> None:
    milestone_title = "Current Active Queue"
    monkeypatch.setattr(
        "backend.app.cli.audit_github_queue",
        lambda repo, repo_root=None: GitHubQueueAudit(
            repo=repo,
            status="ready",
            active_milestone=milestone_title,
            checks=[AuditCheck(name="single_open_milestone", passed=True, details="ok")],
            failures=[],
            notes=["ok"],
        ),
    )
    assert main(["audit-github-queue", "--repo", "YSCJRH/mirror-sim"]) == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["status"] == "ready"
    assert payload["active_milestone"] == milestone_title


def test_cli_eval_world_outputs_json(capsys) -> None:
    assert main(["eval-world", "--world", "museum-night"]) == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["world_id"] == "museum-night"
    assert payload["status"] == "pass"


def test_cli_eval_transfer_outputs_json(capsys) -> None:
    assert main(["eval-transfer"]) == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["world_id"] == "transfer"
    assert payload["status"] == "pass"


def test_safety_blocks_redline_payload() -> None:
    unsafe_payload = {"description": "This scenario performs political persuasion and voter targeting."}
    try:
        ensure_safe_scenario(unsafe_payload)
    except ValueError as exc:
        assert "Unsafe scenario payload" in str(exc)
    else:
        raise AssertionError("unsafe payload was not blocked")
