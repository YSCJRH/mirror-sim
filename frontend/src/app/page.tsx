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

async function readText(relativePath: string) {
  const repoRoot = path.resolve(process.cwd(), "..");
  return readFile(path.join(repoRoot, relativePath), "utf-8");
}

async function loadWorkbenchData() {
  const [report, claimsRaw, evalRaw, rubric] = await Promise.all([
    readText("artifacts/demo/report/report.md"),
    readText("artifacts/demo/report/claims.json"),
    readText("artifacts/demo/eval/summary.json"),
    readText("docs/rubrics/human-review.md")
  ]);

  return {
    report,
    claims: JSON.parse(claimsRaw) as Claim[],
    evalSummary: JSON.parse(evalRaw) as EvalSummary,
    rubric
  };
}

export default async function Page() {
  const { report, claims, evalSummary, rubric } = await loadWorkbenchData();

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
