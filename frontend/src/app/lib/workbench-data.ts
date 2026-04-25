import path from "node:path";

import { getPublicDemoArtifactSource, type ArtifactSource } from "./artifact-source";

export const compareArtifactPath = "demo.compare";

export type Claim = {
  claim_id: string;
  text: string;
  label: string;
  evidence_ids: string[];
  related_turn_ids: string[];
  confidence_note: string;
};

export type EvalSummary = {
  eval_name: string;
  world_id?: string;
  status: string;
  metrics: Record<string, number>;
  failures: string[];
  notes: string[];
};

export type DocumentRow = {
  document_id: string;
  title: string;
  kind: string;
  metadata?: Record<string, string>;
};

export type ChunkRow = {
  chunk_id: string;
  document_id: string;
  text: string;
  char_start: number;
  char_end: number;
  source_id: string;
};

export type GraphEntity = {
  entity_id: string;
  name: string;
  type: string;
  evidence_ids: string[];
};

export type GraphRelation = {
  relation_id: string;
  source_entity_id: string;
  relation_type: string;
  target_entity_id: string;
  evidence_ids: string[];
};

export type GraphEvent = {
  event_id: string;
  name: string;
  kind: string;
  participant_entity_ids: string[];
  evidence_ids: string[];
};

export type GraphPayload = {
  world_id?: string;
  entities: GraphEntity[];
  relations: GraphRelation[];
  events: GraphEvent[];
  stats: Record<string, number>;
};

export type ScenarioPayload = {
  scenario_id: string;
  world_id?: string;
  title: string;
  description: string;
  branch_count: number;
  turn_budget: number;
  injections: Array<{
    injection_id: string;
    kind: string;
    target_id: string;
    actor_id: string;
  }>;
};

export type TurnAction = {
  turn_id: string;
  run_id: string;
  turn_index: number;
  actor_id: string;
  action_type: string;
  target_id: string | null;
  rationale: string;
  evidence_ids: string[];
  state_patch: Record<string, unknown>;
};

export type SnapshotPayload = {
  turn_index: number;
  state: Record<string, unknown>;
};

export type RunSummary = {
  run_id: string;
  scenario_id: string;
  seed: number;
  turn_budget: number;
  executed_turns: number;
  ledger_public_turn?: number;
  budget_exposed_turn?: number;
  evacuation_turn?: number;
  final_state: Record<string, unknown>;
  action_count: number;
  action_types: string[];
  notes: string[];
};

export type CompareBranch = {
  branch_id: string;
  label: string;
  run_id: string;
  is_reference: boolean;
  summary_path: string;
  trace_path: string;
  snapshot_dir: string;
};

export type CompareOutcomeDelta = {
  reference: unknown;
  candidate: unknown;
  delta: unknown;
};

export type CompareTurnDelta = {
  turn_index: number;
  reference_turn_id: string | null;
  candidate_turn_id: string | null;
};

export type CompareBranchDelta = {
  branch_id: string;
  divergent_turn_count: number;
  divergent_turns: CompareTurnDelta[];
  outcome_deltas: Record<string, CompareOutcomeDelta>;
};

export type CompareArtifact = {
  compare_id: string;
  scenario_id: string;
  seed: number;
  branch_count: number;
  reference_branch_id: string;
  branches: CompareBranch[];
  reference_deltas: CompareBranchDelta[];
};

export type RubricRow = {
  dimension: string;
  one: string;
  three: string;
  five: string;
};

export type RunPayload = {
  key: string;
  label: string;
  branch: CompareBranch;
  scenario: ScenarioPayload;
  summary: RunSummary;
  actions: TurnAction[];
  snapshots: SnapshotPayload[];
};

export type TurnEntry = {
  scenarioKey: string;
  scenarioTitle: string;
  scenarioDescription: string;
  turn: TurnAction;
  snapshot: SnapshotPayload | null;
};

export type ComparisonRow = {
  turnIndex: number;
  reference: TurnEntry | null;
  candidate: TurnEntry | null;
};

