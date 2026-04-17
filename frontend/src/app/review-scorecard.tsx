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
type BundleVariant = "compact" | "full";
type ReceiverRole = "reviewer" | "approver" | "operator";
type ResponseKitRouteFilter = "active" | "all" | "acknowledge" | "request-more-context" | "escalate";

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
const bundleVariantProfiles: Record<BundleVariant, { label: string; summary: string }> = {
  compact: {
    label: "Compact",
    summary: "Keep the cover sheet, primary export, and only the companions that this destination currently needs."
  },
  full: {
    label: "Full",
    summary: "Carry the richer delivery bundle so cover context, rationale, and sidecar all travel together for deeper review."
  }
};
const receiverRoleProfiles: Record<ReceiverRole, { label: string; summary: string }> = {
  reviewer: {
    label: "Reviewer",
    summary: "Tailor the bundle for someone who is validating evidence quality, fit, and whether more context is needed."
  },
  approver: {
    label: "Approver",
    summary: "Tailor the bundle for someone who needs to make a sign-off, hold, or escalation decision from the same package."
  },
  operator: {
    label: "Operator",
    summary: "Tailor the bundle for someone who is picking up the next concrete action after the handoff is received."
  }
};
const rolePresetProfiles: Record<
  ReceiverRole,
  { destination: DeliveryDestination; variant: BundleVariant; emphasis: string; summary: string }
> = {
  reviewer: {
    destination: "pr-comment",
    variant: "full",
    emphasis: "Lead with the review payload and keep context-heavy sections visible for evidence checks.",
    summary: "Use when the next reader is evaluating whether the packet is review-ready or still needs more evidence."
  },
  approver: {
    destination: "closeout",
    variant: "full",
    emphasis: "Lead with decision-facing sections so approve, hold, or escalate posture is visible immediately.",
    summary: "Use when the next reader is making a closeout or gate decision from the same bundle."
  },
  operator: {
    destination: "pickup-handoff",
    variant: "compact",
    emphasis: "Lead with the operational payload and keep only the companions needed for the next execution step.",
    summary: "Use when the next reader is picking up work and needs a faster, action-first handoff package."
  }
};
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

function buildCopySidecarSummary(
  destination: DeliveryDestination,
  selectedExportId: ExportSurfaceId,
  recommendedExportId: ExportSurfaceId,
  copyPreflight: ReturnType<typeof buildCopyPreflightChecklist>,
  blockers: string[]
) {
  const selectedSurface = exportSurfaces[selectedExportId];
  const recommendedSurface = exportSurfaces[recommendedExportId];
  const followsRecommendation = selectedExportId === recommendedExportId;
  const confidenceLabel =
    copyPreflight.tone === "ready"
      ? followsRecommendation
        ? "high confidence"
        : "steady override"
      : copyPreflight.tone === "followup"
        ? "watch closely"
        : "draft only";
  const destinationFit = followsRecommendation
    ? `${selectedSurface.label} remains the workbench recommendation for ${deliveryDestinations[destination].label.toLowerCase()}.`
    : `${selectedSurface.label} is being used instead of ${recommendedSurface.label} for ${deliveryDestinations[destination].label.toLowerCase()}.`;
  const blockerSummary =
    blockers.length > 0
      ? `Carry blocker acknowledgement with this handoff: ${blockers.slice(0, 2).join(" ")}`
      : "No active blockers currently require extra acknowledgement beside the copied export.";
  const confidenceSummary =
    copyPreflight.tone === "ready"
      ? "The current selection reads as copy-safe for the destination without obvious missing context."
      : copyPreflight.tone === "followup"
        ? "The current selection is usable, but the next reader should still see the sidecar before treating it as final."
        : "Treat the copied export as a draft handoff and keep the sidecar attached so the remaining gaps stay visible.";

  return {
    tone: copyPreflight.tone,
    confidenceLabel,
    destinationFit,
    blockerSummary,
    confidenceSummary,
    markdown: [
      "## Copy Sidecar",
      `- Destination: ${deliveryDestinations[destination].label}`,
      `- Selected export: ${selectedSurface.label}`,
      `- Recommendation status: ${
        followsRecommendation
          ? "following the current recommendation"
          : `override current recommendation (${recommendedSurface.label})`
      }`,
      `- Selection confidence: ${confidenceLabel}`,
      "",
      "### Destination fit",
      `- ${destinationFit}`,
      "",
      "### Blocker acknowledgement",
      ...(blockers.length > 0 ? blockers.slice(0, 2).map((blocker) => `- ${blocker}`) : ["- No blockers surfaced."]),
      "",
      "### Confidence note",
      `- ${confidenceSummary}`
    ].join("\n")
  };
}

function buildHandoffBundlePreview(
  destination: DeliveryDestination,
  selectedExportId: ExportSurfaceId,
  selectedExportMarkdown: string,
  rationaleNote: string | null,
  copySidecarMarkdown: string
) {
  const exportPreview = buildPayloadPreview(selectedExportMarkdown, 8);
  const sidecarPreview = buildPayloadPreview(copySidecarMarkdown, 8);

  return {
    exportPreview,
    sidecarPreview,
    markdown: [
      "# Handoff Bundle Preview",
      "",
      `- Destination: ${deliveryDestinations[destination].label}`,
      `- Primary export: ${exportSurfaces[selectedExportId].label}`,
      "",
      "## Primary export excerpt",
      exportPreview.excerpt,
      ...(exportPreview.hiddenLineCount > 0
        ? [``, `- +${exportPreview.hiddenLineCount} more line(s) remain in the full export.`]
        : []),
      "",
      "## Rationale note",
      rationaleNote ? `- ${rationaleNote}` : "- No rationale note selected.",
      "",
      "## Copy sidecar excerpt",
      sidecarPreview.excerpt,
      ...(sidecarPreview.hiddenLineCount > 0
        ? [``, `- +${sidecarPreview.hiddenLineCount} more line(s) remain in the full sidecar.`]
        : [])
    ].join("\n")
  };
}

function buildRecipientCoverSheet(
  destination: DeliveryDestination,
  selectedExportId: ExportSurfaceId,
  recommendedExportId: ExportSurfaceId,
  rationaleNote: string | null,
  copyPreflight: ReturnType<typeof buildCopyPreflightChecklist>,
  blockers: string[]
) {
  const selectedSurface = exportSurfaces[selectedExportId];
  const recommendedSurface = exportSurfaces[recommendedExportId];
  const followsRecommendation = selectedExportId === recommendedExportId;
  const includeRationale = !followsRecommendation || copyPreflight.tone !== "ready";
  const includeSidecar = destination !== "pr-comment" || blockers.length > 0 || copyPreflight.tone !== "ready";
  const deliveryLead =
    destination === "pr-comment"
      ? "Lead with a concise GitHub-ready note so the next reader can understand the handoff without reformatting the package."
      : destination === "closeout"
        ? "Lead with a closure-ready summary so reviewers see the primary evidence bundle, confidence posture, and blocker state at a glance."
        : "Lead with an operator-facing summary so the next owner sees the package purpose, selected export, and companions before diving into the detailed payload.";
  const rationalePosture = followsRecommendation
    ? `${selectedSurface.label} still follows the current recommendation for ${deliveryDestinations[destination].label.toLowerCase()}.`
    : `${selectedSurface.label} is intentionally overriding ${recommendedSurface.label} for ${deliveryDestinations[destination].label.toLowerCase()}.`;
  const blockerPosture =
    blockers.length > 0
      ? `Call out ${blockers.length} blocker(s) near the top of the package so the receiver treats this as an informed handoff instead of a clean final sign-off.`
      : copyPreflight.tone === "ready"
        ? "No active blockers currently need top-level receiver attention."
        : "No blocker list is active, but the receiver should still treat the package as follow-up work until the copy-preflight warnings clear.";
  const companions = [
    {
      label: "Primary export",
      status: "included",
      detail: `${selectedSurface.label} stays first because it carries the main ${deliveryDestinations[destination].label.toLowerCase()} payload.`
    },
    {
      label: "Rationale note",
      status: includeRationale ? "included" : "optional",
      detail: includeRationale
        ? rationaleNote ?? "Keep the rationale note attached so the receiver sees why this choice still makes sense."
        : "The rationale note can stay optional when the current package already fits the destination cleanly."
    },
    {
      label: "Copy sidecar",
      status: includeSidecar ? "included" : "optional",
      detail: includeSidecar
        ? "Keep the sidecar attached so destination fit, blocker acknowledgement, and confidence cues remain visible."
        : "The sidecar can stay optional when the destination is discussion-first and no extra blocker or confidence cues need emphasis."
    }
  ];

  return {
    statusTone: blockers.length > 0 && copyPreflight.tone === "ready" ? "followup" : copyPreflight.tone,
    recommendationPosture: followsRecommendation ? "following recommendation" : "override in effect",
    deliveryLead,
    rationalePosture,
    blockerPosture,
    companions,
    markdown: [
      "# Recipient Handoff Cover Sheet",
      "",
      `- Destination: ${deliveryDestinations[destination].label}`,
      `- Lead export: ${selectedSurface.label}`,
      `- Recommendation posture: ${followsRecommendation ? "following the current recommendation" : `overriding ${recommendedSurface.label}`}`,
      `- Package confidence: ${
        copyPreflight.tone === "ready"
          ? "ready to send"
          : copyPreflight.tone === "followup"
            ? "usable with follow-up"
            : "draft-only handoff"
      }`,
      "",
      "## Receiver orientation",
      `- ${deliveryLead}`,
      "",
      "## Rationale posture",
      `- ${rationalePosture}`,
      ...(includeRationale ? [`- ${rationaleNote ?? "Keep the rationale note attached with the package."}`] : []),
      "",
      "## Blocker posture",
      ...(blockers.length > 0 ? blockers.slice(0, 2).map((blocker) => `- ${blocker}`) : ["- No blockers surfaced."]),
      `- ${blockerPosture}`,
      "",
      "## Included companions",
      ...companions.map((companion) => `- ${companion.label}: ${companion.status}. ${companion.detail}`)
    ].join("\n")
  };
}

