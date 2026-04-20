from __future__ import annotations

import json
from pathlib import Path

from backend.app.config import get_settings
from backend.app.domain.models import Claim, RunTrace, TurnAction
from backend.app.safety.service import ensure_safe_report, validate_claim_payloads
from backend.app.simulation.rules import OutcomeDefinition, SimulationPlan, load_simulation_plan
from backend.app.utils import read_json, read_jsonl, slugify, write_json


def _load_summary(path: Path) -> RunTrace:
    return RunTrace.model_validate(read_json(path / "summary.json"))


def _load_actions(path: Path) -> list[TurnAction]:
    return [TurnAction.model_validate(row) for row in read_jsonl(path / "run_trace.jsonl")]


def _guess_simulation_rules_path(
    run_dir: Path,
    baseline_dir: Path | None,
    simulation_rules_path: Path | None,
) -> Path:
    if simulation_rules_path is not None:
        return simulation_rules_path

    for seed_path in [run_dir, *(run_dir.parents), *(baseline_dir.parents if baseline_dir else [])]:
        candidate = seed_path / "config" / "simulation_rules.yaml"
        if candidate.exists():
            return candidate
    return get_settings().simulation_rules_path


def _summary_outcome_value(summary: RunTrace, field: str):
    if hasattr(summary, field):
        return getattr(summary, field)
    return summary.final_state.get(field)


def _format_value(value: object) -> str:
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)


def _candidate_actions_for_outcome(
    outcome: OutcomeDefinition,
    actions: list[TurnAction],
    summary: RunTrace,
) -> list[TurnAction]:
    scoped_actions = [action for action in actions if action.action_type in outcome.action_types] or actions
    outcome_value = _summary_outcome_value(summary, outcome.field)
    if isinstance(outcome_value, int) and not isinstance(outcome_value, bool):
        exact_turns = [action for action in scoped_actions if action.turn_index == outcome_value]
        if exact_turns:
            return exact_turns
    return scoped_actions[:2]


def _claim_for_outcome(
    outcome: OutcomeDefinition,
    *,
    baseline_summary: RunTrace,
    candidate_summary: RunTrace,
    baseline_actions: list[TurnAction],
    candidate_actions: list[TurnAction],
) -> Claim:
    baseline_value = _summary_outcome_value(baseline_summary, outcome.field)
    candidate_value = _summary_outcome_value(candidate_summary, outcome.field)
    baseline_references = _candidate_actions_for_outcome(outcome, baseline_actions, baseline_summary)
    candidate_references = _candidate_actions_for_outcome(outcome, candidate_actions, candidate_summary)
    evidence_ids = sorted(
        {
            *(evidence_id for action in baseline_references for evidence_id in action.evidence_ids),
            *(evidence_id for action in candidate_references for evidence_id in action.evidence_ids),
        }
    )
    related_turn_ids = [action.turn_id for action in [*baseline_references, *candidate_references]]

    return Claim(
        claim_id=f"claim_{slugify(outcome.field)}",
        text=(
            f"Based on the current corpus and deterministic rules, {outcome.label} changed from "
            f"{_format_value(baseline_value)} in `{baseline_summary.scenario_id}` to "
            f"{_format_value(candidate_value)} in `{candidate_summary.scenario_id}`."
        ),
        label="evidence_backed",
        evidence_ids=evidence_ids,
        related_turn_ids=related_turn_ids,
        confidence_note="Directly derived from deterministic branch summaries and linked action evidence.",
    )


def _fallback_claim(candidate_summary: RunTrace, candidate_actions: list[TurnAction]) -> Claim:
    references = candidate_actions[:2]
    return Claim(
        claim_id="claim_single_branch_outcome",
        text=(
            f"Based on the current corpus and deterministic rules, `{candidate_summary.scenario_id}` stays bounded and "
            "auditable as a single deterministic branch."
        ),
        label="inferred",
        evidence_ids=sorted({evidence_id for action in references for evidence_id in action.evidence_ids}),
        related_turn_ids=[action.turn_id for action in references],
        confidence_note="Single-branch fallback summary.",
    )


