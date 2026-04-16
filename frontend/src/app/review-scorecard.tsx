"use client";

import { useState } from "react";

type RubricRow = {
  dimension: string;
  one: string;
  three: string;
  five: string;
};

type DecisionSummary = {
  label: string;
  tone: "incomplete" | "ready" | "followup" | "hold";
  summary: string;
  average: string;
};

type ClaimPacket = {
  claimId: string;
  text: string;
  relatedTurnIds: string[];
};

type DivergentTurn = {
  turnIndex: number;
  baselineTurnId: string | null;
  baselineAction: string | null;
  interventionTurnId: string | null;
  interventionAction: string | null;
};

type PickupLane = "lane:auto-safe" | "lane:protected-core";

type LaneRoute = {
  summary: string;
  checklist: string[];
  reviewPath: string[];
};

type ExportSurfaceId =
  | "decision-brief"
  | "review-packet"
  | "issue-comment"
  | "closeout-packet"
  | "pickup-routing";

type ExportSurface = {
  label: string;
  destination: string;
  summary: string;
  targetId: string;
};

type DeliveryReadiness = {
  label: string;
  tone: "incomplete" | "ready" | "followup" | "hold";
  summary: string;
  warnings: string[];
  readyItems: string[];
};

type ReviewScorecardProps = {
  rubricRows: RubricRow[];
  claimCount: number;
  divergentTurnCount: number;
  evalName: string;
  evalStatus: string;
  claimPackets: ClaimPacket[];
  divergentTurns: DivergentTurn[];
};

const scoreOptions = [1, 2, 3, 4, 5] as const;
const closeoutValidationCommands = [
  "npm run build --prefix frontend",
  "./make.ps1 smoke",
  "./make.ps1 test",
  "./make.ps1 eval-demo",
  "python -m backend.app.cli audit-phase phase1",
  "python -m backend.app.cli audit-phase phase2",
  "python -m backend.app.cli audit-phase phase3"
] as const;
const postMergeCheckpointCommands = [
  "./make.ps1 smoke",
  "./make.ps1 test",
  "./make.ps1 eval-demo",
  "python -m backend.app.cli audit-phase phase1",
  "python -m backend.app.cli audit-phase phase2",
  "python -m backend.app.cli audit-phase phase3",
  "python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim"
] as const;
const laneRoutes: Record<PickupLane, LaneRoute> = {
  "lane:auto-safe": {
    summary: "Use the safe-lane route when the change stays outside protected-core files and can merge after standard checks with no blocking labels.",
    checklist: [
      "Run audit-github-queue and confirm exactly one active milestone still reports ready.",
      "Pick the earliest open status:ready issue and keep a single writer on it.",
      "Create an isolated worktree named wt/<phase>-<topic> before editing.",
      "Classify the diff before opening the PR and keep it inside safe-lane surfaces.",
      "Re-run local smoke, test, and eval checks when the workbench or demo readers change."
    ],
    reviewPath: [
      "Open the PR once checks are ready and the issue handoff copy is prepared.",
      "Allow merge only after required checks are green and no blocking labels remain.",
      "Do not widen the diff into queue governance, templates, contracts, or other protected-core paths mid-flight."
    ]
  },
  "lane:protected-core": {
    summary: "Use the protected-core route when queue governance, templates, contracts, CI, or operating docs are touched and the work cannot rely on auto-merge.",
    checklist: [
      "Run audit-github-queue and confirm the active milestone still reports ready before pickup.",
      "Create one dedicated worktree for the issue and avoid multi-writer overlap on the same core surface.",
      "Classify the diff early and keep explicit protected-core framing in the PR summary.",
      "Re-run local smoke, test, eval-demo, and phase audits when governance, CI, or runbook logic changes.",
      "Keep the issue or closeout packet attached so review context stays visible during protected-core review."
    ],
    reviewPath: [
      "Open the PR with explicit protected-core framing and do not auto-merge.",
      "Require an explicit review pass before merge when templates, contracts, queue rules, or operating docs are involved.",
      "If the queue becomes paused or fail after merge, stop pickup and repair the milestone, exit gate, or label structure before continuing."
    ]
  }
};
const exportSurfaces: Record<ExportSurfaceId, ExportSurface> = {
  "decision-brief": {
    label: "Decision brief",
    destination: "Use for a concise operator handoff summary or a fast status checkpoint.",
    summary: "Carries the current recommendation, blockers, next actions, and evidence anchors in a compact form.",
    targetId: "decision-brief-export"
  },
  "review-packet": {
    label: "Review packet",
    destination: "Use for broader reviewer or product follow-up context when the full packet is still helpful.",
    summary: "Includes claims, divergent turns, rubric context, and the current worksheet state in the widest export surface.",
    targetId: "review-packet-export"
  },
  "issue-comment": {
    label: "Issue comment packet",
    destination: "Use for a PR or issue comment when the next operator needs GitHub-ready handoff copy.",
    summary: "Compresses the handoff into comment-ready markdown without requiring manual reformatting.",
    targetId: "issue-comment-export"
  },
  "closeout-packet": {
    label: "Closeout packet",
    destination: "Use for an exit gate or milestone closeout note when validation and sign-off posture need to travel together.",
    summary: "Packages sign-off posture, trusted validation commands, evidence anchors, blockers, and reviewer notes for closeout.",
    targetId: "closeout-packet-export"
  },
  "pickup-routing": {
    label: "Pickup routing",
    destination: "Use for the next operator pickup when lane-specific merge and checkpoint rules need to stay visible.",
    summary: "Maps the current review state onto safe-lane or protected-core pickup, merge, and post-merge steps.",
    targetId: "pickup-routing-export"
  }
};

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