function buildAttachmentOrderGuidance(
  destination: DeliveryDestination,
  selectedExportId: ExportSurfaceId,
  recommendedExportId: ExportSurfaceId,
  rationaleNote: string | null,
  copyPreflight: ReturnType<typeof buildCopyPreflightChecklist>,
  blockerCount: number
) {
  const isOverride = selectedExportId !== recommendedExportId;
  const includeRationale = isOverride || copyPreflight.tone !== "ready";
  const includeSidecar = destination !== "pr-comment" || blockerCount > 0 || copyPreflight.tone !== "ready";

  const stepsByDestination: Record<
    DeliveryDestination,
    Array<{ key: string; title: string; detail: string; active: boolean }>
  > = {
    "pr-comment": [
      {
        key: "export",
        title: "Primary export first",
        detail: `${exportSurfaces[selectedExportId].label} should stay first because the thread still needs the main handoff payload upfront.`,
        active: true
      },
      {
        key: "rationale",
        title: "Rationale note second",
        detail: isOverride
          ? "Attach the rationale note right after the export so readers understand why you overrode the default recommendation."
          : "Attach the rationale note only when the current choice still needs explanation or when readiness remains discussion-first.",
        active: includeRationale
      },
      {
        key: "sidecar",
        title: "Sidecar last",
        detail: "Use the sidecar as a compact trailing companion when blocker acknowledgement or confidence cues still matter in the thread.",
        active: includeSidecar
      }
    ],
    closeout: [
      {
        key: "export",
        title: "Closeout export first",
        detail: `${exportSurfaces[selectedExportId].label} should anchor the package because the closeout note still needs the main evidence-bearing export first.`,
        active: true
      },
      {
        key: "sidecar",
        title: "Sidecar second",
        detail: "Keep blocker acknowledgement and selection confidence immediately after the export so closure readers do not miss them.",
        active: true
      },
      {
        key: "rationale",
        title: "Rationale note third",
        detail: isOverride
          ? "Append the rationale note after the sidecar when reviewers need an explicit explanation for the override."
          : "Use the rationale note as an optional tail note when the closeout choice still needs extra explanation.",
        active: includeRationale
      }
    ],
    "pickup-handoff": [
      {
        key: "export",
        title: "Primary export first",
        detail: `${exportSurfaces[selectedExportId].label} should lead the handoff so the next operator sees the main task payload before the companions.`,
        active: true
      },
      {
        key: "rationale",
        title: "Rationale note second",
        detail: isOverride
          ? "Keep the rationale note near the top so the next operator sees why the fallback was chosen."
          : "Use the rationale note as a quick justification when the next operator needs to know why the recommendation still stands.",
        active: includeRationale
      },
      {
        key: "sidecar",
        title: "Sidecar third",
        detail: "Finish with the sidecar so destination fit, blockers, and selection confidence stay available as the next-step companion.",
        active: includeSidecar
      }
    ]
  };

  const steps = stepsByDestination[destination].map((step, index) => ({
    order: index + 1,
    ...step
  }));

  const checklist = [
    `Lead with ${exportSurfaces[selectedExportId].label}.`,
    ...(includeRationale
      ? [rationaleNote ? `Keep the rationale note attached: ${rationaleNote}` : "Keep a rationale note attached to explain the current choice."]
      : ["A separate rationale note is optional for this handoff."]),
    ...(includeSidecar
      ? ["Carry the copy sidecar with the package so destination fit, blockers, and confidence stay visible."]
      : ["The copy sidecar can stay optional unless blockers or confidence cues need extra emphasis."])
  ];

  return {
    summary:
      destination === "pr-comment"
        ? "Package the handoff for a GitHub thread by leading with the export and attaching companions only when they add real review value."
        : destination === "closeout"
          ? "Package the handoff as a closure bundle by keeping blocker and confidence cues close to the main export."
          : "Package the handoff for the next operator by keeping the main export first and the companions close behind it.",
    steps,
    checklist
  };
}

function buildReceiverGuidance(
  destination: DeliveryDestination,
  variant: BundleVariant,
  role: ReceiverRole,
  copyPreflight: ReturnType<typeof buildCopyPreflightChecklist>,
  nextActions: string[],
  blockers: string[]
) {
  const actionLead =
    role === "reviewer"
      ? destination === "pr-comment"
        ? "Review the copied bundle in-thread and decide whether the current evidence packet is sufficient for discussion."
        : destination === "closeout"
          ? "Review the copied bundle as a closure packet and call out whether evidence quality is strong enough for gate review."
          : "Review the pickup bundle and confirm whether the next operator has enough context to act without reopening the packet."
      : role === "approver"
        ? destination === "pr-comment"
          ? "Use the copied bundle to decide whether the branch is ready for a sign-off response or still needs more evidence."
          : destination === "closeout"
            ? "Use the copied bundle to make an explicit approve, hold, or escalate decision for the current exit path."
            : "Use the pickup bundle to decide whether execution can proceed immediately or needs another review checkpoint."
        : destination === "pr-comment"
          ? "Review the copied bundle in-thread and decide whether the current packet is enough for sign-off discussion."
          : destination === "closeout"
            ? "Review the copied bundle as a closure packet and decide whether the branch can actually clear the exit gate."
            : "Acknowledge pickup, name the first execution step, and keep the current blocker posture visible for the next operator.";
  const checklist = [
    actionLead,
    role === "reviewer"
      ? `Reviewer focus: ${nextActions[0] ?? "Confirm the strongest evidence-backed next action before treating the handoff as complete."}`
      : role === "approver"
        ? `Decision focus: ${nextActions[0] ?? "Name the next required action before issuing an approval or hold decision."}`
        : nextActions[0] ?? "Confirm the next concrete action before treating the handoff as complete.",
    blockers[0] === "No blocking issues surfaced in the current frontend-only review state."
      ? "Explicitly note that no blocking issues surfaced in the current review state."
      : `Carry the top blocker forward: ${blockers[0]}`,
    role === "reviewer"
      ? variant === "compact"
        ? "Ask for the full bundle if your review still needs rationale or confidence detail."
        : "Reply with the strongest evidence boundary that still needs attention after review."
      : role === "approver"
        ? variant === "compact"
          ? "Request the full bundle before deciding if the compact packet feels too light for approval."
          : "Reply with an explicit approve, hold, or escalate posture after reading the richer bundle."
        : variant === "compact"
          ? "Ask for the full bundle if the receiver still needs extra rationale or confidence context."
          : "Reply with the first follow-through action after reading the richer bundle."
  ];
  const replyPrompt =
    role === "reviewer"
      ? destination === "pr-comment"
        ? `Reviewer read the ${variant} bundle for ${deliveryDestinations[destination].label.toLowerCase()}; evidence confidence is ____, more context needed is ____, and blocker posture is ____.`
        : destination === "closeout"
          ? `Reviewer read the ${variant} closeout bundle; review posture is ____, strongest remaining evidence gap is ____, and blocker posture is ____.`
          : `Reviewer read the ${variant} pickup bundle; the next operator has enough context for ____ / still needs ____, and blocker posture is ____.`
      : role === "approver"
        ? destination === "pr-comment"
          ? `Approver reviewed the ${variant} bundle for ${deliveryDestinations[destination].label.toLowerCase()}; decision is approve / hold / request-more-context because ____, and blocker posture is ____.`
          : destination === "closeout"
            ? `Approver reviewed the ${variant} closeout bundle; gate decision is ____, required follow-through is ____, and blocker posture is ____.`
            : `Approver reviewed the ${variant} pickup bundle; execution may proceed after ____ / must pause for ____, and blocker posture is ____.`
        : destination === "pr-comment"
          ? `Reviewed the ${variant} bundle for ${deliveryDestinations[destination].label.toLowerCase()}; next step is ____, and blocker posture is ____.`
          : destination === "closeout"
            ? `Reviewed the ${variant} closeout bundle; gate decision is ____, next follow-through action is ____, and blocker posture is ____.`
            : `Picked up the ${variant} bundle; first execution step is ____, reply checkpoint is ____, and blocker posture is ____.`;

  return {
    roleLabel: receiverRoleProfiles[role].label,
    tone: copyPreflight.tone === "ready" && blockers[0] === "No blocking issues surfaced in the current frontend-only review state."
      ? "ready"
      : copyPreflight.tone,
    summary:
      role === "reviewer"
        ? variant === "compact"
          ? "Keep reviewer-facing cues attached so the next reviewer can quickly decide whether the compact bundle is enough."
          : "Carry reviewer-facing cues so the next reviewer can comment on evidence quality without rebuilding the handoff."
        : role === "approver"
          ? variant === "compact"
            ? "Keep approver-facing cues attached so the next decision-maker can request more context before clearing the handoff."
            : "Carry approver-facing cues so the next decision-maker can issue an approve, hold, or escalate posture from the same bundle."
          : variant === "compact"
            ? "Keep a short operator checklist and reply prompt attached so the next operator can confirm whether the compact bundle is enough."
            : "Carry explicit operator follow-through cues so the next reader can acknowledge the richer bundle and state the first action after review.",
    checklist,
    replyPrompt
  };
}

function buildFollowThroughRouting(
  destination: DeliveryDestination,
  variant: BundleVariant,
  role: ReceiverRole,
  copyPreflight: ReturnType<typeof buildCopyPreflightChecklist>,
  blockers: string[],
  nextActions: string[]
) {
  const hasCleanBlockers = blockers[0] === "No blocking issues surfaced in the current frontend-only review state.";
  const acknowledgeTone =
    copyPreflight.tone === "ready" && hasCleanBlockers ? "ready" : copyPreflight.tone === "followup" ? "followup" : "hold";
  const requestMoreTone =
    variant === "compact" || !hasCleanBlockers || copyPreflight.tone !== "ready" ? "followup" : "ready";
  const escalateTone =
    copyPreflight.tone === "hold" || !hasCleanBlockers || destination === "closeout" ? "hold" : "followup";
  const acknowledgePrompt =
    role === "approver"
      ? `Acknowledge receipt and state whether the ${deliveryDestinations[destination].label.toLowerCase()} handoff is approved to proceed.`
      : role === "reviewer"
        ? `Acknowledge receipt and state whether the current evidence packet is sufficient for review.`
        : `Acknowledge receipt and name the first execution step after reading the bundle.`;
  const requestMorePrompt =
    role === "approver"
      ? `Request the fuller packet, extra evidence, or a blocker update before you issue a final decision.`
      : role === "reviewer"
        ? `Request more context if the current packet still leaves evidence quality or confidence unresolved.`
        : `Request more context if the current bundle is too light to start execution safely.`;
  const escalatePrompt =
    role === "approver"
      ? `Escalate when the current blocker posture or gate risk is too strong for approval in this handoff.`
      : role === "reviewer"
        ? `Escalate when the evidence boundary is weak enough that normal review should pause.`
        : `Escalate when execution should pause and another reviewer or approver needs to step in.`;

  return {
    summary:
      "Use the routing strip to tell the receiver whether they should acknowledge, ask for more context, or escalate from the current bundle state.",
    routes: [
      {
        key: "acknowledge",
        label: "Acknowledge",
        tone: acknowledgeTone,
        detail:
          acknowledgeTone === "ready"
            ? "The current handoff is strong enough for a clean acknowledgement and forward motion."
            : "Acknowledge only as a provisional handoff; the receiver should keep the remaining gaps visible.",
        prompt: acknowledgePrompt
      },
      {
        key: "request-more-context",
        label: "Request More Context",
        tone: requestMoreTone,
        detail:
          requestMoreTone === "ready"
            ? "This remains available if the receiver wants the richer packet, but the current bundle is already fairly complete."
            : `Use this when the receiver still needs fuller context. Start from: ${nextActions[0] ?? "Name the next missing context item before proceeding."}`,
        prompt: requestMorePrompt
      },
      {
        key: "escalate",
        label: "Escalate",
        tone: escalateTone,
        detail:
          escalateTone === "hold"
            ? "The current posture is strong enough that escalation should stay visible as a first-class path."
            : "Keep escalation available when the receiver cannot comfortably acknowledge or request more context inside the current lane.",
        prompt: escalatePrompt
      }
    ]
  };
}

