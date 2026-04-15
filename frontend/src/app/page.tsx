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

export default function Page() {
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
    </main>
  );
}