def generate_report(
    run_dir: Path,
    out_dir: Path,
    baseline_dir: Path | None = None,
    *,
    simulation_rules_path: Path | None = None,
) -> list[Claim]:
    candidate_summary = _load_summary(run_dir)
    candidate_actions = _load_actions(run_dir)
    plan = load_simulation_plan(_guess_simulation_rules_path(run_dir, baseline_dir, simulation_rules_path))

    claims: list[Claim]
    key_differences: list[str]
    scenario_line: str

    if baseline_dir is not None:
        baseline_summary = _load_summary(baseline_dir)
        baseline_actions = _load_actions(baseline_dir)
        changed_outcomes = [
            outcome
            for outcome in plan.tracked_outcomes
            if _summary_outcome_value(baseline_summary, outcome.field)
            != _summary_outcome_value(candidate_summary, outcome.field)
        ]
        selected_outcomes = changed_outcomes[:3] or plan.tracked_outcomes[:1]
        claims = [
            _claim_for_outcome(
                outcome,
                baseline_summary=baseline_summary,
                candidate_summary=candidate_summary,
                baseline_actions=baseline_actions,
                candidate_actions=candidate_actions,
            )
            for outcome in selected_outcomes
        ]
        key_differences = [
            f"- {outcome.label}: baseline {_format_value(_summary_outcome_value(baseline_summary, outcome.field))}, "
            f"candidate {_format_value(_summary_outcome_value(candidate_summary, outcome.field))}"
            for outcome in selected_outcomes
        ]
        scenario_line = (
            f"Comparing `{baseline_summary.scenario_id}` with `{candidate_summary.scenario_id}` under seed "
            f"{candidate_summary.seed} in world `{plan.world_id}`."
        )
    else:
        claims = [_fallback_claim(candidate_summary, candidate_actions)]
        key_differences = [
            f"- {outcome.label}: {_format_value(_summary_outcome_value(candidate_summary, outcome.field))}"
            for outcome in plan.tracked_outcomes[:3]
        ]
        scenario_line = (
            f"Scenario `{candidate_summary.scenario_id}` under seed {candidate_summary.seed} in world `{plan.world_id}`."
        )

    claim_payloads = [claim.model_dump() for claim in claims]
    validate_claim_payloads(claim_payloads)
    claim_rows = "\n".join(
        f"| {claim.claim_id} | {claim.label} | {', '.join(claim.evidence_ids)} | {claim.text} |"
        for claim in claims
    )
    action_chain = "\n".join(
        f"- T{action.turn_index}: `{action.actor_id}` performs `{action.action_type}`"
        + (f" toward `{action.target_id}`." if action.target_id else ".")
        for action in candidate_actions[:4]
    )
    report = "\n".join(
        [
            "# Mirror Report",
            "",
            "## 1. Scenario",
            scenario_line,
            "",
            "## 2. Key Differences",
            *key_differences,
            "",
            "## 3. Key Action Chain",
            action_chain,
            "",
            "## 4. Result Summary",
            f"- Final state: {candidate_summary.final_state}",
            "",
            "## 5. Uncertainties",
            "- This report describes a bounded simulation branch, not a claim about the real world.",
            "- Outcome deltas remain constrained to the explicit corpus, rules, and injected disturbances in this world.",
            "",
            "## 6. Claim Table",
            "| Claim ID | Label | Evidence IDs | Text |",
            "|---|---|---|---|",
            claim_rows,
            "",
            "## 7. Evidence And Reasoning Labels",
            "- `evidence_backed`: direct branch facts visible in run artifacts.",
            "- `inferred`: bounded conclusions drawn from deterministic branch artifacts.",
            "- `speculative`: reserved for narrative extensions outside direct branch proof.",
        ]
    )
    ensure_safe_report(report)
    write_json(out_dir / "claims.json", claim_payloads)
    (out_dir / "report.md").write_text(report + "\n", encoding="utf-8")
    return claims
