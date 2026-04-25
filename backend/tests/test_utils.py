from __future__ import annotations

import json
from pathlib import Path

from backend.app.utils import read_json_arg


def test_read_json_arg_parses_inline_object_without_path_probe(monkeypatch) -> None:
    def fail_exists(self: Path) -> bool:
        raise AssertionError("inline JSON should not be probed as a path")

    monkeypatch.setattr(Path, "exists", fail_exists)

    assert read_json_arg(json.dumps({"kind": "demo"})) == {"kind": "demo"}


def test_read_json_arg_reads_existing_file(tmp_path: Path) -> None:
    payload_path = tmp_path / "payload.json"
    payload_path.write_text(json.dumps({"kind": "file"}), encoding="utf-8")

    assert read_json_arg(str(payload_path)) == {"kind": "file"}


def test_read_json_arg_falls_back_after_path_probe_oserror(monkeypatch) -> None:
    def raise_oserror(self: Path) -> bool:
        raise OSError("path probe failed")

    monkeypatch.setattr(Path, "exists", raise_oserror)

    assert read_json_arg('"inline string"') == "inline string"
