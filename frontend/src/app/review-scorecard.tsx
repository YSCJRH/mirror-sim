"use client";

import { useState } from "react";

type RubricRow = {
  dimension: string;
  one: string;
  three: string;
  five: string;
};

type ReviewScorecardProps = {
  rubricRows: RubricRow[];
  claimCount: number;
  divergentTurnCount: number;
  evalName: string;
  evalStatus: string;
  claimPackets: Array<{
    claimId: string;
    text: string;
    relatedTurnIds: string[];
  }>;
  divergentTurns: Array<{
    turnIndex: number;
    baselineTurnId: string | null;
    baselineAction: string | null;
    interventionTurnId: string | null;
    interventionAction: string | null;
  }>;
};

const scoreOptions = [1, 2, 3, 4, 5] as const;

function formatDecisionLabel(score: number | null) {
  return score === null ? "unscored" : `${score}/5`;
}

function currentAnchor(row: RubricRow, score: number | null) {
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

function decisionFromScores(
  scores: Record<string, number | null>,
  totalRows: number
): {
  label: string;
  tone: "incomplete" | "ready" | "followup" | "hold";
  summary: string;
  average: string;
} {
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

export function ReviewScorecard({
  rubricRows,
  claimCount,
  divergentTurnCount,
  evalName,
  evalStatus,
  claimPackets,
  divergentTurns
}: ReviewScorecardProps) {
  const [scores, setScores] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(rubricRows.map((row) => [row.dimension, null]))
  );
  const [notes, setNotes] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const filledCount = Object.values(scores).filter((value) => value !== null).length;
  const decision = decisionFromScores(scores, rubricRows.length);
  const weakDimensions = rubricRows.filter((row) => {
    const score = scores[row.dimension];
    return score !== null && score < 3;
  });
  const packetMarkdown = [
    "# Mirror Review Packet",
    "",
    "## Current Summary",
    `- Eval: ${evalName} (${evalStatus})`,
    `- Claims reviewed: ${claimCount}`,
    `- Divergent turns: ${divergentTurnCount}`,
    `- Provisional sign-off: ${decision.label}`,
    `- Scorecard coverage: ${filledCount}/${rubricRows.length} dimensions scored`,
    "",
    "## Rubric Scorecard",
    ...rubricRows.map((row) => `- ${row.dimension}: ${formatDecisionLabel(scores[row.dimension])}`),
    "",
    "## Claim Packet",
    ...claimPackets.flatMap((claim) => [
      `- ${claim.claimId}: ${claim.text}`,
      `  - related turns: ${claim.relatedTurnIds.length > 0 ? claim.relatedTurnIds.join(", ") : "none"}`
    ]),
    "",
    "## Divergent Turn Packet",
    ...(divergentTurns.length > 0
      ? divergentTurns.map(
          (turn) =>
            `- Turn ${turn.turnIndex}: baseline ${turn.baselineTurnId ?? "none"} (${turn.baselineAction ?? "none"}) vs intervention ${turn.interventionTurnId ?? "none"} (${turn.interventionAction ?? "none"})`
        )
      : ["- No divergent turns highlighted in the current packet."]),
    "",
    "## Rubric Context",
    ...rubricRows.flatMap((row) => [
      `- ${row.dimension}`,
      `  - 1: ${row.one}`,
      `  - 3: ${row.three}`,
      `  - 5: ${row.five}`
    ]),
    "",
    "## Reviewer Notes",
    notes.trim() ? notes : "- No reviewer notes captured yet."
  ].join("\n");

  return (
    <section className="panel panelAccent">
      <div className="panelHeader">
        <p className="eyebrow">Reviewer Sign-Off</p>
        <h2>Turn the rubric into a live scorecard and a provisional sign-off worksheet.</h2>
        <p>
          This worksheet stays frontend-only: it reads the current demo artifacts, accepts reviewer input,
          and generates a sign-off view without creating new saved files.
        </p>
      </div>

      <div className="reviewColumns">
        <div className="reviewScoreGrid">
          {rubricRows.map((row) => {
            const selectedScore = scores[row.dimension];
            return (
              <article key={row.dimension} className="scoreCard">
                <div className="claimHeader">
                  <strong>{row.dimension}</strong>
                  <span className="pill">{formatDecisionLabel(selectedScore)}</span>
                </div>
                <div className="scoreAnchors">
                  <p>
                    <strong>1</strong>: {row.one}
                  </p>
                  <p>
                    <strong>3</strong>: {row.three}
                  </p>
                  <p>
                    <strong>5</strong>: {row.five}
                  </p>
                </div>
                <div className="scoreButtons">
                  {scoreOptions.map((score) => (
                    <button
                      key={score}
                      type="button"
                      className={`scoreButton${selectedScore === score ? " scoreButtonActive" : ""}`}
                      onClick={() =>
                        setScores((current) => ({
                          ...current,
                          [row.dimension]: score
                        }))
                      }
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <p className="scoreHint">{currentAnchor(row, selectedScore)}</p>
              </article>
            );
          })}
        </div>

        <div className="reviewSidebar">
          <article className="worksheetCard">
            <div className="artifactMeta">
              <span>worksheet</span>
              <code>{filledCount}/{rubricRows.length} dimensions scored</code>
            </div>
            <div className="claimHeader">
              <strong>Provisional decision</strong>
              <span className={`statusPill statusPill${decision.tone}`}>
                {decision.label}
              </span>
            </div>
            <p>{decision.summary}</p>

            <div className="metricGrid">
              <div className="metricCard">
                <span>eval</span>
                <strong>{evalStatus}</strong>
              </div>
              <div className="metricCard">
                <span>claims</span>
                <strong>{claimCount}</strong>
              </div>
              <div className="metricCard">
                <span>divergent turns</span>
                <strong>{divergentTurnCount}</strong>
              </div>
              <div className="metricCard">
                <span>average</span>
                <strong>{decision.average}</strong>
              </div>
            </div>

            <ul className="checklist compact">
              <li>Eval source: `{evalName}`</li>
              {rubricRows.map((row) => (
                <li key={row.dimension}>
                  {row.dimension}: {formatDecisionLabel(scores[row.dimension])}
                </li>
              ))}
            </ul>

            <div className="worksheetNotes">
              <h3>Reviewer notes snapshot</h3>
              <p>{notes.trim() ? notes : "No reviewer notes captured yet."}</p>
            </div>

            {weakDimensions.length > 0 ? (
              <div className="worksheetFollowup">
                <h3>Follow-up focus</h3>
                <p>
                  Revisit: {weakDimensions.map((row) => row.dimension).join(", ")}.
                </p>
              </div>
            ) : null}
          </article>

          <article className="artifactCard reviewerNotesCard">
            <div className="artifactMeta">
              <span>notes</span>
              <code>reviewer workspace</code>
            </div>
            <label className="noteLabel" htmlFor="reviewer-notes">
              Reviewer notes
            </label>
            <textarea
              id="reviewer-notes"
              className="notesField"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Capture the strongest evidence boundary, the weakest rubric dimension, and whether the branch is ready to sign off."
            />
          </article>

          <article className="artifactCard packetCard">
            <div className="artifactMeta">
              <span>packet</span>
              <code>frontend-derived markdown</code>
            </div>
            <div className="claimHeader">
              <strong>Shareable review packet</strong>
              <button
                type="button"
                className="actionButton"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(packetMarkdown);
                    setCopyState("copied");
                  } catch {
                    setCopyState("failed");
                  }
                }}
              >
                Copy markdown packet
              </button>
            </div>
            <p className="scoreHint">
              This packet packages claim IDs, divergent turn IDs, rubric context, and the current worksheet summary
              without creating any new artifact files.
            </p>
            <textarea className="packetField" readOnly value={packetMarkdown} />
            <p className="scoreHint">
              {copyState === "copied"
                ? "Packet copied to clipboard."
                : copyState === "failed"
                  ? "Clipboard copy failed. You can still copy from the packet field."
                  : "Use this field as the handoff-ready packet for reviewers or follow-on product work."}
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
