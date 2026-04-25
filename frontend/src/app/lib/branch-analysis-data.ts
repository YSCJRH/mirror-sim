import {
  loadWorkbenchData,
  type ClaimDrilldown,
  type ComparisonOverview,
  type WorkbenchData
} from "./workbench-data";

export type BranchRouteOption = {
  branchId: string;
  scenarioId: string;
  title: string;
  key: string;
};

export type WorldContextData = {
  graph: WorkbenchData["graph"];
  compareArtifact: WorkbenchData["compareArtifact"];
  baselineRun: WorkbenchData["baselineRun"];
  comparisonOverviews: WorkbenchData["comparisonOverviews"];
  evalSummary: WorkbenchData["evalSummary"];
  claimDrilldowns: WorkbenchData["claimDrilldowns"];
  reportComparisonRun: WorkbenchData["reportComparisonRun"];
};

export type BranchChangeExplorerData = {
  graph: WorkbenchData["graph"];
  compareArtifact: WorkbenchData["compareArtifact"];
  baselineRun: WorkbenchData["baselineRun"];
  overview: ComparisonOverview;
  comparisonOverviews: WorkbenchData["comparisonOverviews"];
  branchOptions: BranchRouteOption[];
};

export type EvidenceExplainData = BranchChangeExplorerData & {
  relevantClaims: ClaimDrilldown[];
  relatedTurnIds: string[];
};

function branchOptions(data: WorkbenchData): BranchRouteOption[] {
  return data.comparisonOverviews.map((overview) => ({
    branchId: overview.run.branch.branch_id,
    scenarioId: overview.run.scenario.scenario_id,
    title: overview.run.scenario.title,
    key: overview.run.key
  }));
}

function findOverview(data: WorkbenchData, branchId: string) {
  return data.comparisonOverviews.find((overview) => overview.run.branch.branch_id === branchId) ?? null;
}

export async function loadWorldContext(): Promise<WorldContextData> {
  const data = await loadWorkbenchData();
  return {
    graph: data.graph,
    compareArtifact: data.compareArtifact,
    baselineRun: data.baselineRun,
    comparisonOverviews: data.comparisonOverviews,
    evalSummary: data.evalSummary,
    claimDrilldowns: data.claimDrilldowns,
    reportComparisonRun: data.reportComparisonRun
  };
}

export async function loadBranchChangeExplorer(
  branchId: string
): Promise<BranchChangeExplorerData | null> {
  const data = await loadWorkbenchData();
  const overview = findOverview(data, branchId);

  if (!overview) {
    return null;
  }

  return {
    graph: data.graph,
    compareArtifact: data.compareArtifact,
    baselineRun: data.baselineRun,
    overview,
    comparisonOverviews: data.comparisonOverviews,
    branchOptions: branchOptions(data)
  };
}

export async function loadEvidenceExplain(
  branchId: string
): Promise<EvidenceExplainData | null> {
  const data = await loadWorkbenchData();
  const overview = findOverview(data, branchId);

  if (!overview) {
    return null;
  }

  const relatedTurnIdSet = new Set(
    overview.rows.flatMap((row) =>
      [row.reference?.turn.turn_id ?? null, row.candidate?.turn.turn_id ?? null].filter(
        (turnId): turnId is string => Boolean(turnId)
      )
    )
  );

  const relevantClaims = data.claimDrilldowns.filter((drilldown) =>
    drilldown.relatedTurns.some((entry) => relatedTurnIdSet.has(entry.turn.turn_id))
  );

  return {
    graph: data.graph,
    compareArtifact: data.compareArtifact,
    baselineRun: data.baselineRun,
    overview,
    comparisonOverviews: data.comparisonOverviews,
    branchOptions: branchOptions(data),
    relevantClaims: relevantClaims.length > 0 ? relevantClaims : data.claimDrilldowns.slice(0, 3),
    relatedTurnIds: Array.from(relatedTurnIdSet)
  };
}

export async function loadAnalystReview() {
  return loadWorkbenchData();
}
