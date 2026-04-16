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

type DeliveryDestination = "pr-comment" | "closeout" | "pickup-handoff";

type ExportCoverage = {
  includes: string[];
  omits: string[];
  note: string;
};

type DeliveryPresetProfile = {
  emphasis: string;
  bestFit: string;
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
const deliveryDestinations: Record<DeliveryDestination, { label: string; summary: string }> = {
  "pr-comment": {
    label: "PR comment",
    summary: "Use when the next operator needs GitHub-ready handoff copy inside a PR or issue thread."
  },
  closeout: {
    label: "Closeout",
    summary: "Use when sign-off posture, validation commands, and evidence anchors need to travel together."
  },
  "pickup-handoff": {
    label: "Pickup handoff",
    summary: "Use when the next operator needs the clearest next step for continuing the work."
  }
};
const presetProfiles: Record<DeliveryDestination, DeliveryPresetProfile> = {
  "pr-comment": {
    emphasis: "Compact GitHub-ready summary",
    bestFit: "Best when the next step is discussion inside a PR or issue thread."
  },
  closeout: {
    emphasis: "Validation and sign-off evidence",
    bestFit: "Best when a milestone or exit gate needs a closeout-ready note."
  },
  "pickup-handoff": {
    emphasis: "Operator continuation path",
    bestFit: "Best when the next operator needs to keep moving without re-reading the whole workbench."
  }
};
const deliveryDestinationOrder: DeliveryDestination[] = ["pr-comment", "closeout", "pickup-handoff"];
const exportCoverage: Record<ExportSurfaceId, ExportCoverage> = {
  "decision-brief": {
    includes: ["Claim context", "Blockers", "Reviewer notes"],
    omits: ["Validation commands", "Lane guidance"],
    note: "Optimized for a concise narrative handoff rather than a full validation or governance bundle."
  },
  "review-packet": {
    includes: ["Claim context", "Reviewer notes"],
    omits: ["Blockers", "Validation commands", "Lane guidance"],
    note: "Best when the next reader still needs the broadest artifact context."
  },
  "issue-comment": {
    includes: ["Claim context", "Reviewer notes"],
    omits: ["Blockers", "Validation commands", "Lane guidance"],
    note: "Trimmed for GitHub comments, so it favors concise context over full delivery scaffolding."
  },
  "closeout-packet": {
    includes: ["Claim context", "Blockers", "Validation commands", "Reviewer notes"],
    omits: ["Lane guidance"],
    note: "Designed for exit gates and milestone notes where validation evidence must stay visible."
  },
  "pickup-routing": {
    includes: ["Claim context", "Blockers", "Validation commands", "Lane guidance", "Reviewer notes"],
    omits: [],
    note: "Carries the fullest operator-routing context, especially when lane rules and post-merge checks matter."
  }
};
const validationPreviewChips = ["smoke", "test", "eval-demo", "phase audits"] as const;

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

function recommendedExportForDestination(
  destination: DeliveryDestination,
  pickupLane: PickupLane,
  deliveryReadiness: DeliveryReadiness
): { exportId: ExportSurfaceId; reason: string; caution: string | null } {
  if (destination === "pr-comment") {
    return {
      exportId: "issue-comment",
      reason: "The issue comment packet is already trimmed into GitHub-ready sections, so it is the fastest fit for a PR or issue comment.",
      caution:
        deliveryReadiness.tone === "ready"
          ? null
          : "The current readiness warnings still apply, so treat the copied comment as a handoff snapshot rather than a sign-off claim."
    };
  }

  if (destination === "closeout") {
    return {
      exportId: "closeout-packet",
      reason: "The closeout packet keeps sign-off posture, validation commands, blockers, and evidence anchors together for exit-gate or milestone notes.",
      caution:
        deliveryReadiness.tone === "ready"
          ? null
          : "Resolve the visible readiness warnings before treating the closeout packet as final closure evidence."
    };
  }

  if (pickupLane === "lane:protected-core") {
    return {
      exportId: "pickup-routing",
      reason: "Protected-core pickup should travel with lane-specific review, merge, and checkpoint rules, so routing is the safest first export.",
      caution: "Supplement with the decision brief if the next operator also needs a shorter narrative summary."
    };
  }

  return {
    exportId: "decision-brief",
    reason: "For safe-lane pickup, the decision brief is the fastest summary of recommendation, blockers, and next actions for the next operator.",
    caution:
      deliveryReadiness.tone === "ready"
        ? "Use the pickup routing panel if the next operator also needs the explicit merge and checkpoint path."
        : "Use the readiness panel below to resolve missing inputs before treating the brief as a clean handoff."
  };
}

function alternativeExportsForDestination(
  destination: DeliveryDestination,
  recommendedExportId: ExportSurfaceId,
  pickupLane: PickupLane
) {
  const candidates: ExportSurfaceId[] =
    destination === "pr-comment"
      ? ["decision-brief", "review-packet", "pickup-routing"]
      : destination === "closeout"
        ? ["pickup-routing", "decision-brief", "issue-comment"]
        : pickupLane === "lane:protected-core"
          ? ["decision-brief", "issue-comment", "closeout-packet"]
          : ["pickup-routing", "issue-comment", "review-packet"];

  return candidates.filter((exportId) => exportId !== recommendedExportId).slice(0, 2);
}

function buildPayloadPreview(markdown: string, previewLineCount = 10) {
  const lines = markdown.trim().split("\n");
  const previewLines = lines.slice(0, previewLineCount);

  return {
    excerpt: previewLines.join("\n"),
    lineCount: lines.length,
    hiddenLineCount: Math.max(lines.length - previewLines.length, 0),
    sectionCount: lines.filter((line) => line.startsWith("## ")).length
  };
}

function buildMarkdownSections(markdown: string) {
  const sections: Array<{ title: string; lineCount: number }> = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  for (const rawLine of markdown.trim().split("\n")) {
    const line = rawLine.trimEnd();
    if (line.startsWith("## ")) {
      if (currentTitle !== null) {
        sections.push({
          title: currentTitle,
          lineCount: currentLines.filter((sectionLine) => sectionLine.trim() !== "").length
        });
      }
      currentTitle = line.slice(3);
      currentLines = [line];
      continue;
    }

    if (currentTitle !== null) {
      currentLines.push(line);
    }
  }

  if (currentTitle !== null) {
    sections.push({
      title: currentTitle,
      lineCount: currentLines.filter((sectionLine) => sectionLine.trim() !== "").length
    });
  }

  return sections;
}

function buildSectionDiffHighlights(recommendedMarkdown: string, fallbackMarkdown: string) {
  const recommendedSections = buildMarkdownSections(recommendedMarkdown);
  const fallbackSections = buildMarkdownSections(fallbackMarkdown);
  const recommendedMap = new Map(recommendedSections.map((section) => [section.title, section]));
  const fallbackMap = new Map(fallbackSections.map((section) => [section.title, section]));
  const titles = Array.from(new Set([...recommendedMap.keys(), ...fallbackMap.keys()]));

  const highlights = titles.map((title) => {
    const recommendedSection = recommendedMap.get(title);
    const fallbackSection = fallbackMap.get(title);

    if (recommendedSection && !fallbackSection) {
      return {
        title,
        kind: "recommended-only" as const,
        recommendedLines: recommendedSection.lineCount,
        fallbackLines: 0,
        note: "Only the current recommendation carries this section."
      };
    }

    if (!recommendedSection && fallbackSection) {
      return {
        title,
        kind: "fallback-only" as const,
        recommendedLines: 0,
        fallbackLines: fallbackSection.lineCount,
        note: "Only the selected fallback carries this section."
      };
    }

    const lineDelta = (recommendedSection?.lineCount ?? 0) - (fallbackSection?.lineCount ?? 0);
    if (Math.abs(lineDelta) <= 1) {
      return {
        title,
        kind: "shared" as const,
        recommendedLines: recommendedSection?.lineCount ?? 0,
        fallbackLines: fallbackSection?.lineCount ?? 0,
        note: "Both exports keep this section at roughly the same size."
      };
    }

    if (lineDelta > 0) {
      return {
        title,
        kind: "recommended-heavier" as const,
        recommendedLines: recommendedSection?.lineCount ?? 0,
        fallbackLines: fallbackSection?.lineCount ?? 0,
        note: `The recommendation spends ${lineDelta} more line(s) here than the selected fallback.`
      };
    }

    return {
      title,
      kind: "fallback-heavier" as const,
      recommendedLines: recommendedSection?.lineCount ?? 0,
      fallbackLines: fallbackSection?.lineCount ?? 0,
      note: `The selected fallback spends ${Math.abs(lineDelta)} more line(s) here than the recommendation.`
    };
  });

  const changedHighlights = highlights.filter((highlight) => highlight.kind !== "shared");
  return changedHighlights.length > 0 ? changedHighlights : highlights.slice(0, 1);
}

function tradeoffSummaryForExport(exportId: ExportSurfaceId) {
  switch (exportId) {
    case "issue-comment":
      return "Favor speed and GitHub-ready brevity, but widen the packet if the next reader also needs blockers, validation commands, or routing context.";
    case "closeout-packet":
      return "Favor a fuller closeout-ready packet, but pivot when the audience only needs a shorter update or next-step summary.";
    case "pickup-routing":
      return "Favor operator continuation safety, but pivot when the next handoff is discussion-first and does not need the full lane checklist.";
    case "decision-brief":
      return "Favor the shortest narrative summary, but pivot when validation evidence or routing rules need to stay attached.";
    case "review-packet":
      return "Favor the widest review context, but pivot when the handoff needs to be shorter or more operationally focused.";
  }
}

function fallbackNoteForExport(exportId: ExportSurfaceId, pickupLane: PickupLane) {
  switch (exportId) {
    case "decision-brief":
      return {
        when: "Use when the next operator needs the current recommendation, blockers, and next actions in the shortest readable form.",
        tradeoff: "You gain speed, but you leave detailed validation commands and lane-routing steps behind."
      };
    case "review-packet":
      return {
        when: "Use when a reviewer still needs the broadest claim, timeline, and rubric context before deciding what to do next.",
        tradeoff: "You gain wider evidence context, but the packet is less GitHub-ready and less operationally focused."
      };
    case "issue-comment":
      return {
        when: "Use when the next touchpoint is a PR or issue thread and the payload needs to paste cleanly into GitHub.",
        tradeoff: "You gain comment-ready brevity, but blockers, validation commands, and lane rules may be less visible."
      };
    case "closeout-packet":
      return {
        when: "Use when sign-off posture, blockers, and trusted validation commands need to travel together into a milestone or exit-gate note.",
        tradeoff: "You gain stronger closeout evidence, but the packet is heavier than a quick handoff or discussion note."
      };
    case "pickup-routing":
      return {
        when: pickupLane === "lane:protected-core"
          ? "Use when the next operator must keep protected-core review, merge, and post-merge checkpoint rules in view."
          : "Use when the next operator needs an explicit continuation path and checkpoint sequence rather than just a narrative summary.",
        tradeoff: "You gain safer continuation guidance, but the export is more operational and less conversational."
      };
  }
}

function buildTradeoffGuidance(
  destination: DeliveryDestination,
  recommendedExportId: ExportSurfaceId,
  pickupLane: PickupLane,
  deliveryReadiness: DeliveryReadiness,
  blockerCount: number,
  alternativeExportIds: ExportSurfaceId[]
) {
  const recommendedSurface = exportSurfaces[recommendedExportId];
  const acceptWhen = [
    `the next touchpoint really is ${deliveryDestinations[destination].label.toLowerCase()} and ${recommendedSurface.label.toLowerCase()} already matches that handoff shape`,
    blockerCount === 0
      ? "no blockers need extra visibility beyond the current recommendation"
      : `${blockerCount} blocker(s) are acceptable to carry in the current recommendation without widening the payload`,
    deliveryReadiness.tone === "ready"
      ? "the current scorecard and notes are strong enough that you do not need a heavier fallback packet"
      : "you need a progress snapshot, not a final sign-off or closure record"
  ];
  const pivotWhen = [
    deliveryReadiness.tone === "ready"
      ? "the next reader needs more operational detail than the recommended export keeps visible"
      : "readiness warnings make the current recommendation feel too light for the next handoff",
    recommendedExportId === "issue-comment"
      ? "validation commands, blockers, or lane-routing rules need to stay attached to the exported payload"
      : recommendedExportId === "closeout-packet"
        ? "the audience only needs a shorter progress update instead of a full closeout note"
        : recommendedExportId === "pickup-routing"
          ? "the next touchpoint is discussion-first and does not need the full routing checklist"
          : "the next reader needs either broader evidence context or stronger operational scaffolding than the current recommendation provides"
  ];

  return {
    summary: tradeoffSummaryForExport(recommendedExportId),
    acceptWhen,
    pivotWhen,
    fallbackOptions: alternativeExportIds.map((exportId) => ({
      exportId,
      ...fallbackNoteForExport(exportId, pickupLane)
    }))
  };
}

function buildCopyPreflightChecklist(
  destination: DeliveryDestination,
  selectedExportId: ExportSurfaceId,
  recommendedExportId: ExportSurfaceId,
  selectedExportCoverage: ExportCoverage,
  deliveryReadiness: DeliveryReadiness,
  blockerCount: number
) {
  const items: Array<{ label: string; tone: "ready" | "followup" | "hold"; detail: string }> = [];

  items.push(
    selectedExportId === recommendedExportId
      ? {
          label: "Recommendation fit",
          tone: "ready",
          detail: "The current export still matches the workbench recommendation for this destination."
        }
      : {
          label: "Recommendation fit",
          tone: "followup",
          detail: `You are overriding the current recommendation. Confirm why ${exportSurfaces[selectedExportId].label.toLowerCase()} is the better handoff for this destination.`
        }
  );

  if (destination === "pr-comment") {
    items.push(
      selectedExportId === "issue-comment" || selectedExportId === "decision-brief"
        ? {
            label: "GitHub-ready brevity",
            tone: "ready",
            detail: "The current export is short enough to paste into a PR or issue thread without major reshaping."
          }
        : {
            label: "GitHub-ready brevity",
            tone: "followup",
            detail: "The current export is wider than a typical PR comment. Keep it only if the extra context is intentional."
          }
    );
  } else if (destination === "closeout") {
    const hasValidation = selectedExportCoverage.includes.includes("Validation commands");
    const hasBlockers = selectedExportCoverage.includes.includes("Blockers");
    items.push(
      hasValidation && hasBlockers
        ? {
            label: "Closeout evidence",
            tone: "ready",
            detail: "The current export keeps validation commands and blocker context attached for a closeout note."
          }
        : {
            label: "Closeout evidence",
            tone: "hold",
            detail: "This export omits part of the closeout evidence bundle. Widen the packet before treating it as a final closeout note."
          }
    );
  } else {
    const hasLaneGuidance = selectedExportCoverage.includes.includes("Lane guidance");
    items.push(
      hasLaneGuidance || selectedExportId === "decision-brief"
        ? {
            label: "Pickup clarity",
            tone: "ready",
            detail: "The current export keeps either explicit lane guidance or a concise next-step brief for the next operator."
          }
        : {
            label: "Pickup clarity",
            tone: "followup",
            detail: "The current export is usable, but the next operator may still need routing or next-step context before acting."
          }
    );
  }

  items.push(
    blockerCount === 0
      ? {
          label: "Blocker visibility",
          tone: "ready",
          detail: "No active blockers are forcing a wider export or special acknowledgement before copy."
        }
      : selectedExportCoverage.includes.includes("Blockers")
        ? {
            label: "Blocker visibility",
            tone: "followup",
            detail: "Active blockers exist, but the current export carries them. Keep the acknowledgement visible when you paste."
          }
        : {
            label: "Blocker visibility",
            tone: "hold",
            detail: "Active blockers exist, but the current export omits them. Widen the packet or acknowledge blockers before copy."
          }
  );

  items.push(
    deliveryReadiness.tone === "ready"
      ? {
          label: "Readiness posture",
          tone: "ready",
          detail: "Current scorecard, notes, and evidence coverage are strong enough for direct copy."
        }
      : deliveryReadiness.tone === "followup"
        ? {
            label: "Readiness posture",
            tone: "followup",
            detail: "You can copy this export for discussion, but targeted cleanup is still recommended before treating it as final."
          }
        : {
            label: "Readiness posture",
            tone: "hold",
            detail: "The current readiness state still has blocking gaps. Treat copy as a draft handoff rather than a clean final deliverable."
          }
  );

  const summaryTone = items.some((item) => item.tone === "hold")
    ? "hold"
    : items.some((item) => item.tone === "followup")
      ? "followup"
      : "ready";

  return {
    tone: summaryTone,
    items,
    summary:
      summaryTone === "ready"
        ? "The current export is aligned closely enough with the selected destination that a direct copy is low-friction."
        : summaryTone === "followup"
          ? "The current export is usable, but at least one destination or blocker cue still deserves a quick operator check before copy."
          : "The current export should not be treated as copy-safe without acknowledging the highlighted gaps first."
  };
}

function buildSelectionRationaleOptions(
  destination: DeliveryDestination,
  selectedExportId: ExportSurfaceId,
  recommendedExportId: ExportSurfaceId,
  selectedExportCoverage: ExportCoverage,
  recommendedExportCoverage: ExportCoverage,
  deliveryReadiness: DeliveryReadiness,
  blockerCount: number
) {
  const selectedSurface = exportSurfaces[selectedExportId];
  const recommendedSurface = exportSurfaces[recommendedExportId];
  const isOverride = selectedExportId !== recommendedExportId;

  if (!isOverride) {
    const options = [
      {
        key: "fit",
        label: "Best destination fit",
        detail: `${selectedSurface.label} still matches the current ${deliveryDestinations[destination].label.toLowerCase()} handoff better than the nearby alternatives.`,
        note: `Keep ${selectedSurface.label.toLowerCase()} because it still fits the current ${deliveryDestinations[destination].label.toLowerCase()} destination without needing a fallback packet.`
      },
      {
        key: "speed",
        label: "Lowest-friction path",
        detail: "The current recommendation is the fastest copy path that still preserves enough context for the next reader.",
        note: `Keep ${selectedSurface.label.toLowerCase()} because it is the lowest-friction export that still carries the needed context.`
      }
    ];

    if (blockerCount === 0) {
      options.push({
        key: "no-blockers",
        label: "No blocker escalation needed",
        detail: "No active blockers are asking for a wider or more defensive export right now.",
        note: `Keep ${selectedSurface.label.toLowerCase()} because there are no blocker cues forcing a wider fallback.`
      });
    } else if (selectedExportCoverage.includes.includes("Blockers")) {
      options.push({
        key: "blockers-covered",
        label: "Current blockers stay visible",
        detail: "Active blockers exist, but the current recommendation already carries them clearly enough for this handoff.",
        note: `Keep ${selectedSurface.label.toLowerCase()} because it already carries the current blocker context for this handoff.`
      });
    }

    if (deliveryReadiness.tone !== "ready") {
      options.push({
        key: "discussion",
        label: "Discussion-first handoff",
        detail: "The current state still reads as discussion or review, so a heavier fallback packet would add friction without closing the gaps.",
        note: `Keep ${selectedSurface.label.toLowerCase()} because the branch still needs review discussion more than a heavier fallback export.`
      });
    }

    return options;
  }

  const options = [
    {
      key: "fit",
      label: "Better destination fit",
      detail: `${selectedSurface.label} fits this ${deliveryDestinations[destination].label.toLowerCase()} handoff better than the current recommendation ${recommendedSurface.label}.`,
      note: `Override ${recommendedSurface.label.toLowerCase()} with ${selectedSurface.label.toLowerCase()} because it is the better fit for the current ${deliveryDestinations[destination].label.toLowerCase()} handoff.`
    }
  ];

  if (
    selectedExportCoverage.includes.includes("Blockers") &&
    !recommendedExportCoverage.includes.includes("Blockers")
  ) {
    options.push({
      key: "blockers",
      label: "Need blocker visibility",
      detail: `${selectedSurface.label} keeps blockers attached, while ${recommendedSurface.label} would hide part of that risk context.`,
      note: `Override ${recommendedSurface.label.toLowerCase()} with ${selectedSurface.label.toLowerCase()} so blocker context stays visible during handoff.`
    });
  }

  if (
    selectedExportCoverage.includes.includes("Validation commands") &&
    !recommendedExportCoverage.includes.includes("Validation commands")
  ) {
    options.push({
      key: "validation",
      label: "Need validation evidence",
      detail: `${selectedSurface.label} carries validation commands that the current recommendation leaves behind.`,
      note: `Override ${recommendedSurface.label.toLowerCase()} with ${selectedSurface.label.toLowerCase()} because the next reader needs validation evidence attached.`
    });
  }

  if (
    selectedExportCoverage.includes.includes("Lane guidance") &&
    !recommendedExportCoverage.includes.includes("Lane guidance")
  ) {
    options.push({
      key: "routing",
      label: "Need routing clarity",
      detail: `${selectedSurface.label} keeps lane or pickup-routing guidance visible, which the current recommendation would downplay.`,
      note: `Override ${recommendedSurface.label.toLowerCase()} with ${selectedSurface.label.toLowerCase()} so routing and merge guidance stay explicit.`
    });
  }

  if (
    destination === "pr-comment" &&
    (selectedExportId === "issue-comment" || selectedExportId === "decision-brief") &&
    selectedExportId !== recommendedExportId
  ) {
    options.push({
      key: "brevity",
      label: "Need a shorter export",
      detail: `${selectedSurface.label} is shorter and more paste-ready for a GitHub thread than the current recommendation.`,
      note: `Override ${recommendedSurface.label.toLowerCase()} with ${selectedSurface.label.toLowerCase()} because the handoff needs a tighter GitHub-ready payload.`
    });
  }

  if (deliveryReadiness.tone === "hold") {
    options.push({
      key: "confidence",
      label: "Need a more defensive handoff",
      detail: "Current readiness warnings are strong enough that a wider or more explicit fallback is safer than the default recommendation.",
      note: `Override ${recommendedSurface.label.toLowerCase()} with ${selectedSurface.label.toLowerCase()} because the current readiness state calls for a more defensive handoff.`
    });
  }

  return options;
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
  const [selectedDestination, setSelectedDestination] = useState<DeliveryDestination>("pr-comment");
  const [recommendedCopyState, setRecommendedCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [shortcutCopyState, setShortcutCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [selectedRationaleKey, setSelectedRationaleKey] = useState<string | null>(null);

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
  const selectedExportCoverage = exportCoverage[selectedExport];
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
  const recommendedExport = recommendedExportForDestination(selectedDestination, pickupLane, deliveryReadiness);
  const recommendedExportSurface = exportSurfaces[recommendedExport.exportId];
  const recommendedExportCoverage = exportCoverage[recommendedExport.exportId];
  const shortcutAlternatives = alternativeExportsForDestination(
    selectedDestination,
    recommendedExport.exportId,
    pickupLane
  );
  const tradeoffGuidance = buildTradeoffGuidance(
    selectedDestination,
    recommendedExport.exportId,
    pickupLane,
    deliveryReadiness,
    blockers.length,
    shortcutAlternatives
  );
  const copyPreflight = buildCopyPreflightChecklist(
    selectedDestination,
    selectedExport,
    recommendedExport.exportId,
    selectedExportCoverage,
    deliveryReadiness,
    blockers.length
  );
  const selectionRationaleOptions = buildSelectionRationaleOptions(
    selectedDestination,
    selectedExport,
    recommendedExport.exportId,
    selectedExportCoverage,
    recommendedExportCoverage,
    deliveryReadiness,
    blockers.length
  );
  const selectedRationale =
    selectionRationaleOptions.find((option) => option.key === selectedRationaleKey) ?? selectionRationaleOptions[0];
  const claimChipPreview =
    claimPackets.length > 0
      ? claimPackets.slice(0, 3).map((claim) => claim.claimId)
      : ["No claims in scope"];
  const blockerChipPreview =
    blockers.length > 0 ? blockers.slice(0, 2).map((blocker) => blocker.replace(/\.$/, "")) : ["No blockers surfaced"];
  const presetRecommendations = deliveryDestinationOrder.map((destination) => {
    const recommendation = recommendedExportForDestination(destination, pickupLane, deliveryReadiness);
    return {
      destination,
      recommendation,
      exportSurface: exportSurfaces[recommendation.exportId]
    };
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
  const exportMarkdownById: Record<ExportSurfaceId, string> = {
    "decision-brief": handoffMarkdown,
    "review-packet": packetMarkdown,
    "issue-comment": issueCommentMarkdown,
    "closeout-packet": closeoutMarkdown,
    "pickup-routing": pickupRoutingMarkdown
  };
  const comparisonAlternativeId = shortcutAlternatives.includes(selectedExport)
    ? selectedExport
    : (shortcutAlternatives[0] ?? recommendedExport.exportId);
  const payloadPreviewCards = [
    {
      exportId: recommendedExport.exportId,
      roleLabel: "Current recommendation",
      detail: recommendedExport.reason,
      toneClass: "statusPillready"
    },
    ...(comparisonAlternativeId !== recommendedExport.exportId
      ? [
          {
            exportId: comparisonAlternativeId,
            roleLabel: "Best nearby alternative",
            detail: exportSurfaces[comparisonAlternativeId].summary,
            toneClass: "statusPillfollowup"
          }
        ]
      : [])
  ].map(({ exportId, roleLabel, detail, toneClass }) => {
    const coverage = exportCoverage[exportId];

    return {
      exportId,
      roleLabel,
      detail,
      toneClass,
      surface: exportSurfaces[exportId],
      coverage,
      preview: buildPayloadPreview(exportMarkdownById[exportId])
    };
  });
  const sectionDiffHighlights = buildSectionDiffHighlights(
    exportMarkdownById[recommendedExport.exportId],
    exportMarkdownById[comparisonAlternativeId]
  );

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
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(exportMarkdownById[recommendedExport.exportId]);
                    setRecommendedCopyState("copied");
                  } catch {
                    setRecommendedCopyState("failed");
                  }
                }}
              >
                Copy recommended export
              </button>
            </div>
            <p className="scoreHint">
              Start from the destination, then use the recommended export or jump to any detailed packet when you need more control.
            </p>

            <div className="laneToggleGroup" role="tablist" aria-label="Delivery destination chooser">
              {(Object.keys(deliveryDestinations) as DeliveryDestination[]).map((destination) => (
                <button
                  key={destination}
                  type="button"
                  className={`laneToggleButton${selectedDestination === destination ? " laneToggleButtonActive" : ""}`}
                  onClick={() => {
                    setSelectedDestination(destination);
                    setSelectedExport(recommendedExportForDestination(destination, pickupLane, deliveryReadiness).exportId);
                  }}
                >
                  {deliveryDestinations[destination].label}
                </button>
              ))}
            </div>

            <div className="presetGrid">
              {presetRecommendations.map(({ destination, recommendation, exportSurface }) => {
                const isActive = selectedDestination === destination;
                const coverage = exportCoverage[recommendation.exportId];
                const presetProfile = presetProfiles[destination];

                return (
                  <article
                    key={destination}
                    className={`presetCard${isActive ? " presetCardActive" : ""}`}
                  >
                    <div className="claimHeader">
                      <strong>{deliveryDestinations[destination].label}</strong>
                      {isActive ? <span className="statusPill statusPillready">active</span> : null}
                    </div>
                    <p className="scoreHint">{deliveryDestinations[destination].summary}</p>
                    <p>
                      <strong>Recommended export:</strong> {exportSurface.label}
                    </p>
                    <p>
                      <strong>Emphasis:</strong> {presetProfile.emphasis}
                    </p>
                    <p className="scoreHint">{presetProfile.bestFit}</p>
                    <p className="scoreHint">{recommendation.reason}</p>

                    <div className="presetMeta">
                      <div className="presetMetaBlock">
                        <h3>Expected omissions</h3>
                        <div className="chipRow">
                          {coverage.omits.length > 0 ? (
                            coverage.omits.map((item) => (
                              <span key={item} className="metaChip">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="metaChip">No key delivery fields omitted</span>
                          )}
                        </div>
                      </div>

                      <div className="presetMetaBlock">
                        <h3>Best-fit destination</h3>
                        <div className="chipRow">
                          <span className="metaChip">{deliveryDestinations[destination].label}</span>
                          <span className="metaChip">{exportSurface.label}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="actionButton"
                      onClick={() => {
                        setSelectedDestination(destination);
                        setSelectedExport(recommendation.exportId);
                      }}
                    >
                      {isActive ? "Preset active" : "Use preset"}
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="shortcutStrip">
              <div className="shortcutHeader">
                <strong>Quick-export strip</strong>
                <span className="pill">{recommendedExportSurface.label}</span>
              </div>
              <p className="scoreHint">
                Use the fastest path for the current destination, or pivot to one of the nearby alternatives without leaving the guide surface.
              </p>
              <div className="shortcutActions">
                <button
                  type="button"
                  className="actionButton"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(exportMarkdownById[recommendedExport.exportId]);
                      setShortcutCopyState("copied");
                    } catch {
                      setShortcutCopyState("failed");
                    }
                  }}
                >
                  Copy {recommendedExportSurface.label}
                </button>
                <button
                  type="button"
                  className="actionButton"
                  onClick={() => {
                    setSelectedExport(recommendedExport.exportId);
                    document.getElementById(recommendedExportSurface.targetId)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start"
                    });
                  }}
                >
                  Jump to {recommendedExportSurface.label}
                </button>
              </div>
              <div className="shortcutAltList">
                {shortcutAlternatives.map((exportId) => (
                  <button
                    key={exportId}
                    type="button"
                    className="laneToggleButton"
                    onClick={() => {
                      setSelectedExport(exportId);
                      document.getElementById(exportSurfaces[exportId].targetId)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                      });
                    }}
                  >
                    Try {exportSurfaces[exportId].label}
                  </button>
                ))}
              </div>
              <p className="scoreHint">
                {shortcutCopyState === "copied"
                  ? `${recommendedExportSurface.label} copied from the shortcut strip.`
                  : shortcutCopyState === "failed"
                    ? "Clipboard copy failed. You can still copy from the recommended export card below."
                    : "Use the shortcut strip when you already trust the current recommendation and want the fastest copy or jump action."}
              </p>
            </div>

            <div className="payloadPreviewBoard">
              <div className="claimHeader">
                <strong>Payload preview</strong>
                <span className="pill">recommended vs nearby alternative</span>
              </div>
              <p className="scoreHint">
                Compare the first sections of the live markdown payloads before you copy either path. The preview stays
                frontend-only and reflects the current destination, scorecard, notes, and blocker state.
              </p>

              {shortcutAlternatives.length > 0 ? (
                <div className="payloadComparePicker">
                  <span className="scoreHint">Selected fallback</span>
                  <div className="chipRow">
                    {shortcutAlternatives.map((exportId) => (
                      <button
                        key={exportId}
                        type="button"
                        className={`laneToggleButton${comparisonAlternativeId === exportId ? " laneToggleButtonActive" : ""}`}
                        onClick={() => setSelectedExport(exportId)}
                      >
                        Compare {exportSurfaces[exportId].label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="payloadPreviewGrid">
                {payloadPreviewCards.map((card, index) => (
                  <article
                    key={card.exportId}
                    className={`payloadPreviewCard${index === 0 ? " payloadPreviewCardPrimary" : ""}`}
                  >
                    <div className="claimHeader">
                      <div>
                        <strong>{card.surface.label}</strong>
                        <p className="scoreHint">{card.surface.destination}</p>
                      </div>
                      <span className={`statusPill ${card.toneClass}`}>{card.roleLabel}</span>
                    </div>

                    <p className="scoreHint">{card.detail}</p>

                    <div className="payloadPreviewMeta">
                      <span className="metaChip">{card.preview.lineCount} lines</span>
                      <span className="metaChip">{card.preview.sectionCount} sections</span>
                      <span className="metaChip">
                        {card.coverage.omits.length > 0 ? `${card.coverage.omits.length} omission(s)` : "full field coverage"}
                      </span>
                    </div>

                    <pre className="payloadPreviewPre">{card.preview.excerpt}</pre>

                    <div className="payloadPreviewFooter">
                      <p className="scoreHint">
                        {card.preview.hiddenLineCount > 0
                          ? `+${card.preview.hiddenLineCount} more line(s) in the full ${card.surface.label.toLowerCase()} export below.`
                          : `This preview already shows the full ${card.surface.label.toLowerCase()} payload.`}
                      </p>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={() => {
                          setSelectedExport(card.exportId);
                          document.getElementById(card.surface.targetId)?.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                          });
                        }}
                      >
                        Focus {card.surface.label}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="payloadDiffBoard">
                <div className="claimHeader">
                  <strong>Section-level delta</strong>
                  <span className="pill">{exportSurfaces[comparisonAlternativeId].label}</span>
                </div>
                <p className="scoreHint">
                  These highlights show where the current recommendation drops, adds, or expands sections relative to the
                  selected fallback.
                </p>

                <div className="payloadDiffGrid">
                  {sectionDiffHighlights.map((highlight) => (
                    <article
                      key={highlight.title}
                      className={`payloadDiffCard payloadDiffCard${highlight.kind.replace(/-/g, "")}`}
                    >
                      <div className="claimHeader">
                        <strong>{highlight.title}</strong>
                        <span className="statusPill statusPillfollowup">{highlight.kind.replace(/-/g, " ")}</span>
                      </div>
                      <p className="scoreHint">{highlight.note}</p>
                      <div className="payloadPreviewMeta">
                        <span className="metaChip">recommended: {highlight.recommendedLines} lines</span>
                        <span className="metaChip">fallback: {highlight.fallbackLines} lines</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="tradeoffBoard">
              <div className="claimHeader">
                <strong>Tradeoff notes</strong>
                <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
              </div>
              <p className="scoreHint">{tradeoffGuidance.summary}</p>

              <div className="handoffSections">
                <div className="handoffSection handoffSectionReady">
                  <h3>Accept the recommendation when</h3>
                  <ul className="checklist compact">
                    {tradeoffGuidance.acceptWhen.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="handoffSection handoffSectionWarning">
                  <h3>Pivot to a fallback when</h3>
                  <ul className="checklist compact">
                    {tradeoffGuidance.pivotWhen.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="fallbackGrid">
                {tradeoffGuidance.fallbackOptions.map((option) => (
                  <article key={option.exportId} className="fallbackCard">
                    <div className="claimHeader">
                      <strong>{exportSurfaces[option.exportId].label}</strong>
                      <span className="statusPill statusPillfollowup">fallback</span>
                    </div>
                    <p className="scoreHint">{option.when}</p>
                    <p className="scoreHint">
                      <strong>Tradeoff:</strong> {option.tradeoff}
                    </p>
                    <button
                      type="button"
                      className="actionButton"
                      onClick={() => {
                        setSelectedExport(option.exportId);
                        document.getElementById(exportSurfaces[option.exportId].targetId)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start"
                        });
                      }}
                      >
                        Try {exportSurfaces[option.exportId].label}
                      </button>
                  </article>
                ))}
              </div>
            </div>

            <div className="selectionRationaleBoard">
              <div className="claimHeader">
                <strong>Selection rationale</strong>
                <span
                  className={`statusPill statusPill${
                    selectedExport === recommendedExport.exportId ? "ready" : "followup"
                  }`}
                >
                  {selectedExport === recommendedExport.exportId ? "keep recommendation" : "override selected"}
                </span>
              </div>
              <p className="scoreHint">
                {selectedExport === recommendedExport.exportId
                  ? `The current export still follows the workbench recommendation for ${deliveryDestinations[selectedDestination].label.toLowerCase()}.`
                  : `The current export overrides the recommendation ${recommendedExportSurface.label} in favor of ${selectedExportSurface.label}.`}
              </p>
              <div className="statusRow">
                <span className="pill">{recommendedExportSurface.label}</span>
                <span className="pill">{selectedExportSurface.label}</span>
              </div>

              <div className="chipRow">
                {selectionRationaleOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`laneToggleButton${selectedRationale?.key === option.key ? " laneToggleButtonActive" : ""}`}
                    onClick={() => setSelectedRationaleKey(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {selectedRationale ? (
                <div className="handoffSections">
                  <div className="handoffSection handoffSectionReady">
                    <h3>Why this choice</h3>
                    <p>{selectedRationale.detail}</p>
                  </div>

                  <div className="handoffSection">
                    <h3>Rationale note preview</h3>
                    <p className="scoreHint">{selectedRationale.note}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="copyPreflightBoard">
              <div className="claimHeader">
                <strong>Copy preflight</strong>
                <span className={`statusPill statusPill${copyPreflight.tone}`}>{copyPreflight.tone}</span>
              </div>
              <p className="scoreHint">
                {copyPreflight.summary}
              </p>
              <div className="statusRow">
                <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                <span className="pill">{selectedExportSurface.label}</span>
              </div>

              <div className="preflightGrid">
                {copyPreflight.items.map((item) => (
                  <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                    <div className="claimHeader">
                      <strong>{item.label}</strong>
                      <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                    </div>
                    <p className="scoreHint">{item.detail}</p>
                  </article>
                ))}
              </div>

              <div
                className={`handoffSection${
                  blockers.length > 0 ? " handoffSectionWarning" : " handoffSectionReady"
                }`}
              >
                <h3>Blocker acknowledgement</h3>
                <p className="scoreHint">
                  {blockers.length > 0
                    ? "These blocker cues should stay visible if you copy the current export into a live handoff."
                    : "No blockers are currently asking for extra acknowledgement before copy."}
                </p>
                <div className="chipRow">
                  {blockers.length > 0 ? (
                    blockerChipPreview.map((blocker) => (
                      <span key={blocker} className="metaChip">
                        {blocker}
                      </span>
                    ))
                  ) : (
                    <span className="metaChip metaChipMuted">No blockers surfaced</span>
                  )}
                </div>
              </div>
            </div>

            <div className="handoffSection">
              <h3>Carry-forward context</h3>
              <p className="scoreHint">
                These chips show what the current export selection carries forward before you copy it.
              </p>

              <div className="presetMeta">
                <div className="presetMetaBlock">
                  <h3>Claims</h3>
                  <div className="chipRow">
                    {selectedExportCoverage.includes.includes("Claim context") ? (
                      claimChipPreview.map((claimId) => (
                        <span key={claimId} className="metaChip">
                          {claimId}
                        </span>
                      ))
                    ) : (
                      <span className="metaChip metaChipMuted">Claims omitted</span>
                    )}
                  </div>
                </div>

                <div className="presetMetaBlock">
                  <h3>Blockers</h3>
                  <div className="chipRow">
                    {selectedExportCoverage.includes.includes("Blockers") ? (
                      blockerChipPreview.map((blocker) => (
                        <span key={blocker} className="metaChip">
                          {blocker}
                        </span>
                      ))
                    ) : (
                      <span className="metaChip metaChipMuted">Blockers omitted</span>
                    )}
                  </div>
                </div>

                <div className="presetMetaBlock">
                  <h3>Validation steps</h3>
                  <div className="chipRow">
                    {selectedExportCoverage.includes.includes("Validation commands") ? (
                      validationPreviewChips.map((step) => (
                        <span key={step} className="metaChip">
                          {step}
                        </span>
                      ))
                    ) : (
                      <span className="metaChip metaChipMuted">Validation steps omitted</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="handoffSections">
              <div
                className={`handoffSection${
                  deliveryReadiness.tone === "ready" ? " handoffSectionReady" : " handoffSectionWarning"
                }`}
              >
                <h3>Recommended export</h3>
                <p>
                  <strong>{recommendedExportSurface.label}</strong>
                </p>
                <p>{recommendedExport.reason}</p>
                <p className="scoreHint">{deliveryDestinations[selectedDestination].summary}</p>
              </div>

              <div className="handoffSection">
                <h3>Quick actions</h3>
                <ul className="checklist compact">
                  <li>Best destination: {recommendedExportSurface.destination}</li>
                  <li>Current sign-off posture: {decision.label}.</li>
                  <li>Current blockers surfaced: {blockers.length}.</li>
                  {recommendedExport.caution ? <li>{recommendedExport.caution}</li> : null}
                </ul>
                <button
                  type="button"
                  className="actionButton"
                  onClick={() => {
                    document.getElementById(recommendedExportSurface.targetId)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start"
                    });
                  }}
                >
                  Jump to recommended export
                </button>
              </div>
            </div>

            <p className="scoreHint">
              {recommendedCopyState === "copied"
                ? `${recommendedExportSurface.label} copied to clipboard.`
                : recommendedCopyState === "failed"
                  ? "Clipboard copy failed. You can still copy from the detailed export field below."
                  : "Use the quick-copy button for the current destination, or switch destinations to update the recommendation."}
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

          <article className="artifactCard handoffCard">
            <div className="artifactMeta">
              <span>coverage</span>
              <code>destination inclusion preview</code>
            </div>
            <div className="claimHeader">
              <strong>Coverage matrix</strong>
              <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
            </div>
            <p className="scoreHint">
              Compare what each export includes before you copy it. The highlighted card matches the current recommended export.
            </p>

            <div className="coverageGrid">
              {(Object.keys(exportSurfaces) as ExportSurfaceId[]).map((exportId) => {
                const coverage = exportCoverage[exportId];
                const isRecommended = recommendedExport.exportId === exportId;
                return (
                  <article
                    key={exportId}
                    className={`coverageCard${isRecommended ? " coverageCardActive" : ""}`}
                  >
                    <div className="claimHeader">
                      <strong>{exportSurfaces[exportId].label}</strong>
                      {isRecommended ? <span className="statusPill statusPillready">recommended</span> : null}
                    </div>
                    <p className="scoreHint">{exportSurfaces[exportId].destination}</p>

                    <div className="coverageLists">
                      <div className="coverageList">
                        <h3>Includes</h3>
                        <ul className="checklist compact">
                          {coverage.includes.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="coverageList">
                        <h3>Omits</h3>
                        <ul className="checklist compact">
                          {coverage.omits.length > 0 ? (
                            coverage.omits.map((item) => <li key={item}>{item}</li>)
                          ) : (
                            <li>No key delivery fields omitted in this export.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <p className="scoreHint">{coverage.note}</p>
                  </article>
                );
              })}
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
