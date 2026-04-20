import { readFile } from "node:fs/promises";
import path from "node:path";
import { ReviewScorecard } from "./review-scorecard";

const repoRoot = path.resolve(process.cwd(), "..");
const compareArtifactPath = "artifacts/demo/compare/scenario_fog_harbor_phase44_matrix/compare.json";

const sections = [
  {
    title: "Corpus",
    copy: "Source documents and chunks remain the bounded truth layer behind every later comparison, claim, and review step.",
    path: "artifacts/demo/ingest"
  },
  {
    title: "World Model",
    copy: "Graph entities, relations, events, and personas keep evidence-bearing context queryable after the matrix branches diverge.",
    path: "artifacts/demo/graph and artifacts/demo/personas"
  },
  {
    title: "Scenario Matrix",
    copy: "Canonical baseline and intervention scenarios stay normalized, explicit, and discoverable from the same artifact directory.",
    path: "artifacts/demo/scenario"
  },
  {
    title: "Run Matrix",
    copy: "Deterministic traces and snapshots now load as a four-branch comparison surface instead of a single intervention lane.",
    path: "artifacts/demo/run"
  },
  {
    title: "Compare To Review",
    copy: "The default operator path now starts from outcome deltas, then drops into trace, claim and evidence, and eval summary.",
    path: "artifacts/demo/report, run, and eval"
  }
];

type Claim = {
  claim_id: string;
  text: string;
  label: string;
  evidence_ids: string[];
  related_turn_ids: string[];
  confidence_note: string;
};

type EvalSummary = {
  eval_name: string;
  status: string;
  metrics: Record<string, number>;
  failures: string[];
  notes: string[];
};

type DocumentRow = {
  document_id: string;
  title: string;
  kind: string;
  metadata?: Record<string, string>;
};

type ChunkRow = {
  chunk_id: string;
  document_id: string;
  text: string;
  char_start: number;
  char_end: number;
  source_id: string;
};

type GraphEntity = {
  entity_id: string;
  name: string;
  type: string;
  evidence_ids: string[];
};

type GraphRelation = {
  relation_id: string;
  source_entity_id: string;
  relation_type: string;
  target_entity_id: string;
  evidence_ids: string[];
};

type GraphEvent = {
  event_id: string;
  name: string;
  kind: string;
  participant_entity_ids: string[];
  evidence_ids: string[];
};

type GraphPayload = {
  entities: GraphEntity[];
  relations: GraphRelation[];
  events: GraphEvent[];
  stats: Record<string, number>;
};

