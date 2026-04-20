import type {
  PickupLane,
  LaneRoute,
  ExportSurfaceId,
  ExportSurface,
  DeliveryDestination,
  BundleVariant,
  ReceiverRole,
  ExportCoverage,
  DeliveryPresetProfile
} from "./types";

export const scoreOptions = [1, 2, 3, 4, 5] as const;
export const closeoutValidationCommands = [
  "npm run build --prefix frontend",
  "./make.ps1 smoke",
  "./make.ps1 test",
  "./make.ps1 eval-demo",
  "python -m backend.app.cli audit-phase phase1",
  "python -m backend.app.cli audit-phase phase2",
  "python -m backend.app.cli audit-phase phase3"
] as const;
export const postMergeCheckpointCommands = [
  "./make.ps1 smoke",
  "./make.ps1 test",
  "./make.ps1 eval-demo",
  "python -m backend.app.cli audit-phase phase1",
  "python -m backend.app.cli audit-phase phase2",
  "python -m backend.app.cli audit-phase phase3",
  "python -m backend.app.cli audit-github-queue --repo YSCJRH/mirror-sim"
] as const;
export const laneRoutes: Record<PickupLane, LaneRoute> = {
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
export const exportSurfaces: Record<ExportSurfaceId, ExportSurface> = {
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
export const deliveryDestinations: Record<DeliveryDestination, { label: string; summary: string }> = {
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
export const presetProfiles: Record<DeliveryDestination, DeliveryPresetProfile> = {
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
export const deliveryDestinationOrder: DeliveryDestination[] = ["pr-comment", "closeout", "pickup-handoff"];
export const bundleVariantProfiles: Record<BundleVariant, { label: string; summary: string }> = {
  compact: {
    label: "Compact",
    summary: "Keep the cover sheet, primary export, and only the companions that this destination currently needs."
  },
  full: {
    label: "Full",
    summary: "Carry the richer delivery bundle so cover context, rationale, and sidecar all travel together for deeper review."
  }
};
export const receiverRoleProfiles: Record<ReceiverRole, { label: string; summary: string }> = {
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
export const rolePresetProfiles: Record<
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
export const exportCoverage: Record<ExportSurfaceId, ExportCoverage> = {
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
export const validationPreviewChips = ["smoke", "test", "eval-demo", "phase audits"] as const;
