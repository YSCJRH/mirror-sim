import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { ReviewScorecard } from "./review-scorecard";

const repoRoot = path.resolve(process.cwd(), "..");

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

async function listJsonBaseNames(relativeDir: string) {
  const entries = await readdir(path.join(repoRoot, relativeDir), { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/u, ""))
    .sort((left, right) => {
      if (left === "baseline") {
        return -1;
      }
      if (right === "baseline") {
        return 1;
      }
      return left.localeCompare(right);
    });
}

async function loadSnapshots(runDir: string, turnBudget: number) {
  return Promise.all(
    Array.from({ length: turnBudget }, (_, index) =>
      readJson<SnapshotPayload>(
        `artifacts/demo/run/${runDir}/snapshots/turn-${String(index + 1).padStart(2, "0")}.json`
      )
    )
  );
}

async function loadRunPayload(key: ScenarioKey, scenario: ScenarioPayload): Promise<RunPayload> {
  const [summary, actions, snapshots] = await Promise.all([
    readJson<RunSummary>(`artifacts/demo/run/${key}/summary.json`),
    readJsonl<TurnAction>(`artifacts/demo/run/${key}/run_trace.jsonl`),
    loadSnapshots(key, scenario.turn_budget)
  ]);

  return {
    key,
    label: key === "baseline" ? "Baseline" : "Intervention",
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
    scenarioKeys
  ] = await Promise.all([
    readText("artifacts/demo/report/report.md"),
    readJson<Claim[]>("artifacts/demo/report/claims.json"),
    readJson<EvalSummary>("artifacts/demo/eval/summary.json"),
    readText("docs/rubrics/human-review.md"),
    readJsonl<DocumentRow>("artifacts/demo/ingest/documents.jsonl"),
    readJsonl<ChunkRow>("artifacts/demo/ingest/chunks.jsonl"),
    readJson<GraphPayload>("artifacts/demo/graph/graph.json"),
    listJsonBaseNames("artifacts/demo/scenario")
  ]);

  const runs = await Promise.all(
    scenarioKeys.map(async (key) => {
      const scenario = await readJson<ScenarioPayload>(`artifacts/demo/scenario/${key}.json`);
      return loadRunPayload(key, scenario);
    })
  );

  const runsByKey = new Map(runs.map((run) => [run.key, run]));
  const baselineRun = runsByKey.get("baseline") ?? runs[0];

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
  baseline: TurnEntry | null;
  candidate: TurnEntry | null;
  divergent: boolean;
};

type ComparisonOverview = {
  run: RunPayload;
  rows: ComparisonRow[];
  divergentTurnCount: number;
  ledgerDelta: number | null;
  evacuationDelta: number | null;
  directWarningPath: boolean;
  summaryLines: string[];
};

function turnsDiffer(baseline: TurnEntry | null, candidate: TurnEntry | null) {
  if (!baseline || !candidate) {
    return baseline !== candidate;
  }

  return (
    baseline.turn.action_type !== candidate.turn.action_type ||
    baseline.turn.target_id !== candidate.turn.target_id ||
    baseline.turn.actor_id !== candidate.turn.actor_id
  );
}

function buildComparisonRows(baselineRun: RunPayload, candidateRun: RunPayload): ComparisonRow[] {
  const baselineTurns = buildTurnEntries(baselineRun);
  const candidateTurns = buildTurnEntries(candidateRun);

  return Array.from(
    { length: Math.max(baselineTurns.length, candidateTurns.length) },
    (_, index) => {
      const baseline = baselineTurns[index] ?? null;
      const candidate = candidateTurns[index] ?? null;

      return {
        turnIndex: index + 1,
        baseline,
        candidate,
        divergent: turnsDiffer(baseline, candidate)
      };
    }
  );
}

function firstDirectWarningTurn(run: RunPayload) {
  const directWarningTurn = run.actions.find(
    (action) => action.action_type === "inform" && action.target_id === "persona_zhao_ke"
  );

  return directWarningTurn?.turn_index ?? null;
}

function hasDirectWarningPath(run: RunPayload) {
  return firstDirectWarningTurn(run) !== null;
}

function describeMetricDelta(
  label: string,
  baselineTurn: number | undefined,
  candidateTurn: number | undefined
) {
  if (typeof baselineTurn !== "number" && typeof candidateTurn !== "number") {
    return `${label} never lands in either branch.`;
  }

  if (typeof baselineTurn === "number" && typeof candidateTurn !== "number") {
    return `${label} never lands in this intervention branch.`;
  }

  if (typeof baselineTurn !== "number" && typeof candidateTurn === "number") {
    return `${label} appears only in this intervention branch at ${formatTurnLabel(candidateTurn)}.`;
  }

  const resolvedBaselineTurn = baselineTurn as number;
  const resolvedCandidateTurn = candidateTurn as number;
  const delta = resolvedCandidateTurn - resolvedBaselineTurn;

  if (delta > 0) {
    return `${label} slips by ${delta} turn${delta === 1 ? "" : "s"} to ${formatTurnLabel(resolvedCandidateTurn)}.`;
  }

  if (delta < 0) {
    return `${label} lands ${Math.abs(delta)} turn${Math.abs(delta) === 1 ? "" : "s"} earlier at ${formatTurnLabel(resolvedCandidateTurn)}.`;
  }

  return `${label} stays on the baseline timing at ${formatTurnLabel(resolvedCandidateTurn)}.`;
}

