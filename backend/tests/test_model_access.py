from __future__ import annotations

import json
from pathlib import Path

import pytest

from backend.app.model_access import enforce_hosted_quota, validate_hosted_model_access
from backend.app.sessions.service import start_session


def test_hosted_model_access_requires_enabled_server_secret_and_model(monkeypatch) -> None:
    monkeypatch.delenv("MIRROR_HOSTED_MODEL_ENABLED", raising=False)
    monkeypatch.delenv("MIRROR_HOSTED_OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("MIRROR_HOSTED_DECISION_MODEL", raising=False)

    with pytest.raises(ValueError, match="disabled"):
        validate_hosted_model_access()

    monkeypatch.setenv("MIRROR_HOSTED_MODEL_ENABLED", "1")
    with pytest.raises(ValueError, match="server secret"):
        validate_hosted_model_access()

    monkeypatch.setenv("MIRROR_HOSTED_OPENAI_API_KEY", "test-secret-never-commit")
    with pytest.raises(ValueError, match="missing"):
        validate_hosted_model_access()

    monkeypatch.setenv("MIRROR_HOSTED_DECISION_MODEL", "gpt-test")
    assert validate_hosted_model_access() == "gpt-test"


def test_hosted_session_manifest_never_writes_key(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("MIRROR_HOSTED_MODEL_ENABLED", "1")
    monkeypatch.setenv("MIRROR_HOSTED_OPENAI_API_KEY", "test-secret-never-commit")
    monkeypatch.setenv("MIRROR_HOSTED_DECISION_MODEL", "gpt-test")

    session = start_session(
        "fog-harbor-east-gate",
        "scenario_baseline",
        artifacts_root=tmp_path,
        decision_provider="hosted_openai",
    )

    session_path = tmp_path / "sessions" / session.session_id / "session.json"
    raw = session_path.read_text(encoding="utf-8")
    payload = json.loads(raw)
    assert payload["decision_config"]["provider"] == "hosted_openai"
    assert payload["decision_config"]["model_id"] == "gpt-test"
    assert "test-secret-never-commit" not in raw
    assert "MIRROR_HOSTED_OPENAI_API_KEY" not in raw


def test_hosted_quota_hashes_identity_and_blocks_over_limit(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("MIRROR_HOSTED_DAILY_REQUEST_LIMIT", "1")
    monkeypatch.setenv("MIRROR_HOSTED_SESSION_BRANCH_LIMIT", "1")

    decision = enforce_hosted_quota(
        repo_root=tmp_path,
        user_id="invite-code-user",
        session_id="session_demo",
    )
    assert decision.user_requests_used == 1
    assert decision.session_requests_used == 1
    usage_files = list((tmp_path / "state" / "usage").glob("hosted-openai-*.json"))
    assert len(usage_files) == 1
    raw = usage_files[0].read_text(encoding="utf-8")
    assert "invite-code-user" not in raw
    assert decision.user_hash in raw

    with pytest.raises(ValueError, match="daily request limit"):
        enforce_hosted_quota(
            repo_root=tmp_path,
            user_id="invite-code-user",
            session_id="another_session",
        )
