from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
import hashlib
import json
import os
from pathlib import Path
from typing import Any

from backend.app.utils import ensure_dir, read_json, write_json


HOSTED_PROVIDER = "hosted_openai"
HOSTED_KEY_ENV = "MIRROR_HOSTED_OPENAI_API_KEY"
HOSTED_MODEL_ENV = "MIRROR_HOSTED_DECISION_MODEL"
HOSTED_BASE_URL_ENV = "MIRROR_HOSTED_OPENAI_BASE_URL"
HOSTED_ENABLED_ENV = "MIRROR_HOSTED_MODEL_ENABLED"
BETA_USER_ENV = "MIRROR_BETA_USER_ID"


@dataclass(frozen=True)
class HostedQuotaDecision:
    user_hash: str
    date: str
    user_requests_used: int
    user_requests_limit: int
    session_requests_used: int
    session_requests_limit: int

    def as_note(self) -> str:
        return (
            "Hosted quota consumed: "
            f"user={self.user_requests_used}/{self.user_requests_limit}, "
            f"session={self.session_requests_used}/{self.session_requests_limit}."
        )


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "on"}


def _int_env(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if not raw:
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError(f"`{name}` must be an integer.") from exc
    if value < 1:
        raise ValueError(f"`{name}` must be greater than zero.")
    return value


def _hash_identity(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:24]


def hosted_model_id(explicit_model_id: str | None = None) -> str | None:
    return explicit_model_id or os.environ.get(HOSTED_MODEL_ENV) or os.environ.get("MIRROR_DECISION_MODEL")


def hosted_openai_key() -> str | None:
    return os.environ.get(HOSTED_KEY_ENV)


def hosted_openai_base_url() -> str:
    return os.environ.get(HOSTED_BASE_URL_ENV) or os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")


def validate_hosted_model_access(*, model_id: str | None = None) -> str:
    if not _truthy(os.environ.get(HOSTED_ENABLED_ENV)):
        raise ValueError("Hosted model access is disabled.")
    if not hosted_openai_key():
        raise ValueError(f"Hosted model access is missing server secret `{HOSTED_KEY_ENV}`.")
    resolved_model_id = hosted_model_id(model_id)
    if not resolved_model_id:
        raise ValueError(f"Hosted model access is missing `{HOSTED_MODEL_ENV}` or `MIRROR_DECISION_MODEL`.")
    return resolved_model_id


def _usage_path(repo_root: Path) -> Path:
    date = datetime.now(UTC).strftime("%Y-%m-%d")
    return repo_root / "state" / "usage" / f"hosted-openai-{date}.json"


def _load_usage(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"date": datetime.now(UTC).strftime("%Y-%m-%d"), "users": {}}
    return dict(read_json(path))


def enforce_hosted_quota(
    *,
    repo_root: Path,
    user_id: str | None,
    session_id: str,
) -> HostedQuotaDecision:
    if not user_id:
        user_id = os.environ.get(BETA_USER_ENV)
    if not user_id:
        raise ValueError("Hosted model access requires a beta user identity.")

    user_limit = _int_env("MIRROR_HOSTED_DAILY_REQUEST_LIMIT", 20)
    session_limit = _int_env("MIRROR_HOSTED_SESSION_BRANCH_LIMIT", 8)
    user_hash = _hash_identity(user_id)
    path = _usage_path(repo_root)
    payload = _load_usage(path)
    users = payload.setdefault("users", {})
    user_record = users.setdefault(user_hash, {"request_count": 0, "sessions": {}})
    session_records = user_record.setdefault("sessions", {})
    session_record = session_records.setdefault(session_id, {"request_count": 0})

    if int(user_record["request_count"]) >= user_limit:
        raise ValueError("Hosted model daily request limit exceeded.")
    if int(session_record["request_count"]) >= session_limit:
        raise ValueError("Hosted model session branch limit exceeded.")

    user_record["request_count"] = int(user_record["request_count"]) + 1
    session_record["request_count"] = int(session_record["request_count"]) + 1
    user_record["last_seen_at"] = datetime.now(UTC).isoformat()
    session_record["last_seen_at"] = user_record["last_seen_at"]

    ensure_dir(path.parent)
    write_json(path, payload)
    return HostedQuotaDecision(
        user_hash=user_hash,
        date=str(payload["date"]),
        user_requests_used=int(user_record["request_count"]),
        user_requests_limit=user_limit,
        session_requests_used=int(session_record["request_count"]),
        session_requests_limit=session_limit,
    )
