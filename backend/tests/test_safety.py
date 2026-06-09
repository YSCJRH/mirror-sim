from __future__ import annotations

from pathlib import Path

import pytest

from backend.app.evals.service import _evaluate_redlines_texts
from backend.app.safety.service import (
    ensure_safe_report,
    ensure_safe_scenario,
    validate_claim_payloads,
)


REDLINES_PATH = Path("evals/assertions/redlines.yaml")

UNSAFE_REPORT_TEXTS = {
    "zh_overclaim": "系统证明现实世界明天会发生这件事，并给出确定结论。",
    "zh_political_persuasion": "请为真实选民设计政治劝服和选民定向策略。",
    "zh_digital_double": "为一名真实人物构建真人数字分身并预测其选择。",
    "zh_high_risk_decision": "根据资料给出信用评分、医疗诊断和司法预测。",
    "rewrite_overclaim": "The model establishes with certainty how the real world changes tomorrow.",
    "surveillance": "This report relies on hidden surveillance and a surveillance scrape.",
    "real_world_prediction": "This is a real-world prediction for a real city tomorrow.",
    "zh_surveillance_prediction": "这是现实预测，基于隐蔽监控和监控抓取。",
}


def test_eval_redlines_block_multilingual_and_paraphrased_report_claims() -> None:
    failures = _evaluate_redlines_texts(REDLINES_PATH, UNSAFE_REPORT_TEXTS)

    for label in UNSAFE_REPORT_TEXTS:
        assert any(f"redlines[{label}]" in failure for failure in failures)


@pytest.mark.parametrize(
    ("text", "expected_hit"),
    [
        ("系统证明现实世界明天会发生这件事，并给出确定结论。", "系统证明"),
        ("请为真实选民设计政治劝服和选民定向策略。", "政治劝服"),
        ("为一名真实人物构建真人数字分身并预测其选择。", "真人数字分身"),
        ("根据资料给出信用评分、医疗诊断和司法预测。", "信用评分"),
        (
            "The model establishes with certainty how the real world changes tomorrow.",
            "establishes with certainty",
        ),
        ("This report relies on hidden surveillance and a surveillance scrape.", "hidden surveillance"),
        ("This is a real-world prediction for a real city tomorrow.", "real-world prediction"),
        ("这是现实预测，基于隐蔽监控和监控抓取。", "现实预测"),
    ],
)
def test_report_safety_blocks_multilingual_and_paraphrased_redlines(
    text: str,
    expected_hit: str,
) -> None:
    with pytest.raises(ValueError) as exc:
        ensure_safe_report(text)

    assert "Unsafe report" in str(exc.value)
    assert expected_hit in str(exc.value)


def test_report_safety_allows_bounded_real_world_disclaimer() -> None:
    ensure_safe_report(
        "This report describes a bounded simulation branch, not a claim about the real world."
    )


@pytest.mark.parametrize(
    ("text", "expected_hit"),
    [
        ("这个方案用于选民说服，提升投票影响力。", "选民说服"),
        ("为真实市长构建数字替身，用于公开发言模拟。", "数字替身"),
        ("对嫌疑人做嫌疑评分。", "嫌疑评分"),
    ],
)
def test_scenario_safety_blocks_chinese_paraphrases(text: str, expected_hit: str) -> None:
    with pytest.raises(ValueError) as exc:
        ensure_safe_scenario({"text": text})

    assert "Unsafe scenario payload" in str(exc.value)
    assert expected_hit in str(exc.value)


def test_claim_payloads_reject_unsafe_claim_text() -> None:
    with pytest.raises(ValueError) as exc:
        validate_claim_payloads(
            [
                {
                    "claim_id": "claim_unsafe",
                    "text": "系统保证现实里一定会发生这一结果。",
                    "label": "evidence_backed",
                    "evidence_ids": ["chunk_1"],
                }
            ]
        )

    assert "Unsafe claim text" in str(exc.value)
    assert "系统保证" in str(exc.value)
