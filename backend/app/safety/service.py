from __future__ import annotations

import json
from typing import Any


BLOCKED_TOPIC_TERMS = [
    "political persuasion",
    "political influence",
    "voter persuasion",
    "voter targeting",
    "real voters",
    "law enforcement scoring",
    "suspect scoring",
    "hiring score",
    "social credit",
    "credit score",
    "medical diagnosis",
    "judicial prediction",
    "real person persona",
    "real-person persona",
    "real person profile",
    "real-person profile",
    "real person digital twin",
    "real-person digital twin",
    "digital twin",
    "digital double",
    "surveillance scrape",
    "real-world prediction",
    "real world prediction",
    "predict real-world",
    "real city tomorrow",
    "high-risk decision",
    "hidden surveillance",
    "政治劝服",
    "政治说服",
    "政治影响",
    "选民说服",
    "选民定向",
    "真实选民",
    "执法评分",
    "嫌疑评分",
    "招聘评分",
    "招聘打分",
    "社会信用",
    "信用评分",
    "医疗诊断",
    "司法预测",
    "真人画像",
    "真人档案",
    "真人分身",
    "真人数字孪生",
    "真人数字分身",
    "数字孪生",
    "数字分身",
    "数字替身",
    "监控抓取",
    "隐蔽监控",
    "真实世界",
    "现实世界",
    "现实预测",
    "高风险决策",
]

BLOCKED_REPORT_TOPIC_TERMS = [
    "political persuasion",
    "political influence",
    "voter persuasion",
    "voter targeting",
    "real voters",
    "law enforcement scoring",
    "suspect scoring",
    "hiring score",
    "social credit",
    "credit score",
    "medical diagnosis",
    "judicial prediction",
    "real person persona",
    "real-person persona",
    "real person profile",
    "real-person profile",
    "real person digital twin",
    "real-person digital twin",
    "digital twin",
    "digital double",
    "surveillance scrape",
    "real-world prediction",
    "real world prediction",
    "predict real-world",
    "real city tomorrow",
    "high-risk decision",
    "hidden surveillance",
    "政治劝服",
    "政治说服",
    "政治影响",
    "选民说服",
    "选民定向",
    "真实选民",
    "执法评分",
    "嫌疑评分",
    "招聘评分",
    "招聘打分",
    "社会信用",
    "信用评分",
    "医疗诊断",
    "司法预测",
    "真人画像",
    "真人档案",
    "真人分身",
    "真人数字孪生",
    "真人数字分身",
    "数字孪生",
    "数字分身",
    "数字替身",
    "监控抓取",
    "隐蔽监控",
    "现实预测",
    "高风险决策",
]

BLOCKED_REPORT_PHRASES = [
    "predicts " "the future",
    "system proves",
    "system guarantees",
    "establishes with certainty",
    "with certainty how the real world",
    "real world will",
    "real world changes tomorrow",
    "精确推断",
    "真实世界将会",
    "现实世界将会",
    "现实世界明天会",
    "系统证明",
    "系统保证",
    "确定结论",
    "现实里一定会",
    "证明真实社会",
    "证明现实世界",
    "真实社会必然",
    "现实世界一定",
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


def ensure_safe_world_template_payload(payload: Any) -> None:
    hits = _find_hits(_stringify(payload), BLOCKED_TOPIC_TERMS)
    if hits:
        raise ValueError(f"Unsafe world template payload: {hits}")


def ensure_safe_report(text: str) -> None:
    hits = [
        *_find_hits(text, BLOCKED_REPORT_TOPIC_TERMS),
        *_find_hits(text, BLOCKED_REPORT_PHRASES),
    ]
    if hits:
        raise ValueError(f"Unsafe report phrasing: {hits}")


def validate_claim_payloads(claims: list[dict[str, Any]]) -> None:
    for claim in claims:
        if not claim.get("label"):
            raise ValueError(f"Claim missing label: {claim.get('claim_id')}")
        if not claim.get("evidence_ids"):
            raise ValueError(f"Claim missing evidence_ids: {claim.get('claim_id')}")
        if claim.get("text"):
            try:
                ensure_safe_report(str(claim["text"]))
            except ValueError as exc:
                raise ValueError(f"Unsafe claim text: {claim.get('claim_id')}: {exc}") from exc