function recommendationFromState(
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

function buildNextActions(
  decision: DecisionSummary,
  unscoredDimensions: RubricRow[],
  weakDimensions: RubricRow[],
  divergentTurns: DivergentTurn[],
  claimPackets: ClaimPacket[],
  notes: string
) {
  const actions: string[] = [];

  if (unscoredDimensions.length > 0) {
    actions.push(`Score the remaining rubric dimensions: ${unscoredDimensions.map((row) => row.dimension).join(", ")}.`);
  }

  if (weakDimensions.length > 0) {
    actions.push(`Rework the weakest dimensions first: ${weakDimensions.map((row) => row.dimension).join(", ")}.`);
  }

  if (divergentTurns.length > 0) {
    actions.push(`Replay divergent turns ${divergentTurns.slice(0, 3).map((turn) => turn.turnIndex).join(", ")} to confirm the branch comparison still supports the recommendation.`);
  } else {
    actions.push("Keep the current baseline and intervention timeline comparison attached as the operator replay path.");
  }

  if (claimPackets.length > 0) {
    actions.push(`Carry forward claim IDs ${claimPackets.slice(0, 3).map((claim) => claim.claimId).join(", ")} as the minimum evidence packet for the next operator.`);
  }

  if (decision.tone === "ready") {
    actions.push("Paste the issue comment packet into the next PR or issue touchpoint so sign-off context stays attached to the branch.");
  }

  if (!notes.trim()) {
    actions.push("Add a concise reviewer note that names the strongest evidence boundary before handoff.");
  }

  return actions;
}

function buildBlockers(
  decision: DecisionSummary,
  unscoredDimensions: RubricRow[],
  weakDimensions: RubricRow[],
  notes: string
) {
  const blockers: string[] = [];

  if (unscoredDimensions.length > 0) {
    blockers.push(`The worksheet is still incomplete across ${unscoredDimensions.length} dimension(s).`);
  }

  if (weakDimensions.length > 0) {
    blockers.push(`The lowest-confidence dimensions are ${weakDimensions.map((row) => row.dimension).join(", ")}.`);
  }

  if (decision.tone !== "ready") {
    blockers.push(`Current sign-off posture is ${decision.label}, so this branch should not be presented as fully cleared yet.`);
  }

  if (!notes.trim()) {
    blockers.push("Reviewer notes are still empty, which weakens the operator handoff context.");
  }

  return blockers.length > 0
    ? blockers
    : ["No blocking issues surfaced in the current frontend-only review state."];
}

function buildCarryForwardAnchors(claimPackets: ClaimPacket[], divergentTurns: DivergentTurn[]) {
  const anchors = claimPackets.slice(0, 3).map((claim) => {
    const relatedTurns = claim.relatedTurnIds.length > 0 ? claim.relatedTurnIds.join(", ") : "no related turns";
    return `${claim.claimId}: keep with ${relatedTurns}.`;
  });

  if (divergentTurns.length > 0) {
    anchors.push(
      `Replay turn ${divergentTurns
        .slice(0, 2)
        .map((turn) => turn.turnIndex)
        .join(" and ")} when the next operator needs to verify the baseline/intervention split.`
    );
  }

  return anchors.length > 0 ? anchors : ["No claims or divergent turns are loaded into the current packet."];
}

function buildDeliveryReadiness(
  decision: DecisionSummary,
  filledCount: number,
  totalRows: number,
  unscoredDimensions: RubricRow[],
  weakDimensions: RubricRow[],
  notes: string,
  claimCount: number,
  divergentTurnCount: number
): DeliveryReadiness {
  const warnings: string[] = [];
  const readyItems: string[] = [];

  if (unscoredDimensions.length > 0) {
    warnings.push(`Unscored rubric dimensions: ${unscoredDimensions.map((row) => row.dimension).join(", ")}.`);
  } else {
    readyItems.push("All rubric dimensions are scored.");
  }

  if (!notes.trim()) {
    warnings.push("Reviewer notes are still empty.");
  } else {
    readyItems.push("Reviewer notes are captured.");
  }

  if (weakDimensions.length > 0) {
    warnings.push(`Lowest-confidence dimensions still need attention: ${weakDimensions.map((row) => row.dimension).join(", ")}.`);
  }

  if (decision.tone !== "ready") {
    warnings.push(`Current sign-off posture is ${decision.label}.`);
  } else {
    readyItems.push("Sign-off posture is currently ready to sign off.");
  }

  if (claimCount > 0) {
    readyItems.push(`${claimCount} claim(s) are available for export.`);
  }

  if (divergentTurnCount > 0) {
    readyItems.push(`${divergentTurnCount} divergent turn(s) are mapped for replay.`);
  }

  if (warnings.length === 0) {
    return {
      label: "delivery-ready",
      tone: "ready",
      summary: "The current scorecard, notes, and evidence anchors are complete enough to support review, closeout, and pickup exports without obvious missing inputs.",
      warnings: ["No missing inputs are currently blocking export use."],
      readyItems
    };
  }

  if (unscoredDimensions.length > 0 || !notes.trim()) {
    return {
      label: "missing inputs",
      tone: "incomplete",
      summary: `Complete ${filledCount}/${totalRows} scored dimensions and capture reviewer notes before treating the packet set as handoff-ready.`,
      warnings,
      readyItems
    };
  }

  if (decision.tone === "followup") {
    return {
      label: "needs targeted cleanup",
      tone: "followup",
      summary: "Exports are usable for discussion, but the weakest dimensions still need focused cleanup before a confident handoff or closeout.",
      warnings,
      readyItems
    };
  }

  return {
    label: "not ready for closeout",
    tone: "hold",
    summary: "The current packet set still carries meaningful delivery risk. Treat warnings as blockers until the sign-off posture improves.",
    warnings,
    readyItems
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
  const [issueCommentCopyState, setIssueCommentCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [handoffCopyState, setHandoffCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [closeoutCopyState, setCloseoutCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [pickupLane, setPickupLane] = useState<PickupLane>("lane:auto-safe");
  const [pickupRoutingCopyState, setPickupRoutingCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [selectedExport, setSelectedExport] = useState<ExportSurfaceId>("issue-comment");

  const filledCount = Object.values(scores).filter((value) => value !== null).length;
  const decision = decisionFromScores(scores, rubricRows.length);
  const unscoredDimensions = rubricRows.filter((row) => scores[row.dimension] === null);
  const weakDimensions = rubricRows.filter((row) => {
    const score = scores[row.dimension];
    return score !== null && score < 3;
  });
  const recommendation = recommendationFromState(decision, unscoredDimensions, weakDimensions);
  const nextActions = buildNextActions(
    decision,
    unscoredDimensions,
    weakDimensions,
    divergentTurns,
    claimPackets,
    notes
  );
  const blockers = buildBlockers(decision, unscoredDimensions, weakDimensions, notes);
  const carryForwardAnchors = buildCarryForwardAnchors(claimPackets, divergentTurns);
  const pickupRoute = laneRoutes[pickupLane];
  const selectedExportSurface = exportSurfaces[selectedExport];
  const deliveryReadiness = buildDeliveryReadiness(
    decision,
    filledCount,
    rubricRows.length,
    unscoredDimensions,
    weakDimensions,
    notes,
    claimCount,
    divergentTurnCount
  );
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
  const handoffMarkdown = [
    "## Operator Decision Brief",
    `- Sign-off posture: ${decision.label}`,
    `- Eval: ${evalName} (${evalStatus})`,
    `- Claims in scope: ${claimCount}`,
    `- Divergent turns in scope: ${divergentTurnCount}`,
    `- Scorecard coverage: ${filledCount}/${rubricRows.length} dimensions scored`,
    "",
    "## Recommendation",
    `- ${recommendation}`,
    "",
    "## Immediate Next Actions",
    ...nextActions.map((action) => `- ${action}`),
    "",
    "## Current Blockers",
    ...blockers.map((blocker) => `- ${blocker}`),
    "",
    "## Carry-Forward Anchors",
    ...carryForwardAnchors.map((anchor) => `- ${anchor}`),
    "",
    "## Reviewer Notes",
    notes.trim() ? notes : "- No reviewer notes captured yet."
  ].join("\n");
  const closeoutMarkdown = [
    "## Exit Gate Closeout Packet",
    `- Provisional sign-off: ${decision.label}`,
    `- Eval: ${evalName} (${evalStatus})`,
    `- Claims reviewed: ${claimCount}`,
    `- Divergent turns reviewed: ${divergentTurnCount}`,
    `- Scorecard coverage: ${filledCount}/${rubricRows.length} dimensions scored`,
    "",
    "## Closeout Recommendation",
    `- ${recommendation}`,
    "",
    "## Validation Checklist",
    ...closeoutValidationCommands.map((command) => `- Run \`${command}\``),
    "",
    "## Carry-Forward Evidence Anchors",
    ...carryForwardAnchors.map((anchor) => `- ${anchor}`),
    "",
    "## Current Blockers",
    ...blockers.map((blocker) => `- ${blocker}`),
    "",
    "## Reviewer Notes",
    notes.trim() ? notes : "- No reviewer notes captured yet."
  ].join("\n");
  const pickupRoutingMarkdown = [
    "## Pickup Routing",
    `- Selected lane: ${pickupLane}`,
    `- Sign-off posture: ${decision.label}`,
    `- Eval: ${evalName} (${evalStatus})`,
    "",
    "## Lane Summary",
    `- ${pickupRoute.summary}`,
    "",
    "## Current Next Actions",
    ...nextActions.map((action) => `- ${action}`),
    "",
    "## Lane Checklist",
    ...pickupRoute.checklist.map((step) => `- ${step}`),
    "",
    "## Review And Merge Path",
    ...pickupRoute.reviewPath.map((step) => `- ${step}`),
    "",
    "## Post-Merge Checkpoint",
    ...postMergeCheckpointCommands.map((command) => `- Run \`${command}\``),
    "",
    "## Carry-Forward Anchors",
    ...carryForwardAnchors.map((anchor) => `- ${anchor}`),
    "",
    "## Current Blockers",
    ...blockers.map((blocker) => `- ${blocker}`),
    "",
    "## Reviewer Notes",
    notes.trim() ? notes : "- No reviewer notes captured yet."
  ].join("\n");
  const issueCommentMarkdown = [
    "## Review Handoff",
    `- Provisional sign-off: ${decision.label}`,
    `- Eval: ${evalName} (${evalStatus})`,
    `- Scorecard coverage: ${filledCount}/${rubricRows.length} dimensions scored`,
    "",
    "## Claims To Carry Forward",
    ...claimPackets.flatMap((claim) => [
      `- \`${claim.claimId}\`: ${claim.text}`,
      `  - related turns: ${claim.relatedTurnIds.length > 0 ? claim.relatedTurnIds.join(", ") : "none"}`
    ]),
    "",
    "## Divergent Turns To Replay",
    ...(divergentTurns.length > 0
      ? divergentTurns.map(
          (turn) =>
            `- Turn ${turn.turnIndex}: baseline \`${turn.baselineTurnId ?? "none"}\` vs intervention \`${turn.interventionTurnId ?? "none"}\``
        )
      : ["- No divergent turns highlighted in the current comparison."]),
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

          <article className="artifactCard handoffCard">
            <div className="artifactMeta">
              <span>exports</span>
              <code>destination guide</code>
            </div>
            <div className="claimHeader">
              <strong>Packet chooser</strong>
              <button
                type="button"
                className="actionButton"
                onClick={() => {
                  document.getElementById(selectedExportSurface.targetId)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
                }}
              >
                Jump to selected export
              </button>
            </div>
            <p className="scoreHint">
              Use this guide when you know the destination first and need the right export surface without scanning the whole sidebar.
            </p>

            <div className="laneToggleGroup" role="tablist" aria-label="Export destination chooser">
              {(Object.keys(exportSurfaces) as ExportSurfaceId[]).map((exportId) => (
                <button
                  key={exportId}
                  type="button"
                  className={`laneToggleButton${selectedExport === exportId ? " laneToggleButtonActive" : ""}`}
                  onClick={() => setSelectedExport(exportId)}
                >
                  {exportSurfaces[exportId].label}
                </button>
              ))}
            </div>

            <div className="handoffSections">
              <div className="handoffSection">
                <h3>Selected export</h3>
                <p>{selectedExportSurface.summary}</p>
              </div>

              <div className="handoffSection">
                <h3>Best destination</h3>
                <ul className="checklist compact">
                  <li>{selectedExportSurface.destination}</li>
                  <li>Current sign-off posture: {decision.label}.</li>
                  <li>Current blockers surfaced: {blockers.length}.</li>
                </ul>
              </div>
            </div>
          </article>

          <article className="artifactCard handoffCard">
            <div className="artifactMeta">
              <span>readiness</span>
              <code>delivery completeness</code>
            </div>
            <div className="claimHeader">
              <strong>Delivery readiness</strong>
              <span className={`statusPill statusPill${deliveryReadiness.tone}`}>
                {deliveryReadiness.label}
              </span>
            </div>
            <p>{deliveryReadiness.summary}</p>

            <div className="handoffSections">
              <div
                className={`handoffSection${
                  deliveryReadiness.tone === "ready" ? " handoffSectionReady" : " handoffSectionWarning"
                }`}
              >
                <h3>Warnings</h3>
                <ul className="checklist compact">
                  {deliveryReadiness.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>

              <div className="handoffSection">
                <h3>Already covered</h3>
                <ul className="checklist compact">
                  {deliveryReadiness.readyItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article id="decision-brief-export" className="artifactCard handoffCard">
            <div className="artifactMeta">
              <span>handoff</span>
              <code>operator pickup brief</code>
            </div>
            <div className="claimHeader">
              <strong>Decision brief</strong>
              <button
                type="button"
                className="actionButton"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(handoffMarkdown);
                    setHandoffCopyState("copied");
                  } catch {
                    setHandoffCopyState("failed");
                  }
                }}
              >
                Copy handoff brief
              </button>
            </div>
            <p className="scoreHint">
              This panel turns the live worksheet into an operator-ready decision brief, with a recommended next step,
              blockers, and carry-forward evidence anchors.
            </p>
            <div className="claimHeader">
              <strong>Recommended next step</strong>
              <span className={`statusPill statusPill${decision.tone}`}>
                {decision.label}
              </span>
            </div>
            <p>{recommendation}</p>

            <div className="handoffSections">
              <div className="handoffSection">
                <h3>Immediate next actions</h3>
                <ul className="checklist compact">
                  {nextActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>

              <div className="handoffSection">
                <h3>Current blockers</h3>
                <ul className="checklist compact">
                  {blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </div>

              <div className="handoffSection">
                <h3>Carry-forward anchors</h3>
                <ul className="checklist compact">
                  {carryForwardAnchors.map((anchor) => (
                    <li key={anchor}>{anchor}</li>
                  ))}
                </ul>
              </div>
            </div>

            <textarea className="packetField packetFieldCompact" readOnly value={handoffMarkdown} />
            <p className="scoreHint">
              {handoffCopyState === "copied"
                ? "Handoff brief copied to clipboard."
                : handoffCopyState === "failed"
                  ? "Clipboard copy failed. You can still copy from the packet field."
                  : "Use this field when the next operator needs a concise decision brief instead of the full review packet."}
            </p>
          </article>

          <article id="pickup-routing-export" className="artifactCard handoffCard">
            <div className="artifactMeta">
              <span>routing</span>
              <code>lane-aware pickup</code>
            </div>
            <div className="claimHeader">
              <strong>Pickup routing panel</strong>
              <button
                type="button"
                className="actionButton"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(pickupRoutingMarkdown);
                    setPickupRoutingCopyState("copied");
                  } catch {
                    setPickupRoutingCopyState("failed");
                  }
                }}
              >
                Copy pickup routing
              </button>
            </div>
            <p className="scoreHint">
              Toggle the lane to switch between safe-lane and protected-core pickup steps without leaving the workbench.
            </p>

            <div className="laneToggleGroup" role="tablist" aria-label="Pickup lane routing">
              {(Object.keys(laneRoutes) as PickupLane[]).map((lane) => (
                <button
                  key={lane}
                  type="button"
                  className={`laneToggleButton${pickupLane === lane ? " laneToggleButtonActive" : ""}`}
                  onClick={() => setPickupLane(lane)}
                >
                  {lane}
                </button>
              ))}
            </div>

            <div className="claimHeader">
              <strong>Selected route</strong>
              <span className="pill">{pickupLane}</span>
            </div>
            <p>{pickupRoute.summary}</p>

            <div className="handoffSections">
              <div className="handoffSection">
                <h3>Lane checklist</h3>
                <ul className="checklist compact">
                  {pickupRoute.checklist.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="handoffSection">
                <h3>Review and merge path</h3>
                <ul className="checklist compact">
                  {pickupRoute.reviewPath.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="handoffSection">
                <h3>Post-merge checkpoint</h3>
                <ul className="checklist compact">
                  {postMergeCheckpointCommands.map((command) => (
                    <li key={command}>
                      Run <code>{command}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <textarea className="packetField packetFieldCompact" readOnly value={pickupRoutingMarkdown} />
            <p className="scoreHint">
              {pickupRoutingCopyState === "copied"
                ? "Pickup routing copied to clipboard."
                : pickupRoutingCopyState === "failed"
                  ? "Clipboard copy failed. You can still copy from the packet field."
                  : "Use this field when the next operator needs lane-specific pickup and merge guidance tied to the current review state."}
            </p>
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
            <div className="packetStack">
              <div id="review-packet-export" className="packetSection">
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
              </div>

              <div id="issue-comment-export" className="packetSection">
                <div className="claimHeader">
                  <strong>Issue comment packet</strong>
                  <button
                    type="button"
                    className="actionButton"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(issueCommentMarkdown);
                        setIssueCommentCopyState("copied");
                      } catch {
                        setIssueCommentCopyState("failed");
                      }
                    }}
                  >
                    Copy issue comment
                  </button>
                </div>
                <p className="scoreHint">
                  This version trims the handoff into GitHub-ready sections so an operator can paste it into an issue or PR comment without reformatting.
                </p>
                <textarea className="packetField packetFieldCompact" readOnly value={issueCommentMarkdown} />
                <p className="scoreHint">
                  {issueCommentCopyState === "copied"
                    ? "Issue comment packet copied to clipboard."
                    : issueCommentCopyState === "failed"
                      ? "Clipboard copy failed. You can still copy from the packet field."
                      : "Use this field when the next operator needs a GitHub-comment-ready review handoff."}
                </p>
              </div>

              <div id="closeout-packet-export" className="packetSection">
                <div className="claimHeader">
                  <strong>Closeout packet</strong>
                  <button
                    type="button"
                    className="actionButton"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(closeoutMarkdown);
                        setCloseoutCopyState("copied");
                      } catch {
                        setCloseoutCopyState("failed");
                      }
                    }}
                  >
                    Copy closeout packet
                  </button>
                </div>
                <p className="scoreHint">
                  This version packages sign-off posture, trusted validation commands, carry-forward evidence anchors,
                  and reviewer notes into an exit-gate-ready closeout note.
                </p>

                <div className="handoffSections">
                  <div className="handoffSection">
                    <h3>Validation checklist</h3>
                    <ul className="checklist compact">
                      {closeoutValidationCommands.map((command) => (
                        <li key={command}>
                          Run <code>{command}</code>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="handoffSection">
                    <h3>Carry-forward anchors</h3>
                    <ul className="checklist compact">
                      {carryForwardAnchors.map((anchor) => (
                        <li key={anchor}>{anchor}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <textarea className="packetField packetFieldCompact" readOnly value={closeoutMarkdown} />
                <p className="scoreHint">
                  {closeoutCopyState === "copied"
                    ? "Closeout packet copied to clipboard."
                    : closeoutCopyState === "failed"
                      ? "Clipboard copy failed. You can still copy from the packet field."
                      : "Use this field when the next operator needs an exit-gate or milestone closeout summary without rewriting the current review state."}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
