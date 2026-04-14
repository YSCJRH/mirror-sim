from __future__ import annotations

from pathlib import Path

from backend.app.domain.models import Claim, RunTrace, TurnAction
from backend.app.safety.service import ensure_safe_report, validate_claim_payloads
from backend.app.utils import read_json, read_jsonl, write_json


def _load_summary(path: Path) -> RunTrace:
    return RunTrace.model_validate(read_json(path / "summary.json"))


def _load_actions(path: Path) -> list[TurnAction]:
    return [TurnAction.model_validate(row) for row in read_jsonl(path / "run_trace.jsonl")]


def _first_action(actions: list[TurnAction], action_type: str) -> TurnAction | None:
    for action in actions:
        if action.action_type == action_type:
            return action
    return None


def generate_report(run_dir: Path, out_dir: Path, baseline_dir: Path | None = None) -> list[Claim]:
    candidate_summary = _load_summary(run_dir)
    candidate_actions = _load_actions(run_dir)

    claims: list[Claim]
    if baseline_dir is not None:
        baseline_summary = _load_summary(baseline_dir)
        baseline_actions = _load_actions(baseline_dir)
        baseline_publish = _first_action(baseline_actions, "publish")
        candidate_publish = _first_action(candidate_actions, "publish")
        baseline_evacuate = _first_action(baseline_actions, "evacuate")
        candidate_evacuate = _first_action(candidate_actions, "evacuate")
        candidate_hide = _first_action(candidate_actions, "hide")

        claims = [
            Claim(
                claim_id="claim_ledger_delay",
                text=(
                    f"Based on the current corpus and rules, the maintenance ledger reached the public decision loop on "
                    f"turn {candidate_summary.ledger_public_turn} instead of turn {baseline_summary.ledger_public_turn}."
                ),
                label="evidence_backed",
                evidence_ids=sorted(
                    {
                        *(baseline_publish.evidence_ids if baseline_publish else []),
                        *(candidate_publish.evidence_ids if candidate_publish else []),
                    }
                ),
                related_turn_ids=[
                    baseline_publish.turn_id if baseline_publish else "",
                    candidate_publish.turn_id if candidate_publish else "",
                ],
                confidence_note="Directly derived from the deterministic run summaries.",
            ),
            Claim(
                claim_id="claim_festival_pressure",
                text=(
                    "In this scenario branch, Zhao Ke kept the festival on schedule longer because documentary pressure "
                    "had not surfaced by the time he first chose between disruption and concealment."
                ),
                label="inferred",
                evidence_ids=sorted(
                    {
                        *(candidate_hide.evidence_ids if candidate_hide else []),
                        *(candidate_publish.evidence_ids if candidate_publish else []),
                    }
                ),
                related_turn_ids=[
                    candidate_hide.turn_id if candidate_hide else "",
                    candidate_publish.turn_id if candidate_publish else "",
                ],
                confidence_note="Inferred from the candidate hide action and the later publish turn.",
            ),
            Claim(
                claim_id="claim_evacuation_delay",
                text=(
                    f"In this scenario branch, evacuation moved from turn {baseline_summary.evacuation_turn} to "
                    f"turn {candidate_summary.evacuation_turn}, shrinking the response window before storm arrival."
                ),
                label="inferred",
                evidence_ids=sorted(
                    {
                        *(baseline_evacuate.evidence_ids if baseline_evacuate else []),
                        *(candidate_evacuate.evidence_ids if candidate_evacuate else []),
                    }
                ),
                related_turn_ids=[
                    baseline_evacuate.turn_id if baseline_evacuate else "",
                    candidate_evacuate.turn_id if candidate_evacuate else "",
                ],
                confidence_note="Derived from branch comparison of deterministic evacuation turns.",
            ),
        ]

        key_differences = [
            f"- Ledger publish turn: baseline {baseline_summary.ledger_public_turn}, candidate {candidate_summary.ledger_public_turn}",
            f"- Evacuation turn: baseline {baseline_summary.evacuation_turn}, candidate {candidate_summary.evacuation_turn}",
            f"- Festival status at end: baseline {baseline_summary.final_state['festival_status']}, candidate {candidate_summary.final_state['festival_status']}",
        ]
        scenario_line = f"Comparing `{baseline_summary.scenario_id}` with `{candidate_summary.scenario_id}` under seed {candidate_summary.seed}."
    else:
        publish_action = _first_action(candidate_actions, "publish")
        evacuate_action = _first_action(candidate_actions, "evacuate")
        claims = [
            Claim(
                claim_id="claim_single_branch_outcome",
                text="Based on the current corpus and rules, the branch exposes the maintenance issue before final storm arrival.",
                label="inferred",
                evidence_ids=sorted(
                    {
                        *(publish_action.evidence_ids if publish_action else []),
                        *(evacuate_action.evidence_ids if evacuate_action else []),
                    }
                ),
                related_turn_ids=[
                    publish_action.turn_id if publish_action else "",
                    evacuate_action.turn_id if evacuate_action else "",
                ],
                confidence_note="Single-branch summary.",
            )
        ]
        key_differences = [f"- Final festival status: {candidate_summary.final_state['festival_status']}"]
        scenario_line = f"Scenario `{candidate_summary.scenario_id}` under seed {candidate_summary.seed}."

    claim_payloads = [claim.model_dump() for claim in claims]
    validate_claim_payloads(claim_payloads)
    claim_rows = "\n".join(
        f"| {claim.claim_id} | {claim.label} | {', '.join(claim.evidence_ids)} | {claim.text} |" for claim in claims
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
            "- Su He inspects the gate and escalates pressure through a bounded turn sequence.",
            "- Lin Lan either publishes the ledger on time or loses turns to the document delay.",
            "- Zhao Ke reacts to visible evidence rather than free-form agent improvisation.",
            "",
            "## 4. Result Summary",
            f"- Final state: {candidate_summary.final_state}",
            "",
            "## 5. Uncertainties",
            "- This report describes a bounded simulation branch, not a claim about the real world.",
            "- Communication side effects outside the scripted action set remain speculative.",
            "",
            "## 6. Claim Table",
            "| Claim ID | Label | Evidence IDs | Text |",
            "|---|---|---|---|",
            claim_rows,
            "",
            "## 7. Evidence And Reasoning Labels",
            "- `evidence_backed`: direct branch facts visible in run artifacts.",
            "- `inferred`: comparison logic derived from the deterministic branch artifacts.",
            "- `speculative`: reserved for narrative extensions outside direct branch proof.",
        ]
    )
    ensure_safe_report(report)
    write_json(out_dir / "claims.json", claim_payloads)
    (out_dir / "report.md").write_text(report + "\n", encoding="utf-8")
    return claims