export type ComparisonOverview = {
  run: RunPayload;
  delta: CompareBranchDelta;
  rows: ComparisonRow[];
  divergentTurnCount: number;
  budgetExposureDelta: number | null;
  ledgerDelta: number | null;
  evacuationDelta: number | null;
  routeOnly: boolean;
  knowledgeShift: boolean;
  summaryLines: string[];
};

export type ClaimDrilldown = {
  claim: Claim;
  evidenceChunks: Array<{
    chunk: ChunkRow;
    document: DocumentRow | null;
  }>;
  relatedTurns: TurnEntry[];
};

export type WorkbenchData = {
  report: string;
  claims: Claim[];
  evalSummary: EvalSummary;
  rubric: string;
  rubricRows: RubricRow[];
  documents: DocumentRow[];
  chunks: ChunkRow[];
  graph: GraphPayload;
  compareArtifact: CompareArtifact;
  runs: RunPayload[];
  baselineRun: RunPayload;
  comparisonRuns: RunPayload[];
  comparisonOverviews: ComparisonOverview[];
  reportComparison: ComparisonOverview | null;
  reportComparisonRun: RunPayload;
  routeOnlyCount: number;
  delayedEvacuationCount: number;
  delayedLedgerCount: number;
  knowledgeShiftCount: number;
  totalDivergentTurnCount: number;
  claimDrilldowns: ClaimDrilldown[];
};

function parseRubricRows(rubric: string): RubricRow[] {
  const rows = rubric
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .slice(2)
    .map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean))
    .filter((cells) => cells.length >= 4)
    .map(([dimension, one, three, five]) => ({ dimension, one, three, five }));

  if (rows.length > 0) {
    return rows;
  }

  return [
    {
      dimension: "Usefulness",
      one: "Adds no new understanding",
      three: "Some useful contrast",
      five: "Clearly clarifies branch differences"
    },
    {
      dimension: "Credibility",
      one: "Reads like guesswork",
      three: "Partly grounded",
      five: "Evidence boundaries are clear"
    },
    {
      dimension: "Explainability",
      one: "Hard to trace",
      three: "Mostly understandable",
      five: "Easy to replay from trace"
    },
    {
      dimension: "Actionability",
      one: "No next step is obvious",
      three: "Some follow-up hints",
      five: "Clear next engineering/product step"
    }
  ];
}

function runKeyFromSummaryPath(summaryPath: string) {
  return path.basename(path.dirname(summaryPath));
}

async function loadSnapshots(source: ArtifactSource, snapshotDir: string, turnBudget: number) {
  return Promise.all(
    Array.from({ length: turnBudget }, (_, index) =>
      source.readTrustedDemoJson<SnapshotPayload>(
        `artifacts/demo/${snapshotDir}/turn-${String(index + 1).padStart(2, "0")}.json`
      )
    )
  );
}

async function loadRunPayload(source: ArtifactSource, branch: CompareBranch): Promise<RunPayload> {
  const key = runKeyFromSummaryPath(branch.summary_path);
  const scenario = await source.readTrustedDemoJson<ScenarioPayload>(`artifacts/demo/scenario/${key}.json`);
  const [summary, actions, snapshots] = await Promise.all([
    source.readTrustedDemoJson<RunSummary>(`artifacts/demo/${branch.summary_path}`),
    source.readTrustedDemoJsonl<TurnAction>(`artifacts/demo/${branch.trace_path}`),
    loadSnapshots(source, branch.snapshot_dir, scenario.turn_budget)
  ]);

  return {
    key,
    label: branch.label,
    branch,
    scenario,
    summary,
    actions,
    snapshots
  };
}

function buildTurnEntries(run: RunPayload): TurnEntry[] {
  return run.actions.map((turn, index) => ({
    scenarioKey: run.key,
    scenarioTitle: run.scenario.title,
    scenarioDescription: run.scenario.description,
    turn,
    snapshot: run.snapshots[index] ?? null
  }));
}

