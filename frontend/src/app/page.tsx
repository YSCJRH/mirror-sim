import type { Metadata } from "next";

import { ButtonLink } from "./components/button-link";
import { ContextCard } from "./components/context-card";
import { PageHero } from "./components/page-hero";
import { SectionHeading } from "./components/section-heading";
import { SurfaceCard } from "./components/surface-card";
import { WorkbenchTopBar } from "./components/workbench-top-bar";
import { getAppLocale } from "./lib/locale";
import { loadWorkbenchData } from "./lib/workbench-data";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Mirror Public Demo",
    description:
      "A read-only deterministic demo for inspecting Mirror's bounded replay, branch comparison, claims, evidence, and eval summary."
  };
}

export default async function Page() {
  const locale = await getAppLocale();
  const data = await loadWorkbenchData();
  const featuredBranch = data.reportComparisonRun.branch.branch_id;
  const checksPassed =
    data.evalSummary.metrics.checks_passed ?? data.evalSummary.metrics.passed_assertions ?? 0;
  const checksTotal = data.evalSummary.metrics.checks_total ?? data.evalSummary.metrics.assertions_total ?? null;

  return (
    <main className="workbenchPage">
      <WorkbenchTopBar
        locale={locale}
        eyebrow="Mirror Public Demo"
        items={[
          { href: "/", label: "Public Demo", active: true },
          { href: `/changes/${featuredBranch}`, label: "Branch Comparison", active: false },
          { href: `/explain/${featuredBranch}`, label: "Claims & Evidence", active: false },
          { href: "/review", label: "Advanced Review", active: false }
        ]}
      />

      <PageHero
        eyebrow="Deterministic-only Phase 1"
        title="Replay a bounded what-if world without accounts, uploads, or model calls."
        lede="Mirror is a constrained, evidence-backed, replayable sandbox for fictional or explicitly authorized worlds. This public demo serves one precomputed Fog Harbor scenario so visitors can inspect the replay, branch comparison, claims, evidence, and eval summary."
        support="This is not a real-world prediction tool, not a real-person replica system, and not a political persuasion or high-risk decision product."
        actions={
          <>
            <ButtonLink href={`/changes/${featuredBranch}`} variant="primary">
              Explore branch comparison
            </ButtonLink>
            <ButtonLink href={`/explain/${featuredBranch}`} variant="secondary">
              Inspect claims and evidence
            </ButtonLink>
            <ButtonLink href="/review" variant="ghost">
              Advanced review
            </ButtonLink>
          </>
        }
        aside={
          <div className="contextCardGrid contextCardGridCompact">
            <ContextCard
              label="Demo world"
              value={data.graph.world_id ?? "fog-harbor"}
              summary="Original fictional canonical demo artifacts."
              tone="accent"
            />
            <ContextCard
              label="Eval status"
              value={data.evalSummary.status}
              summary={`${checksPassed}${checksTotal ? `/${checksTotal}` : ""} checks passed; generated before the request. No hosted model is called here.`}
            />
          </div>
        }
      />

      <section className="dashboardSection">
        <SectionHeading
          eyebrow="Guided demo"
          title="Start with the replay, then follow the evidence."
          description="The public path focuses on understanding the canonical demo. Runtime mutation, create-world, corpus upload, Hosted GPT, BYOK, auth, payment, database storage, and quota systems are reserved for later phases."
        />
        <div className="branchComparisonGrid">
          <SurfaceCard className="branchComparisonCard" tone="strong" as="article">
            <div className="interventionCardMeta">
              <span>What Mirror is</span>
              <span>Allowed Phase 1 path</span>
            </div>
            <h3>Bounded, replayable simulation review</h3>
            <p className="subtle">
              Inspect a fictional world, compare deterministic branches, and trace claims back to evidence chunks
              and turn actions.
            </p>
          </SurfaceCard>
          <SurfaceCard className="branchComparisonCard" tone="strong" as="article">
            <div className="interventionCardMeta">
              <span>What Mirror is not</span>
              <span>Blocked in public demo</span>
            </div>
            <h3>No prediction, persuasion, or real-person profiling</h3>
            <p className="subtle">
              Phase 1 does not forecast real events, model real people, make high-risk decisions, or run political
              persuasion workflows.
            </p>
          </SurfaceCard>
          <SurfaceCard className="branchComparisonCard" tone="strong" as="article">
            <div className="interventionCardMeta">
              <span>Demo artifacts</span>
              <span>Allowlisted API</span>
            </div>
            <h3>Canonical Fog Harbor only</h3>
            <p className="subtle">
              The public API exposes logical artifact ids for the manifest, report, claims, evidence, graph,
              comparison, and eval summary. It does not expose local filesystem paths.
            </p>
          </SurfaceCard>
        </div>
      </section>

      <section className="dashboardSection">
        <SectionHeading
          eyebrow="Branch comparison"
          title="Review deterministic deltas without starting a new run."
          description={`${data.comparisonOverviews.length} precomputed branches are available. The baseline branch is ${data.baselineRun.label}.`}
        />
        <div className="branchComparisonGrid">
          {data.comparisonOverviews.slice(0, 4).map((overview) => (
            <SurfaceCard key={overview.run.branch.branch_id} className="branchComparisonCard" as="article">
              <div className="interventionCardMeta">
                <span>{overview.run.scenario.scenario_id}</span>
                <span>{overview.divergentTurnCount} divergent turns</span>
              </div>
              <h3>{overview.run.scenario.title}</h3>
              <p className="subtle">{overview.summaryLines[0]}</p>
              <div className="cardActions">
                <ButtonLink href={`/changes/${overview.run.branch.branch_id}`} variant="primary">
                  Compare branch
                </ButtonLink>
                <ButtonLink href={`/explain/${overview.run.branch.branch_id}`} variant="secondary">
                  Evidence view
                </ButtonLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className="dashboardSection">
        <SectionHeading
          eyebrow="Claims, evidence, eval"
          title="Every report claim keeps its label and evidence ids."
          description={`${data.claims.length} claims, ${data.documents.length} documents, and ${data.chunks.length} evidence chunks are available for inspection through the public demo path.`}
        />
        <div className="contextCardGrid">
          <ContextCard
            label="Claims"
            value={String(data.claims.length)}
            summary="Structured claims keep label and evidence_ids for verification."
            tone="accent"
          />
          <ContextCard
            label="Evidence chunks"
            value={String(data.chunks.length)}
            summary="Chunks are fictional or explicitly authorized demo material."
          />
          <ContextCard
            label="Eval failures"
            value={String(data.evalSummary.failures.length)}
            summary="The eval summary is served as a precomputed artifact."
          />
        </div>
      </section>
    </main>
  );
}
