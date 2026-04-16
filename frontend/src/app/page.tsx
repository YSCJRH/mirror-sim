import { readFile } from "node:fs/promises";
import path from "node:path";
import { ReviewScorecard } from "./review-scorecard";

const sections = [
  {
    title: "Corpus",
    copy: "Source documents and chunks remain the base truth layer behind every later review step.",
    path: "artifacts/demo/ingest"
  },
  {
    title: "World Model",
    copy: "Graph entities, relations, events, and personas keep evidence-bearing context queryable.",
    path: "artifacts/demo/graph and artifacts/demo/personas"
  },
  {
    title: "Scenario",
    copy: "Baseline and intervention scenarios stay explicit, normalized, and branch-comparable.",
    path: "artifacts/demo/scenario"
  },
  {
    title: "Run",
    copy: "Deterministic traces and snapshots now surface as a reviewer-readable branch timeline.",
    path: "artifacts/demo/run"
  },
  {
    title: "Review Workflow",
    copy: "Claims, evidence excerpts, graph context, and branch turns can be traversed without leaving the workbench.",
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

type ScenarioKey = "baseline" | "reporter_detained";

type RubricRow = {
  dimension: string;
  one: string;
  three: string;
  five: string;
};

type RunPayload = {
  key: ScenarioKey;
  title: string;
  scenario: ScenarioPayload;
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
  const repoRoot = path.resolve(process.cwd(), "..");
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

async function loadSnapshots(runDir: string, turnBudget: number) {
  return Promise.all(
    Array.from({ length: turnBudget }, (_, index) =>
      readJson<SnapshotPayload>(
        `artifacts/demo/run/${runDir}/snapshots/turn-${String(index + 1).padStart(2, "0")}.json`
      )
    )
  );
}

async function loadRunPayload(
  key: ScenarioKey,
  runDir: string,
  title: string,
  scenario: ScenarioPayload
): Promise<RunPayload> {
  const [actions, snapshots] = await Promise.all([
    readJsonl<TurnAction>(`artifacts/demo/run/${runDir}/run_trace.jsonl`),
    loadSnapshots(runDir, scenario.turn_budget)
  ]);

  return {
    key,
    title,
    scenario,
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
    baselineScenario,
    interventionScenario
  ] = await Promise.all([
    readText("artifacts/demo/report/report.md"),
    readJson<Claim[]>("artifacts/demo/report/claims.json"),
    readJson<EvalSummary>("artifacts/demo/eval/summary.json"),
    readText("docs/rubrics/human-review.md"),
    readJsonl<DocumentRow>("artifacts/demo/ingest/documents.jsonl"),
    readJsonl<ChunkRow>("artifacts/demo/ingest/chunks.jsonl"),
    readJson<GraphPayload>("artifacts/demo/graph/graph.json"),
    readJson<ScenarioPayload>("artifacts/demo/scenario/baseline.json"),
    readJson<ScenarioPayload>("artifacts/demo/scenario/reporter_detained.json")
  ]);

  const [baselineRun, interventionRun] = await Promise.all([
    loadRunPayload("baseline", "baseline", "Baseline", baselineScenario),
    loadRunPayload("reporter_detained", "reporter_detained", "Intervention", interventionScenario)
  ]);

  return {
    report,
    claims,
    evalSummary,
    rubric,
    documents,
    chunks,
    graph,
    baselineRun,
    interventionRun
  };
}

function formatValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value) ?? "undefined";
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
    "mayor_alerted"
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

export default async function Page() {
  const {
    report,
    claims,
    evalSummary,
    rubric,
    documents,
    chunks,
    graph,
    baselineRun,
    interventionRun
  } = await loadWorkbenchData();

  const rubricRows = parseRubricRows(rubric);
  const documentsById = new Map(documents.map((document) => [document.document_id, document]));
  const chunksById = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]));
  const baselineTurns = buildTurnEntries(baselineRun);
  const interventionTurns = buildTurnEntries(interventionRun);
  const allTurns = [...baselineTurns, ...interventionTurns];
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

    const scenarioContext = Array.from(new Set(relatedTurns.map((entry) => entry.scenarioKey))).map((scenarioKey) =>
      scenarioKey === "baseline" ? baselineRun : interventionRun
    );

    return {
      claim,
      evidenceChunks,
      graphContext,
      relatedTurns,
      scenarioContext
    };
  });

  const timelineRows = Array.from(
    { length: Math.max(baselineTurns.length, interventionTurns.length) },
    (_, index) => ({
      turnIndex: index + 1,
      baseline: baselineTurns[index] ?? null,
      intervention: interventionTurns[index] ?? null
    })
  );

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Mirror Engine / Phase 5 Review Sign-Off</p>
        <h1>Review the Fog Harbor sandbox with evidence, trace, and branch context in one place.</h1>
        <p className="lede">
          The workbench now stays artifact-first while extending the reviewer path:
          from claim, to evidence, to branch timeline, to a live sign-off worksheet inside the bounded demo world.
        </p>
        <div className="heroMeta">
          <span>Current demo: Fog Harbor East Gate</span>
          <span>Current phase: review sign-off and evidence packaging</span>
          <span>No backend API expansion required</span>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Workbench Spine</p>
          <h2>Each review step still maps directly to the durable artifact tree.</h2>
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
          <p className="eyebrow">Phase 5 Slice</p>
          <h2>The current successor slice turns review context into sign-off context.</h2>
        </div>
        <ul className="checklist">
          <li>Claim cards now link into their supporting evidence, graph context, and branch turns.</li>
          <li>Baseline and intervention runs now surface as a reviewer-readable turn-by-turn timeline.</li>
          <li>Reviewer scorecards and sign-off worksheets now live on top of the same artifacts, still without backend API expansion.</li>
        </ul>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Report</p>
          <h2>Current branch report and evidence-labeled claims.</h2>
        </div>
        <div className="reportGrid">
          <article className="artifactCard artifactCardWide">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>artifacts/demo/report/report.md</code>
            </div>
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

      <section className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Claim Drill-Down</p>
          <h2>Move from each claim into supporting evidence, graph context, and trace context.</h2>
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
                          <span className="pill">{run.title}</span>
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
          <p className="eyebrow">Scenario</p>
          <h2>Normalized baseline and intervention scenarios stay visible in the browser.</h2>
        </div>
        <div className="reportGrid">
          <article className="artifactCard">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>artifacts/demo/scenario/baseline.json</code>
            </div>
            <div className="claimHeader">
              <strong>{baselineRun.scenario.title}</strong>
              <span className="pill">{baselineRun.scenario.scenario_id}</span>
            </div>
            <div className="claimEvidence">
              <code>turn_budget={baselineRun.scenario.turn_budget}</code>
              <code>branch_count={baselineRun.scenario.branch_count}</code>
            </div>
            <pre className="artifactPre artifactPreCompact">
              {JSON.stringify(baselineRun.scenario, null, 2)}
            </pre>
          </article>

          <article className="artifactCard">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>artifacts/demo/scenario/reporter_detained.json</code>
            </div>
            <div className="claimHeader">
              <strong>{interventionRun.scenario.title}</strong>
              <span className="pill">{interventionRun.scenario.scenario_id}</span>
            </div>
            <div className="claimEvidence">
              <code>turn_budget={interventionRun.scenario.turn_budget}</code>
              <code>branch_count={interventionRun.scenario.branch_count}</code>
              <code>injections={interventionRun.scenario.injections.length}</code>
            </div>
            <pre className="artifactPre artifactPreCompact">
              {JSON.stringify(interventionRun.scenario, null, 2)}
            </pre>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Run Timeline</p>
          <h2>Compare baseline and intervention turns with trace, state patch, and snapshot state.</h2>
        </div>
        <div className="timelineRows">
          {timelineRows.map(({ turnIndex, baseline, intervention }) => {
            const divergent =
              baseline?.turn.action_type !== intervention?.turn.action_type ||
              baseline?.turn.target_id !== intervention?.turn.target_id;

            return (
              <article key={turnIndex} className={`timelineRow${divergent ? " timelineRowDivergent" : ""}`}>
                <div className="claimHeader">
                  <strong>Turn {turnIndex}</strong>
                  <span className="pill">{divergent ? "branch divergence" : "same step"}</span>
                </div>
                <div className="timelineCards">
                  {[baseline, intervention].map((entry, index) => (
                    <section
                      key={index === 0 ? "baseline" : "intervention"}
                      id={entry ? `turn-${entry.turn.turn_id}` : undefined}
                      className={`timelineCard${entry ? "" : " timelineCardEmpty"}`}
                    >
                      {entry ? (
                        <>
                          <div className="artifactMeta">
                            <span>{entry.scenarioKey === "baseline" ? "baseline" : "intervention"}</span>
                            <code>{entry.turn.turn_id}</code>
                          </div>
                          <div className="claimHeader">
                            <strong>{entry.turn.action_type}</strong>
                            <span className="pill">{entry.turn.actor_id}</span>
                          </div>
                          <p>{entry.turn.rationale}</p>
                          <div className="claimEvidence">
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
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Eval And Review</p>
          <h2>Machine summary and human rubric stay visible side-by-side.</h2>
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
        divergentTurnCount={timelineRows.filter(({ baseline, intervention }) => (
          baseline?.turn.action_type !== intervention?.turn.action_type ||
          baseline?.turn.target_id !== intervention?.turn.target_id
        )).length}
        evalName={evalSummary.eval_name}
        evalStatus={evalSummary.status}
        claimPackets={claims.map((claim) => ({
          claimId: claim.claim_id,
          text: claim.text,
          relatedTurnIds: claim.related_turn_ids.filter(Boolean)
        }))}
        divergentTurns={timelineRows
          .filter(({ baseline, intervention }) => (
            baseline?.turn.action_type !== intervention?.turn.action_type ||
            baseline?.turn.target_id !== intervention?.turn.target_id
          ))
          .map(({ turnIndex, baseline, intervention }) => ({
            turnIndex,
            baselineTurnId: baseline?.turn.turn_id ?? null,
            baselineAction: baseline?.turn.action_type ?? null,
            interventionTurnId: intervention?.turn.turn_id ?? null,
            interventionAction: intervention?.turn.action_type ?? null
          }))}
      />
    </main>
  );
}