function describeWarningPath(baselineRun: RunPayload, candidateRun: RunPayload) {
  const baselineWarningTurn = firstDirectWarningTurn(baselineRun);
  const candidateWarningTurn = firstDirectWarningTurn(candidateRun);

  if (baselineWarningTurn === null && candidateWarningTurn === null) {
    return "No direct warning path to Zhao Ke appears in either branch.";
  }

  if (baselineWarningTurn !== null && candidateWarningTurn === null) {
    return "The direct warning path to Zhao Ke drops out of this branch.";
  }

  if (baselineWarningTurn === null && candidateWarningTurn !== null) {
    return `A direct warning path to Zhao Ke appears only in this branch at ${formatTurnLabel(candidateWarningTurn)}.`;
  }

  if (baselineWarningTurn === candidateWarningTurn) {
    return `The direct warning path to Zhao Ke still lands at ${formatTurnLabel(candidateWarningTurn)}.`;
  }

  return `The direct warning path to Zhao Ke shifts from ${formatTurnLabel(baselineWarningTurn)} to ${formatTurnLabel(candidateWarningTurn)}.`;
}

function buildComparisonOverview(
  baselineRun: RunPayload,
  candidateRun: RunPayload
): ComparisonOverview {
  const rows = buildComparisonRows(baselineRun, candidateRun);
  const divergentTurnCount = rows.filter((row) => row.divergent).length;
  const ledgerDelta =
    typeof candidateRun.summary.ledger_public_turn === "number" &&
    typeof baselineRun.summary.ledger_public_turn === "number"
      ? candidateRun.summary.ledger_public_turn - baselineRun.summary.ledger_public_turn
      : null;
  const evacuationDelta =
    typeof candidateRun.summary.evacuation_turn === "number" &&
    typeof baselineRun.summary.evacuation_turn === "number"
      ? candidateRun.summary.evacuation_turn - baselineRun.summary.evacuation_turn
      : null;

  return {
    run: candidateRun,
    rows,
    divergentTurnCount,
    ledgerDelta,
    evacuationDelta,
    directWarningPath: hasDirectWarningPath(candidateRun),
    summaryLines: [
      describeMetricDelta(
        "Ledger publication",
        baselineRun.summary.ledger_public_turn,
        candidateRun.summary.ledger_public_turn
      ),
      describeMetricDelta(
        "Evacuation",
        baselineRun.summary.evacuation_turn,
        candidateRun.summary.evacuation_turn
      ),
      describeWarningPath(baselineRun, candidateRun)
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

  const comparisonOverviews = comparisonRuns.map((run) => buildComparisonOverview(baselineRun, run));
  const reportComparison =
    comparisonOverviews.find((overview) => overview.run.key === reportComparisonRun.key) ?? null;
  const delayedEvacuationCount = comparisonOverviews.filter(
    (overview) => (overview.evacuationDelta ?? 0) > 0
  ).length;
  const delayedLedgerCount = comparisonOverviews.filter(
    (overview) => (overview.ledgerDelta ?? 0) > 0
  ).length;
  const lostDirectWarningCount = comparisonOverviews.filter(
    (overview) => !overview.directWarningPath
  ).length;

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Mirror Engine / Phase 44 Counterfactual Workbench</p>
        <h1>Start with the scenario matrix, then drop into trace, evidence, and eval.</h1>
        <p className="lede">
          The workbench now leads with artifact-backed counterfactual deltas across the canonical
          Fog Harbor matrix, so reviewers can answer which intervention changed what before they
          drill into turn-by-turn trace, claims, evidence, or the eval summary.
        </p>
        <div className="heroMeta">
          <span>Current demo: Fog Harbor East Gate</span>
          <span>{runs.length} canonical scenario branches loaded</span>
          <span>{comparisonRuns.length} intervention comparisons against baseline</span>
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
          <p className="eyebrow">Workbench Spine</p>
          <h2>Each step in the matrix-to-review path still maps directly to durable artifacts.</h2>
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

      <section className="panel panelAccent">
        <div className="panelHeader">
          <p className="eyebrow">Phase 44 Slice</p>
          <h2>The default operator path is now compare, then trace, then claim and evidence, then eval.</h2>
        </div>
        <ul className="checklist">
          <li>The workbench opens with a four-branch scenario matrix instead of a single intervention lane.</li>
          <li>Each intervention card now links straight into pairwise trace diff, claim and evidence review, and the eval summary.</li>
          <li>
            The current report artifacts still come from the canonical baseline vs reporter-detained
            pair, so that narrower report contract stays explicit rather than being implied across
            all branches.
          </li>
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
            <strong>{runs.length}</strong>
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
            <span>lost direct warning path</span>
            <strong>{lostDirectWarningCount}</strong>
          </div>
        </div>
        <div className="comparisonOverviewGrid">
          <article className="artifactCard">
            <div className="artifactMeta">
              <span>baseline</span>
              <code>artifacts/demo/run/{baselineRun.key}/summary.json</code>
            </div>
            <div className="claimHeader">
              <strong>{baselineRun.scenario.title}</strong>
              <span className="pill">reference branch</span>
            </div>
            <p>{baselineRun.scenario.description}</p>
            <div className="claimEvidence">
              <code>{baselineRun.scenario.scenario_id}</code>
              <code>turn_budget={baselineRun.scenario.turn_budget}</code>
              <code>injections={baselineRun.scenario.injections.length}</code>
            </div>
            <div className="metricGrid">
              <div className="metricCard">
                <span>ledger public</span>
                <strong>{formatTurnLabel(baselineRun.summary.ledger_public_turn)}</strong>
              </div>
              <div className="metricCard">
                <span>evacuation</span>
                <strong>{formatTurnLabel(baselineRun.summary.evacuation_turn)}</strong>
              </div>
              <div className="metricCard">
                <span>direct warning</span>
                <strong>{formatTurnLabel(firstDirectWarningTurn(baselineRun) ?? undefined)}</strong>
              </div>
            </div>
            <ul className="checklist compact">
              <li>Baseline keeps the direct warning path to Zhao Ke intact.</li>
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
                <code>artifacts/demo/run/{overview.run.key}/summary.json</code>
              </div>
              <div className="claimHeader">
                <strong>{overview.run.scenario.title}</strong>
                <span className="pill">{overview.divergentTurnCount} divergent turns</span>
              </div>
              <p>{overview.run.scenario.description}</p>
              <div className="claimEvidence">
                <code>{overview.run.scenario.scenario_id}</code>
                <code>ledger delta {formatDeltaLabel(overview.ledgerDelta)}</code>
                <code>evacuation delta {formatDeltaLabel(overview.evacuationDelta)}</code>
              </div>
              <div className="claimEvidence">
                {overview.run.scenario.injections.map((injection) => (
                  <code key={injection.injection_id}>{injection.kind}</code>
                ))}
                <span className="pill">
                  {overview.directWarningPath ? "direct warning preserved" : "direct warning lost"}
                </span>
              </div>
              <div className="metricGrid">
                <div className="metricCard">
                  <span>ledger public</span>
                  <strong>{formatTurnLabel(overview.run.summary.ledger_public_turn)}</strong>
                </div>
                <div className="metricCard">
                  <span>evacuation</span>
                  <strong>{formatTurnLabel(overview.run.summary.evacuation_turn)}</strong>
                </div>
                <div className="metricCard">
                  <span>direct warning</span>
                  <strong>{formatTurnLabel(firstDirectWarningTurn(overview.run) ?? undefined)}</strong>
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

      <section className="panel">
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

      <section className="panel">
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

      <section className="panel" id="trace-diff">
        <div className="panelHeader">
          <p className="eyebrow">Pairwise Trace Diff</p>
          <h2>Compare the baseline against each intervention with trace, state patch, and highlighted snapshot state.</h2>
        </div>
        <div className="detailList">
          {comparisonOverviews.map((overview) => (
            <article key={overview.run.key} id={`compare-${overview.run.key}`} className="artifactCard">
              <div className="artifactMeta">
                <span>compare</span>
                <code>baseline -&gt; {overview.run.key}</code>
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
              <div className="timelineRows">
                {overview.rows.map(({ turnIndex, baseline, candidate, divergent }) => (
                  <article
                    key={`${overview.run.key}-turn-${turnIndex}`}
                    className={`timelineRow${divergent ? " timelineRowDivergent" : ""}`}
                  >
                    <div className="claimHeader">
                      <strong>Turn {turnIndex}</strong>
                      <span className="pill">{divergent ? "branch divergence" : "same step"}</span>
                    </div>
                    <div className="timelineCards">
                      {[baseline, candidate].map((entry, index) => (
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
            </article>
          ))}
        </div>
      </section>

      <section className="panel" id="eval-summary">
        <div className="panelHeader">
          <p className="eyebrow">Eval And Review</p>
          <h2>The matrix-level machine summary stays visible beside the human review rubric.</h2>
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
          .filter((row) => row.divergent)
          .map(({ turnIndex, baseline, candidate }) => ({
            turnIndex,
            baselineTurnId: baseline?.turn.turn_id ?? null,
            baselineAction: baseline?.turn.action_type ?? null,
            interventionTurnId: candidate?.turn.turn_id ?? null,
            interventionAction: candidate?.turn.action_type ?? null
          }))}
      />
    </main>
  );
}
