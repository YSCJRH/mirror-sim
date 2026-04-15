import { readFile } from "node:fs/promises";
import path from "node:path";

const sections = [
  {
    title: "Corpus",
    copy: "Source documents, chunks, and demo-world evidence remain the base truth layer.",
    path: "artifacts/demo/ingest"
  },
  {
    title: "World Model",
    copy: "Graph entities, relations, events, and personas define the constrained simulation world.",
    path: "artifacts/demo/graph and artifacts/demo/personas"
  },
  {
    title: "Scenario",
    copy: "Baseline and intervention scenarios stay explicit, normalized, and reviewable.",
    path: "artifacts/demo/scenario"
  },
  {
    title: "Run",
    copy: "Deterministic traces, snapshots, and branch summaries keep replayability visible.",
    path: "artifacts/demo/run"
  },
  {
    title: "Report",
    copy: "Claims, evidence labels, and eval summaries remain the final review surface.",
    path: "artifacts/demo/report and artifacts/demo/eval"
  }
];

type Claim = {
  claim_id: string;
  text: string;
  label: string;
  evidence_ids: string[];
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

async function readText(relativePath: string) {
  const repoRoot = path.resolve(process.cwd(), "..");
  return readFile(path.join(repoRoot, relativePath), "utf-8");
}

async function readJson<T>(relativePath: string) {
  return JSON.parse(await readText(relativePath)) as T;
}

async function loadWorkbenchData() {
  const [report, claimsRaw, evalRaw, rubric, documentsRaw, graph, baselineScenario, interventionScenario] =
    await Promise.all([
    readText("artifacts/demo/report/report.md"),
    readText("artifacts/demo/report/claims.json"),
    readText("artifacts/demo/eval/summary.json"),
    readText("docs/rubrics/human-review.md"),
    readText("artifacts/demo/ingest/documents.jsonl"),
    readJson<GraphPayload>("artifacts/demo/graph/graph.json"),
    readJson<ScenarioPayload>("artifacts/demo/scenario/baseline.json"),
    readJson<ScenarioPayload>("artifacts/demo/scenario/reporter_detained.json")
    ]);

  return {
    report,
    claims: JSON.parse(claimsRaw) as Claim[],
    evalSummary: JSON.parse(evalRaw) as EvalSummary,
    rubric,
    documents: documentsRaw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as DocumentRow),
    graph,
    baselineScenario,
    interventionScenario
  };
}

export default async function Page() {
  const { report, claims, evalSummary, rubric, documents, graph, baselineScenario, interventionScenario } =
    await loadWorkbenchData();

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Mirror Engine / Phase 3 Workbench</p>
        <h1>Review the Fog Harbor sandbox from one place.</h1>
        <p className="lede">
          This shell is the browser entrypoint for the constrained demo world. It keeps the
          workbench centered on evidence, artifacts, and phase-based review instead of free-form
          chat first.
        </p>
        <div className="heroMeta">
          <span>Current demo: Fog Harbor East Gate</span>
          <span>Current status: shell established, artifact panels follow next</span>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <p className="eyebrow">Workbench Spine</p>
          <h2>Each view maps directly to the durable artifact tree.</h2>
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
          <p className="eyebrow">Next Queue</p>
          <h2>This entrypoint is intentionally narrow.</h2>
        </div>
        <ul className="checklist">
          <li>Render report, claims, eval summary, and rubric panels.</li>
          <li>Expose corpus, graph, and scenario artifacts without changing their contracts.</li>
          <li>Keep evidence and traceability visible in every later Phase 3 view.</li>
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
                      <code key={evidenceId}>{evidenceId}</code>
                    ))}
                  </div>
                  <p className="claimNote">{claim.confidence_note}</p>
                </article>
              ))}
            </div>
          </article>
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
              The browser shell now exposes the source-document layer directly, so later reviewers
              can trace claims and graph objects back to the bounded corpus instead of treating the
              simulation as a black box.
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
              This view keeps the graph inspectable without introducing a new API or a heavy graph
              visualization dependency. It is intentionally review-first and contract-light.
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
              <strong>{baselineScenario.title}</strong>
              <span className="pill">{baselineScenario.scenario_id}</span>
            </div>
            <div className="claimEvidence">
              <code>turn_budget={baselineScenario.turn_budget}</code>
              <code>branch_count={baselineScenario.branch_count}</code>
            </div>
            <pre className="artifactPre artifactPreCompact">
              {JSON.stringify(baselineScenario, null, 2)}
            </pre>
          </article>

          <article className="artifactCard">
            <div className="artifactMeta">
              <span>artifact</span>
              <code>artifacts/demo/scenario/reporter_detained.json</code>
            </div>
            <div className="claimHeader">
              <strong>{interventionScenario.title}</strong>
              <span className="pill">{interventionScenario.scenario_id}</span>
            </div>
            <div className="claimEvidence">
              <code>turn_budget={interventionScenario.turn_budget}</code>
              <code>branch_count={interventionScenario.branch_count}</code>
              <code>injections={interventionScenario.injections.length}</code>
            </div>
            <pre className="artifactPre artifactPreCompact">
              {JSON.stringify(interventionScenario, null, 2)}
            </pre>
          </article>
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
    </main>
  );
}
