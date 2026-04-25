import type { DecisionSummary, RubricRow } from "./types";

export function formatDecisionLabel(score: number | null) {
  return score === null ? "unscored" : `${score}/5`;
}

export function currentAnchor(row: RubricRow, score: number | null) {
  if (score === null) {
    return "Select a score to anchor this worksheet row.";
  }
  if (score <= 2) {
    return row.one;
  }
  if (score === 3) {
    return row.three;
  }
  return row.five;
}

export function decisionFromScores(
  scores: Record<string, number | null>,
  totalRows: number
): DecisionSummary {
  const selectedScores = Object.values(scores).filter((value): value is number => value !== null);
  if (selectedScores.length < totalRows) {
    return {
      label: "worksheet incomplete",
      tone: "incomplete",
      summary: "Finish scoring every rubric dimension before making a sign-off recommendation.",
      average: "pending"
    };
  }

  const average = selectedScores.reduce((sum, value) => sum + value, 0) / selectedScores.length;
  const minimum = Math.min(...selectedScores);

  if (average >= 4 && minimum >= 3) {
    return {
      label: "ready to sign off",
      tone: "ready",
      summary: "Evidence boundaries and branch replay look strong enough to move toward sign-off.",
      average: average.toFixed(1)
    };
  }

  if (average >= 3 && minimum >= 2) {
    return {
      label: "needs targeted follow-up",
      tone: "followup",
      summary: "The review is broadly usable, but at least one rubric dimension still needs focused cleanup before sign-off.",
      average: average.toFixed(1)
    };
  }

  return {
    label: "hold and revise",
    tone: "hold",
    summary: "The current branch still reads as too risky or too hard to replay for sign-off. Rework the weakest dimensions first.",
    average: average.toFixed(1)
  };
}

export function recommendationFromState(
  decision: DecisionSummary,
  unscoredDimensions: RubricRow[],
  weakDimensions: RubricRow[]
) {
  if (unscoredDimensions.length > 0) {
    return "Complete the remaining rubric dimensions before handing this branch off for sign-off or escalation.";
  }

  if (decision.tone === "ready") {
    return "Carry the current packet forward, ask for sign-off, and preserve the claim and timeline evidence as the operator replay path.";
  }

  if (decision.tone === "followup") {
    return `Run one focused cleanup pass on ${weakDimensions.map((row) => row.dimension).join(", ")} and replay the highlighted divergent turns before requesting sign-off.`;
  }

  return `Pause sign-off and treat the branch as an active revision lane until ${weakDimensions.map((row) => row.dimension).join(", ")} reads as evidence-grounded and replayable.`;
}
