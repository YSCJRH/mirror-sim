from __future__ import annotations

import json
from pathlib import Path

from backend.app.cli import main
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


def test_cli_inspect_world_outputs_json(tmp_path: Path, capsys) -> None:
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
                "entity",
                "--id",
                "entity_east_gate",
                "--graph",
                str(tmp_path / "graph" / "graph.json"),
                "--personas",
                str(tmp_path / "personas" / "personas.json"),
            ]
        )
        == 0
    )
    payload = json.loads(capsys.readouterr().out)
    assert payload["kind"] == "entity"
    assert payload["object"]["entity_id"] == "entity_east_gate"


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


def test_safety_blocks_redline_payload() -> None:
    unsafe_payload = {"description": "This scenario performs political persuasion and voter targeting."}
    try:
        ensure_safe_scenario(unsafe_payload)
    except ValueError as exc:
        assert "Unsafe scenario payload" in str(exc)
    else:
        raise AssertionError("unsafe payload was not blocked")