function valuesMatch(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function numericOutcomeDelta(outcomes: Record<string, CompareOutcomeDelta>, key: string) {
  const delta = outcomes[key]?.delta;
  return typeof delta === "number" ? delta : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function outcomeChanged(outcome: CompareOutcomeDelta | undefined) {
  if (!outcome) {
    return false;
  }

  if (typeof outcome.delta === "number") {
    return outcome.delta !== 0;
  }

  return !valuesMatch(outcome.reference, outcome.candidate);
}

function describeTurnOutcome(label: string, outcome: CompareOutcomeDelta | undefined) {
  if (!outcome) {
    return `${label} is not recorded in the compare artifact.`;
  }

  const referenceTurn = typeof outcome.reference === "number" ? outcome.reference : undefined;
  const candidateTurn = typeof outcome.candidate === "number" ? outcome.candidate : undefined;

  if (referenceTurn === undefined && candidateTurn === undefined) {
    return `${label} is not reached in either branch.`;
  }

  if (referenceTurn !== undefined && candidateTurn === undefined) {
    return `${label} never lands in this branch.`;
  }

  if (referenceTurn === undefined && candidateTurn !== undefined) {
    return `${label} appears only in this branch at T${candidateTurn}.`;
  }

  const resolvedReferenceTurn = referenceTurn as number;
  const resolvedCandidateTurn = candidateTurn as number;
  const delta =
    typeof outcome.delta === "number" ? outcome.delta : resolvedCandidateTurn - resolvedReferenceTurn;

  if (delta > 0) {
    return `${label} slips by ${delta} turn${delta === 1 ? "" : "s"} to T${resolvedCandidateTurn}.`;
  }

  if (delta < 0) {
    return `${label} lands ${Math.abs(delta)} turn${Math.abs(delta) === 1 ? "" : "s"} earlier at T${resolvedCandidateTurn}.`;
  }

  return `${label} stays on the baseline timing at T${resolvedCandidateTurn}.`;
}

function describeRiskKnownBy(outcome: CompareOutcomeDelta | undefined) {
  if (!outcome) {
    return "The compare artifact does not record any risk-awareness delta for this branch.";
  }

  const referenceActors = stringArray(outcome.reference);
  const candidateActors = stringArray(outcome.candidate);
  const removedActors = referenceActors.filter((actorId) => !candidateActors.includes(actorId));
  const addedActors = candidateActors.filter((actorId) => !referenceActors.includes(actorId));

  if (removedActors.length === 0 && addedActors.length === 0) {
    return "Risk awareness reaches the same actor set as baseline.";
  }

  if (removedActors.length > 0 && addedActors.length === 0) {
    return `Risk awareness no longer reaches ${removedActors.join(", ")} in this branch.`;
  }

  if (addedActors.length > 0 && removedActors.length === 0) {
    return `Risk awareness expands to ${addedActors.join(", ")} in this branch.`;
  }

  return `Risk awareness reroutes: removed ${removedActors.join(", ")}; added ${addedActors.join(", ")}.`;
}

function buildComparisonOverview(
  run: RunPayload,
  delta: CompareBranchDelta,
  turnsById: Map<string, TurnEntry>
): ComparisonOverview {
  const rows = delta.divergent_turns.map((turnDelta) => ({
    turnIndex: turnDelta.turn_index,
    reference: turnDelta.reference_turn_id ? turnsById.get(turnDelta.reference_turn_id) ?? null : null,
    candidate: turnDelta.candidate_turn_id ? turnsById.get(turnDelta.candidate_turn_id) ?? null : null
  }));
  const budgetExposureDelta = numericOutcomeDelta(delta.outcome_deltas, "budget_exposed_turn");
  const ledgerDelta = numericOutcomeDelta(delta.outcome_deltas, "ledger_public_turn");
  const evacuationDelta = numericOutcomeDelta(delta.outcome_deltas, "evacuation_turn");
  const routeOnly = [budgetExposureDelta, ledgerDelta, evacuationDelta].every(
    (value) => value === 0 || value === null
  );
  const knowledgeShift = outcomeChanged(delta.outcome_deltas.risk_known_by);

  return {
    run,
    delta,
    rows,
    divergentTurnCount: delta.divergent_turn_count,
    budgetExposureDelta,
    ledgerDelta,
    evacuationDelta,
    routeOnly,
    knowledgeShift,
    summaryLines: [
      describeTurnOutcome("Budget exposure", delta.outcome_deltas.budget_exposed_turn),
      describeTurnOutcome("Ledger publication", delta.outcome_deltas.ledger_public_turn),
      describeTurnOutcome("Evacuation", delta.outcome_deltas.evacuation_turn),
      describeRiskKnownBy(delta.outcome_deltas.risk_known_by)
    ]
  };
}

export async function loadWorkbenchData(): Promise<WorkbenchData> {
  const source = getPublicDemoArtifactSource();
  const [report, claims, evalSummary, rubric, documents, chunks, graph, compareArtifact] = await Promise.all([
    source.readText("demo.report"),
    source.readJson<Claim[]>("demo.claims"),
    source.readJson<EvalSummary>("demo.eval_summary"),
    source.readText("demo.rubric"),
    source.readJsonl<DocumentRow>("demo.documents"),
    source.readJsonl<ChunkRow>("demo.chunks"),
    source.readJson<GraphPayload>("demo.graph"),
    source.readJson<CompareArtifact>(compareArtifactPath)
  ]);

  const runs = await Promise.all(compareArtifact.branches.map((branch) => loadRunPayload(source, branch)));
  const runsByKey = new Map(runs.map((run) => [run.key, run]));
  const runsByBranchId = new Map(runs.map((run) => [run.branch.branch_id, run]));
  const baselineRun = runsByBranchId.get(compareArtifact.reference_branch_id) ?? runs[0];

  if (!baselineRun) {
    throw new Error("Expected at least one canonical demo run.");
  }

  const comparisonRuns = runs.filter((run) => run.key !== baselineRun.key);
  const reportComparisonRun = runsByKey.get("reporter_detained") ?? comparisonRuns[0] ?? baselineRun;
  const allTurns = runs.flatMap(buildTurnEntries);
  const turnsById = new Map(allTurns.map((entry) => [entry.turn.turn_id, entry]));
  const documentsById = new Map(documents.map((document) => [document.document_id, document]));
  const chunksById = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]));

  const comparisonOverviews = comparisonRuns
    .map((run) => {
      const delta = compareArtifact.reference_deltas.find(
        (branchDelta) => branchDelta.branch_id === run.branch.branch_id
      );
      if (!delta) {
        return null;
      }
      return buildComparisonOverview(run, delta, turnsById);
    })
    .filter((overview): overview is ComparisonOverview => Boolean(overview));

  const reportComparison =
    comparisonOverviews.find((overview) => overview.run.key === reportComparisonRun.key) ?? null;

  const claimDrilldowns = claims.map((claim) => {
    const relatedTurns = claim.related_turn_ids
      .filter((value): value is string => Boolean(value))
      .map((turnId) => turnsById.get(turnId))
      .filter((entry): entry is TurnEntry => Boolean(entry));

    const evidenceChunks = claim.evidence_ids
      .map((chunkId) => chunksById.get(chunkId))
      .filter((chunk): chunk is ChunkRow => Boolean(chunk))
      .map((chunk) => ({
        chunk,
        document: documentsById.get(chunk.document_id) ?? null
      }));

    return {
      claim,
      evidenceChunks,
      relatedTurns
    };
  });

  return {
    report,
    claims,
    evalSummary,
    rubric,
    rubricRows: parseRubricRows(rubric),
    documents,
    chunks,
    graph,
    compareArtifact,
    runs,
    baselineRun,
    comparisonRuns,
    comparisonOverviews,
    reportComparison,
    reportComparisonRun,
    routeOnlyCount: comparisonOverviews.filter((overview) => overview.routeOnly).length,
    delayedEvacuationCount: comparisonOverviews.filter(
      (overview) => (overview.evacuationDelta ?? 0) > 0
    ).length,
    delayedLedgerCount: comparisonOverviews.filter((overview) => (overview.ledgerDelta ?? 0) > 0)
      .length,
    knowledgeShiftCount: comparisonOverviews.filter((overview) => overview.knowledgeShift).length,
    totalDivergentTurnCount: comparisonOverviews.reduce(
      (sum, overview) => sum + overview.divergentTurnCount,
      0
    ),
    claimDrilldowns
  };
}
