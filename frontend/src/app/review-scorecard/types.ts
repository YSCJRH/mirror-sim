export type RubricRow = {
  dimension: string;
  one: string;
  three: string;
  five: string;
};

export type DecisionSummary = {
  label: string;
  tone: "incomplete" | "ready" | "followup" | "hold";
  summary: string;
  average: string;
};

export type ClaimPacket = {
  claimId: string;
  text: string;
  relatedTurnIds: string[];
};

export type DivergentTurn = {
  turnIndex: number;
  baselineTurnId: string | null;
  baselineAction: string | null;
  interventionTurnId: string | null;
  interventionAction: string | null;
};

export type PickupLane = "lane:auto-safe" | "lane:protected-core";

export type LaneRoute = {
  summary: string;
  checklist: string[];
  reviewPath: string[];
};

export type ExportSurfaceId =
  | "decision-brief"
  | "review-packet"
  | "issue-comment"
  | "closeout-packet"
  | "pickup-routing";

export type ExportSurface = {
  label: string;
  destination: string;
  summary: string;
  targetId: string;
};

export type DeliveryReadiness = {
  label: string;
  tone: "incomplete" | "ready" | "followup" | "hold";
  summary: string;
  warnings: string[];
  readyItems: string[];
};

export type DeliveryDestination = "pr-comment" | "closeout" | "pickup-handoff";
export type BundleVariant = "compact" | "full";
export type ReceiverRole = "reviewer" | "approver" | "operator";
export type ResponseKitRouteFilter = "active" | "all" | "acknowledge" | "request-more-context" | "escalate";

export type ExportCoverage = {
  includes: string[];
  omits: string[];
  note: string;
};

export type DeliveryPresetProfile = {
  emphasis: string;
  bestFit: string;
};

export type ReviewScorecardProps = {
  rubricRows: RubricRow[];
  claimCount: number;
  divergentTurnCount: number;
  evalName: string;
  evalStatus: string;
  claimPackets: ClaimPacket[];
  divergentTurns: DivergentTurn[];
};