type ScenarioPayload = {
  scenario_id: string;
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

type TurnAction = {
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

type SnapshotPayload = {
  turn_index: number;
  state: Record<string, unknown>;
};

type RunSummary = {
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

type CompareBranch = {
  branch_id: string;
  label: string;
  run_id: string;
  is_reference: boolean;
  summary_path: string;
  trace_path: string;
  snapshot_dir: string;
};

type CompareOutcomeDelta = {
  reference: unknown;
  candidate: unknown;
  delta: unknown;
};

type CompareTurnDelta = {
  turn_index: number;
  reference_turn_id: string | null;
  candidate_turn_id: string | null;
};

type CompareBranchDelta = {
  branch_id: string;
  divergent_turn_count: number;
  divergent_turns: CompareTurnDelta[];
  outcome_deltas: Record<string, CompareOutcomeDelta>;
};

type CompareArtifact = {
  compare_id: string;
  scenario_id: string;
  seed: number;
  branch_count: number;
  reference_branch_id: string;
  branches: CompareBranch[];
  reference_deltas: CompareBranchDelta[];
};

type ScenarioKey = string;

type RubricRow = {
  dimension: string;
  one: string;
  three: string;
  five: string;
};

type RunPayload = {
  key: ScenarioKey;
  label: string;
  branch: CompareBranch;
  scenario: ScenarioPayload;
  summary: RunSummary;
  actions: TurnAction[];
  snapshots: SnapshotPayload[];
};

type TurnEntry = {
  scenarioKey: ScenarioKey;
  scenarioTitle: string;
  scenarioDescription: string;
  turn: TurnAction;
  snapshot: SnapshotPayload | null;
};

async function readText(relativePath: string) {
  return readFile(path.join(repoRoot, relativePath), "utf-8");
}

async function readJson<T>(relativePath: string) {
  return JSON.parse(await readText(relativePath)) as T;
}

async function readJsonl<T>(relativePath: string) {
  return (await readText(relativePath))
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function runKeyFromSummaryPath(summaryPath: string) {
  return path.basename(path.dirname(summaryPath));
}

async function loadSnapshots(snapshotDir: string, turnBudget: number) {
  return Promise.all(
    Array.from({ length: turnBudget }, (_, index) =>
      readJson<SnapshotPayload>(
        `artifacts/demo/${snapshotDir}/turn-${String(index + 1).padStart(2, "0")}.json`
      )
    )
  );
}

async function loadRunPayload(branch: CompareBranch): Promise<RunPayload> {
  const key = runKeyFromSummaryPath(branch.summary_path);
  const scenario = await readJson<ScenarioPayload>(`artifacts/demo/scenario/${key}.json`);
  const [summary, actions, snapshots] = await Promise.all([
    readJson<RunSummary>(`artifacts/demo/${branch.summary_path}`),
    readJsonl<TurnAction>(`artifacts/demo/${branch.trace_path}`),
    loadSnapshots(branch.snapshot_dir, scenario.turn_budget)
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

async function loadWorkbenchData() {
  const [
    report,
    claims,
    evalSummary,
    rubric,
    documents,
    chunks,
    graph,
    compareArtifact
  ] = await Promise.all([
    readText("artifacts/demo/report/report.md"),
    readJson<Claim[]>("artifacts/demo/report/claims.json"),
    readJson<EvalSummary>("artifacts/demo/eval/summary.json"),
    readText("docs/rubrics/human-review.md"),
    readJsonl<DocumentRow>("artifacts/demo/ingest/documents.jsonl"),
    readJsonl<ChunkRow>("artifacts/demo/ingest/chunks.jsonl"),
    readJson<GraphPayload>("artifacts/demo/graph/graph.json"),
    readJson<CompareArtifact>(compareArtifactPath)
  ]);

  const runs = await Promise.all(compareArtifact.branches.map((branch) => loadRunPayload(branch)));

  const runsByKey = new Map(runs.map((run) => [run.key, run]));
  const runsByBranchId = new Map(runs.map((run) => [run.branch.branch_id, run]));
  const baselineRun = runsByBranchId.get(compareArtifact.reference_branch_id) ?? runs[0];

  if (!baselineRun) {
    throw new Error("Expected at least one canonical demo run.");
  }

  const comparisonRuns = runs.filter((run) => run.key !== baselineRun.key);
  const reportComparisonRun = runsByKey.get("reporter_detained") ?? comparisonRuns[0] ?? baselineRun;

  return {
    report,
    claims,
    evalSummary,
    rubric,
    documents,
    chunks,
    graph,
    compareArtifact,
    runs,
    runsByKey,
    baselineRun,
    comparisonRuns,
    reportComparisonRun
  };
}

function formatValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value) ?? "undefined";
}

function formatTurnLabel(turn: number | null | undefined) {
  return typeof turn === "number" ? `T${turn}` : "not reached";
}

function formatDeltaLabel(delta: number | null) {
  if (delta === null) {
    return "n/a";
  }
  if (delta === 0) {
    return "0 turns";
  }
  const prefix = delta > 0 ? "+" : "-";
  return `${prefix}${Math.abs(delta)} turn${Math.abs(delta) === 1 ? "" : "s"}`;
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

function stateHighlights(state: Record<string, unknown> | undefined) {
  if (!state) {
    return [];
  }

  const keys = [
    "festival_status",
    "budget_exposed",
    "ledger_public",
    "budget_exposed_turn",
    "ledger_public_turn",
    "evacuation_requested",
    "evacuation_triggered",
    "evacuation_turn",
    "public_pressure",
    "command_post",
    "mayor_alerted",
    "communications_status"
  ];

  return keys.flatMap((key) => {
    const value = state[key];
    if (value === null || value === undefined || value === false) {
      return [];
    }
    return [`${key}=${formatValue(value)}`];
  });
}

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

type ComparisonRow = {
  turnIndex: number;
  reference: TurnEntry | null;
  candidate: TurnEntry | null;
};

type ComparisonOverview = {
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
    return `${label} appears only in this branch at ${formatTurnLabel(candidateTurn)}.`;
  }

  const resolvedReferenceTurn = referenceTurn as number;
  const resolvedCandidateTurn = candidateTurn as number;
  const delta =
    typeof outcome.delta === "number" ? outcome.delta : resolvedCandidateTurn - resolvedReferenceTurn;

  if (delta > 0) {
    return `${label} slips by ${delta} turn${delta === 1 ? "" : "s"} to ${formatTurnLabel(resolvedCandidateTurn)}.`;
  }

  if (delta < 0) {
    return `${label} lands ${Math.abs(delta)} turn${Math.abs(delta) === 1 ? "" : "s"} earlier at ${formatTurnLabel(resolvedCandidateTurn)}.`;
  }

  return `${label} stays on the baseline timing at ${formatTurnLabel(resolvedCandidateTurn)}.`;
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

export default async function Page() {
  const {
    report,
    claims,
    evalSummary,
    rubric,
    documents,
    chunks,
    graph,
    compareArtifact,
    runs,
    runsByKey,
    baselineRun,
    comparisonRuns,
    reportComparisonRun
  } = await loadWorkbenchData();

  const rubricRows = parseRubricRows(rubric);
  const documentsById = new Map(documents.map((document) => [document.document_id, document]));
  const chunksById = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]));
  const allTurns = runs.flatMap(buildTurnEntries);
  const turnsById = new Map(allTurns.map((entry) => [entry.turn.turn_id, entry]));
  const claimIdsByTurnId = new Map<string, string[]>();

  for (const claim of claims) {
    for (const turnId of claim.related_turn_ids.filter((value): value is string => Boolean(value))) {
      const ids = claimIdsByTurnId.get(turnId) ?? [];
      ids.push(claim.claim_id);
      claimIdsByTurnId.set(turnId, ids);
    }
  }

  const claimDrilldowns = claims.map((claim) => {
    const evidenceIdSet = new Set(claim.evidence_ids);
    const evidenceChunks = claim.evidence_ids
      .map((chunkId) => chunksById.get(chunkId))
      .filter((chunk): chunk is ChunkRow => Boolean(chunk))
      .map((chunk) => ({
        chunk,
        document: documentsById.get(chunk.document_id) ?? null
      }));

    const graphContext = {
      entities: graph.entities.filter((entity) => entity.evidence_ids.some((evidenceId) => evidenceIdSet.has(evidenceId))),
      relations: graph.relations.filter((relation) => relation.evidence_ids.some((evidenceId) => evidenceIdSet.has(evidenceId))),
      events: graph.events.filter((event) => event.evidence_ids.some((evidenceId) => evidenceIdSet.has(evidenceId)))
    };

    const relatedTurns = claim.related_turn_ids
      .filter((value): value is string => Boolean(value))
      .map((turnId) => turnsById.get(turnId))
      .filter((entry): entry is TurnEntry => Boolean(entry));

    const scenarioContext = Array.from(new Set(relatedTurns.map((entry) => entry.scenarioKey)))
      .map((scenarioKey) => runsByKey.get(scenarioKey))
      .filter((run): run is RunPayload => Boolean(run));

    return {
      claim,
      evidenceChunks,
      graphContext,
      relatedTurns,
      scenarioContext
    };
  });

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
  const routeOnlyCount = comparisonOverviews.filter((overview) => overview.routeOnly).length;
  const delayedEvacuationCount = comparisonOverviews.filter(
    (overview) => (overview.evacuationDelta ?? 0) > 0
  ).length;
  const delayedLedgerCount = comparisonOverviews.filter(
    (overview) => (overview.ledgerDelta ?? 0) > 0
  ).length;
  const knowledgeShiftCount = comparisonOverviews.filter(
    (overview) => overview.knowledgeShift
  ).length;
  const totalDivergentTurnCount = comparisonOverviews.reduce(
    (sum, overview) => sum + overview.divergentTurnCount,
    0
  );
  const operatorPathSteps = [
    {
      step: "01",
      title: "Compare branches",
      target: "#compare-overview",
      summary: "Start from durable compare deltas so you can see which intervention changes the overall outcome shape.",
      meta: `${comparisonRuns.length} intervention branches`
    },
    {
      step: "02",
      title: "Replay divergent trace",
      target: "#trace-diff",
      summary: "Open only the divergent turns named by the compare artifact instead of scanning full branch timelines first.",
      meta: `${totalDivergentTurnCount} divergent turns mapped`
    },
    {
      step: "03",
      title: "Check claim and evidence",
      target: "#report-claims",
      summary: "Verify the canonical report pair, then drop into evidence excerpts, graph context, and linked turns when needed.",
      meta: `${claims.length} evidence-linked claims`
    },
    {
      step: "04",
      title: "Confirm eval posture",
      target: "#eval-summary",
      summary: "Finish the default pass with machine eval posture before opening packet-heavy review and handoff tooling.",
      meta: `${evalSummary.eval_name}: ${evalSummary.status}`
    }
  ];

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Mirror Engine / Phase 46 Focused Compare Workbench</p>
        <h1>Start with compare, then trace, claim and evidence, and eval.</h1>
        <p className="lede">
          The default operator path now stays intentionally narrow: compare the branches, replay
          only the divergent trace, inspect the linked claim and evidence chain, and confirm the
          eval posture before opening heavier review or packet surfaces.
        </p>
        <div className="heroMeta">
          <span>Current demo: Fog Harbor East Gate</span>
          <span>{compareArtifact.branch_count} canonical scenario branches loaded</span>
          <span>{comparisonRuns.length} intervention comparisons against baseline</span>
          <span>compare artifact: {compareArtifact.compare_id}</span>
          <span>
            Current report pair: baseline vs {reportComparisonRun.scenario.title}
          </span>
          <span>
            {evalSummary.eval_name}: {evalSummary.status}
          </span>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Default Operator Path</p>
          <h2>Use the focused compare path first, then open advanced review and reference surfaces only when needed.</h2>
        </div>
        <div className="pathGrid">
          {operatorPathSteps.map((step) => (
            <article key={step.step} className="pathCard">
              <span className="pathStep">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.summary}</p>
              <div className="claimEvidence">
                <code>{step.meta}</code>
                <a className="linkPill" href={step.target}>
                  Open step
                </a>
              </div>
            </article>
          ))}
        </div>
        <ul className="checklist">
          <li>The compare artifact remains the first read, and focused divergent trace is now treated as the next default step rather than a later deep-dive.</li>
          <li>Claim/evidence review and eval stay in the primary path; review-scorecard and packet-heavy surfaces remain available afterward as advanced tooling.</li>
          <li>Scenario, world-model, and corpus artifacts remain in-repo as reference surfaces, but they no longer compete with the core compare path for first attention.</li>
        </ul>
      </section>

      <section className="panel panelAccent" id="compare-overview">
        <div className="panelHeader">
          <p className="eyebrow">Counterfactual Overview</p>
          <h2>See which intervention changes the outcome, which only changes the route, and where to inspect next.</h2>
        </div>
        <div className="metricGrid">
          <div className="metricCard">
            <span>scenario branches</span>
            <strong>{compareArtifact.branch_count}</strong>
          </div>
          <div className="metricCard">
            <span>intervention branches</span>
            <strong>{comparisonRuns.length}</strong>
          </div>
          <div className="metricCard">
            <span>delayed ledger branches</span>
            <strong>{delayedLedgerCount}</strong>
          </div>
          <div className="metricCard">
            <span>delayed evacuation branches</span>
            <strong>{delayedEvacuationCount}</strong>
          </div>
          <div className="metricCard">
            <span>route-only branches</span>
            <strong>{routeOnlyCount}</strong>
          </div>
          <div className="metricCard">
            <span>knowledge-shift branches</span>
            <strong>{knowledgeShiftCount}</strong>
          </div>
        </div>
        <div className="comparisonOverviewGrid">
          <article className="artifactCard">
            <div className="artifactMeta">
              <span>reference</span>
              <code>{compareArtifactPath}</code>
              <code>artifacts/demo/{baselineRun.branch.summary_path}</code>
            </div>
            <div className="claimHeader">
              <strong>{baselineRun.scenario.title}</strong>
              <span className="pill">reference branch</span>
            </div>
            <p>{baselineRun.scenario.description}</p>
            <div className="claimEvidence">
              <code>{baselineRun.branch.branch_id}</code>
              <code>{baselineRun.scenario.scenario_id}</code>
              <code>turn_budget={baselineRun.scenario.turn_budget}</code>
              <code>seed={compareArtifact.seed}</code>
            </div>
            <div className="metricGrid">
              <div className="metricCard">
                <span>budget exposed</span>
                <strong>{formatTurnLabel(baselineRun.summary.budget_exposed_turn)}</strong>
              </div>
              <div className="metricCard">
                <span>ledger public</span>
                <strong>{formatTurnLabel(baselineRun.summary.ledger_public_turn)}</strong>
              </div>
              <div className="metricCard">
                <span>evacuation</span>
                <strong>{formatTurnLabel(baselineRun.summary.evacuation_turn)}</strong>
              </div>
            </div>
            <ul className="checklist compact">
              <li>The compare contract anchors every delta against this reference branch.</li>
              <li>Budget exposure lands at {formatTurnLabel(baselineRun.summary.budget_exposed_turn)}.</li>
              <li>Ledger publication becomes public at {formatTurnLabel(baselineRun.summary.ledger_public_turn)}.</li>
              <li>Evacuation triggers at {formatTurnLabel(baselineRun.summary.evacuation_turn)}.</li>
            </ul>
            <div className="claimEvidence">
              <a className="linkPill" href="#scenario-matrix">
                Scenario JSON
              </a>
              <a className="linkPill" href="#trace-diff">
                Trace compare
              </a>
              <a className="linkPill" href="#eval-summary">
                Eval summary
              </a>
            </div>
          </article>

          {comparisonOverviews.map((overview) => (
            <article key={overview.run.key} className="artifactCard">
              <div className="artifactMeta">
                <span>{overview.run.label}</span>
                <code>{compareArtifactPath}</code>
                <code>artifacts/demo/{overview.run.branch.summary_path}</code>
              </div>
              <div className="claimHeader">
                <strong>{overview.run.scenario.title}</strong>
                <span className="pill">{overview.divergentTurnCount} divergent turns</span>
              </div>
              <p>{overview.run.scenario.description}</p>
              <div className="claimEvidence">
                <code>{overview.run.branch.branch_id}</code>
                <code>{overview.run.scenario.scenario_id}</code>
                <code>budget delta {formatDeltaLabel(overview.budgetExposureDelta)}</code>
                <code>ledger delta {formatDeltaLabel(overview.ledgerDelta)}</code>
                <code>evacuation delta {formatDeltaLabel(overview.evacuationDelta)}</code>
              </div>
              <div className="claimEvidence">
                {overview.run.scenario.injections.map((injection) => (
                  <code key={injection.injection_id}>{injection.kind}</code>
                ))}
                <span className="pill">{overview.routeOnly ? "route-only delta" : "timing drift"}</span>
                {overview.knowledgeShift ? <span className="pill">knowledge shift</span> : null}
              </div>
              <div className="metricGrid">
                <div className="metricCard">
                  <span>budget exposed</span>
                  <strong>{formatTurnLabel(overview.run.summary.budget_exposed_turn)}</strong>
                </div>
                <div className="metricCard">
                  <span>ledger public</span>
                  <strong>{formatTurnLabel(overview.run.summary.ledger_public_turn)}</strong>
                </div>
                <div className="metricCard">
                  <span>evacuation</span>
                  <strong>{formatTurnLabel(overview.run.summary.evacuation_turn)}</strong>
                </div>
              </div>
              <ul className="checklist compact">
                {overview.summaryLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {overview.run.summary.notes.length > 1 ? (
                <p className="subtle">{overview.run.summary.notes.slice(1).join(" ")}</p>
              ) : null}
              <div className="claimEvidence">
                <a className="linkPill" href={`#compare-${overview.run.key}`}>
                  Trace diff
                </a>
                <a className="linkPill" href="#report-claims">
                  Claim and evidence
                </a>
                <a className="linkPill" href="#eval-summary">
                  Eval summary
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" id="trace-diff">
        <div className="panelHeader">
          <p className="eyebrow">Focused Trace Diff</p>
          <h2>Replay only the divergent turns named by the compare artifact, then jump straight into claims, evidence, or eval.</h2>
        </div>
        <div className="detailList">
          {comparisonOverviews.map((overview) => (
            <article key={overview.run.key} id={`compare-${overview.run.key}`} className="artifactCard">
              <div className="artifactMeta">
                <span>compare</span>
                <code>{compareArtifactPath}</code>
                <code>artifacts/demo/{overview.run.branch.trace_path}</code>
              </div>
              <div className="claimHeader">
                <strong>{baselineRun.scenario.title} vs {overview.run.scenario.title}</strong>
                <span className="pill">{overview.divergentTurnCount} divergent turns</span>
              </div>
              <p>{overview.summaryLines.join(" ")}</p>
              <div className="claimEvidence">
                <a className="linkPill" href="#report-claims">
                  Jump to claims
                </a>
                <a className="linkPill" href="#claim-drilldowns">
                  Jump to drill-down
                </a>
                <a className="linkPill" href="#eval-summary">
                  Jump to eval
                </a>
              </div>
              {overview.rows.length > 0 ? (
                <div className="timelineRows">
                  {overview.rows.map(({ turnIndex, reference, candidate }) => (
                    <article
                      key={`${overview.run.key}-turn-${turnIndex}`}
                      className="timelineRow timelineRowDivergent"
                    >
                      <div className="claimHeader">
                        <strong>Turn {turnIndex}</strong>
                        <span className="pill">branch divergence</span>
                      </div>
                      <div className="timelineCards">
                        {[reference, candidate].map((entry, index) => (
                          <section
                            key={index === 0 ? `${overview.run.key}-baseline` : `${overview.run.key}-candidate`}
                            id={entry ? `turn-${entry.turn.turn_id}` : undefined}
                            className={`timelineCard${entry ? "" : " timelineCardEmpty"}`}
                          >
                            {entry ? (
                              <>
                                <div className="artifactMeta">
                                  <span>{index === 0 ? "baseline" : "candidate"}</span>
                                  <code>{entry.turn.turn_id}</code>
                                </div>
                                <div className="claimHeader">
                                  <strong>{entry.turn.action_type}</strong>
                                  <span className="pill">{entry.turn.actor_id}</span>
                                </div>
                                <p>{entry.turn.rationale}</p>
                                <div className="claimEvidence">
                                  <code>{entry.scenarioTitle}</code>
                                  {entry.turn.target_id ? <code>{entry.turn.target_id}</code> : null}
                                  {claimIdsByTurnId.get(entry.turn.turn_id)?.map((claimId) => (
                                    <a key={claimId} className="linkPill" href={`#drill-${claimId}`}>
                                      {claimId}
                                    </a>
                                  ))}
                                </div>
                                <div className="claimEvidence">
                                  {entry.turn.evidence_ids.map((evidenceId) => (
                                    <a key={evidenceId} className="linkPill" href={`#chunk-${evidenceId}`}>
                                      {evidenceId}
                                    </a>
                                  ))}
                                </div>
                                <div className="timelineState">
                                  {Object.keys(entry.turn.state_patch).length > 0 ? (
                                    Object.entries(entry.turn.state_patch).map(([key, value]) => (
                                      <code key={key}>
                                        {key}={formatValue(value)}
                                      </code>
                                    ))
                                  ) : (
                                    <span className="subtle">no state patch</span>
                                  )}
                                </div>
                                <div className="timelineState">
                                  {stateHighlights(entry.snapshot?.state).length > 0 ? (
                                    stateHighlights(entry.snapshot?.state).map((highlight) => (
                                      <code key={highlight}>{highlight}</code>
                                    ))
                                  ) : (
                                    <span className="subtle">no highlighted snapshot state</span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="subtle">No turn recorded for this branch.</span>
                            )}
                          </section>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="subtle">This branch has no divergent turns recorded in the compare artifact.</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="panel" id="report-claims">
        <div className="panelHeader">
          <p className="eyebrow">Report Pair</p>
          <h2>Current report artifacts remain explicit about the canonical baseline vs reporter-detained comparison.</h2>
        </div>
        <div className="reportGrid">
          <article className="artifactCard artifactCardWide">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>artifacts/demo/report/report.md</code>
            </div>
            <div className="claimEvidence">
              <code>baseline</code>
              <code>{reportComparisonRun.key}</code>
              <a className="linkPill" href={`#compare-${reportComparisonRun.key}`}>
                Open canonical trace diff
              </a>
            </div>
            <p>
              The report layer is still generated from the baseline vs reporter-detained pair, which
              keeps the current claim and evidence contract honest while the new matrix overview
              broadens the top-level comparison surface.
            </p>
            <pre className="artifactPre">{report}</pre>
          </article>
          <article className="artifactCard">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>artifacts/demo/report/claims.json</code>
            </div>
            <div className="claimList">
              {claims.map((claim) => (
                <article key={claim.claim_id} className="claimCard">
                  <div className="claimHeader">
                    <strong>{claim.claim_id}</strong>
                    <span className="pill">{claim.label}</span>
                  </div>
                  <p>{claim.text}</p>
                  <div className="claimEvidence">
                    {claim.evidence_ids.map((evidenceId) => (
                      <a key={evidenceId} className="linkPill" href={`#chunk-${evidenceId}`}>
                        {evidenceId}
                      </a>
                    ))}
                  </div>
                  <div className="claimEvidence">
                    {claim.related_turn_ids.filter(Boolean).map((turnId) => (
                      <a key={turnId} className="linkPill" href={`#turn-${turnId}`}>
                        {turnId}
                      </a>
                    ))}
                  </div>
                  <a className="jumpLink" href={`#drill-${claim.claim_id}`}>
                    Open review drill-down
                  </a>
                  <p className="claimNote">{claim.confidence_note}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="panel" id="claim-drilldowns">
        <div className="panelHeader">
          <p className="eyebrow">Claim Drill-Down</p>
          <h2>Move from each claim into supporting evidence, graph context, and the specific branch turns behind it.</h2>
        </div>
        <div className="drilldownGrid">
          {claimDrilldowns.map(({ claim, evidenceChunks, graphContext, relatedTurns, scenarioContext }) => (
            <article key={claim.claim_id} id={`drill-${claim.claim_id}`} className="drilldownCard">
              <div className="claimHeader">
                <strong>{claim.claim_id}</strong>
                <span className="pill">{claim.label}</span>
              </div>
              <p>{claim.text}</p>

              <div className="detailStack">
                <section className="detailBlock">
                  <h3>Evidence excerpts</h3>
                  <div className="detailList">
                    {evidenceChunks.map(({ chunk, document }) => (
                      <article key={chunk.chunk_id} id={`chunk-${chunk.chunk_id}`} className="evidenceBlock">
                        <div className="claimHeader">
                          <strong>{document?.title ?? chunk.document_id}</strong>
                          <span className="pill">{document?.kind ?? "chunk"}</span>
                        </div>
                        <div className="claimEvidence">
                          <code>{chunk.chunk_id}</code>
                          <code>{chunk.document_id}</code>
                        </div>
                        <p>{chunk.text}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="detailBlock">
                  <h3>Scenario context</h3>
                  <div className="detailList">
                    {scenarioContext.map((run) => (
                      <article key={run.scenario.scenario_id} className="docCard">
                        <div className="claimHeader">
                          <strong>{run.scenario.title}</strong>
                          <span className="pill">{run.label}</span>
                        </div>
                        <p>{run.scenario.description}</p>
                        <div className="claimEvidence">
                          <code>{run.scenario.scenario_id}</code>
                          <code>turn_budget={run.scenario.turn_budget}</code>
                          <code>injections={run.scenario.injections.length}</code>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="detailBlock">
                  <h3>Graph context</h3>
                  <div className="objectColumns">
                    <div>
                      <h3>Entities</h3>
                      <ul className="objectList">
                        {graphContext.entities.length > 0 ? (
                          graphContext.entities.map((entity) => (
                            <li key={entity.entity_id}>
                              <strong>{entity.name}</strong>
                              <code>{entity.entity_id}</code>
                            </li>
                          ))
                        ) : (
                          <li className="objectListEmpty">No entity evidence overlap.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h3>Relations</h3>
                      <ul className="objectList">
                        {graphContext.relations.length > 0 ? (
                          graphContext.relations.map((relation) => (
                            <li key={relation.relation_id}>
                              <strong>{relation.relation_type}</strong>
                              <code>{relation.relation_id}</code>
                            </li>
                          ))
                        ) : (
                          <li className="objectListEmpty">No relation evidence overlap.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h3>Events</h3>
                      <ul className="objectList">
                        {graphContext.events.length > 0 ? (
                          graphContext.events.map((event) => (
                            <li key={event.event_id}>
                              <strong>{event.name}</strong>
                              <code>{event.event_id}</code>
                            </li>
                          ))
                        ) : (
                          <li className="objectListEmpty">No event evidence overlap.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="detailBlock">
                  <h3>Related turns</h3>
                  <div className="detailList">
                    {relatedTurns.map((entry) => (
                      <article key={entry.turn.turn_id} className="traceItem">
                        <div className="claimHeader">
                          <strong>{entry.turn.turn_id}</strong>
                          <span className="pill">{entry.scenarioTitle}</span>
                        </div>
                        <div className="claimEvidence">
                          <a className="linkPill" href={`#turn-${entry.turn.turn_id}`}>
                            jump to timeline
                          </a>
                          <code>{entry.turn.action_type}</code>
                          {entry.turn.target_id ? <code>{entry.turn.target_id}</code> : null}
                        </div>
                        <p>{entry.turn.rationale}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" id="eval-summary">
        <div className="panelHeader">
          <p className="eyebrow">Eval And Review</p>
          <h2>Finish the default path with the matrix-level eval posture before opening advanced review tooling.</h2>
        </div>
        <div className="reportGrid">
          <article className="artifactCard">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>artifacts/demo/eval/summary.json</code>
            </div>
            <div className="metricGrid">
              {Object.entries(evalSummary.metrics).map(([key, value]) => (
                <div key={key} className="metricCard">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="statusRow">
              <span className="pill">{evalSummary.status}</span>
              <span>{evalSummary.eval_name}</span>
            </div>
            {evalSummary.notes.length > 0 ? (
              <ul className="checklist compact">
                {evalSummary.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </article>

          <article className="artifactCard">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>docs/rubrics/human-review.md</code>
            </div>
            <pre className="artifactPre artifactPreCompact">{rubric}</pre>
          </article>
        </div>
      </section>

      <section className="panel panelAccent" id="advanced-review">
        <div className="panelHeader">
          <p className="eyebrow">Advanced Review</p>
          <h2>Scorecards, handoff packets, and packet-heavy review tools stay available after the core compare pass.</h2>
        </div>
        <div className="reportGrid">
          <article className="artifactCard">
            <div className="artifactMeta">
              <span>after default path</span>
              <code>review-scorecard and delivery surfaces</code>
            </div>
            <p>
              Once compare, divergent trace, claim/evidence, and eval are clear, the advanced
              review surfaces below remain available for scoring, handoff packaging, and delivery
              planning without dominating the first-read experience.
            </p>
            <div className="claimEvidence">
              <a className="linkPill" href="#review-scorecard">
                Open scorecard
              </a>
              <a className="linkPill" href="#reference-map">
                Open reference map
              </a>
            </div>
          </article>

          <article className="artifactCard">
            <div className="artifactMeta">
              <span>reference surfaces</span>
              <code>scenario, world, and corpus remain available below</code>
            </div>
            <ul className="checklist compact">
              <li>Keep the default path narrow when you only need to understand branch differences and evidence posture.</li>
              <li>Open the advanced review surfaces when you are ready to score the branch or assemble a handoff packet.</li>
              <li>Drop into scenario, world-model, or corpus references only when the core compare path still leaves a question unresolved.</li>
            </ul>
          </article>
        </div>
      </section>

      <ReviewScorecard
        rubricRows={rubricRows}
        claimCount={claims.length}
        divergentTurnCount={reportComparison?.divergentTurnCount ?? 0}
        evalName={evalSummary.eval_name}
        evalStatus={evalSummary.status}
        claimPackets={claims.map((claim) => ({
          claimId: claim.claim_id,
          text: claim.text,
          relatedTurnIds: claim.related_turn_ids.filter(Boolean)
        }))}
        divergentTurns={(reportComparison?.rows ?? [])
          .map(({ turnIndex, reference, candidate }) => ({
            turnIndex,
            baselineTurnId: reference?.turn.turn_id ?? null,
            baselineAction: reference?.turn.action_type ?? null,
            interventionTurnId: candidate?.turn.turn_id ?? null,
            interventionAction: candidate?.turn.action_type ?? null
          }))}
      />

      <section className="panel" id="reference-map">
        <div className="panelHeader">
          <p className="eyebrow">Reference Map</p>
          <h2>These supporting artifact surfaces stay available behind the default operator path.</h2>
        </div>
        <div className="grid">
          {sections.map((section) => (
            <article key={section.title} className="card">
              <h3>{section.title}</h3>
              <p>{section.copy}</p>
              <code>{section.path}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="panel" id="corpus-reference">
        <div className="panelHeader">
          <p className="eyebrow">Corpus</p>
          <h2>Canonical source documents remain directly inspectable.</h2>
        </div>
        <div className="reportGrid">
          <article className="artifactCard">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>artifacts/demo/ingest/documents.jsonl</code>
            </div>
            <div className="docList">
              {documents.map((document) => (
                <article key={document.document_id} className="docCard">
                  <div className="claimHeader">
                    <strong>{document.title}</strong>
                    <span className="pill">{document.kind}</span>
                  </div>
                  <div className="claimEvidence">
                    <code>{document.document_id}</code>
                    {document.metadata?.author ? <code>{document.metadata.author}</code> : null}
                    {document.metadata?.channel ? <code>{document.metadata.channel}</code> : null}
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="artifactCard">
            <div className="artifactMeta">
              <span>summary</span>
              <code>{documents.length} documents</code>
            </div>
            <p>
              The source-document layer remains fully visible, so reviewers can verify evidence
              chains without treating the simulation or report layer as a black box.
            </p>
          </article>
        </div>
      </section>

      <section className="panel" id="world-model">
        <div className="panelHeader">
          <p className="eyebrow">World Model</p>
          <h2>Graph objects stay visible as structured, evidence-bearing records.</h2>
        </div>
        <div className="reportGrid">
          <article className="artifactCard">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>artifacts/demo/graph/graph.json</code>
            </div>
            <div className="metricGrid">
              {Object.entries(graph.stats).map(([key, value]) => (
                <div key={key} className="metricCard">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="objectColumns">
              <div>
                <h3>Entities</h3>
                <ul className="objectList">
                  {graph.entities.slice(0, 4).map((entity) => (
                    <li key={entity.entity_id}>
                      <strong>{entity.name}</strong>
                      <code>{entity.entity_id}</code>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Relations</h3>
                <ul className="objectList">
                  {graph.relations.slice(0, 4).map((relation) => (
                    <li key={relation.relation_id}>
                      <strong>{relation.relation_type}</strong>
                      <code>{relation.relation_id}</code>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Events</h3>
                <ul className="objectList">
                  {graph.events.slice(0, 4).map((event) => (
                    <li key={event.event_id}>
                      <strong>{event.name}</strong>
                      <code>{event.event_id}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className="artifactCard">
            <div className="artifactMeta">
              <span>traceability</span>
              <code>entities / relations / events</code>
            </div>
            <p>
              This view still avoids a heavy graph dependency, but the new claim drill-down now
              cross-links evidence-bearing graph records when a claim shares their `evidence_ids`.
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Scenario Matrix</p>
          <h2>All canonical scenario artifacts stay visible, normalized, and branch-comparable.</h2>
        </div>
        <div className="scenarioGrid" id="scenario-matrix">
          {runs.map((run) => (
            <article key={run.key} className="artifactCard">
              <div className="artifactMeta">
                <span>{run.label}</span>
                <code>artifacts/demo/scenario/{run.key}.json</code>
              </div>
              <div className="claimHeader">
                <strong>{run.scenario.title}</strong>
                <span className="pill">{run.scenario.scenario_id}</span>
              </div>
              <p>{run.scenario.description}</p>
              <div className="claimEvidence">
                <code>turn_budget={run.scenario.turn_budget}</code>
                <code>branch_count={run.scenario.branch_count}</code>
                <code>injections={run.scenario.injections.length}</code>
              </div>
              <pre className="artifactPre artifactPreCompact">
                {JSON.stringify(run.scenario, null, 2)}
              </pre>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}