function buildDecisionTemplates(
  destination: DeliveryDestination,
  variant: BundleVariant,
  role: ReceiverRole,
  receiverGuidance: ReturnType<typeof buildReceiverGuidance>,
  followThroughRouting: ReturnType<typeof buildFollowThroughRouting>
) {
  const roleLabel = receiverRoleProfiles[role].label;
  const templates = followThroughRouting.routes.map((route) => ({
    key: route.key,
    label: route.label,
    tone: route.tone,
    detail: route.detail,
    prompt: route.prompt,
    markdown: [
      `### ${route.label}`,
      `- Receiver role: ${roleLabel}`,
      `- Destination: ${deliveryDestinations[destination].label}`,
      `- Bundle mode: ${bundleVariantProfiles[variant].label}`,
      `- Route tone: ${route.tone}`,
      `- Use when: ${route.detail}`,
      `- Suggested response: ${route.prompt}`
    ].join("\n")
  }));

  return {
    summary:
      "Use these snippets when the receiver is ready to send a concrete acknowledge, request-more-context, or escalate response without rewriting the routing guidance by hand.",
    templates,
    combinedMarkdown: [
      "## Decision Templates",
      ...templates.flatMap((template) => ["", template.markdown]),
      "",
      "## Shared Reply Prompt",
      `- ${receiverGuidance.replyPrompt}`
    ].join("\n")
  };
}

function buildGroupedResponsePack(
  destination: DeliveryDestination,
  variant: BundleVariant,
  role: ReceiverRole,
  decisionTemplates: ReturnType<typeof buildDecisionTemplates>
) {
  return {
    summary:
      "Use the grouped response pack when the receiver wants all three current paths together instead of copying each template one by one.",
    markdown: [
      "# Grouped Response Pack",
      "",
      `- Receiver role: ${receiverRoleProfiles[role].label}`,
      `- Destination: ${deliveryDestinations[destination].label}`,
      `- Bundle mode: ${bundleVariantProfiles[variant].label}`,
      "",
      decisionTemplates.combinedMarkdown
    ].join("\n")
  };
}

function buildRouteFilteredResponseKit(
  destination: DeliveryDestination,
  variant: BundleVariant,
  role: ReceiverRole,
  routeFilter: ResponseKitRouteFilter,
  activeRouteKey: string,
  decisionTemplates: ReturnType<typeof buildDecisionTemplates>,
  groupedResponsePack: ReturnType<typeof buildGroupedResponsePack>,
  sharedReplyPrompt: string
) {
  const activeTemplate =
    decisionTemplates.templates.find((template) => template.key === activeRouteKey) ?? decisionTemplates.templates[0];

  if (routeFilter === "all") {
    return {
      filterLabel: "All routes",
      summary: groupedResponsePack.summary,
      templates: decisionTemplates.templates,
      markdown: groupedResponsePack.markdown
    };
  }

  const resolvedRouteKey = routeFilter === "active" ? activeTemplate.key : routeFilter;
  const selectedTemplate =
    decisionTemplates.templates.find((template) => template.key === resolvedRouteKey) ?? activeTemplate;
  const filterLabel = routeFilter === "active" ? `Active route: ${selectedTemplate.label}` : selectedTemplate.label;
  const summary =
    routeFilter === "active"
      ? `Use the active-route response kit when the current preset workflow already points to ${selectedTemplate.label.toLowerCase()} and you want a narrower copy surface than the full grouped pack.`
      : `Use the ${selectedTemplate.label.toLowerCase()} kit when the receiver only needs that path instead of the full grouped response pack.`;

  return {
    filterLabel,
    summary,
    templates: [selectedTemplate],
    markdown: [
      "# Route-Filtered Response Kit",
      "",
      `- Receiver role: ${receiverRoleProfiles[role].label}`,
      `- Destination: ${deliveryDestinations[destination].label}`,
      `- Bundle mode: ${bundleVariantProfiles[variant].label}`,
      `- Route filter: ${filterLabel}`,
      "",
      selectedTemplate.markdown,
      "",
      "## Shared Reply Prompt",
      `- ${sharedReplyPrompt}`
    ].join("\n")
  };
}

function buildRoleSpecificBundlePlan(
  role: ReceiverRole,
  includeRationale: boolean,
  includeSidecar: boolean,
  variant: BundleVariant
) {
  const baseOrderByRole: Record<ReceiverRole, string[]> = {
    reviewer: [
      "primary-export",
      "receiver-follow-through",
      "rationale-note",
      "follow-through-routing",
      "decision-templates",
      "manifest",
      "copy-sidecar",
      "bundle-order"
    ],
    approver: [
      "receiver-follow-through",
      "follow-through-routing",
      "decision-templates",
      "manifest",
      "primary-export",
      "rationale-note",
      "copy-sidecar",
      "bundle-order"
    ],
    operator: [
      "primary-export",
      "receiver-follow-through",
      "copy-sidecar",
      "follow-through-routing",
      "decision-templates",
      "manifest",
      "rationale-note",
      "bundle-order"
    ]
  };
  const detailByRole: Record<ReceiverRole, Record<string, string>> = {
    reviewer: {
      "primary-export": "Lead with the evidence-bearing export so the reviewer can judge whether the packet is strong enough without hunting for the core payload.",
      "receiver-follow-through": "Keep the review checklist near the top so the reviewer can quickly say whether the packet is sufficient.",
      "rationale-note": "Keep rationale visible when the reviewer needs to understand why this package shape was chosen.",
      "follow-through-routing": "Show routing early so the reviewer can choose between acknowledge, request-more-context, and escalate paths.",
      "decision-templates": "Keep reusable response templates near the top so the reviewer can answer immediately from the current route.",
      manifest: "Keep the manifest visible so the reviewer can see what is included before asking for more context.",
      "copy-sidecar": "Keep destination-fit and blocker confidence nearby when a fuller review path still matters.",
      "bundle-order": "Show packaging order last as a reference once review priorities are already clear."
    },
    approver: {
      "primary-export": "Keep the main export high enough that the approver can inspect the core evidence before deciding.",
      "receiver-follow-through": "Put the decision-facing checklist first so the approver can issue approve, hold, or escalate posture quickly.",
      "rationale-note": "Keep rationale visible when the approver needs to understand why the current package shape should stand.",
      "follow-through-routing": "Keep routing near the top because the approver mainly needs the decision paths, not just the packet contents.",
      "decision-templates": "Keep reusable approve, hold, and escalate language near the top so the approver can answer from the same bundle.",
      manifest: "Keep the manifest visible so the approver sees the package scope before clearing it.",
      "copy-sidecar": "Keep blocker and confidence cues nearby when the approval decision still depends on delivery posture.",
      "bundle-order": "Keep packaging order as a lower-priority reference after the decision path is already visible."
    },
    operator: {
      "primary-export": "Lead with the operational payload so the next owner can act without scrolling through meta sections first.",
      "receiver-follow-through": "Keep the action checklist high because the operator mainly needs the first next step and reply checkpoint.",
      "rationale-note": "Keep rationale available, but lower, when the operator mainly needs execution context instead of decision framing.",
      "follow-through-routing": "Show routing before the manifest so the operator sees whether to acknowledge, ask for more context, or escalate.",
      "decision-templates": "Keep reusable response templates nearby so the operator can answer quickly after deciding the next action.",
      manifest: "Keep the manifest visible as a quick inventory after the action path is already understood.",
      "copy-sidecar": "Keep the sidecar high when the operator still needs blocker and destination-fit context beside the main export.",
      "bundle-order": "Keep packaging order last because it matters less than starting execution."
    }
  };
  const labelByKey: Record<string, string> = {
    "primary-export": "Primary export",
    "receiver-follow-through": "Receiver follow-through",
    "rationale-note": "Rationale note",
    "follow-through-routing": "Routing strip",
    "decision-templates": "Decision templates",
    manifest: "Package manifest",
    "copy-sidecar": "Copy sidecar",
    "bundle-order": "Bundle order guidance"
  };
  const available = new Set([
    "primary-export",
    "receiver-follow-through",
    "follow-through-routing",
    "decision-templates",
    "manifest",
    ...(includeRationale ? ["rationale-note"] : []),
    ...(includeSidecar ? ["copy-sidecar"] : []),
    ...(variant === "full" ? ["bundle-order"] : [])
  ]);
  const orderedKeys = baseOrderByRole[role].filter((key) => available.has(key));

  return {
    orderedKeys,
    orderedLabels: orderedKeys.map((key) => labelByKey[key] ?? key),
    pinnedSections: orderedKeys.slice(0, 3).map((key) => ({
      label: labelByKey[key] ?? key,
      detail: detailByRole[role][key]
    }))
  };
}

