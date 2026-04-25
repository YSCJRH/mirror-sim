from __future__ import annotations

import json
from typing import Any


BLOCKED_TOPIC_TERMS = [
    "political persuasion",
    "voter targeting",
    "law enforcement scoring",
    "social credit",
    "credit score",
    "medical diagnosis",
    "judicial prediction",
    "real person persona",
    "surveillance scrape",
]

BLOCKED_REPORT_PHRASES = [
    "predicts " "the future",
    "system proves",
    "real world will",
    "精确推断",
    "真实世界将会",
]


def _stringify(payload: Any) -> str:
    if isinstance(payload, str):
        return payload
    return json.dumps(payload, ensure_ascii=False, sort_keys=True)


def _find_hits(text: str, terms: list[str]) -> list[str]:
    lowered = text.lower()
    return [term for term in terms if term.lower() in lowered]


def ensure_safe_demo_text(text: str, *, context: str) -> None:
    hits = _find_hits(text, BLOCKED_TOPIC_TERMS)
    if hits:
        raise ValueError(f"Unsafe demo text in {context}: {hits}")


def ensure_safe_scenario(payload: Any) -> None:
    hits = _find_hits(_stringify(payload), BLOCKED_TOPIC_TERMS)
    if hits:
        raise ValueError(f"Unsafe scenario payload: {hits}")


def ensure_safe_report(text: str) -> None:
    hits = _find_hits(text, BLOCKED_REPORT_PHRASES)
    if hits:
        raise ValueError(f"Unsafe report phrasing: {hits}")


def validate_claim_payloads(claims: list[dict[str, Any]]) -> None:
    for claim in claims:
        if not claim.get("label"):
            raise ValueError(f"Claim missing label: {claim.get('claim_id')}")
        if not claim.get("evidence_ids"):
            raise ValueError(f"Claim missing evidence_ids: {claim.get('claim_id')}")
