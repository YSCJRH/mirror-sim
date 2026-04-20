import type {
  RubricRow,
  DecisionSummary,
  ClaimPacket,
  DivergentTurn,
  PickupLane,
  ExportSurfaceId,
  DeliveryReadiness,
  DeliveryDestination,
  BundleVariant,
  ReceiverRole,
  ResponseKitRouteFilter,
  ExportCoverage
} from "./types";
import {
  exportSurfaces,
  deliveryDestinations,
  receiverRoleProfiles,
  bundleVariantProfiles
} from "./config";

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

export function buildNextActions(
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

export function buildBlockers(
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

export function buildCarryForwardAnchors(claimPackets: ClaimPacket[], divergentTurns: DivergentTurn[]) {
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

export function buildDeliveryReadiness(
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

export function recommendedExportForDestination(
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

export function alternativeExportsForDestination(
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

export function buildPayloadPreview(markdown: string, previewLineCount = 10) {
  const lines = markdown.trim().split("\n");
  const previewLines = lines.slice(0, previewLineCount);

  return {
    excerpt: previewLines.join("\n"),
    lineCount: lines.length,
    hiddenLineCount: Math.max(lines.length - previewLines.length, 0),
    sectionCount: lines.filter((line) => line.startsWith("## ")).length
  };
}

export function buildMarkdownSections(markdown: string) {
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

export function buildSectionDiffHighlights(recommendedMarkdown: string, fallbackMarkdown: string) {
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

export function tradeoffSummaryForExport(exportId: ExportSurfaceId) {
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

export function fallbackNoteForExport(exportId: ExportSurfaceId, pickupLane: PickupLane) {
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

export function buildTradeoffGuidance(
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

export function buildCopyPreflightChecklist(
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

export function buildSelectionRationaleOptions(
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

export function buildCopySidecarSummary(
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

export function buildHandoffBundlePreview(
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

export function buildRecipientCoverSheet(
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

export function buildAttachmentOrderGuidance(
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

export function buildReceiverGuidance(
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

export function buildFollowThroughRouting(
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

export function buildDecisionTemplates(
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

export function buildGroupedResponsePack(
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

export function buildRouteFilteredResponseKit(
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

export function buildRoleSpecificBundlePlan(
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

export function buildFinalBundlePackage(
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