function buildFinalBundlePackage(
  variant: BundleVariant,
  destination: DeliveryDestination,
  role: ReceiverRole,
  selectedExportId: ExportSurfaceId,
  selectedExportMarkdown: string,
  recommendedExportId: ExportSurfaceId,
  rationaleNote: string | null,
  copySidecarMarkdown: string,
  recipientCoverSheetMarkdown: string,
  receiverGuidance: ReturnType<typeof buildReceiverGuidance>,
  followThroughRouting: ReturnType<typeof buildFollowThroughRouting>,
  decisionTemplates: ReturnType<typeof buildDecisionTemplates>,
  attachmentOrder: ReturnType<typeof buildAttachmentOrderGuidance>,
  copyPreflight: ReturnType<typeof buildCopyPreflightChecklist>,
  blockers: string[]
) {
  const selectedSurface = exportSurfaces[selectedExportId];
  const recommendedSurface = exportSurfaces[recommendedExportId];
  const followsRecommendation = selectedExportId === recommendedExportId;
  const requiredRationale = !followsRecommendation || copyPreflight.tone !== "ready";
  const requiredSidecar = destination !== "pr-comment" || blockers.length > 0 || copyPreflight.tone !== "ready";
  const includeRationale = variant === "full" ? true : requiredRationale;
  const includeSidecar = variant === "full" ? true : requiredSidecar;
  const rolePlan = buildRoleSpecificBundlePlan(role, includeRationale, includeSidecar, variant);
  const manifestItems = [
    {
      label: "Recipient cover sheet",
      status: "included",
      tone: "ready",
      detail: "Lead the package with the receiver-facing summary so destination, export choice, and blocker posture are visible before the detailed payload."
    },
    {
      label: "Primary export",
      status: "included",
      tone: "ready",
      detail: `${selectedSurface.label} stays in the package because it carries the main ${deliveryDestinations[destination].label.toLowerCase()} payload.`
    },
    {
      label: "Rationale note",
      status: includeRationale ? (requiredRationale ? "included" : "included in full") : "omitted in compact",
      tone: includeRationale ? "ready" : "followup",
      detail: includeRationale
        ? rationaleNote ?? "Include the rationale note so the receiver sees why this package shape was chosen."
        : "This note stays out of the compact bundle because the current package already matches the destination without extra explanation."
    },
    {
      label: "Copy sidecar",
      status: includeSidecar ? (requiredSidecar ? "included" : "included in full") : "omitted in compact",
      tone: includeSidecar ? "ready" : "followup",
      detail: includeSidecar
        ? "Include the sidecar so destination fit, blocker acknowledgement, and confidence cues travel with the copied bundle."
        : "This sidecar stays out of the compact bundle because the current destination does not need extra blocker or confidence scaffolding."
    },
    {
      label: "Receiver follow-through cues",
      status: "included",
      tone: receiverGuidance.tone,
      detail: receiverGuidance.summary
    },
    {
      label: "Routing strip",
      status: "included",
      tone: followThroughRouting.routes.some((route) => route.tone === "hold")
        ? "hold"
        : followThroughRouting.routes.some((route) => route.tone === "followup")
          ? "followup"
          : "ready",
      detail: followThroughRouting.summary
    },
    {
      label: "Decision-template snippets",
      status: "included",
      tone: decisionTemplates.templates.some((template) => template.tone === "hold")
        ? "hold"
        : decisionTemplates.templates.some((template) => template.tone === "followup")
          ? "followup"
          : "ready",
      detail: decisionTemplates.summary
    },
    {
      label: "Workbench-only guide surfaces",
      status: "intentionally omitted",
      tone: "hold",
      detail: "Leave packet chooser, routing guidance, and the rest of the workbench scaffolding behind; the final bundle should travel as a compact delivery artifact."
    }
  ];
  const sectionBlocks: Record<string, string[]> = {
    manifest: [
      variant === "full" ? "## Full Package Manifest" : "## Compact Package Manifest",
      ...manifestItems.map((item) => `- ${item.label}: ${item.status}. ${item.detail}`)
    ],
    "bundle-order": [
      "## Bundle Order",
      ...attachmentOrder.steps.filter((step) => step.active).map((step) => `- ${step.order}. ${step.title}: ${step.detail}`)
    ],
    "follow-through-routing": [
      "## Follow-Through Routing",
      ...followThroughRouting.routes.flatMap((route) => [
        `- ${route.label}: ${route.detail}`,
        `  - Prompt: ${route.prompt}`
      ])
    ],
    "decision-templates": [
      "## Decision Templates",
      ...decisionTemplates.templates.flatMap((template) => [
        `- ${template.label}: ${template.detail}`,
        `  - Suggested response: ${template.prompt}`
      ])
    ],
    "receiver-follow-through": [
      "## Receiver Follow-Through",
      `- Receiver role: ${receiverGuidance.roleLabel}`,
      ...receiverGuidance.checklist.map((item) => `- ${item}`)
    ],
    "primary-export": [selectedExportMarkdown],
    "rationale-note": [
      "## Rationale Note",
      rationaleNote ? `- ${rationaleNote}` : "- Keep the rationale note attached with the copied package."
    ],
    "copy-sidecar": [copySidecarMarkdown]
  };
  const orderedSections = ["Cover sheet lead-in", ...rolePlan.orderedLabels];
  const summary =
    variant === "full"
      ? "Copy a fuller delivery bundle that always carries the cover sheet, manifest, primary export, and both companion surfaces."
      : includeRationale || includeSidecar
        ? "Copy a compact delivery bundle that keeps the cover sheet, primary export, and only the companions this destination currently needs."
        : "Copy a compact delivery bundle with the cover sheet and primary export first, while the manifest records the companions intentionally left out.";

  return {
    variantLabel: bundleVariantProfiles[variant].label,
    roleLabel: receiverGuidance.roleLabel,
    summary,
    manifestItems,
    pinnedSections: rolePlan.pinnedSections,
    orderedSections,
    markdown: [
      recipientCoverSheetMarkdown,
      ...rolePlan.orderedKeys.flatMap((key) => ["", ...sectionBlocks[key]]),
      "",
      decisionTemplates.combinedMarkdown,
      "",
      "## Suggested Reply Prompt",
      `- ${receiverGuidance.replyPrompt}`
    ].join("\n")
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
  const [selectedDestination, setSelectedDestination] = useState<DeliveryDestination>("pr-comment");
  const [recommendedCopyState, setRecommendedCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [shortcutCopyState, setShortcutCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [selectedRationaleKey, setSelectedRationaleKey] = useState<string | null>(null);
  const [sidecarCopyState, setSidecarCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [coverSheetCopyState, setCoverSheetCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [bundleVariant, setBundleVariant] = useState<BundleVariant>("compact");
  const [receiverRole, setReceiverRole] = useState<ReceiverRole>("operator");
  const [finalBundleCopyState, setFinalBundleCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [decisionTemplateCopyState, setDecisionTemplateCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [responseShortcutCopyState, setResponseShortcutCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [lastShortcutLabel, setLastShortcutLabel] = useState<string>("");
  const [presetActionCopyState, setPresetActionCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [lastPresetLabel, setLastPresetLabel] = useState<string>("");
  const [responsePackCopyState, setResponsePackCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [selectedResponseKitRoute, setSelectedResponseKitRoute] = useState<ResponseKitRouteFilter>("active");
  const [responseKitComparisonCopyState, setResponseKitComparisonCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [sessionHandoffPacketCopyState, setSessionHandoffPacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [sessionSendCueCopyState, setSessionSendCueCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [sessionSenderNoteCopyState, setSessionSenderNoteCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [sessionSummaryCopyState, setSessionSummaryCopyState] = useState<"idle" | "copied" | "failed">("idle");

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
  const copySidecar = buildCopySidecarSummary(
    selectedDestination,
    selectedExport,
    recommendedExport.exportId,
    copyPreflight,
    blockers
  );
  const recipientCoverSheet = buildRecipientCoverSheet(
    selectedDestination,
    selectedExport,
    recommendedExport.exportId,
    selectedRationale?.note ?? null,
    copyPreflight,
    blockers
  );
  const attachmentOrder = buildAttachmentOrderGuidance(
    selectedDestination,
    selectedExport,
    recommendedExport.exportId,
    selectedRationale?.note ?? null,
    copyPreflight,
    blockers.length
  );
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
  const handoffBundlePreview = buildHandoffBundlePreview(
    selectedDestination,
    selectedExport,
    exportMarkdownById[selectedExport],
    selectedRationale?.note ?? null,
    copySidecar.markdown
  );
  const receiverGuidance = buildReceiverGuidance(
    selectedDestination,
    bundleVariant,
    receiverRole,
    copyPreflight,
    nextActions,
    blockers
  );
  const followThroughRouting = buildFollowThroughRouting(
    selectedDestination,
    bundleVariant,
    receiverRole,
    copyPreflight,
    blockers,
    nextActions
  );
  const decisionTemplates = buildDecisionTemplates(
    selectedDestination,
    bundleVariant,
    receiverRole,
    receiverGuidance,
    followThroughRouting
  );
  const groupedResponsePack = buildGroupedResponsePack(
    selectedDestination,
    bundleVariant,
    receiverRole,
    decisionTemplates
  );
  const primaryResponseShortcut =
    decisionTemplates.templates.find((template) => template.tone === "ready") ?? decisionTemplates.templates[0];
  const routeFilteredResponseKit = buildRouteFilteredResponseKit(
    selectedDestination,
    bundleVariant,
    receiverRole,
    selectedResponseKitRoute,
    primaryResponseShortcut.key,
    decisionTemplates,
    groupedResponsePack,
    receiverGuidance.replyPrompt
  );
  const responseKitFilterOptions: Array<{ key: ResponseKitRouteFilter; label: string }> = [
    { key: "active", label: "Active route" },
    { key: "all", label: "All routes" },
    ...decisionTemplates.templates.map((template) => ({
      key: template.key as ResponseKitRouteFilter,
      label: template.label
    }))
  ];
  const comparisonAnchorRouteFilter = selectedResponseKitRoute === "all" ? ("active" as const) : selectedResponseKitRoute;
  const comparisonAnchorKit = buildRouteFilteredResponseKit(
    selectedDestination,
    bundleVariant,
    receiverRole,
    comparisonAnchorRouteFilter,
    primaryResponseShortcut.key,
    decisionTemplates,
    groupedResponsePack,
    receiverGuidance.replyPrompt
  );
  const comparisonAnchorTemplate = comparisonAnchorKit.templates[0];
  const alternateResponseKitCards = decisionTemplates.templates
    .filter((template) => template.key !== comparisonAnchorTemplate.key)
    .map((template) => {
      const alternateKit = buildRouteFilteredResponseKit(
        selectedDestination,
        bundleVariant,
        receiverRole,
        template.key as ResponseKitRouteFilter,
        primaryResponseShortcut.key,
        decisionTemplates,
        groupedResponsePack,
        receiverGuidance.replyPrompt
      );

      return {
        template,
        alternateKit
      };
    });
  const responseKitComparisonMarkdown = [
    "# Response Kit Comparison",
    "",
    `- Anchor route: ${comparisonAnchorTemplate.label}`,
    `- Current chooser: ${responseKitFilterOptions.find((option) => option.key === selectedResponseKitRoute)?.label ?? "Unknown"}`,
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Bundle mode: ${bundleVariantProfiles[bundleVariant].label}`,
    `- Receiver role: ${receiverRoleProfiles[receiverRole].label}`,
    "",
    "## Anchor Route Kit",
    comparisonAnchorKit.markdown,
    "",
    "## Alternate Route Kits",
    ...alternateResponseKitCards.flatMap(({ alternateKit }) => ["", alternateKit.markdown])
  ].join("\n");
  const finalBundlePackage = buildFinalBundlePackage(
    bundleVariant,
    selectedDestination,
    receiverRole,
    selectedExport,
    exportMarkdownById[selectedExport],
    recommendedExport.exportId,
    selectedRationale?.note ?? null,
    copySidecar.markdown,
    recipientCoverSheet.markdown,
    receiverGuidance,
    followThroughRouting,
    decisionTemplates,
    attachmentOrder,
    copyPreflight,
    blockers
  );
  const rolePresetCards = (["reviewer", "approver", "operator"] as ReceiverRole[]).map((role) => {
    const preset = rolePresetProfiles[role];
    const recommendation = recommendedExportForDestination(preset.destination, pickupLane, deliveryReadiness);
    const exportId = recommendation.exportId;
    const presetCoverage = exportCoverage[exportId];
    const presetCopyPreflight = buildCopyPreflightChecklist(
      preset.destination,
      exportId,
      recommendation.exportId,
      presetCoverage,
      deliveryReadiness,
      blockers.length
    );
    const presetRationaleOptions = buildSelectionRationaleOptions(
      preset.destination,
      exportId,
      recommendation.exportId,
      presetCoverage,
      exportCoverage[recommendation.exportId],
      deliveryReadiness,
      blockers.length
    );
    const presetRationale = presetRationaleOptions[0];
    const presetCopySidecar = buildCopySidecarSummary(
      preset.destination,
      exportId,
      recommendation.exportId,
      presetCopyPreflight,
      blockers
    );
    const presetRecipientCoverSheet = buildRecipientCoverSheet(
      preset.destination,
      exportId,
      recommendation.exportId,
      presetRationale?.note ?? null,
      presetCopyPreflight,
      blockers
    );
    const presetAttachmentOrder = buildAttachmentOrderGuidance(
      preset.destination,
      exportId,
      recommendation.exportId,
      presetRationale?.note ?? null,
      presetCopyPreflight,
      blockers.length
    );
    const presetReceiverGuidance = buildReceiverGuidance(
      preset.destination,
      preset.variant,
      role,
      presetCopyPreflight,
      nextActions,
      blockers
    );
    const presetFollowThroughRouting = buildFollowThroughRouting(
      preset.destination,
      preset.variant,
      role,
      presetCopyPreflight,
      blockers,
      nextActions
    );
    const presetDecisionTemplates = buildDecisionTemplates(
      preset.destination,
      preset.variant,
      role,
      presetReceiverGuidance,
      presetFollowThroughRouting
    );
    const presetFinalBundle = buildFinalBundlePackage(
      preset.variant,
      preset.destination,
      role,
      exportId,
      exportMarkdownById[exportId],
      recommendation.exportId,
      presetRationale?.note ?? null,
      presetCopySidecar.markdown,
      presetRecipientCoverSheet.markdown,
      presetReceiverGuidance,
      presetFollowThroughRouting,
      presetDecisionTemplates,
      presetAttachmentOrder,
      presetCopyPreflight,
      blockers
    );

    return {
      role,
      preset,
      recommendation,
      exportSurface: exportSurfaces[recommendation.exportId],
      finalBundleMarkdown: presetFinalBundle.markdown
    };
  });
  const activePresetSession =
    rolePresetCards.find(
      ({ role, preset, recommendation }) =>
        receiverRole === role &&
        bundleVariant === preset.variant &&
        selectedDestination === preset.destination &&
        selectedExport === recommendation.exportId
    ) ?? null;
  const sessionPresetLabel = activePresetSession
    ? `${receiverRoleProfiles[activePresetSession.role].label} preset`
    : "Custom preset session";
  const sessionPresetDetail = activePresetSession
    ? activePresetSession.preset.summary
    : `The current ${receiverRoleProfiles[receiverRole].label.toLowerCase()} handoff posture overrides at least one default preset choice while staying inside the same frontend-only workflow.`;
  const sessionCueCards = [
    {
      label: "Role preset",
      value: activePresetSession ? receiverRoleProfiles[activePresetSession.role].label : `${receiverRoleProfiles[receiverRole].label} (custom)`,
      detail: activePresetSession
        ? activePresetSession.preset.emphasis
        : `Base role focus: ${receiverRoleProfiles[receiverRole].summary}`
    },
    {
      label: "Bundle mode",
      value: bundleVariantProfiles[bundleVariant].label,
      detail: bundleVariantProfiles[bundleVariant].summary
    },
    {
      label: "Destination",
      value: deliveryDestinations[selectedDestination].label,
      detail: activePresetSession ? activePresetSession.recommendation.reason : deliveryDestinations[selectedDestination].summary
    },
    {
      label: "Response posture",
      value: primaryResponseShortcut.label,
      detail: primaryResponseShortcut.detail
    }
  ];
  const presetSessionSummaryMarkdown = [
    "## Active Preset Session",
    `- Session: ${sessionPresetLabel}`,
    `- Role preset: ${sessionCueCards[0].value}`,
    `- Bundle mode: ${bundleVariantProfiles[bundleVariant].label}`,
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Recommended export: ${selectedExportSurface.label}`,
    `- Response posture: ${primaryResponseShortcut.label} (${primaryResponseShortcut.tone})`,
    `- Pickup lane: ${pickupLane}`,
    "",
    "## Session Cues",
    ...sessionCueCards.map((cue) => `- ${cue.label}: ${cue.value} - ${cue.detail}`),
    "",
    "## Session Note",
    `- ${sessionPresetDetail}`
  ].join("\n");
  const sessionHandoffPacketHighlights = [
    {
      label: "Session source",
      value: sessionPresetLabel,
      detail: sessionPresetDetail
    },
    {
      label: "Selected route kit",
      value: routeFilteredResponseKit.filterLabel,
      detail: routeFilteredResponseKit.summary
    },
    {
      label: "Send-ready use",
      value: deliveryDestinations[selectedDestination].label,
      detail: "Use this packet when the next reader should receive the active preset session context and the selected route kit together in one copyable handoff."
    }
  ];
  const presetSessionHandoffPacketMarkdown = [
    "# Preset Session Handoff Packet",
    "",
    `- Session: ${sessionPresetLabel}`,
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Bundle mode: ${bundleVariantProfiles[bundleVariant].label}`,
    `- Receiver role: ${receiverRoleProfiles[receiverRole].label}`,
    `- Primary export: ${selectedExportSurface.label}`,
    `- Route kit: ${routeFilteredResponseKit.filterLabel}`,
    "",
    "## Active Session Summary",
    presetSessionSummaryMarkdown,
    "",
    "## Selected Route Kit",
    routeFilteredResponseKit.markdown
  ].join("\n");
  const sessionSendCueCards = [
    {
      label: "Destination cue",
      value: deliveryDestinations[selectedDestination].label,
      detail: deliveryDestinations[selectedDestination].summary
    },
    {
      label: "Route cue",
      value: routeFilteredResponseKit.filterLabel,
      detail: routeFilteredResponseKit.summary
    },
    {
      label: "Receiver cue",
      value: receiverGuidance.roleLabel,
      detail: receiverGuidance.summary
    }
  ];
  const sessionSendChecklistItems = [
    ...copyPreflight.items,
    {
      label: "Receiver posture",
      tone: receiverGuidance.tone,
      detail: receiverGuidance.summary
    }
  ];
  const sessionSendCueMarkdown = [
    "# Session Handoff Send Cues",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Send readiness: ${copyPreflight.tone}`,
    "",
    "## Destination And Delivery Cues",
    ...sessionSendCueCards.map((item) => `- ${item.label}: ${item.value} - ${item.detail}`),
    "",
    "## Send-Readiness Checklist",
    ...sessionSendChecklistItems.map((item) => `- [${item.tone}] ${item.label}: ${item.detail}`)
  ].join("\n");
  const sessionSenderSubjectLine =
    selectedDestination === "pr-comment"
      ? `Review handoff: ${routeFilteredResponseKit.filterLabel} for ${receiverGuidance.roleLabel}`
      : selectedDestination === "closeout"
        ? `Closeout handoff: ${sessionPresetLabel} / ${routeFilteredResponseKit.filterLabel}`
        : `Pickup handoff: ${sessionPresetLabel} / ${routeFilteredResponseKit.filterLabel}`;
  const sessionSenderHighlights = [
    {
      label: "Subject line",
      value: sessionSenderSubjectLine,
      detail: "Use this as the delivery subject when the handoff packet is leaving the workbench and needs a concise header."
    },
    {
      label: "Destination",
      value: deliveryDestinations[selectedDestination].label,
      detail: deliveryDestinations[selectedDestination].summary
    },
    {
      label: "Route",
      value: routeFilteredResponseKit.filterLabel,
      detail: routeFilteredResponseKit.summary
    }
  ];
  const sessionSenderNoteMarkdown = [
    "# Sender Note",
    "",
    `Subject: ${sessionSenderSubjectLine}`,
    "",
    selectedDestination === "pr-comment"
      ? `Sharing the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} handoff packet for ${receiverGuidance.roleLabel.toLowerCase()} review. The current route cue is ${routeFilteredResponseKit.filterLabel.toLowerCase()}, and the packet is being sent with ${copyPreflight.tone} readiness posture.`
      : selectedDestination === "closeout"
        ? `Sharing the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} handoff packet for closeout-facing review. The current route cue is ${routeFilteredResponseKit.filterLabel.toLowerCase()}, and the packet is being sent with ${copyPreflight.tone} readiness posture.`
        : `Sharing the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} handoff packet for the next operator pickup. The current route cue is ${routeFilteredResponseKit.filterLabel.toLowerCase()}, and the packet is being sent with ${copyPreflight.tone} readiness posture.`,
    "",
    "## Receiver Cue",
    `- ${receiverGuidance.replyPrompt}`,
    "",
    "## Destination Cue",
    `- ${deliveryDestinations[selectedDestination].summary}`,
    "",
    "## Top Blocker Cue",
    `- ${blockers[0]}`,
    "",
    "## Suggested Note",
    `- ${copyPreflight.summary}`
  ].join("\n");
  const fullSessionHandoffPacketMarkdown = [
    "# Full Preset Session Handoff Packet",
    "",
    `- Session: ${sessionPresetLabel}`,
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Bundle mode: ${bundleVariantProfiles.full.label}`,
    `- Receiver role: ${receiverRoleProfiles[receiverRole].label}`,
    `- Primary export: ${selectedExportSurface.label}`,
    `- Route kit: ${routeFilteredResponseKit.filterLabel}`,
    "",
    "## Active Session Summary",
    presetSessionSummaryMarkdown,
    "",
    "## Selected Route Kit",
    routeFilteredResponseKit.markdown,
    "",
    "## Send-Readiness Cues",
    sessionSendCueMarkdown,
    "",
    "## Route Comparison",
    responseKitComparisonMarkdown
  ].join("\n");
  const activeSessionHandoffPacketMarkdown =
    bundleVariant === "full" ? fullSessionHandoffPacketMarkdown : presetSessionHandoffPacketMarkdown;
  const sessionHandoffVariantCoverage: Record<
    BundleVariant,
    { summary: string; includes: string[]; omits: string[]; markdown: string }
  > = {
    compact: {
      summary: "Carry the active session summary and selected route kit only, leaving the send cues and alternate-route context behind for the lighter handoff.",
      includes: ["Active session summary", "Selected route kit", "Packet header metadata"],
      omits: ["Send-readiness cues", "Alternate route comparison context"],
      markdown: presetSessionHandoffPacketMarkdown
    },
    full: {
      summary: "Carry the full session handoff packet with send-readiness cues and route-comparison context attached for a more review-heavy delivery.",
      includes: [
        "Active session summary",
        "Selected route kit",
        "Send-readiness cues",
        "Alternate route comparison context"
      ],
      omits: [],
      markdown: fullSessionHandoffPacketMarkdown
    }
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

            <article className="artifactCard sidecarCard">
              <div className="artifactMeta">
                <span>copy sidecar</span>
                <code>handoff companion</code>
              </div>
              <div className="claimHeader">
                <strong>Copy sidecar summary</strong>
                <button
                  type="button"
                  className="actionButton"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(copySidecar.markdown);
                      setSidecarCopyState("copied");
                    } catch {
                      setSidecarCopyState("failed");
                    }
                  }}
                >
                  Copy sidecar
                </button>
              </div>
              <p className="scoreHint">
                Carry this beside the copied export when the next reader needs destination fit, blocker acknowledgement,
                and selection confidence without re-reading the whole workbench.
              </p>
              <div className="statusRow">
                <span className={`statusPill statusPill${copySidecar.tone}`}>{copySidecar.confidenceLabel}</span>
                <span className="pill">{selectedExportSurface.label}</span>
              </div>

              <div className="handoffSections">
                <div className="handoffSection">
                  <h3>Destination fit</h3>
                  <p>{copySidecar.destinationFit}</p>
                </div>

                <div
                  className={`handoffSection${
                    blockers.length > 0 ? " handoffSectionWarning" : " handoffSectionReady"
                  }`}
                >
                  <h3>Blocker acknowledgement</h3>
                  <p>{copySidecar.blockerSummary}</p>
                </div>

                <div className="handoffSection">
                  <h3>Selection confidence</h3>
                  <p>{copySidecar.confidenceSummary}</p>
                </div>
              </div>

              <textarea className="packetField packetFieldCompact" readOnly value={copySidecar.markdown} />
              <p className="scoreHint">
                {sidecarCopyState === "copied"
                  ? "Copy sidecar copied to clipboard."
                  : sidecarCopyState === "failed"
                    ? "Clipboard copy failed. You can still copy from the sidecar field."
                    : "Use this sidecar when the next reader needs quick destination-fit and blocker-confidence context beside the main export."}
              </p>
            </article>

            <article className="artifactCard coverSheetCard">
              <div className="artifactMeta">
                <span>cover sheet</span>
                <code>recipient-facing lead-in</code>
              </div>
              <div className="claimHeader">
                <strong>Recipient-facing cover sheet</strong>
                <button
                  type="button"
                  className="actionButton"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(recipientCoverSheet.markdown);
                      setCoverSheetCopyState("copied");
                    } catch {
                      setCoverSheetCopyState("failed");
                    }
                  }}
                >
                  Copy cover sheet
                </button>
              </div>
              <p className="scoreHint">
                Lead the final package with a concise reader-facing summary of destination, export choice, rationale
                posture, blocker state, and the companions that will travel with the handoff.
              </p>

              <div className="coverSheetHighlightGrid">
                <article className="coverSheetHighlight">
                  <span>Destination</span>
                  <strong>{deliveryDestinations[selectedDestination].label}</strong>
                  <p>{selectedExportSurface.label} is the lead export for this package.</p>
                </article>
                <article className="coverSheetHighlight">
                  <span>Recommendation posture</span>
                  <strong>{recipientCoverSheet.recommendationPosture}</strong>
                  <p>{recipientCoverSheet.rationalePosture}</p>
                </article>
                <article className="coverSheetHighlight">
                  <span>Bundle confidence</span>
                  <strong>
                    {copyPreflight.tone === "ready"
                      ? "ready to send"
                      : copyPreflight.tone === "followup"
                        ? "usable with follow-up"
                        : "draft-only handoff"}
                  </strong>
                  <p>{recipientCoverSheet.blockerPosture}</p>
                </article>
              </div>

              <div className="statusRow">
                <span className={`statusPill statusPill${recipientCoverSheet.statusTone}`}>
                  {recipientCoverSheet.recommendationPosture}
                </span>
                <span className="pill">{selectedExportSurface.label}</span>
              </div>

              <div className="handoffSections">
                <div className="handoffSection">
                  <h3>Receiver orientation</h3>
                  <p>{recipientCoverSheet.deliveryLead}</p>
                </div>

                <div
                  className={`handoffSection${
                    blockers.length > 0 || copyPreflight.tone === "hold" ? " handoffSectionWarning" : " handoffSectionReady"
                  }`}
                >
                  <h3>Blocker posture</h3>
                  <p>{recipientCoverSheet.blockerPosture}</p>
                </div>

                <div className="handoffSection">
                  <h3>Included companions</h3>
                  <ul className="checklist compact">
                    {recipientCoverSheet.companions.map((companion) => (
                      <li key={companion.label}>
                        {companion.label}: {companion.status}. {companion.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <textarea className="packetField packetFieldCompact" readOnly value={recipientCoverSheet.markdown} />
              <p className="scoreHint">
                {coverSheetCopyState === "copied"
                  ? "Cover sheet copied to clipboard."
                  : coverSheetCopyState === "failed"
                    ? "Clipboard copy failed. You can still copy from the cover-sheet field."
                    : "Use this cover sheet when you want the receiver to understand the package purpose before reading the detailed export and companions."}
              </p>
            </article>

            <article className="artifactCard bundlePreviewCard">
              <div className="artifactMeta">
                <span>bundle preview</span>
                <code>export + rationale + sidecar</code>
              </div>
              <div className="claimHeader">
                <strong>Composed handoff bundle</strong>
                <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
              </div>
              <p className="scoreHint">
                Preview how the current export, rationale note, and copy sidecar fit together before you hand the bundle off.
              </p>

              <div className="bundlePreviewStack">
                <article className="bundleComponentCard">
                  <div className="claimHeader">
                    <strong>1. Primary export</strong>
                    <span className="pill">{selectedExportSurface.label}</span>
                  </div>
                  <p className="scoreHint">{selectedExportSurface.destination}</p>
                  <pre className="bundlePreviewPre">{handoffBundlePreview.exportPreview.excerpt}</pre>
                </article>

                <article className="bundleComponentCard">
                  <div className="claimHeader">
                    <strong>2. Rationale note</strong>
                    <span className="pill">
                      {selectedExport === recommendedExport.exportId ? "keep" : "override"}
                    </span>
                  </div>
                  <p className="scoreHint">
                    {selectedRationale?.note ?? "No rationale note selected."}
                  </p>
                </article>

                <article className="bundleComponentCard">
                  <div className="claimHeader">
                    <strong>3. Copy sidecar</strong>
                    <span className={`statusPill statusPill${copySidecar.tone}`}>{copySidecar.confidenceLabel}</span>
                  </div>
                  <p className="scoreHint">{copySidecar.destinationFit}</p>
                  <pre className="bundlePreviewPre">{handoffBundlePreview.sidecarPreview.excerpt}</pre>
                </article>
              </div>

              <textarea className="packetField packetFieldCompact" readOnly value={handoffBundlePreview.markdown} />
              <p className="scoreHint">
                Use this preview to sanity-check the current package composition before you copy the main export and its companions into the next handoff.
              </p>
            </article>

            <div className="attachmentBoard">
              <div className="claimHeader">
                <strong>Attachment order</strong>
                <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
              </div>
              <p className="scoreHint">{attachmentOrder.summary}</p>

              <div className="attachmentStepGrid">
                {attachmentOrder.steps.map((step) => (
                  <article
                    key={step.key}
                    className={`attachmentStepCard${step.active ? " attachmentStepCardActive" : ""}`}
                  >
                    <div className="claimHeader">
                      <strong>{step.order}. {step.title}</strong>
                      <span className={`statusPill statusPill${step.active ? "ready" : "followup"}`}>
                        {step.active ? "attach" : "optional"}
                      </span>
                    </div>
                    <p className="scoreHint">{step.detail}</p>
                  </article>
                ))}
              </div>

              <div className="handoffSection">
                <h3>Companion checklist</h3>
                <ul className="checklist compact">
                  {attachmentOrder.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <article className="artifactCard finalBundleCard">
              <div className="artifactMeta">
                <span>final bundle</span>
                <code>one-step delivery copy</code>
              </div>
              <div className="claimHeader">
                <strong>One-step final bundle</strong>
                <button
                  type="button"
                  className="actionButton"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(finalBundlePackage.markdown);
                      setFinalBundleCopyState("copied");
                    } catch {
                      setFinalBundleCopyState("failed");
                    }
                  }}
                >
                  Copy final bundle
                </button>
              </div>
              <p className="scoreHint">{finalBundlePackage.summary}</p>

              <div className="laneToggleGroup" role="tablist" aria-label="Final bundle variant chooser">
                {(["compact", "full"] as BundleVariant[]).map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    className={`laneToggleButton${bundleVariant === variant ? " laneToggleButtonActive" : ""}`}
                    onClick={() => setBundleVariant(variant)}
                  >
                    {bundleVariantProfiles[variant].label}
                  </button>
                ))}
              </div>
              <p className="scoreHint">{bundleVariantProfiles[bundleVariant].summary}</p>

              <div className="laneToggleGroup" role="tablist" aria-label="Receiver role chooser">
                {(["reviewer", "approver", "operator"] as ReceiverRole[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`laneToggleButton${receiverRole === role ? " laneToggleButtonActive" : ""}`}
                    onClick={() => setReceiverRole(role)}
                  >
                    {receiverRoleProfiles[role].label}
                  </button>
                ))}
              </div>
              <p className="scoreHint">{receiverRoleProfiles[receiverRole].summary}</p>

              <div className="presetGrid">
                {rolePresetCards.map(({ role, preset, recommendation, exportSurface, finalBundleMarkdown }) => {
                  const isActive =
                    receiverRole === role &&
                    bundleVariant === preset.variant &&
                    selectedDestination === preset.destination &&
                    selectedExport === recommendation.exportId;

                  return (
                    <article key={role} className={`presetCard${isActive ? " presetCardActive" : ""}`}>
                      <div className="claimHeader">
                        <strong>{receiverRoleProfiles[role].label} preset</strong>
                        {isActive ? <span className="statusPill statusPillready">active</span> : null}
                      </div>
                      <p className="scoreHint">{preset.summary}</p>
                      <p>
                        <strong>Bundle mode:</strong> {bundleVariantProfiles[preset.variant].label}
                      </p>
                      <p>
                        <strong>Destination:</strong> {deliveryDestinations[preset.destination].label}
                      </p>
                      <p>
                        <strong>Recommended export:</strong> {exportSurface.label}
                      </p>
                      <p className="scoreHint">
                        <strong>Emphasis:</strong> {preset.emphasis}
                      </p>
                      <p className="scoreHint">{recommendation.reason}</p>
                      <div className="shortcutActions">
                        <button
                          type="button"
                          className="actionButton"
                          onClick={() => {
                            setReceiverRole(role);
                            setBundleVariant(preset.variant);
                            setSelectedDestination(preset.destination);
                            setSelectedExport(recommendation.exportId);
                          }}
                        >
                          {isActive ? "Preset active" : "Use preset"}
                        </button>
                        <button
                          type="button"
                          className="actionButton"
                          onClick={async () => {
                            setReceiverRole(role);
                            setBundleVariant(preset.variant);
                            setSelectedDestination(preset.destination);
                            setSelectedExport(recommendation.exportId);

                            try {
                              await navigator.clipboard.writeText(finalBundleMarkdown);
                              setLastPresetLabel(receiverRoleProfiles[role].label);
                              setPresetActionCopyState("copied");
                            } catch {
                              setLastPresetLabel(receiverRoleProfiles[role].label);
                              setPresetActionCopyState("failed");
                            }
                          }}
                        >
                          Apply and copy
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="scoreHint">
                {presetActionCopyState === "copied"
                  ? `${lastPresetLabel} preset applied and copied.`
                  : presetActionCopyState === "failed"
                    ? `Clipboard copy failed for the ${lastPresetLabel || "selected"} preset.`
                    : "Use preset to only switch the bundle posture, or Apply and copy to switch and immediately copy the recommended package."}
              </p>

              <div className="shortcutStrip">
                <div className="shortcutHeader">
                  <div>
                    <strong>Active preset session</strong>
                    <p className="scoreHint">{sessionPresetDetail}</p>
                  </div>
                  <div className="shortcutActions">
                    <span className={`statusPill statusPill${primaryResponseShortcut.tone}`}>{primaryResponseShortcut.label}</span>
                    <button
                      type="button"
                      className="actionButton"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(presetSessionSummaryMarkdown);
                          setSessionSummaryCopyState("copied");
                        } catch {
                          setSessionSummaryCopyState("failed");
                        }
                      }}
                    >
                      Copy session summary
                    </button>
                  </div>
                </div>

                <div className="statusRow">
                  <span className="pill">{sessionPresetLabel}</span>
                  <span className="pill">{bundleVariantProfiles[bundleVariant].label}</span>
                  <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                  <span className="pill">{selectedExportSurface.label}</span>
                </div>

                <div className="manifestGrid">
                  {sessionCueCards.map((cue) => (
                    <article key={cue.label} className="manifestCard">
                      <div className="claimHeader">
                        <strong>{cue.label}</strong>
                        <span className="pill">{cue.value}</span>
                      </div>
                      <p className="scoreHint">{cue.detail}</p>
                    </article>
                  ))}
                </div>

                <p className="scoreHint">
                  {sessionSummaryCopyState === "copied"
                    ? "Preset session summary copied to clipboard."
                    : sessionSummaryCopyState === "failed"
                      ? "Clipboard copy failed for the preset session summary."
                      : "Keep this strip visible while switching presets, bundle mode, destination, or response posture so the current handoff session never becomes implicit."}
                </p>
              </div>

              <div className="statusRow">
                <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                <span className="pill">{finalBundlePackage.variantLabel}</span>
                <span className="pill">{finalBundlePackage.roleLabel}</span>
                <span className="pill">{selectedExportSurface.label}</span>
              </div>

              <div className="handoffSection">
                <h3>Role-pinned sections</h3>
                <div className="manifestGrid">
                  {finalBundlePackage.pinnedSections.map((section) => (
                    <article key={section.label} className="manifestCard">
                      <div className="claimHeader">
                        <strong>{section.label}</strong>
                        <span className="statusPill statusPillready">pinned</span>
                      </div>
                      <p className="scoreHint">{section.detail}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="manifestGrid">
                {finalBundlePackage.manifestItems.map((item) => (
                  <article key={item.label} className="manifestCard">
                    <div className="claimHeader">
                      <strong>{item.label}</strong>
                      <span className={`statusPill statusPill${item.tone}`}>{item.status}</span>
                    </div>
                    <p className="scoreHint">{item.detail}</p>
                  </article>
                ))}
              </div>

              <div className="handoffSection">
                <h3>Bundle order</h3>
                <ul className="checklist compact">
                  {finalBundlePackage.orderedSections.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="handoffSection">
                <h3>Follow-through routing</h3>
                <p className="scoreHint">{followThroughRouting.summary}</p>
                <div className="manifestGrid">
                  {followThroughRouting.routes.map((route) => (
                    <article key={route.key} className="manifestCard">
                      <div className="claimHeader">
                        <strong>{route.label}</strong>
                        <span className={`statusPill statusPill${route.tone}`}>{route.tone}</span>
                      </div>
                      <p className="scoreHint">{route.detail}</p>
                      <p className="scoreHint">{route.prompt}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="handoffSection">
                <div className="claimHeader">
                  <h3>Decision templates</h3>
                  <button
                    type="button"
                    className="actionButton"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(decisionTemplates.combinedMarkdown);
                        setDecisionTemplateCopyState("copied");
                      } catch {
                        setDecisionTemplateCopyState("failed");
                      }
                    }}
                  >
                    Copy templates
                  </button>
                </div>
                <p className="scoreHint">{decisionTemplates.summary}</p>

                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <strong>Response-packaging shortcuts</strong>
                    <span className="pill">{primaryResponseShortcut.label}</span>
                  </div>
                  <p className="scoreHint">
                    Use the shortcut strip when you already know which response path you need and want the current
                    role-aware template without re-copying the whole template set.
                  </p>
                  <div className="shortcutActions">
                    <button
                      type="button"
                      className="actionButton"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(primaryResponseShortcut.markdown);
                          setLastShortcutLabel(primaryResponseShortcut.label);
                          setResponseShortcutCopyState("copied");
                        } catch {
                          setLastShortcutLabel(primaryResponseShortcut.label);
                          setResponseShortcutCopyState("failed");
                        }
                      }}
                    >
                      Copy {primaryResponseShortcut.label}
                    </button>
                  </div>
                  <div className="shortcutAltList">
                    {decisionTemplates.templates.map((template) => (
                      <button
                        key={template.key}
                        type="button"
                        className="laneToggleButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(template.markdown);
                            setLastShortcutLabel(template.label);
                            setResponseShortcutCopyState("copied");
                          } catch {
                            setLastShortcutLabel(template.label);
                            setResponseShortcutCopyState("failed");
                          }
                        }}
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                  <p className="scoreHint">
                    {responseShortcutCopyState === "copied"
                      ? `${lastShortcutLabel} shortcut copied to clipboard.`
                      : responseShortcutCopyState === "failed"
                        ? `Clipboard copy failed for ${lastShortcutLabel || "the selected"} shortcut.`
                        : "Use the shortcut buttons for a fast per-route response template without leaving the final bundle surface."}
                  </p>
                </div>

                <div className="manifestGrid">
                  {decisionTemplates.templates.map((template) => (
                    <article key={template.key} className="manifestCard">
                      <div className="claimHeader">
                        <strong>{template.label}</strong>
                        <span className={`statusPill statusPill${template.tone}`}>{template.tone}</span>
                      </div>
                      <p className="scoreHint">{template.detail}</p>
                      <pre className="bundlePreviewPre">{template.markdown}</pre>
                    </article>
                  ))}
                </div>
                <p className="scoreHint">
                  {decisionTemplateCopyState === "copied"
                    ? "Decision templates copied to clipboard."
                    : decisionTemplateCopyState === "failed"
                      ? "Clipboard copy failed. You can still copy from the template cards."
                      : "Use these templates when the receiver is ready to send a concrete acknowledge, request-more-context, or escalate response."}
                </p>
              </div>

              <div className="handoffSection">
                <div className="claimHeader">
                  <h3>Route-filtered response kit</h3>
                  <button
                    type="button"
                    className="actionButton"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(routeFilteredResponseKit.markdown);
                        setResponsePackCopyState("copied");
                      } catch {
                        setResponsePackCopyState("failed");
                      }
                    }}
                  >
                    Copy response kit
                  </button>
                </div>
                <p className="scoreHint">{routeFilteredResponseKit.summary}</p>
                <div className="laneToggleGroup" role="tablist" aria-label="Response kit route chooser">
                  {responseKitFilterOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      className={`laneToggleButton${selectedResponseKitRoute === option.key ? " laneToggleButtonActive" : ""}`}
                      onClick={() => setSelectedResponseKitRoute(option.key)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="statusRow">
                  <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                  <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                  <span className="pill">{bundleVariantProfiles[bundleVariant].label}</span>
                  <span className="pill">{receiverRoleProfiles[receiverRole].label}</span>
                </div>
                <div className="manifestGrid">
                  {routeFilteredResponseKit.templates.map((template) => (
                    <article key={template.key} className="manifestCard">
                      <div className="claimHeader">
                        <strong>{template.label}</strong>
                        <span className={`statusPill statusPill${template.tone}`}>{template.tone}</span>
                      </div>
                      <p className="scoreHint">{template.detail}</p>
                    </article>
                  ))}
                </div>
                <pre className="bundlePreviewPre">{routeFilteredResponseKit.markdown}</pre>
                <p className="scoreHint">
                  {responsePackCopyState === "copied"
                    ? "Route-filtered response kit copied to clipboard."
                    : responsePackCopyState === "failed"
                      ? "Clipboard copy failed. You can still copy from the response-kit preview."
                      : selectedResponseKitRoute === "all"
                        ? "Use All routes when you want the full acknowledge / request-more-context / escalate set in one packaged export."
                        : "Use the route chooser when the receiver only needs the active or selected response path without carrying the full grouped pack."}
                </p>
              </div>

              <div className="handoffSection">
                <div className="claimHeader">
                  <h3>Route kit comparison</h3>
                  <button
                    type="button"
                    className="actionButton"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(responseKitComparisonMarkdown);
                        setResponseKitComparisonCopyState("copied");
                      } catch {
                        setResponseKitComparisonCopyState("failed");
                      }
                    }}
                  >
                    Copy comparison cues
                  </button>
                </div>
                <p className="scoreHint">
                  {selectedResponseKitRoute === "all"
                    ? "The route chooser is currently showing All routes, so this comparison falls back to the active route and nearby alternates."
                    : "Compare the current route kit against nearby alternate paths before deciding whether to keep the current handoff posture or pivot."}
                </p>
                <div className="payloadPreviewBoard">
                  <div className="payloadPreviewGrid">
                    <article className="payloadPreviewCard payloadPreviewCardPrimary">
                      <div className="claimHeader">
                        <strong>{comparisonAnchorTemplate.label}</strong>
                        <span className={`statusPill statusPill${comparisonAnchorTemplate.tone}`}>current</span>
                      </div>
                      <div className="payloadPreviewMeta">
                        <span className="pill">{comparisonAnchorKit.filterLabel}</span>
                        <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                      </div>
                      <p className="scoreHint">{comparisonAnchorTemplate.detail}</p>
                      <pre className="payloadPreviewPre">{comparisonAnchorKit.markdown}</pre>
                    </article>
                    {alternateResponseKitCards.map(({ template, alternateKit }) => (
                      <article key={template.key} className="payloadPreviewCard">
                        <div className="claimHeader">
                          <strong>{template.label}</strong>
                          <span className={`statusPill statusPill${template.tone}`}>alternate</span>
                        </div>
                        <div className="payloadPreviewMeta">
                          <span className="pill">{alternateKit.filterLabel}</span>
                          <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                        </div>
                        <p className="scoreHint">{template.detail}</p>
                        <pre className="payloadPreviewPre">{alternateKit.markdown}</pre>
                      </article>
                    ))}
                  </div>
                </div>
                <p className="scoreHint">
                  {responseKitComparisonCopyState === "copied"
                    ? "Response kit comparison cues copied to clipboard."
                    : responseKitComparisonCopyState === "failed"
                      ? "Clipboard copy failed. You can still copy from the comparison previews."
                      : "Use this board when the current route looks close to another path and you want the differences visible without leaving the workbench."}
                </p>
              </div>

              <div className="handoffSection">
                <div className="claimHeader">
                  <h3>Preset session handoff packet variants</h3>
                  <button
                    type="button"
                    className="actionButton"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(activeSessionHandoffPacketMarkdown);
                        setSessionHandoffPacketCopyState("copied");
                      } catch {
                        setSessionHandoffPacketCopyState("failed");
                      }
                    }}
                  >
                    Copy {bundleVariantProfiles[bundleVariant].label.toLowerCase()} packet
                  </button>
                </div>
                <p className="scoreHint">
                  Send the active preset session and the selected route kit together when the next reader should not have
                  to reconstruct the current handoff posture from separate strips or exports.
                </p>
                <div className="selectionRationaleBoard">
                  <div className="claimHeader">
                    <strong>Sender note</strong>
                    <button
                      type="button"
                      className="actionButton"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(sessionSenderNoteMarkdown);
                          setSessionSenderNoteCopyState("copied");
                        } catch {
                          setSessionSenderNoteCopyState("failed");
                        }
                      }}
                    >
                      Copy sender note
                    </button>
                  </div>
                  <div className="manifestGrid">
                    {sessionSenderHighlights.map((item) => (
                      <article key={item.label} className="manifestCard">
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className="pill">{item.value}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{sessionSenderNoteMarkdown}</pre>
                  <p className="scoreHint">
                    {sessionSenderNoteCopyState === "copied"
                      ? "Sender note copied to clipboard."
                      : sessionSenderNoteCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the sender-note preview."
                        : "Use this note when the packet needs a destination-specific subject line and delivery context before it leaves the workbench."}
                  </p>
                </div>
                <div className="laneToggleGroup" role="tablist" aria-label="Session handoff packet variant chooser">
                  {(["compact", "full"] as BundleVariant[]).map((variant) => (
                    <button
                      key={variant}
                      type="button"
                      className={`laneToggleButton${bundleVariant === variant ? " laneToggleButtonActive" : ""}`}
                      onClick={() => setBundleVariant(variant)}
                    >
                      {bundleVariantProfiles[variant].label}
                    </button>
                  ))}
                </div>
                <p className="scoreHint">{sessionHandoffVariantCoverage[bundleVariant].summary}</p>
                <div className="coverageGrid">
                  {(["compact", "full"] as BundleVariant[]).map((variant) => {
                    const coverage = sessionHandoffVariantCoverage[variant];
                    const isActive = bundleVariant === variant;

                    return (
                      <article key={variant} className={`coverageCard${isActive ? " coverageCardActive" : ""}`}>
                        <div className="claimHeader">
                          <strong>{bundleVariantProfiles[variant].label}</strong>
                          {isActive ? <span className="statusPill statusPillready">active</span> : null}
                        </div>
                        <p className="scoreHint">{coverage.summary}</p>
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
                            <h3>Leaves out</h3>
                            <ul className="checklist compact">
                              {coverage.omits.length > 0 ? (
                                coverage.omits.map((item) => <li key={item}>{item}</li>)
                              ) : (
                                <li>No omissions in this fuller packet.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="copyPreflightBoard">
                  <div className="claimHeader">
                    <strong>Send-readiness cues</strong>
                    <button
                      type="button"
                      className="actionButton"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(sessionSendCueMarkdown);
                          setSessionSendCueCopyState("copied");
                        } catch {
                          setSessionSendCueCopyState("failed");
                        }
                      }}
                    >
                      Copy send cues
                    </button>
                  </div>
                  <p className="scoreHint">
                    {copyPreflight.summary}
                  </p>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${copyPreflight.tone}`}>{copyPreflight.tone}</span>
                  </div>
                  <div className="manifestGrid">
                    {sessionSendCueCards.map((item) => (
                      <article key={item.label} className="manifestCard">
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className="pill">{item.value}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <div className="preflightGrid">
                    {sessionSendChecklistItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <p className="scoreHint">
                    {sessionSendCueCopyState === "copied"
                      ? "Session handoff send cues copied to clipboard."
                      : sessionSendCueCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the visible readiness cues."
                        : "Use these cues when you want to confirm that the current handoff packet is ready to send for this destination and receiver posture."}
                  </p>
                </div>
                <div className="statusRow">
                  <span className="pill">{sessionPresetLabel}</span>
                  <span className="pill">{bundleVariantProfiles[bundleVariant].label}</span>
                  <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                  <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                  <span className="pill">{receiverRoleProfiles[receiverRole].label}</span>
                </div>
                <div className="manifestGrid">
                  {sessionHandoffPacketHighlights.map((item) => (
                    <article key={item.label} className="manifestCard">
                      <div className="claimHeader">
                        <strong>{item.label}</strong>
                        <span className="pill">{item.value}</span>
                      </div>
                      <p className="scoreHint">{item.detail}</p>
                    </article>
                  ))}
                </div>
                <pre className="bundlePreviewPre">{activeSessionHandoffPacketMarkdown}</pre>
                <p className="scoreHint">
                  {sessionHandoffPacketCopyState === "copied"
                    ? `${bundleVariantProfiles[bundleVariant].label} preset session handoff packet copied to clipboard.`
                    : sessionHandoffPacketCopyState === "failed"
                      ? "Clipboard copy failed. You can still copy from the handoff-packet preview."
                      : bundleVariant === "full"
                        ? "Use the full packet when the receiver should get the active session, send-readiness cues, and route-comparison context together."
                        : "Use the compact packet when the selected route kit is ready to travel with the active session summary as one lighter handoff."}
                </p>
              </div>

              <div className="handoffSections">
                <div className={`handoffSection handoffSection${receiverGuidance.tone === "ready" ? "Ready" : "Warning"}`}>
                  <h3>Receiver action checklist</h3>
                  <ul className="checklist compact">
                    {receiverGuidance.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="handoffSection">
                  <h3>Suggested reply prompt</h3>
                  <p>{receiverGuidance.replyPrompt}</p>
                </div>
              </div>

              <textarea className="packetField packetFieldCompact" readOnly value={finalBundlePackage.markdown} />
              <p className="scoreHint">
                {finalBundleCopyState === "copied"
                  ? "Final bundle copied to clipboard."
                  : finalBundleCopyState === "failed"
                    ? "Clipboard copy failed. You can still copy from the final-bundle field."
                    : "Use this copy action when you want the cover sheet, manifest, primary export, and required companions to travel as one delivery artifact."}
              </p>
            </article>

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
