"use client";

import { useState } from "react";
import type {
  PickupLane,
  ExportSurfaceId,
  DeliveryDestination,
  BundleVariant,
  ReceiverRole,
  ResponseKitRouteFilter,
  ReviewScorecardProps
} from "./review-scorecard/types";
import {
  scoreOptions,
  closeoutValidationCommands,
  postMergeCheckpointCommands,
  laneRoutes,
  exportSurfaces,
  deliveryDestinations,
  presetProfiles,
  deliveryDestinationOrder,
  bundleVariantProfiles,
  receiverRoleProfiles,
  rolePresetProfiles,
  exportCoverage,
  validationPreviewChips
} from "./review-scorecard/config";
import {
  formatDecisionLabel,
  currentAnchor,
  decisionFromScores,
  recommendationFromState,
  buildNextActions,
  buildBlockers,
  buildCarryForwardAnchors,
  buildDeliveryReadiness,
  recommendedExportForDestination,
  alternativeExportsForDestination,
  buildPayloadPreview,
  buildSectionDiffHighlights,
  buildTradeoffGuidance,
  buildCopyPreflightChecklist,
  buildSelectionRationaleOptions,
  buildCopySidecarSummary,
  buildHandoffBundlePreview,
  buildRecipientCoverSheet,
  buildAttachmentOrderGuidance,
  buildReceiverGuidance,
  buildFollowThroughRouting,
  buildDecisionTemplates,
  buildGroupedResponsePack,
  buildRouteFilteredResponseKit,
  buildFinalBundlePackage
} from "./review-scorecard/logic";

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
  const [packetVariantDiffCopyState, setPacketVariantDiffCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [packetRecommendationCopyState, setPacketRecommendationCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [finalSendSummaryCopyState, setFinalSendSummaryCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [finalSendChecklistCopyState, setFinalSendChecklistCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [deliveryScriptCopyState, setDeliveryScriptCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [deliveryBundleCopyState, setDeliveryBundleCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [receiverFollowUpPackCopyState, setReceiverFollowUpPackCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [deliveryCheckpointCopyState, setDeliveryCheckpointCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [receiverResponsePacketCopyState, setReceiverResponsePacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [replyOutcomeTrackerCopyState, setReplyOutcomeTrackerCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [resolutionHandoffPackCopyState, setResolutionHandoffPackCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [resolutionStatusBoardCopyState, setResolutionStatusBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [nextStepRoutingPackCopyState, setNextStepRoutingPackCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [actionReadinessBoardCopyState, setActionReadinessBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationHandoffPacketCopyState, setEscalationHandoffPacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [executionKickoffBoardCopyState, setExecutionKickoffBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [executionProgressTrackerCopyState, setExecutionProgressTrackerCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [executionOutcomeBoardCopyState, setExecutionOutcomeBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [executionCorrectionBoardCopyState, setExecutionCorrectionBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [executionRecoveryBoardCopyState, setExecutionRecoveryBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [executionRecoveryCheckpointBoardCopyState, setExecutionRecoveryCheckpointBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [executionRecoveryClearanceBoardCopyState, setExecutionRecoveryClearanceBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [executionRecoveryReleaseBoardCopyState, setExecutionRecoveryReleaseBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [executionRecoveryCompletionBoardCopyState, setExecutionRecoveryCompletionBoardCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationDecisionGuideCopyState, setEscalationDecisionGuideCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationTriggerPacketCopyState, setEscalationTriggerPacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationDispatchPacketCopyState, setEscalationDispatchPacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationDeliveryPacketCopyState, setEscalationDeliveryPacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationConfirmationPacketCopyState, setEscalationConfirmationPacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationReceiptPacketCopyState, setEscalationReceiptPacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationAcknowledgmentPacketCopyState, setEscalationAcknowledgmentPacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationClosurePacketCopyState, setEscalationClosurePacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [escalationFinalizationPacketCopyState, setEscalationFinalizationPacketCopyState] = useState<"idle" | "copied" | "failed">("idle");
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
  const handoffPacketVariantPreviewCards = (["compact", "full"] as BundleVariant[]).map((variant) => {
    const coverage = sessionHandoffVariantCoverage[variant];
    const preview = buildPayloadPreview(coverage.markdown, 12);

    return {
      variant,
      coverage,
      preview,
      toneClass: bundleVariant === variant ? "statusPillready" : "statusPillfollowup"
    };
  });
  const handoffPacketVariantDiffHighlights = buildSectionDiffHighlights(
    fullSessionHandoffPacketMarkdown,
    presetSessionHandoffPacketMarkdown
  );
  const handoffPacketVariantDiffMarkdown = [
    "# Handoff Packet Variant Diff",
    "",
    `- Active variant: ${bundleVariantProfiles[bundleVariant].label}`,
    "",
    "## Compact Packet Coverage",
    `- Includes: ${sessionHandoffVariantCoverage.compact.includes.join(", ")}`,
    `- Leaves out: ${sessionHandoffVariantCoverage.compact.omits.join(", ")}`,
    "",
    "## Full Packet Coverage",
    `- Includes: ${sessionHandoffVariantCoverage.full.includes.join(", ")}`,
    `- Leaves out: ${sessionHandoffVariantCoverage.full.omits.length > 0 ? sessionHandoffVariantCoverage.full.omits.join(", ") : "No omissions"}`,
    "",
    "## Section Delta",
    ...handoffPacketVariantDiffHighlights.map(
      (highlight) =>
        `- ${highlight.title}: ${highlight.kind.replace(/-/g, " ")}. ${highlight.note} (full ${highlight.recommendedLines} lines vs compact ${highlight.fallbackLines} lines)`
    )
  ].join("\n");
  const hasCleanPacketBlockers = blockers[0] === "No blocking issues surfaced in the current frontend-only review state.";
  const routeCarriesMultiplePaths = routeFilteredResponseKit.templates.length > 1;
  const recommendedPacketVariant: BundleVariant =
    selectedDestination === "closeout"
      ? "full"
      : routeCarriesMultiplePaths
        ? "full"
        : selectedDestination === "pickup-handoff"
          ? receiverRole === "operator" && copyPreflight.tone === "ready" && hasCleanPacketBlockers
            ? "compact"
            : "full"
          : copyPreflight.tone === "ready" && hasCleanPacketBlockers && receiverRole !== "approver"
            ? "compact"
            : "full";
  const fallbackPacketVariant: BundleVariant = recommendedPacketVariant === "full" ? "compact" : "full";
  const packetRecommendationReasons = [
    selectedDestination === "closeout"
      ? "Closeout delivery benefits from the fuller packet because send-readiness cues and route comparison context should stay attached."
      : selectedDestination === "pickup-handoff"
        ? recommendedPacketVariant === "compact"
          ? "Pickup handoff currently favors the lighter packet because the next operator mainly needs a fast action-first package."
          : "Pickup handoff currently favors the fuller packet because the next operator still needs extra send context before moving."
        : recommendedPacketVariant === "compact"
          ? "PR-comment delivery currently favors the lighter packet because the handoff can stay brief without losing critical context."
          : "PR-comment delivery currently favors the fuller packet because the handoff still needs more delivery context than a short packet can carry cleanly.",
    routeCarriesMultiplePaths
      ? "The route kit is carrying multiple response paths, so the fuller packet keeps alternate-route context visible."
      : `The current route cue is ${routeFilteredResponseKit.filterLabel}, so the packet does not need extra route-comparison overhead.`,
    receiverRole === "approver"
      ? "Approver posture benefits from fuller packet context so sign-off or hold decisions stay visible."
      : receiverRole === "operator" && recommendedPacketVariant === "compact"
        ? "Operator posture benefits from a shorter packet when the current route already points to a concrete next action."
        : `The ${receiverGuidance.roleLabel.toLowerCase()} posture still fits the ${bundleVariantProfiles[recommendedPacketVariant].label.toLowerCase()} packet.`,
    hasCleanPacketBlockers && copyPreflight.tone === "ready"
      ? "Current blocker and readiness posture are clean enough that the recommendation does not need extra defensive context."
      : "Current blocker or readiness cues still argue for keeping more delivery context attached."
  ];
  const fallbackPacketRationale =
    recommendedPacketVariant === "full"
      ? "Fallback to the compact packet only when the next touchpoint truly needs a shorter update and can live without the fuller send-readiness or route-comparison context."
      : "Fallback to the full packet when the receiver needs send-readiness cues, route comparison, or blocker acknowledgement to stay attached.";
  const packetRecommendationSummary =
    recommendedPacketVariant === "full"
      ? `Recommend the full packet for this ${deliveryDestinations[selectedDestination].label.toLowerCase()} handoff because the current route and receiver posture still benefit from fuller send context.`
      : `Recommend the compact packet for this ${deliveryDestinations[selectedDestination].label.toLowerCase()} handoff because the current route and receiver posture already fit a lighter outgoing packet.`;
  const packetRecommendationAlignment =
    bundleVariant === recommendedPacketVariant
      ? "The current selection already matches the recommendation."
      : `The current selection is acting as the fallback packet. Switch to ${bundleVariantProfiles[recommendedPacketVariant].label.toLowerCase()} if you want the preferred destination fit.`;
  const packetRecommendationMarkdown = [
    "# Packet Recommendation",
    "",
    `- Recommended packet: ${bundleVariantProfiles[recommendedPacketVariant].label}`,
    `- Current packet: ${bundleVariantProfiles[bundleVariant].label}`,
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver role: ${receiverGuidance.roleLabel}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Send posture: ${copyPreflight.tone}`,
    "",
    "## Why This Packet Fits",
    ...packetRecommendationReasons.map((reason) => `- ${reason}`),
    "",
    "## Fallback Rationale",
    `- Keep ${bundleVariantProfiles[fallbackPacketVariant].label.toLowerCase()} available when the handoff shape changes mid-flight or the next reader wants a different context level.`,
    `- ${fallbackPacketRationale}`,
    `- ${packetRecommendationAlignment}`
  ].join("\n");
  const activeSessionPacketPreview = buildPayloadPreview(activeSessionHandoffPacketMarkdown, 10);
  const noBlockingIssueVisible = hasCleanPacketBlockers;
  const finalSendSummaryLead =
    selectedDestination === "pr-comment"
      ? `Review the current sender note, ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} packet, and route cue together before pasting the outgoing handoff into GitHub.`
      : selectedDestination === "closeout"
        ? `Review the current sender note, ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} packet, and route cue together before sending the closeout-facing handoff.`
        : `Review the current sender note, ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} packet, and route cue together before handing the next operator their pickup context.`;
  const finalSendSummaryCards = [
    {
      label: "Sender subject",
      value: sessionSenderSubjectLine,
      detail: "Carry this subject line or heading forward so the outgoing handoff stays recognizable outside the workbench."
    },
    {
      label: "Packet mode",
      value: `${bundleVariantProfiles[bundleVariant].label} packet`,
      detail: `${sessionHandoffVariantCoverage[bundleVariant].summary} Preview size: ${activeSessionPacketPreview.lineCount} lines across ${activeSessionPacketPreview.sectionCount} section(s).`
    },
    {
      label: "Route cue",
      value: routeFilteredResponseKit.filterLabel,
      detail: routeFilteredResponseKit.summary
    },
    {
      label: "Receiver cue",
      value: receiverGuidance.roleLabel,
      detail: receiverGuidance.replyPrompt
    },
    {
      label: "Top blocker cue",
      value: noBlockingIssueVisible ? "No blockers surfaced" : blockers[0].replace(/\.$/, ""),
      detail: noBlockingIssueVisible
        ? "The current outgoing handoff does not need extra blocker acknowledgement beyond the normal send posture."
        : "Keep this acknowledgement near the top of the sendoff so the receiver sees the current risk posture immediately."
    }
  ];
  const finalSendSummaryMarkdown = [
    "# Final Send Summary",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Packet mode: ${bundleVariantProfiles[bundleVariant].label}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Send posture: ${copyPreflight.tone}`,
    `- Sender subject: ${sessionSenderSubjectLine}`,
    "",
    "## Outgoing Handoff",
    selectedDestination === "pr-comment"
      ? `- Send the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} packet as a GitHub-ready review handoff with the active route cue attached.`
      : selectedDestination === "closeout"
        ? `- Send the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} packet as a closeout-facing handoff with the current route cue and validation posture kept visible.`
        : `- Send the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} packet as the next operator pickup handoff with the current route cue attached.`,
    `- ${copyPreflight.summary}`,
    "",
    "## Packet Shape",
    `- ${sessionHandoffVariantCoverage[bundleVariant].summary}`,
    `- Includes: ${sessionHandoffVariantCoverage[bundleVariant].includes.join(", ")}`,
    `- Leaves out: ${sessionHandoffVariantCoverage[bundleVariant].omits.length > 0 ? sessionHandoffVariantCoverage[bundleVariant].omits.join(", ") : "No omissions in this fuller packet."}`,
    "",
    "## Route And Receiver Cues",
    `- Route cue: ${routeFilteredResponseKit.summary}`,
    `- Receiver cue: ${receiverGuidance.replyPrompt}`,
    `- Top blocker cue: ${blockers[0]}`
  ].join("\n");
  const finalSendChecklistDecisionTone =
    copyPreflight.tone === "hold"
      ? "hold"
      : bundleVariant !== recommendedPacketVariant || !hasCleanPacketBlockers || copyPreflight.tone === "followup"
        ? "followup"
        : "ready";
  const finalSendChecklistDecisionLabel =
    finalSendChecklistDecisionTone === "ready"
      ? "send"
      : finalSendChecklistDecisionTone === "hold"
        ? "hold"
        : "widen before send";
  const finalSendChecklistSummary =
    finalSendChecklistDecisionTone === "ready"
      ? "The current packet, recommendation, and readiness posture are aligned closely enough to send without widening the handoff."
      : finalSendChecklistDecisionTone === "hold"
        ? "The current handoff should stay on hold until the blocked send cues are resolved."
        : "The current handoff is usable, but at least one cue still argues for widening or rechecking the packet before sending.";
  const finalSendChecklistCards = [
    {
      label: "Send decision",
      value: finalSendChecklistDecisionLabel,
      detail: finalSendChecklistSummary
    },
    {
      label: "Recommended packet",
      value: bundleVariantProfiles[recommendedPacketVariant].label,
      detail: packetRecommendationSummary
    },
    {
      label: "Current packet",
      value: bundleVariantProfiles[bundleVariant].label,
      detail: packetRecommendationAlignment
    },
    {
      label: "Top blocker cue",
      value: hasCleanPacketBlockers ? "No blockers surfaced" : blockers[0].replace(/\.$/, ""),
      detail: hasCleanPacketBlockers
        ? "No extra blocker acknowledgement is currently forcing a wider or held send posture."
        : "Keep this blocker visible near the top of the outgoing handoff before you send."
    }
  ];
  const finalSendChecklistItems = [
    {
      label: "Recommended packet is selected",
      tone: bundleVariant === recommendedPacketVariant ? "ready" : "followup",
      detail:
        bundleVariant === recommendedPacketVariant
          ? `The current packet already matches the ${bundleVariantProfiles[recommendedPacketVariant].label.toLowerCase()} recommendation for this destination.`
          : `Switch from ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} to ${bundleVariantProfiles[recommendedPacketVariant].label.toLowerCase()} if you want the preferred destination fit before sending.`
    },
    {
      label: "Final send summary is aligned",
      tone: finalSendChecklistDecisionTone,
      detail: finalSendSummaryLead
    },
    {
      label: "Route and receiver posture are explicit",
      tone: routeCarriesMultiplePaths && bundleVariant !== "full" ? "followup" : "ready",
      detail:
        routeCarriesMultiplePaths
          ? `The route cue is ${routeFilteredResponseKit.filterLabel}, so keep the fuller packet or visibly acknowledge that multiple paths remain in play.`
          : `The route cue is ${routeFilteredResponseKit.filterLabel}, and ${receiverGuidance.roleLabel.toLowerCase()} posture is already explicit for this send step.`
    },
    {
      label: "Blocker acknowledgement is acceptable",
      tone: hasCleanPacketBlockers ? "ready" : copyPreflight.tone === "hold" ? "hold" : "followup",
      detail:
        hasCleanPacketBlockers
          ? "No active blocker is asking for extra acknowledgement before the handoff leaves the workbench."
          : `Carry the blocker cue forward before sending: ${blockers[0]}`
    },
    {
      label: "Send posture is acceptable",
      tone: copyPreflight.tone,
      detail: copyPreflight.summary
    }
  ];
  const finalSendChecklistMarkdown = [
    "# Final Send Checklist",
    "",
    `- Decision: ${finalSendChecklistDecisionLabel}`,
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Recommended packet: ${bundleVariantProfiles[recommendedPacketVariant].label}`,
    `- Current packet: ${bundleVariantProfiles[bundleVariant].label}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    "",
    "## Checklist",
    ...finalSendChecklistItems.map((item) => `- [${item.tone}] ${item.label}: ${item.detail}`),
    "",
    "## Next Send Action",
    finalSendChecklistDecisionTone === "ready"
      ? "- Send the current packet and keep the final send summary attached as the outgoing overview."
      : finalSendChecklistDecisionTone === "hold"
        ? "- Hold the send and resolve the blocked readiness or blocker cues before the handoff leaves the workbench."
        : `- Widen or recheck the handoff before sending, starting with: ${bundleVariant === recommendedPacketVariant ? blockers[0] : packetRecommendationAlignment}`
  ].join("\n");
  const deliveryScriptLead =
    selectedDestination === "pr-comment"
      ? "Use this script when you want a final GitHub-ready delivery message that ties together the sender note, packet recommendation, and receiver ask."
      : selectedDestination === "closeout"
        ? "Use this script when you want a closeout-facing delivery message that keeps the recommendation and reviewer ask together."
        : "Use this script when you want a final operator-facing handoff message that names the packet choice, route cue, and next ask in one place.";
  const deliveryScriptCards = [
    {
      label: "Subject line",
      value: sessionSenderSubjectLine,
      detail: "Carry this heading forward so the outgoing message stays aligned with the sender note."
    },
    {
      label: "Delivery decision",
      value: finalSendChecklistDecisionLabel,
      detail: finalSendChecklistSummary
    },
    {
      label: "Recommended packet",
      value: bundleVariantProfiles[recommendedPacketVariant].label,
      detail: packetRecommendationSummary
    },
    {
      label: "Receiver ask",
      value: receiverGuidance.roleLabel,
      detail: receiverGuidance.replyPrompt
    }
  ];
  const deliveryScriptOpening =
    selectedDestination === "pr-comment"
      ? `Sharing the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} handoff packet for ${receiverGuidance.roleLabel.toLowerCase()} review. The current recommendation is ${bundleVariantProfiles[recommendedPacketVariant].label.toLowerCase()}, and the route cue is ${routeFilteredResponseKit.filterLabel.toLowerCase()}.`
      : selectedDestination === "closeout"
        ? `Sharing the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} handoff packet for closeout review. The current recommendation is ${bundleVariantProfiles[recommendedPacketVariant].label.toLowerCase()}, and the route cue is ${routeFilteredResponseKit.filterLabel.toLowerCase()}.`
        : `Handing off the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} packet for the next operator pickup. The current recommendation is ${bundleVariantProfiles[recommendedPacketVariant].label.toLowerCase()}, and the route cue is ${routeFilteredResponseKit.filterLabel.toLowerCase()}.`;
  const deliveryScriptDecisionLine =
    finalSendChecklistDecisionTone === "ready"
      ? "The current send posture is clear enough to proceed with the outgoing handoff."
      : finalSendChecklistDecisionTone === "hold"
        ? "The current handoff should stay on hold until the blocked send cues are resolved."
        : "The current handoff should be widened or rechecked before it is sent.";
  const deliveryScriptMarkdown = [
    "# Delivery Script",
    "",
    `Subject: ${sessionSenderSubjectLine}`,
    "",
    deliveryScriptOpening,
    "",
    "## Recommended Script",
    `- ${deliveryScriptDecisionLine}`,
    `- ${packetRecommendationSummary}`,
    `- ${packetRecommendationAlignment}`,
    `- ${receiverGuidance.replyPrompt}`,
    "",
    "## Keep Attached",
    `- Final send summary: ${finalSendSummaryLead}`,
    `- Send checklist decision: ${finalSendChecklistDecisionLabel}`,
    `- Top blocker cue: ${blockers[0]}`,
    "",
    "## Fallback Cue",
    `- ${fallbackPacketRationale}`
  ].join("\n");
  const deliveryBundleLead =
    selectedDestination === "pr-comment"
      ? "Use this bundle when the outgoing GitHub handoff should carry the sender note, delivery script, summary, and checklist together."
      : selectedDestination === "closeout"
        ? "Use this bundle when the outgoing closeout handoff should carry the sender note, delivery script, summary, and checklist together."
        : "Use this bundle when the next operator should receive the full current delivery package in one copyable export.";
  const deliveryBundleCards = [
    {
      label: "Bundle mode",
      value: bundleVariantProfiles[bundleVariant].label,
      detail: sessionHandoffVariantCoverage[bundleVariant].summary
    },
    {
      label: "Delivery decision",
      value: finalSendChecklistDecisionLabel,
      detail: finalSendChecklistSummary
    },
    {
      label: "Recommended packet",
      value: bundleVariantProfiles[recommendedPacketVariant].label,
      detail: packetRecommendationSummary
    },
    {
      label: "Route cue",
      value: routeFilteredResponseKit.filterLabel,
      detail: routeFilteredResponseKit.summary
    }
  ];
  const deliveryBundleMarkdown = [
    "# Delivery Bundle",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Bundle mode: ${bundleVariantProfiles[bundleVariant].label}`,
    `- Recommended packet: ${bundleVariantProfiles[recommendedPacketVariant].label}`,
    `- Send decision: ${finalSendChecklistDecisionLabel}`,
    "",
    "## Sender Note",
    sessionSenderNoteMarkdown,
    "",
    "## Delivery Script",
    deliveryScriptMarkdown,
    "",
    "## Final Send Summary",
    finalSendSummaryMarkdown,
    "",
    "## Final Send Checklist",
    finalSendChecklistMarkdown
  ].join("\n");
  const receiverFollowUpPrimaryTemplate =
    selectedResponseKitRoute === "all"
      ? primaryResponseShortcut
      : (routeFilteredResponseKit.templates[0] ?? primaryResponseShortcut);
  const receiverFollowUpLead =
    selectedDestination === "pr-comment"
      ? "Use this pack when the GitHub handoff is already moving and you want a short follow-up note that keeps the route cue, receiver ask, and send posture aligned."
      : selectedDestination === "closeout"
        ? "Use this pack when the closeout handoff needs a compact follow-up note that keeps approval posture, route cue, and the next reviewer ask visible."
        : "Use this pack when the next operator touchpoint should restate the pickup route, receiver ask, and current send posture after the handoff moves forward.";
  const receiverFollowUpNextAction = nextActions[0] ?? "Name the next missing context item before proceeding.";
  const receiverFollowUpBlockerCue = blockers[0] ?? "No blocker currently needs top-level follow-up visibility.";
  const receiverFollowUpCards = [
    {
      label: "Current route cue",
      value: routeFilteredResponseKit.filterLabel,
      detail:
        selectedResponseKitRoute === "all"
          ? `All routes remain visible, but ${receiverFollowUpPrimaryTemplate.label.toLowerCase()} is still the primary follow-up path.`
          : routeFilteredResponseKit.summary
    },
    {
      label: "Receiver ask",
      value: receiverGuidance.roleLabel,
      detail: receiverGuidance.replyPrompt
    },
    {
      label: "Send posture",
      value: finalSendChecklistDecisionLabel,
      detail: finalSendChecklistSummary
    },
    {
      label: "Primary follow-up route",
      value: receiverFollowUpPrimaryTemplate.label,
      detail: receiverFollowUpPrimaryTemplate.prompt
    }
  ];
  const receiverFollowUpOpening =
    selectedDestination === "pr-comment"
      ? `Following up on the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} GitHub handoff for ${receiverGuidance.roleLabel.toLowerCase()} review. The current route cue is ${routeFilteredResponseKit.filterLabel.toLowerCase()}, and the send posture is ${finalSendChecklistDecisionLabel.toLowerCase()}.`
      : selectedDestination === "closeout"
        ? `Following up on the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} closeout handoff. The current route cue is ${routeFilteredResponseKit.filterLabel.toLowerCase()}, and the send posture is ${finalSendChecklistDecisionLabel.toLowerCase()}.`
        : `Following up on the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} operator pickup handoff. The current route cue is ${routeFilteredResponseKit.filterLabel.toLowerCase()}, and the send posture is ${finalSendChecklistDecisionLabel.toLowerCase()}.`;
  const receiverFollowUpPostureLine =
    finalSendChecklistDecisionTone === "ready"
      ? "The current handoff can keep moving, so the reply should confirm the next step without reopening the packet shape."
      : finalSendChecklistDecisionTone === "hold"
        ? "The handoff is still on hold, so the reply should keep the blocked cue visible until the send posture clears."
        : "The handoff still needs widening or recheck work, so the reply should confirm what extra context needs to travel next.";
  const receiverFollowUpMarkdown = [
    "# Receiver Follow-up Pack",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Packet mode: ${bundleVariantProfiles[bundleVariant].label}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Send posture: ${finalSendChecklistDecisionLabel}`,
    "",
    "## Follow-up Note",
    receiverFollowUpOpening,
    `- ${receiverFollowUpPostureLine}`,
    "",
    "## Confirm In The Reply",
    `- ${receiverGuidance.replyPrompt}`,
    `- ${receiverFollowUpPrimaryTemplate.prompt}`,
    `- Next action to confirm: ${receiverFollowUpNextAction}`,
    "",
    "## Keep Visible",
    `- Route detail: ${receiverFollowUpPrimaryTemplate.detail}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Final send summary: ${finalSendSummaryLead}`,
    "",
    "## Escalate When",
    `- ${followThroughRouting.routes.find((route) => route.key === "escalate")?.prompt ?? "Escalate when the current lane is no longer sufficient for the next reply."}`
  ].join("\n");
  const deliveryCheckpointLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one post-send checkpoint that confirms what traveled in the GitHub handoff and what receiver reply posture is expected next."
      : selectedDestination === "closeout"
        ? "Use this board when you want a compact closeout checkpoint that keeps the sent package, route cue, and next reply posture visible together."
        : "Use this board when you want the next operator checkpoint to show what was handed off and what follow-up posture should drive the next reply.";
  const deliveryCheckpointSummaryLine =
    finalSendChecklistDecisionTone === "ready"
      ? `The current ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} handoff is ready to move with ${routeFilteredResponseKit.filterLabel.toLowerCase()} visible for ${receiverGuidance.roleLabel.toLowerCase()} follow-up.`
      : finalSendChecklistDecisionTone === "hold"
        ? `The current ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} handoff remains on hold, so the next checkpoint should stay anchored to the blocked send cues before another reply is sent.`
        : `The current ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} handoff still needs widening or recheck work before the next reply checkpoint should move forward.`;
  const deliveryCheckpointCards = [
    {
      label: "Sent bundle",
      value: bundleVariantProfiles[bundleVariant].label,
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Recommended packet",
      value: bundleVariantProfiles[recommendedPacketVariant].label,
      detail: packetRecommendationSummary
    },
    {
      label: "Route cue",
      value: routeFilteredResponseKit.filterLabel,
      detail: routeFilteredResponseKit.summary
    },
    {
      label: "Follow-up route",
      value: receiverFollowUpPrimaryTemplate.label,
      detail: receiverFollowUpPrimaryTemplate.prompt
    }
  ];
  const deliveryCheckpointItems = [
    {
      label: "Sent package is explicit",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail:
        bundleVariant === recommendedPacketVariant
          ? `The current handoff is using the recommended ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} package.`
          : `The current handoff is using the ${bundleVariantProfiles[bundleVariant].label.toLowerCase()} package while the recommendation remains ${bundleVariantProfiles[recommendedPacketVariant].label.toLowerCase()}.`
    },
    {
      label: "Follow-up posture is explicit",
      tone: receiverFollowUpPrimaryTemplate.tone,
      detail: `${receiverFollowUpPrimaryTemplate.label}: ${receiverFollowUpPrimaryTemplate.detail}`
    },
    {
      label: "Next checkpoint is visible",
      tone: finalSendChecklistDecisionTone === "hold" ? "hold" : copyPreflight.tone === "ready" ? "ready" : "followup",
      detail:
        finalSendChecklistDecisionTone === "hold"
          ? receiverFollowUpBlockerCue
          : `Confirm the next reply checkpoint with: ${receiverFollowUpNextAction}`
    }
  ];
  const deliveryCheckpointMarkdown = [
    "# Delivery Checkpoint Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Sent bundle mode: ${bundleVariantProfiles[bundleVariant].label}`,
    `- Recommended packet: ${bundleVariantProfiles[recommendedPacketVariant].label}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Send posture: ${finalSendChecklistDecisionLabel}`,
    `- Follow-up route: ${receiverFollowUpPrimaryTemplate.label}`,
    "",
    "## Checkpoint Summary",
    `- ${deliveryCheckpointSummaryLine}`,
    `- ${receiverFollowUpPostureLine}`,
    `- Expected reply cue: ${receiverFollowUpPrimaryTemplate.prompt}`,
    "",
    "## Confirm Next",
    `- ${receiverGuidance.replyPrompt}`,
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    "",
    "## Keep Nearby",
    `- Delivery bundle: ${deliveryBundleLead}`,
    `- Follow-up pack: ${receiverFollowUpLead}`,
    `- Final send summary: ${finalSendSummaryLead}`,
    "",
    "## Escalate When",
    `- ${followThroughRouting.routes.find((route) => route.key === "escalate")?.prompt ?? "Escalate when the current lane is no longer sufficient for the next reply."}`
  ].join("\n");
  const receiverResponseActiveTemplate =
    selectedResponseKitRoute === "all"
      ? primaryResponseShortcut
      : (routeFilteredResponseKit.templates[0] ?? primaryResponseShortcut);
  const receiverResponseAlternateTemplates = decisionTemplates.templates.filter(
    (template) => template.key !== receiverResponseActiveTemplate.key
  );
  const receiverResponsePacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when the next GitHub-facing reply should carry the current follow-up note, active route template, and fallback reply cues together."
      : selectedDestination === "closeout"
        ? "Use this packet when the next closeout reply should keep the active route template and the backup response paths visible together."
        : "Use this packet when the next operator-facing reply should carry the current follow-up note and active route template without rebuilding the receiver response by hand.";
  const receiverResponsePacketCards = [
    {
      label: "Route view",
      value: routeFilteredResponseKit.filterLabel,
      detail: routeFilteredResponseKit.summary
    },
    {
      label: "Active reply route",
      value: receiverResponseActiveTemplate.label,
      detail: receiverResponseActiveTemplate.prompt
    },
    {
      label: "Receiver cue",
      value: receiverGuidance.roleLabel,
      detail: receiverGuidance.replyPrompt
    },
    {
      label: "Send posture",
      value: finalSendChecklistDecisionLabel,
      detail: receiverFollowUpPostureLine
    }
  ];
  const receiverResponsePacketItems = [
    {
      label: "Active route is explicit",
      tone: receiverResponseActiveTemplate.tone,
      detail: receiverResponseActiveTemplate.detail
    },
    {
      label: "Fallback reply paths stay visible",
      tone: receiverResponseAlternateTemplates.length > 0 ? "followup" : "ready",
      detail:
        receiverResponseAlternateTemplates.length > 0
          ? `Keep ${receiverResponseAlternateTemplates.map((template) => template.label.toLowerCase()).join(" and ")} available if the active path changes after the next receiver reply.`
          : "No alternate reply path is currently competing with the active route."
    },
    {
      label: "Next checkpoint is visible",
      tone: finalSendChecklistDecisionTone === "hold" ? "hold" : "followup",
      detail:
        finalSendChecklistDecisionTone === "hold"
          ? receiverFollowUpBlockerCue
          : `Confirm the next receiver checkpoint with: ${receiverFollowUpNextAction}`
    }
  ];
  const receiverResponsePacketMarkdown = [
    "# Receiver Response Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Route view: ${routeFilteredResponseKit.filterLabel}`,
    `- Active reply route: ${receiverResponseActiveTemplate.label}`,
    `- Send posture: ${finalSendChecklistDecisionLabel}`,
    "",
    "## Follow-up Pack",
    receiverFollowUpMarkdown,
    "",
    "## Active Route Template",
    receiverResponseActiveTemplate.markdown,
    "",
    "## Shared Reply Cues",
    `- ${receiverGuidance.replyPrompt}`,
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    "",
    "## Alternate Reply Paths",
    ...receiverResponseAlternateTemplates.map((template) => `- ${template.label}: ${template.prompt}`),
    "",
    "## Escalate When",
    `- ${followThroughRouting.routes.find((route) => route.key === "escalate")?.prompt ?? "Escalate when the current lane is no longer sufficient for the next reply."}`
  ].join("\n");
  const replyOutcomeTrackerLead =
    selectedDestination === "pr-comment"
      ? "Use this tracker when you want one receiver-facing outcome view that says which reply route is currently active and what still remains open after the handoff."
      : selectedDestination === "closeout"
        ? "Use this tracker when the closeout flow needs a compact view of the active reply route and the remaining resolution state."
        : "Use this tracker when the next operator should see which reply path is currently in play and what still needs resolution after the handoff.";
  const replyOutcomeSummaryLine =
    receiverResponseActiveTemplate.tone === "ready" && finalSendChecklistDecisionTone === "ready"
      ? `The current reply outcome is tracking a clear ${receiverResponseActiveTemplate.label.toLowerCase()} path, and the checkpoint posture is clear enough to keep the handoff moving.`
      : finalSendChecklistDecisionTone === "hold"
        ? `The current reply outcome remains provisional because the handoff is still on hold and the blocked checkpoint cues should stay visible before the next reply moves.`
        : `The current reply outcome is still provisional, so the active ${receiverResponseActiveTemplate.label.toLowerCase()} path should travel with the remaining follow-up and checkpoint cues.`;
  const replyOutcomeTrackerCards = [
    {
      label: "Active outcome route",
      value: receiverResponseActiveTemplate.label,
      detail: receiverResponseActiveTemplate.prompt
    },
    {
      label: "Receiver cue",
      value: receiverGuidance.roleLabel,
      detail: receiverGuidance.replyPrompt
    },
    {
      label: "Checkpoint state",
      value: finalSendChecklistDecisionLabel,
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Next open state",
      value: finalSendChecklistDecisionTone === "hold" ? "Resolve blocker first" : "Confirm next reply checkpoint",
      detail:
        finalSendChecklistDecisionTone === "hold"
          ? receiverFollowUpBlockerCue
          : receiverFollowUpNextAction
    }
  ];
  const replyOutcomeTrackerItems = [
    {
      label: "Reply path is explicit",
      tone: receiverResponseActiveTemplate.tone,
      detail: receiverResponseActiveTemplate.detail
    },
    {
      label: "Checkpoint state remains visible",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Remaining paths stay open",
      tone: receiverResponseAlternateTemplates.length > 0 ? "followup" : "ready",
      detail:
        receiverResponseAlternateTemplates.length > 0
          ? `Keep ${receiverResponseAlternateTemplates.map((template) => template.label.toLowerCase()).join(" and ")} visible in case the reply outcome pivots after the next checkpoint.`
          : "No alternate reply path is currently competing with the active outcome route."
    }
  ];
  const replyOutcomeTrackerMarkdown = [
    "# Reply Outcome Tracker",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Active outcome route: ${receiverResponseActiveTemplate.label}`,
    `- Checkpoint state: ${finalSendChecklistDecisionLabel}`,
    "",
    "## Outcome Summary",
    `- ${replyOutcomeSummaryLine}`,
    `- ${receiverResponseActiveTemplate.prompt}`,
    `- ${deliveryCheckpointSummaryLine}`,
    "",
    "## Still Open",
    `- Next reply checkpoint: ${receiverFollowUpNextAction}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    ...receiverResponseAlternateTemplates.map((template) => `- Alternate path: ${template.label} -> ${template.prompt}`),
    "",
    "## Keep Nearby",
    `- Checkpoint board: ${deliveryCheckpointLead}`,
    `- Response packet: ${receiverResponsePacketLead}`,
    `- Follow-up pack: ${receiverFollowUpLead}`,
    "",
    "## Escalate When",
    `- ${followThroughRouting.routes.find((route) => route.key === "escalate")?.prompt ?? "Escalate when the current lane is no longer sufficient for the next reply."}`
  ].join("\n");
  const resolutionEscalationRoute =
    followThroughRouting.routes.find((route) => route.key === "escalate") ??
    followThroughRouting.routes[followThroughRouting.routes.length - 1];
  const resolutionHandoffPackLead =
    selectedDestination === "pr-comment"
      ? "Use this pack when the remaining GitHub-facing resolution context should travel with the checkpoint board, response packet, and escalation cue in one copyable export."
      : selectedDestination === "closeout"
        ? "Use this pack when the closeout flow should keep the active checkpoint posture, response packet, and escalation path together."
        : "Use this pack when the next operator needs the remaining resolution context packaged with the checkpoint board and receiver response path.";
  const resolutionHandoffCards = [
    {
      label: "Checkpoint state",
      value: finalSendChecklistDecisionLabel,
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Active response route",
      value: receiverResponseActiveTemplate.label,
      detail: receiverResponseActiveTemplate.prompt
    },
    {
      label: "Escalation path",
      value: resolutionEscalationRoute.label,
      detail: resolutionEscalationRoute.prompt
    },
    {
      label: "Next open state",
      value: finalSendChecklistDecisionTone === "hold" ? "Resolve blocker first" : "Confirm next resolution checkpoint",
      detail:
        finalSendChecklistDecisionTone === "hold"
          ? receiverFollowUpBlockerCue
          : receiverFollowUpNextAction
    }
  ];
  const resolutionHandoffItems = [
    {
      label: "Checkpoint context is attached",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Response posture is attached",
      tone: receiverResponseActiveTemplate.tone,
      detail: receiverResponseActiveTemplate.detail
    },
    {
      label: "Escalation path stays visible",
      tone: resolutionEscalationRoute.tone,
      detail: resolutionEscalationRoute.detail
    }
  ];
  const resolutionHandoffPackMarkdown = [
    "# Resolution Handoff Pack",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Active response route: ${receiverResponseActiveTemplate.label}`,
    `- Checkpoint state: ${finalSendChecklistDecisionLabel}`,
    `- Escalation path: ${resolutionEscalationRoute.label}`,
    "",
    "## Resolution Summary",
    `- ${deliveryCheckpointSummaryLine}`,
    `- ${receiverResponseActiveTemplate.prompt}`,
    `- Escalate when: ${resolutionEscalationRoute.prompt}`,
    "",
    "## Current Checkpoint Board",
    deliveryCheckpointMarkdown,
    "",
    "## Current Receiver Response Packet",
    receiverResponsePacketMarkdown,
    "",
    "## Remaining Open State",
    `- Next resolution checkpoint: ${receiverFollowUpNextAction}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Keep ${receiverResponseAlternateTemplates.length > 0 ? receiverResponseAlternateTemplates.map((template) => template.label.toLowerCase()).join(" and ") : "the active route only"} visible while resolution is still open.`,
    "",
    "## Keep Nearby",
    `- Follow-up pack: ${receiverFollowUpLead}`,
    `- Final send summary: ${finalSendSummaryLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const resolutionStatusBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing resolution status view that keeps the current outcome, checkpoint posture, and escalation path visible together."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact resolution snapshot that keeps current status and escalation posture visible together."
        : "Use this board when the next operator needs a quick read on the current resolution state before choosing the next action.";
  const resolutionStatusSummaryLine =
    finalSendChecklistDecisionTone === "ready" && receiverResponseActiveTemplate.tone === "ready"
      ? `The current resolution status is stable enough to keep moving on the ${receiverResponseActiveTemplate.label.toLowerCase()} path while keeping escalation visible as a fallback.`
      : finalSendChecklistDecisionTone === "hold"
        ? `The current resolution status remains blocked, so the hold-state checkpoint cues and escalation path should stay visible before any next step is routed.`
        : `The current resolution status is still provisional, so the active outcome route should travel with the unresolved checkpoint and escalation cues.`;
  const resolutionStatusBoardCards = [
    {
      label: "Resolution status",
      value: finalSendChecklistDecisionLabel,
      detail: resolutionStatusSummaryLine
    },
    {
      label: "Active outcome route",
      value: receiverResponseActiveTemplate.label,
      detail: receiverResponseActiveTemplate.prompt
    },
    {
      label: "Escalation path",
      value: resolutionEscalationRoute.label,
      detail: resolutionEscalationRoute.prompt
    },
    {
      label: "Next open state",
      value: finalSendChecklistDecisionTone === "hold" ? "Hold and resolve blocker" : "Confirm next resolution step",
      detail:
        finalSendChecklistDecisionTone === "hold"
          ? receiverFollowUpBlockerCue
          : receiverFollowUpNextAction
    }
  ];
  const resolutionStatusBoardItems = [
    {
      label: "Outcome route is explicit",
      tone: receiverResponseActiveTemplate.tone,
      detail: replyOutcomeSummaryLine
    },
    {
      label: "Checkpoint posture stays visible",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Escalation posture stays visible",
      tone: resolutionEscalationRoute.tone,
      detail: resolutionEscalationRoute.detail
    }
  ];
  const resolutionStatusBoardMarkdown = [
    "# Resolution Status Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Active outcome route: ${receiverResponseActiveTemplate.label}`,
    `- Resolution status: ${finalSendChecklistDecisionLabel}`,
    `- Escalation path: ${resolutionEscalationRoute.label}`,
    "",
    "## Status Summary",
    `- ${resolutionStatusSummaryLine}`,
    `- ${replyOutcomeSummaryLine}`,
    `- ${deliveryCheckpointSummaryLine}`,
    "",
    "## Remaining Open State",
    `- Next resolution step: ${receiverFollowUpNextAction}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Escalate when: ${resolutionEscalationRoute.prompt}`,
    "",
    "## Keep Nearby",
    `- Outcome tracker: ${replyOutcomeTrackerLead}`,
    `- Resolution handoff pack: ${resolutionHandoffPackLead}`,
    `- Receiver response packet: ${receiverResponsePacketLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const nextStepRoutingPackLead =
    selectedDestination === "pr-comment"
      ? "Use this pack when the next GitHub-facing step needs one routing summary that keeps the active outcome, current resolution status, and open-state cue together."
      : selectedDestination === "closeout"
        ? "Use this pack when the closeout flow needs a compact routing summary for the next resolution step."
        : "Use this pack when the next operator needs the clearest route for the next action without rebuilding the outcome and status context by hand.";
  const nextStepRoutingPrimaryStep =
    finalSendChecklistDecisionTone === "hold"
      ? `Resolve the blocker first: ${receiverFollowUpBlockerCue}`
      : `${receiverResponseActiveTemplate.label}: ${receiverFollowUpNextAction}`;
  const nextStepRoutingSummaryLine =
    finalSendChecklistDecisionTone === "ready"
      ? `Route the next action through ${receiverResponseActiveTemplate.label.toLowerCase()} while keeping ${resolutionEscalationRoute.label.toLowerCase()} visible as the fallback path.`
      : finalSendChecklistDecisionTone === "hold"
        ? "Route the next action through blocker resolution first, and keep the escalation path visible until the hold-state clears."
        : `Route the next action through ${receiverResponseActiveTemplate.label.toLowerCase()} with a visible checkpoint handoff because the current status is still provisional.`;
  const nextStepRoutingPackCards = [
    {
      label: "Next route",
      value: receiverResponseActiveTemplate.label,
      detail: nextStepRoutingSummaryLine
    },
    {
      label: "Primary next step",
      value: finalSendChecklistDecisionTone === "hold" ? "Resolve blocker" : "Advance current route",
      detail: nextStepRoutingPrimaryStep
    },
    {
      label: "Fallback route",
      value: resolutionEscalationRoute.label,
      detail: resolutionEscalationRoute.prompt
    },
    {
      label: "Current status",
      value: finalSendChecklistDecisionLabel,
      detail: resolutionStatusSummaryLine
    }
  ];
  const nextStepRoutingPackItems = [
    {
      label: "Primary route is explicit",
      tone: receiverResponseActiveTemplate.tone,
      detail: receiverResponseActiveTemplate.detail
    },
    {
      label: "Open-state cue is explicit",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail:
        finalSendChecklistDecisionTone === "hold"
          ? receiverFollowUpBlockerCue
          : `Next open state: ${receiverFollowUpNextAction}`
    },
    {
      label: "Fallback path stays visible",
      tone: resolutionEscalationRoute.tone,
      detail: resolutionEscalationRoute.detail
    }
  ];
  const nextStepRoutingPackMarkdown = [
    "# Next-Step Routing Pack",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Next route: ${receiverResponseActiveTemplate.label}`,
    `- Current status: ${finalSendChecklistDecisionLabel}`,
    `- Fallback route: ${resolutionEscalationRoute.label}`,
    "",
    "## Routing Summary",
    `- ${nextStepRoutingSummaryLine}`,
    `- Primary next step: ${nextStepRoutingPrimaryStep}`,
    `- Fallback route: ${resolutionEscalationRoute.prompt}`,
    "",
    "## Keep Visible",
    `- Outcome tracker: ${replyOutcomeTrackerLead}`,
    `- Resolution handoff pack: ${resolutionHandoffPackLead}`,
    `- Resolution status board: ${resolutionStatusBoardLead}`,
    "",
    "## Remaining Open State",
    `- ${receiverFollowUpNextAction}`,
    `- ${receiverFollowUpBlockerCue}`,
    `- Alternate reply routes: ${receiverResponseAlternateTemplates.length > 0 ? receiverResponseAlternateTemplates.map((template) => template.label).join(", ") : "none"}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const actionReadinessBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing readiness readout that says whether the next action is clear to execute."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact check on whether the next action is ready to execute."
        : "Use this board when the next operator needs a fast answer to whether the current state is ready for action.";
  const actionReadinessSummaryLine =
    finalSendChecklistDecisionTone === "ready" && receiverResponseActiveTemplate.tone === "ready"
      ? `The next action is ready to execute on the current ${receiverResponseActiveTemplate.label.toLowerCase()} route, with escalation still visible as a fallback.`
      : finalSendChecklistDecisionTone === "hold"
        ? "The next action is not ready to execute yet because the current blocker posture still requires a hold-state resolution step."
        : `The next action is only partially ready, so the current route should travel with the remaining checkpoint and blocker cues.`;
  const actionReadinessBoardCards = [
    {
      label: "Readiness state",
      value:
        finalSendChecklistDecisionTone === "ready"
          ? "Ready to act"
          : finalSendChecklistDecisionTone === "hold"
            ? "Hold before action"
            : "Needs follow-up",
      detail: actionReadinessSummaryLine
    },
    {
      label: "Primary route",
      value: receiverResponseActiveTemplate.label,
      detail: nextStepRoutingPrimaryStep
    },
    {
      label: "Blocker posture",
      value: finalSendChecklistDecisionTone === "hold" ? "Blocked" : blockers.length > 0 ? "Visible blocker" : "No top blocker",
      detail: receiverFollowUpBlockerCue
    },
    {
      label: "Fallback path",
      value: resolutionEscalationRoute.label,
      detail: resolutionEscalationRoute.prompt
    }
  ];
  const actionReadinessBoardItems = [
    {
      label: "Current route is actionable",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : receiverResponseActiveTemplate.tone === "hold"
            ? "hold"
            : "followup",
      detail: nextStepRoutingSummaryLine
    },
    {
      label: "Blocker posture stays visible",
      tone:
        finalSendChecklistDecisionTone === "hold"
          ? "hold"
          : blockers.length > 0
            ? "followup"
            : "ready",
      detail: receiverFollowUpBlockerCue
    },
    {
      label: "Fallback path is ready",
      tone: resolutionEscalationRoute.tone,
      detail: resolutionEscalationRoute.detail
    }
  ];
  const actionReadinessBoardMarkdown = [
    "# Action Readiness Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Readiness state: ${finalSendChecklistDecisionTone === "ready" ? "Ready to act" : finalSendChecklistDecisionTone === "hold" ? "Hold before action" : "Needs follow-up"}`,
    `- Fallback path: ${resolutionEscalationRoute.label}`,
    "",
    "## Readiness Summary",
    `- ${actionReadinessSummaryLine}`,
    `- ${nextStepRoutingSummaryLine}`,
    `- Primary next step: ${nextStepRoutingPrimaryStep}`,
    "",
    "## Blocker Posture",
    `- ${receiverFollowUpBlockerCue}`,
    `- Current status: ${resolutionStatusSummaryLine}`,
    "",
    "## Keep Nearby",
    `- Resolution status board: ${resolutionStatusBoardLead}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`,
    `- Outcome tracker: ${replyOutcomeTrackerLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const executionKickoffBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing kickoff readout that says whether execution should start now and what the first move should be."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact kickoff summary before the next execution step starts."
        : "Use this board when the next operator needs a clean yes-or-not-yet answer on whether to kick off execution now.";
  const executionKickoffSummaryLine =
    finalSendChecklistDecisionTone === "ready"
      ? `Execution can start on the current ${receiverResponseActiveTemplate.label.toLowerCase()} path, with the fallback escalation route still visible if the state changes.`
      : finalSendChecklistDecisionTone === "hold"
        ? "Execution should not start yet because the current blocker posture still requires a hold-state resolution step."
        : `Execution is not fully ready yet, so the first step should stay attached to the current follow-up and checkpoint cues.`;
  const executionKickoffBoardCards = [
    {
      label: "Kickoff state",
      value:
        finalSendChecklistDecisionTone === "ready"
          ? "Start now"
          : finalSendChecklistDecisionTone === "hold"
            ? "Do not start"
            : "Prepare before start",
      detail: executionKickoffSummaryLine
    },
    {
      label: "First execution step",
      value: finalSendChecklistDecisionTone === "hold" ? "Resolve blocker" : "Advance current route",
      detail: nextStepRoutingPrimaryStep
    },
    {
      label: "Blocker posture",
      value: finalSendChecklistDecisionTone === "hold" ? "Blocked" : blockers.length > 0 ? "Visible blocker" : "No top blocker",
      detail: receiverFollowUpBlockerCue
    },
    {
      label: "Fallback path",
      value: resolutionEscalationRoute.label,
      detail: resolutionEscalationRoute.prompt
    }
  ];
  const executionKickoffBoardItems = [
    {
      label: "Kickoff route is explicit",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: nextStepRoutingSummaryLine
    },
    {
      label: "Readiness posture is explicit",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: actionReadinessSummaryLine
    },
    {
      label: "Fallback path stays visible",
      tone: resolutionEscalationRoute.tone,
      detail: resolutionEscalationRoute.detail
    }
  ];
  const executionKickoffBoardMarkdown = [
    "# Execution Kickoff Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Kickoff state: ${finalSendChecklistDecisionTone === "ready" ? "Start now" : finalSendChecklistDecisionTone === "hold" ? "Do not start" : "Prepare before start"}`,
    `- Fallback path: ${resolutionEscalationRoute.label}`,
    "",
    "## Kickoff Summary",
    `- ${executionKickoffSummaryLine}`,
    `- First execution step: ${nextStepRoutingPrimaryStep}`,
    `- Current readiness: ${actionReadinessSummaryLine}`,
    "",
    "## Blocker Posture",
    `- ${receiverFollowUpBlockerCue}`,
    `- Current routing state: ${nextStepRoutingSummaryLine}`,
    "",
    "## Keep Nearby",
    `- Action readiness board: ${actionReadinessBoardLead}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`,
    `- Resolution status board: ${resolutionStatusBoardLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const executionProgressTone =
    finalSendChecklistDecisionTone === "hold"
      ? "hold"
      : finalSendChecklistDecisionTone === "ready" && receiverResponseActiveTemplate.tone === "ready"
        ? "ready"
        : "followup";
  const executionProgressLabel =
    executionProgressTone === "hold"
      ? "Stalled"
      : executionProgressTone === "ready"
        ? "In progress"
        : "Needs follow-up";
  const executionProgressTrackerLead =
    selectedDestination === "pr-comment"
      ? "Use this tracker when you want one GitHub-facing execution-progress view that keeps kickoff state, checkpoint posture, and receiver response cues together."
      : selectedDestination === "closeout"
        ? "Use this tracker when the closeout flow needs a compact read on whether execution has started cleanly, moved forward, or stalled."
        : "Use this tracker when the next operator needs one execution-progress surface that keeps kickoff posture, checkpoint state, and receiver response cues visible together.";
  const executionProgressSummaryLine =
    executionProgressTone === "ready"
      ? `Execution is actively progressing on the current ${receiverResponseActiveTemplate.label.toLowerCase()} path because the kickoff, checkpoint, and response cues still line up.`
      : executionProgressTone === "hold"
        ? "Execution is stalled because the current blocker posture still prevents the route from advancing past the current checkpoint."
        : "Execution is moving, but it still needs follow-up because the checkpoint or receiver response posture remains provisional.";
  const executionProgressTrackerCards = [
    {
      label: "Progress state",
      value: executionProgressLabel,
      detail: executionProgressSummaryLine
    },
    {
      label: "Kickoff posture",
      value:
        finalSendChecklistDecisionTone === "ready"
          ? "Started now"
          : finalSendChecklistDecisionTone === "hold"
            ? "Not started"
            : "Preparing to start",
      detail: executionKickoffSummaryLine
    },
    {
      label: "Checkpoint state",
      value: finalSendChecklistDecisionLabel,
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Receiver response path",
      value: receiverResponseActiveTemplate.label,
      detail: receiverResponseActiveTemplate.prompt
    }
  ];
  const executionProgressTrackerItems = [
    {
      label: "Kickoff posture stays visible",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: executionKickoffSummaryLine
    },
    {
      label: "Checkpoint state stays visible",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Response posture stays visible",
      tone: receiverResponseActiveTemplate.tone,
      detail: receiverResponseActiveTemplate.detail
    }
  ];
  const executionProgressTrackerMarkdown = [
    "# Execution Progress Tracker",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Progress state: ${executionProgressLabel}`,
    `- Checkpoint state: ${finalSendChecklistDecisionLabel}`,
    "",
    "## Progress Summary",
    `- ${executionProgressSummaryLine}`,
    `- Kickoff posture: ${executionKickoffSummaryLine}`,
    `- Response posture: ${receiverResponseActiveTemplate.prompt}`,
    "",
    "## Current Signals",
    `- ${deliveryCheckpointSummaryLine}`,
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    "",
    "## Keep Nearby",
    `- Execution kickoff board: ${executionKickoffBoardLead}`,
    `- Delivery checkpoint board: ${deliveryCheckpointLead}`,
    `- Receiver response packet: ${receiverResponsePacketLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const executionOutcomeTone =
    executionProgressTone === "ready" && receiverResponseActiveTemplate.tone === "ready"
      ? "ready"
      : finalSendChecklistDecisionTone === "hold" || receiverResponseActiveTemplate.tone === "hold"
        ? "hold"
        : "followup";
  const executionOutcomeLabel =
    executionOutcomeTone === "ready"
      ? "Completed cleanly"
      : executionOutcomeTone === "hold"
        ? "Needs correction"
        : "Still provisional";
  const executionOutcomeBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing execution outcome surface that says whether the current route completed cleanly, stayed provisional, or needs correction."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact read on the current execution outcome before deciding the next step."
        : "Use this board when the next operator needs one outcome surface that keeps execution progress, checkpoint posture, and response posture visible together.";
  const executionOutcomeSummaryLine =
    executionOutcomeTone === "ready"
      ? `The current ${receiverResponseActiveTemplate.label.toLowerCase()} route has landed cleanly enough that the execution outcome can be treated as stable for the next handoff.`
      : executionOutcomeTone === "hold"
        ? "The current execution outcome needs correction because the checkpoint or response posture still points to a blocked or unstable route."
        : "The current execution outcome is still provisional, so the route should keep traveling with visible checkpoint and response cues.";
  const executionOutcomeBoardCards = [
    {
      label: "Outcome state",
      value: executionOutcomeLabel,
      detail: executionOutcomeSummaryLine
    },
    {
      label: "Progress state",
      value: executionProgressLabel,
      detail: executionProgressSummaryLine
    },
    {
      label: "Checkpoint state",
      value: finalSendChecklistDecisionLabel,
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Response posture",
      value: receiverResponseActiveTemplate.label,
      detail: receiverResponseActiveTemplate.prompt
    }
  ];
  const executionOutcomeBoardItems = [
    {
      label: "Progress signal stays visible",
      tone: executionProgressTone,
      detail: executionProgressSummaryLine
    },
    {
      label: "Checkpoint posture stays visible",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: deliveryCheckpointSummaryLine
    },
    {
      label: "Response posture stays visible",
      tone: receiverResponseActiveTemplate.tone,
      detail: receiverResponseActiveTemplate.detail
    }
  ];
  const executionOutcomeBoardMarkdown = [
    "# Execution Outcome Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Outcome state: ${executionOutcomeLabel}`,
    `- Checkpoint state: ${finalSendChecklistDecisionLabel}`,
    "",
    "## Outcome Summary",
    `- ${executionOutcomeSummaryLine}`,
    `- Progress state: ${executionProgressSummaryLine}`,
    `- Response posture: ${receiverResponseActiveTemplate.prompt}`,
    "",
    "## Current Signals",
    `- ${deliveryCheckpointSummaryLine}`,
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    "",
    "## Keep Nearby",
    `- Execution progress tracker: ${executionProgressTrackerLead}`,
    `- Delivery checkpoint board: ${deliveryCheckpointLead}`,
    `- Receiver response packet: ${receiverResponsePacketLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const executionCorrectionTone =
    executionOutcomeTone === "hold"
      ? "hold"
      : blockers.length > 0 || receiverResponseAlternateTemplates.length > 0
        ? "followup"
        : "ready";
  const executionCorrectionLabel =
    executionCorrectionTone === "hold"
      ? "Correct now"
      : executionCorrectionTone === "followup"
        ? "Watch correction"
        : "No correction needed";
  const executionCorrectionBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing correction surface that shows what still needs correction before the current route can stabilize."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact read on what correction work still stands between the current outcome and a stable route."
        : "Use this board when the next operator needs one correction surface that keeps the current outcome, blocker cue, and route alternatives visible together.";
  const executionCorrectionSummaryLine =
    executionCorrectionTone === "hold"
      ? "Correction work should start now because the current outcome is blocked and the route cannot stabilize without resolving the visible blocker."
      : executionCorrectionTone === "followup"
        ? "Correction work should stay nearby because the route still has visible blocker or alternate-path pressure even though it has not fully broken."
        : "No immediate correction work is needed because the current outcome is stable and no competing blocker or route alternative is demanding attention.";
  const executionCorrectionBoardCards = [
    {
      label: "Correction state",
      value: executionCorrectionLabel,
      detail: executionCorrectionSummaryLine
    },
    {
      label: "Outcome state",
      value: executionOutcomeLabel,
      detail: executionOutcomeSummaryLine
    },
    {
      label: "Top blocker cue",
      value: blockers.length > 0 ? "Visible blocker" : "No top blocker",
      detail: receiverFollowUpBlockerCue
    },
    {
      label: "Route alternatives",
      value: receiverResponseAlternateTemplates.length > 0 ? "Keep alternatives visible" : "Primary route only",
      detail:
        receiverResponseAlternateTemplates.length > 0
          ? receiverResponseAlternateTemplates.map((template) => `${template.label}: ${template.prompt}`).join(" | ")
          : "No alternate reply path is currently competing with the active route."
    }
  ];
  const executionCorrectionBoardItems = [
    {
      label: "Outcome posture stays visible",
      tone: executionOutcomeTone,
      detail: executionOutcomeSummaryLine
    },
    {
      label: "Blocker cue stays visible",
      tone:
        blockers.length > 0
          ? executionOutcomeTone === "hold"
            ? "hold"
            : "followup"
          : "ready",
      detail: receiverFollowUpBlockerCue
    },
    {
      label: "Route alternatives stay visible",
      tone: receiverResponseAlternateTemplates.length > 0 ? "followup" : "ready",
      detail:
        receiverResponseAlternateTemplates.length > 0
          ? `Keep ${receiverResponseAlternateTemplates.map((template) => template.label.toLowerCase()).join(" and ")} visible while correction work is still open.`
          : "No alternate route currently needs correction-side attention."
    }
  ];
  const executionCorrectionBoardMarkdown = [
    "# Execution Correction Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Correction state: ${executionCorrectionLabel}`,
    `- Outcome state: ${executionOutcomeLabel}`,
    "",
    "## Correction Summary",
    `- ${executionCorrectionSummaryLine}`,
    `- Outcome posture: ${executionOutcomeSummaryLine}`,
    `- Progress posture: ${executionProgressSummaryLine}`,
    "",
    "## What Still Needs Correction",
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    ...receiverResponseAlternateTemplates.map((template) => `- Alternate route: ${template.label} -> ${template.prompt}`),
    "",
    "## Keep Nearby",
    `- Execution outcome board: ${executionOutcomeBoardLead}`,
    `- Execution progress tracker: ${executionProgressTrackerLead}`,
    `- Receiver response packet: ${receiverResponsePacketLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const executionRecoveryTone =
    executionCorrectionTone === "hold"
      ? "hold"
      : executionCorrectionTone === "followup"
        ? "followup"
        : "ready";
  const executionRecoveryLabel =
    executionRecoveryTone === "hold"
      ? "Recover now"
      : executionRecoveryTone === "followup"
        ? "Prepare recovery"
        : "Route recovered";
  const executionRecoveryBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing recovery surface that shows how the current route should recover after correction work is identified."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact read on how the route should recover from the current correction posture."
        : "Use this board when the next operator needs one recovery surface that keeps correction posture, outcome state, and route reset cues visible together.";
  const executionRecoverySummaryLine =
    executionRecoveryTone === "hold"
      ? "Recovery work should begin now because the route cannot stabilize until the visible blocker is corrected and the next checkpoint is explicitly reset."
      : executionRecoveryTone === "followup"
        ? "Recovery work should stay prepared because the route still needs visible reset cues even though it has not fully broken."
        : "The route is currently stable enough that recovery can stay lightweight while the next checkpoint remains explicit.";
  const executionRecoveryBoardCards = [
    {
      label: "Recovery state",
      value: executionRecoveryLabel,
      detail: executionRecoverySummaryLine
    },
    {
      label: "Correction posture",
      value: executionCorrectionLabel,
      detail: executionCorrectionSummaryLine
    },
    {
      label: "Outcome state",
      value: executionOutcomeLabel,
      detail: executionOutcomeSummaryLine
    },
    {
      label: "Next route reset cue",
      value: receiverFollowUpNextAction,
      detail: nextStepRoutingSummaryLine
    }
  ];
  const executionRecoveryBoardItems = [
    {
      label: "Correction posture stays visible",
      tone: executionCorrectionTone,
      detail: executionCorrectionSummaryLine
    },
    {
      label: "Outcome posture stays visible",
      tone: executionOutcomeTone,
      detail: executionOutcomeSummaryLine
    },
    {
      label: "Route reset cue stays visible",
      tone:
        executionRecoveryTone === "hold"
          ? "hold"
          : "followup",
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    }
  ];
  const executionRecoveryBoardMarkdown = [
    "# Execution Recovery Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Recovery state: ${executionRecoveryLabel}`,
    `- Correction posture: ${executionCorrectionLabel}`,
    "",
    "## Recovery Summary",
    `- ${executionRecoverySummaryLine}`,
    `- Correction posture: ${executionCorrectionSummaryLine}`,
    `- Outcome posture: ${executionOutcomeSummaryLine}`,
    "",
    "## Reset Cues",
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Route guidance: ${nextStepRoutingSummaryLine}`,
    "",
    "## Keep Nearby",
    `- Execution correction board: ${executionCorrectionBoardLead}`,
    `- Execution outcome board: ${executionOutcomeBoardLead}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const executionRecoveryCheckpointTone =
    executionRecoveryTone === "hold"
      ? "hold"
      : executionRecoveryTone === "followup"
        ? "followup"
        : "ready";
  const executionRecoveryCheckpointLabel =
    executionRecoveryCheckpointTone === "hold"
      ? "Checkpoint blocked"
      : executionRecoveryCheckpointTone === "followup"
        ? "Checkpoint pending"
        : "Checkpoint ready";
  const executionRecoveryCheckpointBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing checkpoint surface that makes the current recovery posture, blocker review, and immediate next action explicit."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact checkpoint read on recovery posture, blocker review, and the next action."
        : "Use this board when the next operator needs one checkpoint-ready recovery surface that keeps posture, blockers, and the immediate next action visible together.";
  const executionRecoveryCheckpointSummaryLine =
    executionRecoveryCheckpointTone === "hold"
      ? "The recovery checkpoint stays blocked until the visible blocker is corrected and the next route reset is explicitly confirmed."
      : executionRecoveryCheckpointTone === "followup"
        ? "The recovery checkpoint stays pending while the route reset and blocker review remain visible before the handoff can be treated as stable."
        : "The recovery checkpoint is ready to move forward because the route has stabilized enough to confirm the next action and downstream review.";
  const executionRecoveryCheckpointBoardCards = [
    {
      label: "Checkpoint state",
      value: executionRecoveryCheckpointLabel,
      detail: executionRecoveryCheckpointSummaryLine
    },
    {
      label: "Recovery posture",
      value: executionRecoveryLabel,
      detail: executionRecoverySummaryLine
    },
    {
      label: "Blocker posture",
      value: executionCorrectionLabel,
      detail: `Top blocker cue: ${receiverFollowUpBlockerCue}`
    },
    {
      label: "Current route",
      value: receiverResponseActiveTemplate.label,
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    }
  ];
  const executionRecoveryCheckpointBoardItems = [
    {
      label: "Recovery posture stays visible",
      tone: executionRecoveryTone,
      detail: executionRecoverySummaryLine
    },
    {
      label: "Top blocker review stays visible",
      tone: executionCorrectionTone,
      detail: receiverFollowUpBlockerCue
    },
    {
      label: "Immediate checkpoint action stays visible",
      tone: executionRecoveryCheckpointTone,
      detail: `Primary route step: ${nextStepRoutingPrimaryStep}`
    }
  ];
  const executionRecoveryCheckpointBoardMarkdown = [
    "# Execution Recovery Checkpoint Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Checkpoint state: ${executionRecoveryCheckpointLabel}`,
    `- Recovery state: ${executionRecoveryLabel}`,
    "",
    "## Checkpoint Summary",
    `- ${executionRecoveryCheckpointSummaryLine}`,
    `- Recovery posture: ${executionRecoverySummaryLine}`,
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    "",
    "## Blocker Review",
    `- Correction posture: ${executionCorrectionSummaryLine}`,
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Outcome posture: ${executionOutcomeSummaryLine}`,
    "",
    "## Immediate Next Action",
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    `- Primary route step: ${nextStepRoutingPrimaryStep}`,
    `- Escalate when: ${resolutionEscalationRoute.prompt}`,
    "",
    "## Keep Nearby",
    `- Execution recovery board: ${executionRecoveryBoardLead}`,
    `- Delivery checkpoint board: ${deliveryCheckpointLead}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`
  ].join("\n");
  const executionRecoveryClearanceTone =
    executionRecoveryCheckpointTone === "hold"
      ? "hold"
      : executionRecoveryCheckpointTone === "followup"
        ? "followup"
        : "ready";
  const executionRecoveryClearanceLabel =
    executionRecoveryClearanceTone === "hold"
      ? "Hold clearance"
      : executionRecoveryClearanceTone === "followup"
        ? "Prepare clearance"
        : "Clear route";
  const executionRecoveryClearanceBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing recovery clearance surface that makes the current checkpoint, remaining blocker, and final release cue explicit."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact clearance read on the current checkpoint, remaining blocker, and release cue."
        : "Use this board when the next operator needs one clearance-ready recovery surface that keeps checkpoint posture, blocker review, and release cues visible together.";
  const executionRecoveryClearanceSummaryLine =
    executionRecoveryClearanceTone === "hold"
      ? "Recovery clearance should stay blocked because the remaining blocker still needs visible correction before the route can be released."
      : executionRecoveryClearanceTone === "followup"
        ? "Recovery clearance should stay prepared because the route is stabilizing, but the final release cue still needs explicit review."
        : "Recovery clearance is ready because the checkpoint posture is stable enough to release the route with the current cue set.";
  const executionRecoveryClearanceBoardCards = [
    {
      label: "Clearance state",
      value: executionRecoveryClearanceLabel,
      detail: executionRecoveryClearanceSummaryLine
    },
    {
      label: "Checkpoint posture",
      value: executionRecoveryCheckpointLabel,
      detail: executionRecoveryCheckpointSummaryLine
    },
    {
      label: "Remaining blocker",
      value: executionCorrectionLabel,
      detail: receiverFollowUpBlockerCue
    },
    {
      label: "Release cue",
      value: routeFilteredResponseKit.filterLabel,
      detail: `Primary route step: ${nextStepRoutingPrimaryStep}`
    }
  ];
  const executionRecoveryClearanceBoardItems = [
    {
      label: "Checkpoint posture stays visible",
      tone: executionRecoveryCheckpointTone,
      detail: executionRecoveryCheckpointSummaryLine
    },
    {
      label: "Remaining blocker stays visible",
      tone: executionCorrectionTone,
      detail: receiverFollowUpBlockerCue
    },
    {
      label: "Final release cue stays visible",
      tone: executionRecoveryClearanceTone,
      detail: `Route cue: ${nextStepRoutingSummaryLine}`
    }
  ];
  const executionRecoveryClearanceBoardMarkdown = [
    "# Execution Recovery Clearance Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Clearance state: ${executionRecoveryClearanceLabel}`,
    `- Checkpoint state: ${executionRecoveryCheckpointLabel}`,
    "",
    "## Clearance Summary",
    `- ${executionRecoveryClearanceSummaryLine}`,
    `- Checkpoint posture: ${executionRecoveryCheckpointSummaryLine}`,
    `- Recovery posture: ${executionRecoverySummaryLine}`,
    "",
    "## Remaining Blockers",
    `- Remaining blocker: ${receiverFollowUpBlockerCue}`,
    `- Correction posture: ${executionCorrectionSummaryLine}`,
    `- Outcome posture: ${executionOutcomeSummaryLine}`,
    "",
    "## Final Release Cues",
    `- Route cue: ${nextStepRoutingSummaryLine}`,
    `- Primary route step: ${nextStepRoutingPrimaryStep}`,
    `- Next checkpoint after clearance: ${receiverFollowUpNextAction}`,
    "",
    "## Keep Nearby",
    `- Execution recovery checkpoint board: ${executionRecoveryCheckpointBoardLead}`,
    `- Execution recovery board: ${executionRecoveryBoardLead}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`
  ].join("\n");
  const executionRecoveryReleaseTone =
    executionRecoveryClearanceTone === "hold"
      ? "hold"
      : executionRecoveryClearanceTone === "followup"
        ? "followup"
        : "ready";
  const executionRecoveryReleaseLabel =
    executionRecoveryReleaseTone === "hold"
      ? "Hold release"
      : executionRecoveryReleaseTone === "followup"
        ? "Prepare release"
        : "Release route";
  const executionRecoveryReleaseBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing recovery release surface that makes the release posture, final cue, and first post-release check explicit."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact release read on the final cue and first post-release check."
        : "Use this board when the next operator needs one release-ready recovery surface that keeps the release posture, final cue, and first post-release check visible together.";
  const executionRecoveryReleaseSummaryLine =
    executionRecoveryReleaseTone === "hold"
      ? "Recovery release should stay blocked because the final release cue is not yet strong enough to move the route forward safely."
      : executionRecoveryReleaseTone === "followup"
        ? "Recovery release should stay prepared because the route is nearly clear, but the first post-release check still needs explicit review."
        : "Recovery release is ready because the route is clear enough to move forward with the current cue set and immediate follow-through check.";
  const executionRecoveryReleaseBoardCards = [
    {
      label: "Release state",
      value: executionRecoveryReleaseLabel,
      detail: executionRecoveryReleaseSummaryLine
    },
    {
      label: "Clearance posture",
      value: executionRecoveryClearanceLabel,
      detail: executionRecoveryClearanceSummaryLine
    },
    {
      label: "Final release cue",
      value: routeFilteredResponseKit.filterLabel,
      detail: nextStepRoutingSummaryLine
    },
    {
      label: "First post-release check",
      value: receiverResponseActiveTemplate.label,
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    }
  ];
  const executionRecoveryReleaseBoardItems = [
    {
      label: "Clearance posture stays visible",
      tone: executionRecoveryClearanceTone,
      detail: executionRecoveryClearanceSummaryLine
    },
    {
      label: "Final route cue stays visible",
      tone: executionRecoveryReleaseTone,
      detail: `Primary route step: ${nextStepRoutingPrimaryStep}`
    },
    {
      label: "Immediate post-release check stays visible",
      tone: executionRecoveryCheckpointTone,
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    }
  ];
  const executionRecoveryReleaseBoardMarkdown = [
    "# Execution Recovery Release Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Release state: ${executionRecoveryReleaseLabel}`,
    `- Clearance state: ${executionRecoveryClearanceLabel}`,
    "",
    "## Release Summary",
    `- ${executionRecoveryReleaseSummaryLine}`,
    `- Clearance posture: ${executionRecoveryClearanceSummaryLine}`,
    `- Route cue: ${nextStepRoutingSummaryLine}`,
    "",
    "## Final Release Cues",
    `- Primary route step: ${nextStepRoutingPrimaryStep}`,
    `- Final route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Recovery posture: ${executionRecoverySummaryLine}`,
    "",
    "## Immediate Post-Release Check",
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    `- Active response route: ${receiverResponseActiveTemplate.prompt}`,
    `- Escalate when: ${resolutionEscalationRoute.prompt}`,
    "",
    "## Keep Nearby",
    `- Execution recovery clearance board: ${executionRecoveryClearanceBoardLead}`,
    `- Execution recovery checkpoint board: ${executionRecoveryCheckpointBoardLead}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`
  ].join("\n");
  const executionRecoveryCompletionTone =
    executionRecoveryReleaseTone === "hold"
      ? "hold"
      : executionRecoveryReleaseTone === "followup"
        ? "followup"
        : "ready";
  const executionRecoveryCompletionLabel =
    executionRecoveryCompletionTone === "hold"
      ? "Hold completion"
      : executionRecoveryCompletionTone === "followup"
        ? "Prepare completion"
        : "Complete route";
  const executionRecoveryCompletionBoardLead =
    selectedDestination === "pr-comment"
      ? "Use this board when you want one GitHub-facing recovery completion surface that makes the completion posture, completion cue, and first post-completion check explicit."
      : selectedDestination === "closeout"
        ? "Use this board when the closeout flow needs a compact completion read on the completion cue and first post-completion check."
        : "Use this board when the next operator needs one completion-ready recovery surface that keeps the completion posture, completion cue, and first post-completion check visible together.";
  const executionRecoveryCompletionSummaryLine =
    executionRecoveryCompletionTone === "hold"
      ? "Recovery completion should stay blocked because the completion cue is not yet strong enough to declare the route fully complete."
      : executionRecoveryCompletionTone === "followup"
        ? "Recovery completion should stay prepared because the route is nearly complete, but the first post-completion check still needs explicit review."
        : "Recovery completion is ready because the route is complete enough to move into the immediate post-completion check with the current cue set.";
  const executionRecoveryCompletionBoardCards = [
    {
      label: "Completion state",
      value: executionRecoveryCompletionLabel,
      detail: executionRecoveryCompletionSummaryLine
    },
    {
      label: "Release posture",
      value: executionRecoveryReleaseLabel,
      detail: executionRecoveryReleaseSummaryLine
    },
    {
      label: "Completion cue",
      value: routeFilteredResponseKit.filterLabel,
      detail: nextStepRoutingSummaryLine
    },
    {
      label: "First post-completion check",
      value: receiverResponseActiveTemplate.label,
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    }
  ];
  const executionRecoveryCompletionBoardItems = [
    {
      label: "Release posture stays visible",
      tone: executionRecoveryReleaseTone,
      detail: executionRecoveryReleaseSummaryLine
    },
    {
      label: "Completion cue stays visible",
      tone: executionRecoveryCompletionTone,
      detail: `Primary route step: ${nextStepRoutingPrimaryStep}`
    },
    {
      label: "Immediate post-completion check stays visible",
      tone: executionRecoveryCheckpointTone,
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    }
  ];
  const executionRecoveryCompletionBoardMarkdown = [
    "# Execution Recovery Completion Board",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Completion state: ${executionRecoveryCompletionLabel}`,
    `- Release state: ${executionRecoveryReleaseLabel}`,
    "",
    "## Completion Summary",
    `- ${executionRecoveryCompletionSummaryLine}`,
    `- Release posture: ${executionRecoveryReleaseSummaryLine}`,
    `- Route cue: ${nextStepRoutingSummaryLine}`,
    "",
    "## Completion Cues",
    `- Primary route step: ${nextStepRoutingPrimaryStep}`,
    `- Completion cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Recovery posture: ${executionRecoverySummaryLine}`,
    "",
    "## Immediate Post-Completion Check",
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    `- Active response route: ${receiverResponseActiveTemplate.prompt}`,
    `- Escalate when: ${resolutionEscalationRoute.prompt}`,
    "",
    "## Keep Nearby",
    `- Execution recovery release board: ${executionRecoveryReleaseBoardLead}`,
    `- Execution recovery clearance board: ${executionRecoveryClearanceBoardLead}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`
  ].join("\n");
  const escalationHandoffPacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when the current GitHub-facing path needs to escalate and the status, routing, and fallback cues should travel together."
      : selectedDestination === "closeout"
        ? "Use this packet when the closeout flow needs to escalate and keep the current status and routing posture visible together."
        : "Use this packet when the next operator needs a clean escalation handoff without rebuilding the current status and route context by hand.";
  const escalationHandoffSummaryLine =
    finalSendChecklistDecisionTone === "hold"
      ? "The current state already points toward escalation because the hold-state blocker posture remains visible."
      : `Escalation remains the fallback route while the current ${receiverResponseActiveTemplate.label.toLowerCase()} path stays primary.`;
  const escalationHandoffPacketCards = [
    {
      label: "Escalation route",
      value: resolutionEscalationRoute.label,
      detail: resolutionEscalationRoute.prompt
    },
    {
      label: "Current status",
      value: finalSendChecklistDecisionLabel,
      detail: resolutionStatusSummaryLine
    },
    {
      label: "Current route",
      value: receiverResponseActiveTemplate.label,
      detail: nextStepRoutingSummaryLine
    },
    {
      label: "Top blocker cue",
      value: finalSendChecklistDecisionTone === "hold" ? "Blocked" : "Visible fallback cue",
      detail: receiverFollowUpBlockerCue
    }
  ];
  const escalationHandoffPacketItems = [
    {
      label: "Escalation path is explicit",
      tone: resolutionEscalationRoute.tone,
      detail: resolutionEscalationRoute.detail
    },
    {
      label: "Current status is attached",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: resolutionStatusSummaryLine
    },
    {
      label: "Fallback context is attached",
      tone: blockers.length > 0 ? "followup" : "ready",
      detail: receiverFollowUpBlockerCue
    }
  ];
  const escalationHandoffPacketMarkdown = [
    "# Escalation Handoff Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    `- Current status: ${finalSendChecklistDecisionLabel}`,
    "",
    "## Escalation Summary",
    `- ${escalationHandoffSummaryLine}`,
    `- Escalate when: ${resolutionEscalationRoute.prompt}`,
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    "",
    "## Current Status Board",
    resolutionStatusBoardMarkdown,
    "",
    "## Current Routing Pack",
    nextStepRoutingPackMarkdown,
    "",
    "## Carry Forward",
    `- Top blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Next open state: ${receiverFollowUpNextAction}`,
    `- Alternate routes: ${receiverResponseAlternateTemplates.length > 0 ? receiverResponseAlternateTemplates.map((template) => template.label).join(", ") : "none"}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const escalationDecisionGuideLead =
    selectedDestination === "pr-comment"
      ? "Use this guide when you want one GitHub-facing escalation decision surface that says whether escalation should happen now or stay as fallback."
      : selectedDestination === "closeout"
        ? "Use this guide when the closeout flow needs a compact answer on whether escalation is the right next move."
        : "Use this guide when the next operator needs a clear escalation yes-or-not-yet decision without rebuilding the current context by hand.";
  const escalationDecisionSummaryLine =
    finalSendChecklistDecisionTone === "hold"
      ? "Escalation should stay foregrounded because the current blocker posture still points to a hold-state handoff."
      : blockers.length > 0
        ? "Escalation remains available but should stay secondary while the current route still has a viable next step."
        : "Escalation is available as fallback, but the current route and readiness posture still support normal continuation.";
  const escalationDecisionGuideCards = [
    {
      label: "Escalation decision",
      value:
        finalSendChecklistDecisionTone === "hold"
          ? "Escalate now"
          : blockers.length > 0
            ? "Escalate if blocker persists"
            : "Keep as fallback",
      detail: escalationDecisionSummaryLine
    },
    {
      label: "Current readiness",
      value:
        finalSendChecklistDecisionTone === "ready"
          ? "Ready to act"
          : finalSendChecklistDecisionTone === "hold"
            ? "Hold before action"
            : "Needs follow-up",
      detail: actionReadinessSummaryLine
    },
    {
      label: "Fallback threshold",
      value: resolutionEscalationRoute.label,
      detail: resolutionEscalationRoute.prompt
    },
    {
      label: "Current blocker cue",
      value: blockers.length > 0 ? "Visible blocker" : "No top blocker",
      detail: receiverFollowUpBlockerCue
    }
  ];
  const escalationDecisionGuideItems = [
    {
      label: "Escalation threshold is explicit",
      tone: resolutionEscalationRoute.tone,
      detail: resolutionEscalationRoute.detail
    },
    {
      label: "Readiness threshold is explicit",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: actionReadinessSummaryLine
    },
    {
      label: "Blocker threshold stays visible",
      tone:
        finalSendChecklistDecisionTone === "hold"
          ? "hold"
          : blockers.length > 0
            ? "followup"
            : "ready",
      detail: receiverFollowUpBlockerCue
    }
  ];
  const escalationDecisionGuideMarkdown = [
    "# Escalation Decision Guide",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    `- Current readiness: ${finalSendChecklistDecisionTone === "ready" ? "Ready to act" : finalSendChecklistDecisionTone === "hold" ? "Hold before action" : "Needs follow-up"}`,
    "",
    "## Decision Summary",
    `- ${escalationDecisionSummaryLine}`,
    `- Current readiness: ${actionReadinessSummaryLine}`,
    `- Fallback threshold: ${resolutionEscalationRoute.prompt}`,
    "",
    "## Decision Thresholds",
    `- Blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Next step if not escalating: ${nextStepRoutingPrimaryStep}`,
    `- Current routing summary: ${nextStepRoutingSummaryLine}`,
    "",
    "## Keep Nearby",
    `- Action readiness board: ${actionReadinessBoardLead}`,
    `- Escalation handoff packet: ${escalationHandoffPacketLead}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const escalationTriggerTone =
    finalSendChecklistDecisionTone === "hold"
      ? "hold"
      : blockers.length > 0
        ? "followup"
        : "ready";
  const escalationTriggerLabel =
    escalationTriggerTone === "hold"
      ? "Trigger now"
      : escalationTriggerTone === "followup"
        ? "Watch trigger"
        : "Standby";
  const escalationTriggerPacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when you want one GitHub-facing escalation trigger surface that says exactly when escalation should fire and what context should travel with it."
      : selectedDestination === "closeout"
        ? "Use this packet when the closeout flow needs a compact escalation trigger summary that keeps the threshold and carry-forward context visible together."
        : "Use this packet when the next operator needs a clear escalation trigger handoff without rebuilding the current decision and blocker context by hand.";
  const escalationTriggerSummaryLine =
    escalationTriggerTone === "hold"
      ? "Escalation should trigger now because the current blocker posture has already pushed the route into a hold-state handoff."
      : escalationTriggerTone === "followup"
        ? "Escalation should stay staged as the next trigger if the visible blocker persists or the current route stops advancing."
        : "Escalation stays on standby while the current route remains viable, but the trigger threshold should stay nearby as carry-forward context.";
  const escalationTriggerPacketCards = [
    {
      label: "Trigger state",
      value: escalationTriggerLabel,
      detail: escalationTriggerSummaryLine
    },
    {
      label: "Decision posture",
      value: finalSendChecklistDecisionLabel,
      detail: escalationDecisionSummaryLine
    },
    {
      label: "Escalation route",
      value: resolutionEscalationRoute.label,
      detail: resolutionEscalationRoute.prompt
    },
    {
      label: "Blocker cue",
      value:
        finalSendChecklistDecisionTone === "hold"
          ? "Active blocker"
          : blockers.length > 0
            ? "Visible blocker"
            : "No top blocker",
      detail: receiverFollowUpBlockerCue
    }
  ];
  const escalationTriggerPacketItems = [
    {
      label: "Decision threshold stays explicit",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: escalationDecisionSummaryLine
    },
    {
      label: "Handoff context stays attached",
      tone: resolutionEscalationRoute.tone,
      detail: escalationHandoffSummaryLine
    },
    {
      label: "Blocker trigger stays visible",
      tone: escalationTriggerTone,
      detail: receiverFollowUpBlockerCue
    }
  ];
  const escalationTriggerPacketMarkdown = [
    "# Escalation Trigger Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route: ${receiverResponseActiveTemplate.label}`,
    `- Trigger state: ${escalationTriggerLabel}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    "",
    "## Trigger Summary",
    `- ${escalationTriggerSummaryLine}`,
    `- Decision posture: ${escalationDecisionSummaryLine}`,
    `- Handoff posture: ${escalationHandoffSummaryLine}`,
    "",
    "## Trigger Conditions",
    `- Blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Escalation threshold: ${resolutionEscalationRoute.prompt}`,
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    "",
    "## Carry Forward",
    `- Escalation decision guide: ${escalationDecisionGuideLead}`,
    `- Escalation handoff packet: ${escalationHandoffPacketLead}`,
    `- Execution progress tracker: ${executionProgressTrackerLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const escalationDispatchTone =
    escalationTriggerTone === "hold"
      ? "hold"
      : escalationTriggerTone === "followup"
        ? "followup"
        : "ready";
  const escalationDispatchLabel =
    escalationDispatchTone === "hold"
      ? "Dispatch now"
      : escalationDispatchTone === "followup"
        ? "Prepare dispatch"
        : "Hold dispatch";
  const escalationDispatchPacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when you want one GitHub-facing escalation dispatch surface that says whether the escalation handoff should be sent now or staged."
      : selectedDestination === "closeout"
        ? "Use this packet when the closeout flow needs a compact escalation dispatch summary that keeps the trigger and route cue visible together."
        : "Use this packet when the next operator needs a dispatch-ready escalation handoff without rebuilding the current trigger, decision, and route context by hand.";
  const escalationDispatchSummaryLine =
    escalationDispatchTone === "hold"
      ? "Escalation dispatch should go out now because the trigger threshold has already been met and the current route is no longer sufficient."
      : escalationDispatchTone === "followup"
        ? "Escalation dispatch should be prepared now so it can be sent quickly if the visible trigger persists or the current route stops advancing."
        : "Escalation dispatch should stay on hold while the current route remains viable, but the packet should keep the trigger threshold and route cue nearby.";
  const escalationDispatchPacketCards = [
    {
      label: "Dispatch state",
      value: escalationDispatchLabel,
      detail: escalationDispatchSummaryLine
    },
    {
      label: "Trigger state",
      value: escalationTriggerLabel,
      detail: escalationTriggerSummaryLine
    },
    {
      label: "Escalation route",
      value: resolutionEscalationRoute.label,
      detail: resolutionEscalationRoute.prompt
    },
    {
      label: "Current route cue",
      value: routeFilteredResponseKit.filterLabel,
      detail: nextStepRoutingSummaryLine
    }
  ];
  const escalationDispatchPacketItems = [
    {
      label: "Trigger posture stays explicit",
      tone: escalationTriggerTone,
      detail: escalationTriggerSummaryLine
    },
    {
      label: "Decision posture stays attached",
      tone:
        finalSendChecklistDecisionTone === "ready"
          ? "ready"
          : finalSendChecklistDecisionTone === "hold"
            ? "hold"
            : "followup",
      detail: escalationDecisionSummaryLine
    },
    {
      label: "Route cue stays visible",
      tone:
        finalSendChecklistDecisionTone === "hold"
          ? "hold"
          : "followup",
      detail: nextStepRoutingSummaryLine
    }
  ];
  const escalationDispatchPacketMarkdown = [
    "# Escalation Dispatch Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Current route cue: ${routeFilteredResponseKit.filterLabel}`,
    `- Dispatch state: ${escalationDispatchLabel}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    "",
    "## Dispatch Summary",
    `- ${escalationDispatchSummaryLine}`,
    `- Trigger state: ${escalationTriggerSummaryLine}`,
    `- Decision posture: ${escalationDecisionSummaryLine}`,
    "",
    "## Route And Trigger",
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    `- Blocker cue: ${receiverFollowUpBlockerCue}`,
    `- Escalation threshold: ${resolutionEscalationRoute.prompt}`,
    "",
    "## Carry Forward",
    `- Escalation trigger packet: ${escalationTriggerPacketLead}`,
    `- Escalation decision guide: ${escalationDecisionGuideLead}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const escalationDeliveryTone =
    escalationDispatchTone === "hold"
      ? "hold"
      : escalationDispatchTone === "followup"
        ? "followup"
        : "ready";
  const escalationDeliveryLabel =
    escalationDeliveryTone === "hold"
      ? "Deliver now"
      : escalationDeliveryTone === "followup"
        ? "Prepare delivery"
        : "Hold delivery";
  const escalationDeliveryPacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when you want one GitHub-facing escalation delivery surface that says what should be delivered now and to whom."
      : selectedDestination === "closeout"
        ? "Use this packet when the closeout flow needs a compact escalation delivery summary that keeps the receiver cue and route guidance visible together."
        : "Use this packet when the next operator needs a delivery-ready escalation handoff that keeps the receiver cue, destination, and route guidance visible together.";
  const escalationDeliverySummaryLine =
    escalationDeliveryTone === "hold"
      ? `Escalation delivery should go out now to ${receiverGuidance.roleLabel.toLowerCase()} because the dispatch posture already says the current route is no longer sufficient.`
      : escalationDeliveryTone === "followup"
        ? `Escalation delivery should be prepared for ${receiverGuidance.roleLabel.toLowerCase()} so it can go out quickly if the visible trigger persists.`
        : `Escalation delivery should stay on hold while the current ${routeFilteredResponseKit.filterLabel.toLowerCase()} route remains viable, but the packet should keep the receiver and destination guidance nearby.`;
  const escalationDeliveryPacketCards = [
    {
      label: "Delivery state",
      value: escalationDeliveryLabel,
      detail: escalationDeliverySummaryLine
    },
    {
      label: "Destination",
      value: deliveryDestinations[selectedDestination].label,
      detail: deliveryDestinations[selectedDestination].summary
    },
    {
      label: "Receiver cue",
      value: receiverGuidance.roleLabel,
      detail: receiverGuidance.replyPrompt
    },
    {
      label: "Route guidance",
      value: routeFilteredResponseKit.filterLabel,
      detail: nextStepRoutingSummaryLine
    }
  ];
  const escalationDeliveryPacketItems = [
    {
      label: "Dispatch posture stays visible",
      tone: escalationDispatchTone,
      detail: escalationDispatchSummaryLine
    },
    {
      label: "Receiver guidance stays visible",
      tone: receiverGuidance.tone,
      detail: receiverGuidance.summary
    },
    {
      label: "Destination and route stay visible",
      tone:
        finalSendChecklistDecisionTone === "hold"
          ? "hold"
          : "followup",
      detail: `${deliveryDestinations[selectedDestination].summary} ${nextStepRoutingSummaryLine}`
    }
  ];
  const escalationDeliveryPacketMarkdown = [
    "# Escalation Delivery Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Route guidance: ${routeFilteredResponseKit.filterLabel}`,
    `- Delivery state: ${escalationDeliveryLabel}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    "",
    "## Delivery Summary",
    `- ${escalationDeliverySummaryLine}`,
    `- Dispatch posture: ${escalationDispatchSummaryLine}`,
    `- Trigger posture: ${escalationTriggerSummaryLine}`,
    "",
    "## Receiver And Route Guidance",
    `- Receiver guidance: ${receiverGuidance.summary}`,
    `- Reply prompt: ${receiverGuidance.replyPrompt}`,
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    "",
    "## Carry Forward",
    `- Escalation dispatch packet: ${escalationDispatchPacketLead}`,
    `- Delivery destination: ${deliveryDestinations[selectedDestination].summary}`,
    `- Next-step routing pack: ${nextStepRoutingPackLead}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const escalationConfirmationTone =
    escalationDeliveryTone === "hold"
      ? "hold"
      : escalationDeliveryTone === "followup"
        ? "followup"
        : "ready";
  const escalationConfirmationLabel =
    escalationConfirmationTone === "hold"
      ? "Confirm now"
      : escalationConfirmationTone === "followup"
        ? "Prepare confirmation"
        : "Hold confirmation";
  const escalationConfirmationPacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when you want one GitHub-facing escalation confirmation surface that says what the receiver should confirm after delivery."
      : selectedDestination === "closeout"
        ? "Use this packet when the closeout flow needs a compact escalation confirmation summary that keeps the receiver checklist and destination guidance visible together."
        : "Use this packet when the next operator needs a confirmation-ready escalation handoff that keeps the receiver checklist, destination guidance, and delivery posture visible together.";
  const escalationConfirmationSummaryLine =
    escalationConfirmationTone === "hold"
      ? `Escalation confirmation should happen now with ${receiverGuidance.roleLabel.toLowerCase()} because the delivery posture is already asking for an immediate confirmation loop.`
      : escalationConfirmationTone === "followup"
        ? `Escalation confirmation should be prepared for ${receiverGuidance.roleLabel.toLowerCase()} so the receiver can confirm the handoff quickly if the current route keeps slipping.`
        : `Escalation confirmation can stay on hold while the current ${routeFilteredResponseKit.filterLabel.toLowerCase()} route remains viable, but the checklist should remain ready.`;
  const escalationConfirmationPacketCards = [
    {
      label: "Confirmation state",
      value: escalationConfirmationLabel,
      detail: escalationConfirmationSummaryLine
    },
    {
      label: "Receiver cue",
      value: receiverGuidance.roleLabel,
      detail: receiverGuidance.summary
    },
    {
      label: "Destination",
      value: deliveryDestinations[selectedDestination].label,
      detail: deliveryDestinations[selectedDestination].summary
    },
    {
      label: "Dispatch posture",
      value: escalationDispatchLabel,
      detail: escalationDispatchSummaryLine
    }
  ];
  const escalationConfirmationPacketItems = [
    {
      label: "Receiver checklist stays visible",
      tone: receiverGuidance.tone,
      detail: receiverGuidance.checklist.join(" | ")
    },
    {
      label: "Delivery posture stays visible",
      tone: escalationDeliveryTone,
      detail: escalationDeliverySummaryLine
    },
    {
      label: "Destination guidance stays visible",
      tone:
        finalSendChecklistDecisionTone === "hold"
          ? "hold"
          : "followup",
      detail: deliveryDestinations[selectedDestination].summary
    }
  ];
  const escalationConfirmationPacketMarkdown = [
    "# Escalation Confirmation Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Confirmation state: ${escalationConfirmationLabel}`,
    `- Dispatch posture: ${escalationDispatchLabel}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    "",
    "## Confirmation Summary",
    `- ${escalationConfirmationSummaryLine}`,
    `- Delivery posture: ${escalationDeliverySummaryLine}`,
    `- Dispatch posture: ${escalationDispatchSummaryLine}`,
    "",
    "## Receiver Checklist",
    ...receiverGuidance.checklist.map((item) => `- ${item}`),
    `- Reply prompt: ${receiverGuidance.replyPrompt}`,
    "",
    "## Destination Guidance",
    `- ${deliveryDestinations[selectedDestination].summary}`,
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    "",
    "## Carry Forward",
    `- Escalation delivery packet: ${escalationDeliveryPacketLead}`,
    `- Receiver guidance: ${receiverGuidance.summary}`,
    `- Destination guidance: ${deliveryDestinations[selectedDestination].summary}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const escalationReceiptTone =
    escalationConfirmationTone === "hold"
      ? "hold"
      : escalationConfirmationTone === "followup"
        ? "followup"
        : "ready";
  const escalationReceiptLabel =
    escalationReceiptTone === "hold"
      ? "Receipt now"
      : escalationReceiptTone === "followup"
        ? "Prepare receipt"
        : "Hold receipt";
  const escalationReceiptPacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when you want one GitHub-facing escalation receipt surface that says what the downstream receiver should acknowledge after confirmation."
      : selectedDestination === "closeout"
        ? "Use this packet when the closeout flow needs a compact escalation receipt summary that keeps the acknowledgment cue and destination guidance visible together."
        : "Use this packet when the next operator needs a receipt-ready escalation handoff that keeps acknowledgment cues, destination guidance, and confirmation posture visible together.";
  const escalationReceiptSummaryLine =
    escalationReceiptTone === "hold"
      ? `Escalation receipt should be captured now with ${receiverGuidance.roleLabel.toLowerCase()} because the current confirmation posture already needs an explicit acknowledgment loop.`
      : escalationReceiptTone === "followup"
        ? `Escalation receipt should be prepared for ${receiverGuidance.roleLabel.toLowerCase()} so the downstream receiver can acknowledge the handoff quickly if the current route keeps slipping.`
        : `Escalation receipt can stay on hold while the current ${routeFilteredResponseKit.filterLabel.toLowerCase()} route remains viable, but the acknowledgment note should remain ready.`;
  const escalationReceiptPacketCards = [
    {
      label: "Receipt state",
      value: escalationReceiptLabel,
      detail: escalationReceiptSummaryLine
    },
    {
      label: "Acknowledgment cue",
      value: receiverGuidance.roleLabel,
      detail: `Reply prompt: ${receiverGuidance.replyPrompt}`
    },
    {
      label: "Destination",
      value: deliveryDestinations[selectedDestination].label,
      detail: deliveryDestinations[selectedDestination].summary
    },
    {
      label: "Confirmation posture",
      value: escalationConfirmationLabel,
      detail: escalationConfirmationSummaryLine
    }
  ];
  const escalationReceiptPacketItems = [
    {
      label: "Receiver acknowledgment stays visible",
      tone: receiverGuidance.tone,
      detail: receiverGuidance.checklist.join(" | ")
    },
    {
      label: "Confirmation posture stays visible",
      tone: escalationConfirmationTone,
      detail: escalationConfirmationSummaryLine
    },
    {
      label: "Next receipt checkpoint stays visible",
      tone: escalationReceiptTone,
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    }
  ];
  const escalationReceiptPacketMarkdown = [
    "# Escalation Receipt Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Receipt state: ${escalationReceiptLabel}`,
    `- Confirmation state: ${escalationConfirmationLabel}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    "",
    "## Receipt Summary",
    `- ${escalationReceiptSummaryLine}`,
    `- Confirmation posture: ${escalationConfirmationSummaryLine}`,
    `- Delivery posture: ${escalationDeliverySummaryLine}`,
    "",
    "## Acknowledge Back",
    ...receiverGuidance.checklist.map((item) => `- ${item}`),
    `- Reply prompt: ${receiverGuidance.replyPrompt}`,
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    "",
    "## Destination Guidance",
    `- ${deliveryDestinations[selectedDestination].summary}`,
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    `- Dispatch posture: ${escalationDispatchSummaryLine}`,
    "",
    "## Carry Forward",
    `- Escalation confirmation packet: ${escalationConfirmationPacketLead}`,
    `- Receiver guidance: ${receiverGuidance.summary}`,
    `- Destination guidance: ${deliveryDestinations[selectedDestination].summary}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const escalationAcknowledgmentTone =
    escalationReceiptTone === "hold"
      ? "hold"
      : escalationReceiptTone === "followup"
        ? "followup"
        : "ready";
  const escalationAcknowledgmentLabel =
    escalationAcknowledgmentTone === "hold"
      ? "Acknowledge now"
      : escalationAcknowledgmentTone === "followup"
        ? "Prepare acknowledgment"
        : "Hold acknowledgment";
  const escalationAcknowledgmentPacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when you want one GitHub-facing escalation acknowledgment surface that says what the downstream receiver should acknowledge and carry forward after receipt."
      : selectedDestination === "closeout"
        ? "Use this packet when the closeout flow needs a compact escalation acknowledgment summary that keeps the follow-through cue and destination guidance visible together."
        : "Use this packet when the next operator needs an acknowledgment-ready escalation handoff that keeps follow-through cues, destination guidance, and receipt posture visible together.";
  const escalationAcknowledgmentSummaryLine =
    escalationAcknowledgmentTone === "hold"
      ? `Escalation acknowledgment should happen now with ${receiverGuidance.roleLabel.toLowerCase()} because the receipt posture already needs an explicit acknowledgment and follow-through loop.`
      : escalationAcknowledgmentTone === "followup"
        ? `Escalation acknowledgment should stay prepared for ${receiverGuidance.roleLabel.toLowerCase()} so the downstream receiver can confirm receipt and the next follow-through step without rebuilding context.`
        : `Escalation acknowledgment can stay on hold while the current ${routeFilteredResponseKit.filterLabel.toLowerCase()} route remains viable, but the acknowledgment path should remain ready.`;
  const escalationAcknowledgmentPacketCards = [
    {
      label: "Acknowledgment state",
      value: escalationAcknowledgmentLabel,
      detail: escalationAcknowledgmentSummaryLine
    },
    {
      label: "Receipt posture",
      value: escalationReceiptLabel,
      detail: escalationReceiptSummaryLine
    },
    {
      label: "Follow-through cue",
      value: receiverResponseActiveTemplate.label,
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    },
    {
      label: "Destination",
      value: deliveryDestinations[selectedDestination].label,
      detail: deliveryDestinations[selectedDestination].summary
    }
  ];
  const escalationAcknowledgmentPacketItems = [
    {
      label: "Receipt posture stays visible",
      tone: escalationReceiptTone,
      detail: escalationReceiptSummaryLine
    },
    {
      label: "Receiver follow-through stays visible",
      tone: receiverGuidance.tone,
      detail: receiverGuidance.checklist.join(" | ")
    },
    {
      label: "Next acknowledgment cue stays visible",
      tone: escalationAcknowledgmentTone,
      detail: `Primary route step: ${nextStepRoutingPrimaryStep}`
    }
  ];
  const escalationAcknowledgmentPacketMarkdown = [
    "# Escalation Acknowledgment Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Acknowledgment state: ${escalationAcknowledgmentLabel}`,
    `- Receipt state: ${escalationReceiptLabel}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    "",
    "## Acknowledgment Summary",
    `- ${escalationAcknowledgmentSummaryLine}`,
    `- Receipt posture: ${escalationReceiptSummaryLine}`,
    `- Confirmation posture: ${escalationConfirmationSummaryLine}`,
    "",
    "## Follow-Through Cues",
    ...receiverGuidance.checklist.map((item) => `- ${item}`),
    `- Reply prompt: ${receiverGuidance.replyPrompt}`,
    `- Primary route step: ${nextStepRoutingPrimaryStep}`,
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    "",
    "## Destination Guidance",
    `- ${deliveryDestinations[selectedDestination].summary}`,
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    `- Dispatch posture: ${escalationDispatchSummaryLine}`,
    "",
    "## Carry Forward",
    `- Escalation receipt packet: ${escalationReceiptPacketLead}`,
    `- Receiver guidance: ${receiverGuidance.summary}`,
    `- Destination guidance: ${deliveryDestinations[selectedDestination].summary}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const escalationClosureTone =
    escalationAcknowledgmentTone === "hold"
      ? "hold"
      : escalationAcknowledgmentTone === "followup"
        ? "followup"
        : "ready";
  const escalationClosureLabel =
    escalationClosureTone === "hold"
      ? "Close now"
      : escalationClosureTone === "followup"
        ? "Prepare closeout"
        : "Hold closeout";
  const escalationClosurePacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when you want one GitHub-facing escalation closure surface that says what the downstream receiver should close and how completion should be confirmed."
      : selectedDestination === "closeout"
        ? "Use this packet when the closeout flow needs a compact escalation closure summary that keeps the completion cue and destination guidance visible together."
        : "Use this packet when the next operator needs a closure-ready escalation handoff that keeps completion cues, destination guidance, and acknowledgment posture visible together.";
  const escalationClosureSummaryLine =
    escalationClosureTone === "hold"
      ? `Escalation closure should happen now with ${receiverGuidance.roleLabel.toLowerCase()} because the acknowledgment posture already supports explicit completion and closeout.`
      : escalationClosureTone === "followup"
        ? `Escalation closure should stay prepared for ${receiverGuidance.roleLabel.toLowerCase()} so the downstream receiver can confirm completion and the final closeout step without rebuilding context.`
        : `Escalation closure can stay on hold while the current ${routeFilteredResponseKit.filterLabel.toLowerCase()} route remains viable, but the closeout path should remain ready.`;
  const escalationClosurePacketCards = [
    {
      label: "Closure state",
      value: escalationClosureLabel,
      detail: escalationClosureSummaryLine
    },
    {
      label: "Acknowledgment posture",
      value: escalationAcknowledgmentLabel,
      detail: escalationAcknowledgmentSummaryLine
    },
    {
      label: "Completion cue",
      value: receiverResponseActiveTemplate.label,
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    },
    {
      label: "Destination",
      value: deliveryDestinations[selectedDestination].label,
      detail: deliveryDestinations[selectedDestination].summary
    }
  ];
  const escalationClosurePacketItems = [
    {
      label: "Acknowledgment posture stays visible",
      tone: escalationAcknowledgmentTone,
      detail: escalationAcknowledgmentSummaryLine
    },
    {
      label: "Completion checklist stays visible",
      tone: receiverGuidance.tone,
      detail: receiverGuidance.checklist.join(" | ")
    },
    {
      label: "Final closeout cue stays visible",
      tone: escalationClosureTone,
      detail: `Primary route step: ${nextStepRoutingPrimaryStep}`
    }
  ];
  const escalationClosurePacketMarkdown = [
    "# Escalation Closure Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Closure state: ${escalationClosureLabel}`,
    `- Acknowledgment state: ${escalationAcknowledgmentLabel}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    "",
    "## Closure Summary",
    `- ${escalationClosureSummaryLine}`,
    `- Acknowledgment posture: ${escalationAcknowledgmentSummaryLine}`,
    `- Receipt posture: ${escalationReceiptSummaryLine}`,
    "",
    "## Completion Cues",
    ...receiverGuidance.checklist.map((item) => `- ${item}`),
    `- Reply prompt: ${receiverGuidance.replyPrompt}`,
    `- Primary route step: ${nextStepRoutingPrimaryStep}`,
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    "",
    "## Destination Guidance",
    `- ${deliveryDestinations[selectedDestination].summary}`,
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    `- Dispatch posture: ${escalationDispatchSummaryLine}`,
    "",
    "## Carry Forward",
    `- Escalation acknowledgment packet: ${escalationAcknowledgmentPacketLead}`,
    `- Receiver guidance: ${receiverGuidance.summary}`,
    `- Destination guidance: ${deliveryDestinations[selectedDestination].summary}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
  const escalationFinalizationTone =
    escalationClosureTone === "hold"
      ? "hold"
      : escalationClosureTone === "followup"
        ? "followup"
        : "ready";
  const escalationFinalizationLabel =
    escalationFinalizationTone === "hold"
      ? "Finalize now"
      : escalationFinalizationTone === "followup"
        ? "Prepare finalization"
        : "Hold finalization";
  const escalationFinalizationPacketLead =
    selectedDestination === "pr-comment"
      ? "Use this packet when you want one GitHub-facing escalation finalization surface that says what the downstream receiver should finalize and how the end state should be confirmed."
      : selectedDestination === "closeout"
        ? "Use this packet when the closeout flow needs a compact escalation finalization summary that keeps the final completion cue and destination guidance visible together."
        : "Use this packet when the next operator needs a finalization-ready escalation handoff that keeps final completion cues, destination guidance, and closure posture visible together.";
  const escalationFinalizationSummaryLine =
    escalationFinalizationTone === "hold"
      ? `Escalation finalization should happen now with ${receiverGuidance.roleLabel.toLowerCase()} because the closure posture already supports explicit completion and archive-ready closeout.`
      : escalationFinalizationTone === "followup"
        ? `Escalation finalization should stay prepared for ${receiverGuidance.roleLabel.toLowerCase()} so the downstream receiver can confirm archive-ready completion and the final follow-through step without rebuilding context.`
        : `Escalation finalization can stay on hold while the current ${routeFilteredResponseKit.filterLabel.toLowerCase()} route remains viable, but the archive-ready path should remain ready.`;
  const escalationFinalizationPacketCards = [
    {
      label: "Finalization state",
      value: escalationFinalizationLabel,
      detail: escalationFinalizationSummaryLine
    },
    {
      label: "Closure posture",
      value: escalationClosureLabel,
      detail: escalationClosureSummaryLine
    },
    {
      label: "Final completion cue",
      value: receiverResponseActiveTemplate.label,
      detail: `Next checkpoint: ${receiverFollowUpNextAction}`
    },
    {
      label: "Destination",
      value: deliveryDestinations[selectedDestination].label,
      detail: deliveryDestinations[selectedDestination].summary
    }
  ];
  const escalationFinalizationPacketItems = [
    {
      label: "Closure posture stays visible",
      tone: escalationClosureTone,
      detail: escalationClosureSummaryLine
    },
    {
      label: "Completion checklist stays visible",
      tone: receiverGuidance.tone,
      detail: receiverGuidance.checklist.join(" | ")
    },
    {
      label: "Archive-ready cue stays visible",
      tone: escalationFinalizationTone,
      detail: `Primary route step: ${nextStepRoutingPrimaryStep}`
    }
  ];
  const escalationFinalizationPacketMarkdown = [
    "# Escalation Finalization Packet",
    "",
    `- Destination: ${deliveryDestinations[selectedDestination].label}`,
    `- Receiver cue: ${receiverGuidance.roleLabel}`,
    `- Finalization state: ${escalationFinalizationLabel}`,
    `- Closure state: ${escalationClosureLabel}`,
    `- Escalation route: ${resolutionEscalationRoute.label}`,
    "",
    "## Finalization Summary",
    `- ${escalationFinalizationSummaryLine}`,
    `- Closure posture: ${escalationClosureSummaryLine}`,
    `- Acknowledgment posture: ${escalationAcknowledgmentSummaryLine}`,
    "",
    "## Final Completion Cues",
    ...receiverGuidance.checklist.map((item) => `- ${item}`),
    `- Reply prompt: ${receiverGuidance.replyPrompt}`,
    `- Primary route step: ${nextStepRoutingPrimaryStep}`,
    `- Next checkpoint: ${receiverFollowUpNextAction}`,
    "",
    "## Destination Guidance",
    `- ${deliveryDestinations[selectedDestination].summary}`,
    `- Current route summary: ${nextStepRoutingSummaryLine}`,
    `- Dispatch posture: ${escalationDispatchSummaryLine}`,
    "",
    "## Carry Forward",
    `- Escalation closure packet: ${escalationClosurePacketLead}`,
    `- Receiver guidance: ${receiverGuidance.summary}`,
    `- Destination guidance: ${deliveryDestinations[selectedDestination].summary}`,
    "",
    "## Escalate When",
    `- ${resolutionEscalationRoute.prompt}`
  ].join("\n");
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
    <section id="review-scorecard" className="panel panelAccent">
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
                <div className="copyPreflightBoard">
                  <div className="claimHeader">
                    <strong>Packet recommendation</strong>
                    <button
                      type="button"
                      className="actionButton"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(packetRecommendationMarkdown);
                          setPacketRecommendationCopyState("copied");
                        } catch {
                          setPacketRecommendationCopyState("failed");
                        }
                      }}
                    >
                      Copy recommendation
                    </button>
                  </div>
                  <p className="scoreHint">{packetRecommendationSummary}</p>
                  <div className="statusRow">
                    <span className="pill">Recommended: {bundleVariantProfiles[recommendedPacketVariant].label}</span>
                    <span className="pill">Current: {bundleVariantProfiles[bundleVariant].label}</span>
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className={`statusPill statusPill${bundleVariant === recommendedPacketVariant ? "ready" : "followup"}`}>
                      {bundleVariant === recommendedPacketVariant ? "aligned" : "fallback active"}
                    </span>
                  </div>
                  <div className="handoffSections">
                    <div className="handoffSection handoffSectionReady">
                      <h3>Why this packet fits</h3>
                      <ul className="checklist compact">
                        {packetRecommendationReasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="handoffSection handoffSectionWarning">
                      <h3>Fallback rationale</h3>
                      <p>{fallbackPacketRationale}</p>
                      <p className="scoreHint">{packetRecommendationAlignment}</p>
                    </div>
                  </div>
                  <pre className="bundlePreviewPre">{packetRecommendationMarkdown}</pre>
                  <p className="scoreHint">
                    {packetRecommendationCopyState === "copied"
                      ? "Packet recommendation copied to clipboard."
                      : packetRecommendationCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the recommendation preview."
                        : "Use this banner when you want the workbench to name the preferred packet mode and explain when the fallback still makes sense."}
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
                <div className="payloadPreviewBoard">
                  <div className="claimHeader">
                    <strong>Packet diff preview</strong>
                    <button
                      type="button"
                      className="actionButton"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(handoffPacketVariantDiffMarkdown);
                          setPacketVariantDiffCopyState("copied");
                        } catch {
                          setPacketVariantDiffCopyState("failed");
                        }
                      }}
                    >
                      Copy diff cues
                    </button>
                  </div>
                  <p className="scoreHint">
                    Compare the compact and full handoff packet variants before sending so the omitted sections and extra
                    delivery context stay explicit.
                  </p>
                  <div className="payloadPreviewGrid">
                    {handoffPacketVariantPreviewCards.map((card) => (
                      <article
                        key={card.variant}
                        className={`payloadPreviewCard${bundleVariant === card.variant ? " payloadPreviewCardPrimary" : ""}`}
                      >
                        <div className="claimHeader">
                          <div>
                            <strong>{bundleVariantProfiles[card.variant].label}</strong>
                            <p className="scoreHint">{card.coverage.summary}</p>
                          </div>
                          <span className={`statusPill ${card.toneClass}`}>
                            {bundleVariant === card.variant ? "active" : "alternate"}
                          </span>
                        </div>
                        <div className="payloadPreviewMeta">
                          <span className="metaChip">{card.preview.lineCount} lines</span>
                          <span className="metaChip">{card.preview.sectionCount} sections</span>
                          <span className="metaChip">
                            {card.coverage.omits.length > 0 ? `${card.coverage.omits.length} omission cue(s)` : "no omissions"}
                          </span>
                        </div>
                        <pre className="payloadPreviewPre">{card.preview.excerpt}</pre>
                      </article>
                    ))}
                  </div>
                  <div className="handoffSections">
                    <div className="handoffSection handoffSectionWarning">
                      <h3>Compact leaves out</h3>
                      <ul className="checklist compact">
                        {sessionHandoffVariantCoverage.compact.omits.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="handoffSection handoffSectionReady">
                      <h3>Full keeps attached</h3>
                      <ul className="checklist compact">
                        {sessionHandoffVariantCoverage.full.includes.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="payloadDiffBoard">
                    <div className="claimHeader">
                      <strong>Section-level delta</strong>
                      <span className="pill">full vs compact</span>
                    </div>
                    <div className="payloadDiffGrid">
                      {handoffPacketVariantDiffHighlights.map((highlight) => (
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
                            <span className="metaChip">full: {highlight.recommendedLines} lines</span>
                            <span className="metaChip">compact: {highlight.fallbackLines} lines</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                  <p className="scoreHint">
                    {packetVariantDiffCopyState === "copied"
                      ? "Packet diff cues copied to clipboard."
                      : packetVariantDiffCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the visible diff cues."
                        : "Use this board when you need to see exactly what the full packet adds beyond the compact handoff before sending."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Final send summary</strong>
                      <p className="scoreHint">{finalSendSummaryLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${copyPreflight.tone}`}>{copyPreflight.tone}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(finalSendSummaryMarkdown);
                            setFinalSendSummaryCopyState("copied");
                          } catch {
                            setFinalSendSummaryCopyState("failed");
                          }
                        }}
                      >
                        Copy send summary
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{bundleVariantProfiles[bundleVariant].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {finalSendSummaryCards.map((item) => (
                      <article key={item.label} className="manifestCard">
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className="pill">{item.value}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{finalSendSummaryMarkdown}</pre>
                  <p className="scoreHint">
                    {finalSendSummaryCopyState === "copied"
                      ? "Final send summary copied to clipboard."
                      : finalSendSummaryCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the send-summary preview."
                        : "Use this summary card when you want one outgoing handoff view that keeps the sender note, packet mode, and route posture visible together."}
                  </p>
                </div>
                <div className="copyPreflightBoard">
                  <div className="claimHeader">
                    <strong>Final send checklist</strong>
                    <button
                      type="button"
                      className="actionButton"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(finalSendChecklistMarkdown);
                          setFinalSendChecklistCopyState("copied");
                        } catch {
                          setFinalSendChecklistCopyState("failed");
                        }
                      }}
                    >
                      Copy send checklist
                    </button>
                  </div>
                  <p className="scoreHint">{finalSendChecklistSummary}</p>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{bundleVariantProfiles[recommendedPacketVariant].label} recommended</span>
                    <span className="pill">{bundleVariantProfiles[bundleVariant].label} current</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {finalSendChecklistCards.map((item) => (
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
                    {finalSendChecklistItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{finalSendChecklistMarkdown}</pre>
                  <p className="scoreHint">
                    {finalSendChecklistCopyState === "copied"
                      ? "Final send checklist copied to clipboard."
                      : finalSendChecklistCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the send-checklist preview."
                        : "Use this checklist when you want a send, widen, or hold decision that ties together the recommendation, summary, and readiness cues."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Delivery bundle export</strong>
                      <p className="scoreHint">{deliveryBundleLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(deliveryBundleMarkdown);
                            setDeliveryBundleCopyState("copied");
                          } catch {
                            setDeliveryBundleCopyState("failed");
                          }
                        }}
                      >
                        Copy delivery bundle
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{bundleVariantProfiles[bundleVariant].label}</span>
                    <span className="pill">{bundleVariantProfiles[recommendedPacketVariant].label} recommended</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {deliveryBundleCards.map((item) => (
                      <article key={item.label} className="manifestCard">
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className="pill">{item.value}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{deliveryBundleMarkdown}</pre>
                  <p className="scoreHint">
                    {deliveryBundleCopyState === "copied"
                      ? "Delivery bundle export copied to clipboard."
                      : deliveryBundleCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the bundle preview."
                        : "Use this bundle when the outgoing handoff should travel as one fuller package instead of separate send surfaces."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Destination-specific delivery script</strong>
                      <p className="scoreHint">{deliveryScriptLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(deliveryScriptMarkdown);
                            setDeliveryScriptCopyState("copied");
                          } catch {
                            setDeliveryScriptCopyState("failed");
                          }
                        }}
                      >
                        Copy delivery script
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{bundleVariantProfiles[recommendedPacketVariant].label} recommended</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {deliveryScriptCards.map((item) => (
                      <article key={item.label} className="manifestCard">
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className="pill">{item.value}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{deliveryScriptMarkdown}</pre>
                  <p className="scoreHint">
                    {deliveryScriptCopyState === "copied"
                      ? "Destination-specific delivery script copied to clipboard."
                      : deliveryScriptCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the delivery-script preview."
                      : "Use this script when you want the final outgoing delivery text to stay aligned with the sender note, packet recommendation, and receiver cue."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Receiver follow-up pack</strong>
                      <p className="scoreHint">{receiverFollowUpLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(receiverFollowUpMarkdown);
                            setReceiverFollowUpPackCopyState("copied");
                          } catch {
                            setReceiverFollowUpPackCopyState("failed");
                          }
                        }}
                      >
                        Copy follow-up pack
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {receiverFollowUpCards.map((item) => (
                      <article key={item.label} className="manifestCard">
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className="pill">{item.value}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{receiverFollowUpMarkdown}</pre>
                  <p className="scoreHint">
                    {receiverFollowUpPackCopyState === "copied"
                        ? "Receiver follow-up pack copied to clipboard."
                      : receiverFollowUpPackCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the follow-up-pack preview."
                        : "Use this pack when you want a compact follow-up note that keeps the current route cue, receiver ask, and send posture aligned."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Delivery checkpoint board</strong>
                      <p className="scoreHint">{deliveryCheckpointLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(deliveryCheckpointMarkdown);
                            setDeliveryCheckpointCopyState("copied");
                          } catch {
                            setDeliveryCheckpointCopyState("failed");
                          }
                        }}
                      >
                        Copy checkpoint board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{bundleVariantProfiles[bundleVariant].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {deliveryCheckpointCards.map((item) => (
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
                    {deliveryCheckpointItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{deliveryCheckpointMarkdown}</pre>
                  <p className="scoreHint">
                    {deliveryCheckpointCopyState === "copied"
                      ? "Delivery checkpoint board copied to clipboard."
                      : deliveryCheckpointCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the checkpoint-board preview."
                        : "Use this board when you want one post-send checkpoint that keeps the sent package, route cue, and next reply posture visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Receiver response packet</strong>
                      <p className="scoreHint">{receiverResponsePacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${receiverResponseActiveTemplate.tone}`}>{receiverResponseActiveTemplate.label}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(receiverResponsePacketMarkdown);
                            setReceiverResponsePacketCopyState("copied");
                          } catch {
                            setReceiverResponsePacketCopyState("failed");
                          }
                        }}
                      >
                        Copy response packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {receiverResponsePacketCards.map((item) => (
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
                    {receiverResponsePacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{receiverResponsePacketMarkdown}</pre>
                  <p className="scoreHint">
                    {receiverResponsePacketCopyState === "copied"
                        ? "Receiver response packet copied to clipboard."
                      : receiverResponsePacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the response-packet preview."
                        : "Use this packet when you want the follow-up note, active route template, and fallback reply cues to travel together for the next receiver-facing response."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Reply outcome tracker</strong>
                      <p className="scoreHint">{replyOutcomeTrackerLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${receiverResponseActiveTemplate.tone}`}>{receiverResponseActiveTemplate.label}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(replyOutcomeTrackerMarkdown);
                            setReplyOutcomeTrackerCopyState("copied");
                          } catch {
                            setReplyOutcomeTrackerCopyState("failed");
                          }
                        }}
                      >
                        Copy outcome tracker
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {replyOutcomeTrackerCards.map((item) => (
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
                    {replyOutcomeTrackerItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{replyOutcomeTrackerMarkdown}</pre>
                  <p className="scoreHint">
                    {replyOutcomeTrackerCopyState === "copied"
                      ? "Reply outcome tracker copied to clipboard."
                      : replyOutcomeTrackerCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the outcome-tracker preview."
                        : "Use this tracker when you want one receiver-facing outcome summary that keeps the active reply path and remaining open state visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Resolution handoff pack</strong>
                      <p className="scoreHint">{resolutionHandoffPackLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${resolutionEscalationRoute.tone}`}>{resolutionEscalationRoute.label}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(resolutionHandoffPackMarkdown);
                            setResolutionHandoffPackCopyState("copied");
                          } catch {
                            setResolutionHandoffPackCopyState("failed");
                          }
                        }}
                      >
                        Copy resolution pack
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {resolutionHandoffCards.map((item) => (
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
                    {resolutionHandoffItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{resolutionHandoffPackMarkdown}</pre>
                  <p className="scoreHint">
                    {resolutionHandoffPackCopyState === "copied"
                      ? "Resolution handoff pack copied to clipboard."
                      : resolutionHandoffPackCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the resolution-pack preview."
                        : "Use this pack when the remaining checkpoint, response, and escalation context should travel together for the next resolution handoff."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Resolution status board</strong>
                      <p className="scoreHint">{resolutionStatusBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${resolutionEscalationRoute.tone}`}>{resolutionEscalationRoute.label}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(resolutionStatusBoardMarkdown);
                            setResolutionStatusBoardCopyState("copied");
                          } catch {
                            setResolutionStatusBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy status board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {resolutionStatusBoardCards.map((item) => (
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
                    {resolutionStatusBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{resolutionStatusBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {resolutionStatusBoardCopyState === "copied"
                        ? "Resolution status board copied to clipboard."
                      : resolutionStatusBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the status-board preview."
                        : "Use this board when you want one resolution snapshot that keeps current status, active outcome, and escalation posture visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Next-step routing pack</strong>
                      <p className="scoreHint">{nextStepRoutingPackLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${receiverResponseActiveTemplate.tone}`}>{receiverResponseActiveTemplate.label}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(nextStepRoutingPackMarkdown);
                            setNextStepRoutingPackCopyState("copied");
                          } catch {
                            setNextStepRoutingPackCopyState("failed");
                          }
                        }}
                      >
                        Copy routing pack
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {nextStepRoutingPackCards.map((item) => (
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
                    {nextStepRoutingPackItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{nextStepRoutingPackMarkdown}</pre>
                  <p className="scoreHint">
                    {nextStepRoutingPackCopyState === "copied"
                        ? "Next-step routing pack copied to clipboard."
                      : nextStepRoutingPackCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the routing-pack preview."
                        : "Use this pack when you want one routing summary that keeps the next action, fallback path, and open-state cue visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Action readiness board</strong>
                      <p className="scoreHint">{actionReadinessBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(actionReadinessBoardMarkdown);
                            setActionReadinessBoardCopyState("copied");
                          } catch {
                            setActionReadinessBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy readiness board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {actionReadinessBoardCards.map((item) => (
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
                    {actionReadinessBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{actionReadinessBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {actionReadinessBoardCopyState === "copied"
                        ? "Action readiness board copied to clipboard."
                      : actionReadinessBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the readiness-board preview."
                        : "Use this board when you want one readiness check that confirms whether the next action is clear to execute."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Execution kickoff board</strong>
                      <p className="scoreHint">{executionKickoffBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(executionKickoffBoardMarkdown);
                            setExecutionKickoffBoardCopyState("copied");
                          } catch {
                            setExecutionKickoffBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy kickoff board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {executionKickoffBoardCards.map((item) => (
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
                    {executionKickoffBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{executionKickoffBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {executionKickoffBoardCopyState === "copied"
                      ? "Execution kickoff board copied to clipboard."
                      : executionKickoffBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the kickoff-board preview."
                        : "Use this board when you want one kickoff summary that confirms whether execution should start now."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Execution progress tracker</strong>
                      <p className="scoreHint">{executionProgressTrackerLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${executionProgressTone}`}>{executionProgressLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(executionProgressTrackerMarkdown);
                            setExecutionProgressTrackerCopyState("copied");
                          } catch {
                            setExecutionProgressTrackerCopyState("failed");
                          }
                        }}
                      >
                        Copy progress tracker
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${executionProgressTone}`}>{executionProgressLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {executionProgressTrackerCards.map((item) => (
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
                    {executionProgressTrackerItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{executionProgressTrackerMarkdown}</pre>
                  <p className="scoreHint">
                    {executionProgressTrackerCopyState === "copied"
                      ? "Execution progress tracker copied to clipboard."
                      : executionProgressTrackerCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the progress-tracker preview."
                        : "Use this tracker when you want one execution-progress surface that keeps kickoff, checkpoint, and receiver response cues visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Execution outcome board</strong>
                      <p className="scoreHint">{executionOutcomeBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${executionOutcomeTone}`}>{executionOutcomeLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(executionOutcomeBoardMarkdown);
                            setExecutionOutcomeBoardCopyState("copied");
                          } catch {
                            setExecutionOutcomeBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy outcome board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${executionOutcomeTone}`}>{executionOutcomeLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {executionOutcomeBoardCards.map((item) => (
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
                    {executionOutcomeBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{executionOutcomeBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {executionOutcomeBoardCopyState === "copied"
                      ? "Execution outcome board copied to clipboard."
                      : executionOutcomeBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the outcome-board preview."
                        : "Use this board when you want one execution-outcome surface that keeps progress, checkpoint, and response posture visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Execution correction board</strong>
                      <p className="scoreHint">{executionCorrectionBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${executionCorrectionTone}`}>{executionCorrectionLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(executionCorrectionBoardMarkdown);
                            setExecutionCorrectionBoardCopyState("copied");
                          } catch {
                            setExecutionCorrectionBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy correction board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${executionCorrectionTone}`}>{executionCorrectionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {executionCorrectionBoardCards.map((item) => (
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
                    {executionCorrectionBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{executionCorrectionBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {executionCorrectionBoardCopyState === "copied"
                      ? "Execution correction board copied to clipboard."
                      : executionCorrectionBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the correction-board preview."
                        : "Use this board when you want one correction surface that keeps the outcome posture, blocker cue, and route alternatives visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Execution recovery board</strong>
                      <p className="scoreHint">{executionRecoveryBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${executionRecoveryTone}`}>{executionRecoveryLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(executionRecoveryBoardMarkdown);
                            setExecutionRecoveryBoardCopyState("copied");
                          } catch {
                            setExecutionRecoveryBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy recovery board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${executionRecoveryTone}`}>{executionRecoveryLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {executionRecoveryBoardCards.map((item) => (
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
                    {executionRecoveryBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{executionRecoveryBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {executionRecoveryBoardCopyState === "copied"
                      ? "Execution recovery board copied to clipboard."
                      : executionRecoveryBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the recovery-board preview."
                        : "Use this board when you want one recovery surface that keeps correction posture, outcome state, and route reset cues visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Execution recovery checkpoint board</strong>
                      <p className="scoreHint">{executionRecoveryCheckpointBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${executionRecoveryCheckpointTone}`}>{executionRecoveryCheckpointLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(executionRecoveryCheckpointBoardMarkdown);
                            setExecutionRecoveryCheckpointBoardCopyState("copied");
                          } catch {
                            setExecutionRecoveryCheckpointBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy recovery checkpoint
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${executionRecoveryCheckpointTone}`}>{executionRecoveryCheckpointLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {executionRecoveryCheckpointBoardCards.map((item) => (
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
                    {executionRecoveryCheckpointBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{executionRecoveryCheckpointBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {executionRecoveryCheckpointBoardCopyState === "copied"
                      ? "Execution recovery checkpoint board copied to clipboard."
                      : executionRecoveryCheckpointBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the recovery-checkpoint preview."
                        : "Use this board when you want one checkpoint-ready recovery surface that keeps posture, blockers, and the immediate next action visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Execution recovery clearance board</strong>
                      <p className="scoreHint">{executionRecoveryClearanceBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${executionRecoveryClearanceTone}`}>{executionRecoveryClearanceLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(executionRecoveryClearanceBoardMarkdown);
                            setExecutionRecoveryClearanceBoardCopyState("copied");
                          } catch {
                            setExecutionRecoveryClearanceBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy clearance board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${executionRecoveryClearanceTone}`}>{executionRecoveryClearanceLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {executionRecoveryClearanceBoardCards.map((item) => (
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
                    {executionRecoveryClearanceBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{executionRecoveryClearanceBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {executionRecoveryClearanceBoardCopyState === "copied"
                      ? "Execution recovery clearance board copied to clipboard."
                      : executionRecoveryClearanceBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the clearance-board preview."
                        : "Use this board when you want one clearance-ready recovery surface that keeps checkpoint posture, blocker review, and release cues visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Execution recovery release board</strong>
                      <p className="scoreHint">{executionRecoveryReleaseBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${executionRecoveryReleaseTone}`}>{executionRecoveryReleaseLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(executionRecoveryReleaseBoardMarkdown);
                            setExecutionRecoveryReleaseBoardCopyState("copied");
                          } catch {
                            setExecutionRecoveryReleaseBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy release board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${executionRecoveryReleaseTone}`}>{executionRecoveryReleaseLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {executionRecoveryReleaseBoardCards.map((item) => (
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
                    {executionRecoveryReleaseBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{executionRecoveryReleaseBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {executionRecoveryReleaseBoardCopyState === "copied"
                      ? "Execution recovery release board copied to clipboard."
                      : executionRecoveryReleaseBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the release-board preview."
                        : "Use this board when you want one release-ready recovery surface that keeps the release posture, final cue, and first post-release check visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Execution recovery completion board</strong>
                      <p className="scoreHint">{executionRecoveryCompletionBoardLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${executionRecoveryCompletionTone}`}>{executionRecoveryCompletionLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(executionRecoveryCompletionBoardMarkdown);
                            setExecutionRecoveryCompletionBoardCopyState("copied");
                          } catch {
                            setExecutionRecoveryCompletionBoardCopyState("failed");
                          }
                        }}
                      >
                        Copy completion board
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${executionRecoveryCompletionTone}`}>{executionRecoveryCompletionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {executionRecoveryCompletionBoardCards.map((item) => (
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
                    {executionRecoveryCompletionBoardItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{executionRecoveryCompletionBoardMarkdown}</pre>
                  <p className="scoreHint">
                    {executionRecoveryCompletionBoardCopyState === "copied"
                      ? "Execution recovery completion board copied to clipboard."
                      : executionRecoveryCompletionBoardCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the completion-board preview."
                        : "Use this board when you want one completion-ready recovery surface that keeps the completion posture, completion cue, and first post-completion check visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation handoff packet</strong>
                      <p className="scoreHint">{escalationHandoffPacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${resolutionEscalationRoute.tone}`}>{resolutionEscalationRoute.label}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationHandoffPacketMarkdown);
                            setEscalationHandoffPacketCopyState("copied");
                          } catch {
                            setEscalationHandoffPacketCopyState("failed");
                          }
                        }}
                      >
                        Copy escalation packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationHandoffPacketCards.map((item) => (
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
                    {escalationHandoffPacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationHandoffPacketMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationHandoffPacketCopyState === "copied"
                        ? "Escalation handoff packet copied to clipboard."
                      : escalationHandoffPacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the escalation-packet preview."
                        : "Use this packet when the current status, routing posture, and fallback path should travel together for escalation."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation decision guide</strong>
                      <p className="scoreHint">{escalationDecisionGuideLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${resolutionEscalationRoute.tone}`}>{resolutionEscalationRoute.label}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationDecisionGuideMarkdown);
                            setEscalationDecisionGuideCopyState("copied");
                          } catch {
                            setEscalationDecisionGuideCopyState("failed");
                          }
                        }}
                      >
                        Copy decision guide
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${finalSendChecklistDecisionTone}`}>{finalSendChecklistDecisionLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationDecisionGuideCards.map((item) => (
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
                    {escalationDecisionGuideItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationDecisionGuideMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationDecisionGuideCopyState === "copied"
                      ? "Escalation decision guide copied to clipboard."
                      : escalationDecisionGuideCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the decision-guide preview."
                        : "Use this guide when you want one escalation decision surface that keeps readiness, blocker posture, and fallback thresholds visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation trigger packet</strong>
                      <p className="scoreHint">{escalationTriggerPacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${escalationTriggerTone}`}>{escalationTriggerLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationTriggerPacketMarkdown);
                            setEscalationTriggerPacketCopyState("copied");
                          } catch {
                            setEscalationTriggerPacketCopyState("failed");
                          }
                        }}
                      >
                        Copy trigger packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${escalationTriggerTone}`}>{escalationTriggerLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationTriggerPacketCards.map((item) => (
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
                    {escalationTriggerPacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationTriggerPacketMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationTriggerPacketCopyState === "copied"
                      ? "Escalation trigger packet copied to clipboard."
                      : escalationTriggerPacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the trigger-packet preview."
                        : "Use this packet when you want one escalation trigger surface that keeps the decision threshold, carry-forward context, and blocker cue visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation dispatch packet</strong>
                      <p className="scoreHint">{escalationDispatchPacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${escalationDispatchTone}`}>{escalationDispatchLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationDispatchPacketMarkdown);
                            setEscalationDispatchPacketCopyState("copied");
                          } catch {
                            setEscalationDispatchPacketCopyState("failed");
                          }
                        }}
                      >
                        Copy dispatch packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${escalationDispatchTone}`}>{escalationDispatchLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationDispatchPacketCards.map((item) => (
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
                    {escalationDispatchPacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationDispatchPacketMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationDispatchPacketCopyState === "copied"
                      ? "Escalation dispatch packet copied to clipboard."
                      : escalationDispatchPacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the dispatch-packet preview."
                        : "Use this packet when you want one dispatch-ready escalation surface that keeps the trigger posture, route cue, and decision context visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation delivery packet</strong>
                      <p className="scoreHint">{escalationDeliveryPacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${escalationDeliveryTone}`}>{escalationDeliveryLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationDeliveryPacketMarkdown);
                            setEscalationDeliveryPacketCopyState("copied");
                          } catch {
                            setEscalationDeliveryPacketCopyState("failed");
                          }
                        }}
                      >
                        Copy delivery packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${escalationDeliveryTone}`}>{escalationDeliveryLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationDeliveryPacketCards.map((item) => (
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
                    {escalationDeliveryPacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationDeliveryPacketMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationDeliveryPacketCopyState === "copied"
                      ? "Escalation delivery packet copied to clipboard."
                      : escalationDeliveryPacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the delivery-packet preview."
                        : "Use this packet when you want one delivery-ready escalation surface that keeps the dispatch posture, receiver cue, and route guidance visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation confirmation packet</strong>
                      <p className="scoreHint">{escalationConfirmationPacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${escalationConfirmationTone}`}>{escalationConfirmationLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationConfirmationPacketMarkdown);
                            setEscalationConfirmationPacketCopyState("copied");
                          } catch {
                            setEscalationConfirmationPacketCopyState("failed");
                          }
                        }}
                      >
                        Copy confirmation packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${escalationConfirmationTone}`}>{escalationConfirmationLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationConfirmationPacketCards.map((item) => (
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
                    {escalationConfirmationPacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationConfirmationPacketMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationConfirmationPacketCopyState === "copied"
                      ? "Escalation confirmation packet copied to clipboard."
                      : escalationConfirmationPacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the confirmation-packet preview."
                        : "Use this packet when you want one confirmation-ready escalation surface that keeps the delivery posture, receiver checklist, and destination guidance visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation receipt packet</strong>
                      <p className="scoreHint">{escalationReceiptPacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${escalationReceiptTone}`}>{escalationReceiptLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationReceiptPacketMarkdown);
                            setEscalationReceiptPacketCopyState("copied");
                          } catch {
                            setEscalationReceiptPacketCopyState("failed");
                          }
                        }}
                      >
                        Copy receipt packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${escalationReceiptTone}`}>{escalationReceiptLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationReceiptPacketCards.map((item) => (
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
                    {escalationReceiptPacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationReceiptPacketMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationReceiptPacketCopyState === "copied"
                      ? "Escalation receipt packet copied to clipboard."
                      : escalationReceiptPacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the receipt-packet preview."
                        : "Use this packet when you want one receipt-ready escalation surface that keeps acknowledgment cues, destination guidance, and confirmation posture visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation acknowledgment packet</strong>
                      <p className="scoreHint">{escalationAcknowledgmentPacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${escalationAcknowledgmentTone}`}>{escalationAcknowledgmentLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationAcknowledgmentPacketMarkdown);
                            setEscalationAcknowledgmentPacketCopyState("copied");
                          } catch {
                            setEscalationAcknowledgmentPacketCopyState("failed");
                          }
                        }}
                      >
                        Copy acknowledgment packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${escalationAcknowledgmentTone}`}>{escalationAcknowledgmentLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationAcknowledgmentPacketCards.map((item) => (
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
                    {escalationAcknowledgmentPacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationAcknowledgmentPacketMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationAcknowledgmentPacketCopyState === "copied"
                      ? "Escalation acknowledgment packet copied to clipboard."
                      : escalationAcknowledgmentPacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the acknowledgment-packet preview."
                        : "Use this packet when you want one acknowledgment-ready escalation surface that keeps follow-through cues, destination guidance, and receipt posture visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation closure packet</strong>
                      <p className="scoreHint">{escalationClosurePacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${escalationClosureTone}`}>{escalationClosureLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationClosurePacketMarkdown);
                            setEscalationClosurePacketCopyState("copied");
                          } catch {
                            setEscalationClosurePacketCopyState("failed");
                          }
                        }}
                      >
                        Copy closure packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${escalationClosureTone}`}>{escalationClosureLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationClosurePacketCards.map((item) => (
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
                    {escalationClosurePacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationClosurePacketMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationClosurePacketCopyState === "copied"
                      ? "Escalation closure packet copied to clipboard."
                      : escalationClosurePacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the closure-packet preview."
                        : "Use this packet when you want one closure-ready escalation surface that keeps completion cues, destination guidance, and acknowledgment posture visible together."}
                  </p>
                </div>
                <div className="shortcutStrip">
                  <div className="shortcutHeader">
                    <div>
                      <strong>Escalation finalization packet</strong>
                      <p className="scoreHint">{escalationFinalizationPacketLead}</p>
                    </div>
                    <div className="shortcutActions">
                      <span className={`statusPill statusPill${escalationFinalizationTone}`}>{escalationFinalizationLabel}</span>
                      <button
                        type="button"
                        className="actionButton"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(escalationFinalizationPacketMarkdown);
                            setEscalationFinalizationPacketCopyState("copied");
                          } catch {
                            setEscalationFinalizationPacketCopyState("failed");
                          }
                        }}
                      >
                        Copy finalization packet
                      </button>
                    </div>
                  </div>
                  <div className="statusRow">
                    <span className="pill">{deliveryDestinations[selectedDestination].label}</span>
                    <span className="pill">{routeFilteredResponseKit.filterLabel}</span>
                    <span className="pill">{receiverGuidance.roleLabel}</span>
                    <span className={`statusPill statusPill${escalationFinalizationTone}`}>{escalationFinalizationLabel}</span>
                  </div>
                  <div className="manifestGrid">
                    {escalationFinalizationPacketCards.map((item) => (
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
                    {escalationFinalizationPacketItems.map((item) => (
                      <article key={item.label} className={`preflightCard preflightCard${item.tone}`}>
                        <div className="claimHeader">
                          <strong>{item.label}</strong>
                          <span className={`statusPill statusPill${item.tone}`}>{item.tone}</span>
                        </div>
                        <p className="scoreHint">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                  <pre className="bundlePreviewPre">{escalationFinalizationPacketMarkdown}</pre>
                  <p className="scoreHint">
                    {escalationFinalizationPacketCopyState === "copied"
                      ? "Escalation finalization packet copied to clipboard."
                      : escalationFinalizationPacketCopyState === "failed"
                        ? "Clipboard copy failed. You can still copy from the finalization-packet preview."
                        : "Use this packet when you want one finalization-ready escalation surface that keeps final completion cues, destination guidance, and closure posture visible together."}
                  </p>
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
