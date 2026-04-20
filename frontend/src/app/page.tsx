import Link from "next/link";
import type { Metadata } from "next";

import { LanguageSwitch } from "./components/language-switch";
import { getCopy } from "./lib/copy";
import { getAppLocale } from "./lib/locale";
import {
  formatDocumentCount,
  buildOverviewLines,
  formatDivergentTurnCount,
  formatDeltaLabel,
  formatEvidenceCount,
  formatEvalPosture,
  formatRelatedTurnCount,
  localizeActionType,
  localizeClaimLabel,
  localizeEvalMetricKey,
  localizeScenarioDescription,
  localizeScenarioTitle,
  formatTurn,
  friendlyWorldName
} from "./lib/presenters";
import { loadWorkbenchData, type ClaimDrilldown } from "./lib/workbench-data";

function summarizeClaimSources(drilldown: ClaimDrilldown) {
  const documents = Array.from(
    drilldown.evidenceChunks.reduce((map, entry) => {
      const key = entry.document?.document_id ?? entry.chunk.document_id;
      const current = map.get(key);
      map.set(key, {
        key,
        title: entry.document?.title ?? entry.chunk.document_id,
        count: (current?.count ?? 0) + 1
      });
      return map;
    }, new Map<string, { key: string; title: string; count: number }>())
  ).map(([, value]) => value);

  return documents;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  return {
    title: locale === "zh-CN" ? "Mirror 工作台总览" : "Mirror Briefing Dashboard",
    description:
      locale === "zh-CN"
        ? "Mirror 的双语编辑部指挥台首页，优先展示对比、证据与评测。"
        : "Bilingual editorial briefing dashboard for Mirror's compare, evidence, and eval flow."
  };
}

export default async function Page() {
  const locale = await getAppLocale();
  const copy = getCopy(locale);
  const data = await loadWorkbenchData();
  const worldName = friendlyWorldName(locale, data.graph.world_id);
  const keyClaims = data.claimDrilldowns.slice(0, 3);
  const topMetrics = Object.entries(data.evalSummary.metrics)
    .slice(0, 4)
    .map(([key, value]) => ({
      key,
      label: localizeEvalMetricKey(locale, key),
      value
    }));
  const baselineTitle = localizeScenarioTitle(
    locale,
    data.baselineRun.scenario.scenario_id,
    data.baselineRun.scenario.title
  );
  const reportComparisonTitle = localizeScenarioTitle(
    locale,
    data.reportComparisonRun.scenario.scenario_id,
    data.reportComparisonRun.scenario.title
  );

  return (
    <main className="workbenchPage">
      <header className="topBar">
        <div className="topBarBrand">
          <p className="eyebrow">{copy.brand.eyebrow}</p>
          <div className="topBarLinks">
            <span className="topBarActive">{copy.brand.dashboardLabel}</span>
            <Link href="/review">{copy.brand.reviewLabel}</Link>
          </div>
        </div>
        <LanguageSwitch locale={locale} />
      </header>

      <section className="heroPanel">
        <div className="heroPanelCopy">
          <p className="eyebrow">{copy.dashboard.interventionEyebrow}</p>
          <h1>{copy.dashboard.title}</h1>
          <p className="lede">{copy.dashboard.lede}</p>
          <div className="heroActions">
            <Link className="heroAction heroActionPrimary" href="/review">
              {copy.dashboard.jumpToReview}
            </Link>
            <Link className="heroAction" href="/review#reference">
              {copy.dashboard.jumpToReference}
            </Link>
          </div>
        </div>
        <div className="briefSummaryGrid">
          <article className="briefCard briefCardDark">
            <span>{copy.brand.worldLabel}</span>
            <strong>{worldName}</strong>
          </article>
          <article className="briefCard">
            <span>{copy.metrics.scenarioBranches}</span>
            <strong>{data.compareArtifact.branch_count}</strong>
          </article>
          <article className="briefCard">
            <span>{copy.metrics.interventionBranches}</span>
            <strong>{data.comparisonRuns.length}</strong>
          </article>
          <article className="briefCard">
            <span>{copy.metrics.evalStatus}</span>
            <strong>{formatEvalPosture(locale, data.evalSummary.eval_name, data.evalSummary.status)}</strong>
          </article>
          <article className="briefCard briefCardWide">
            <span>{copy.dashboard.currentPair}</span>
            <strong>{baselineTitle} ↔ {reportComparisonTitle}</strong>
          </article>
          <article className="briefCard briefCardWide">
            <span>{copy.brand.compareArtifactLabel}</span>
            <code>{data.compareArtifact.compare_id}</code>
          </article>
        </div>
      </section>

      <section className="dashboardSection">
        <div className="sectionHeading">
          <p className="eyebrow">{copy.dashboard.routeEyebrow}</p>
          <h2>{copy.dashboard.routeTitle}</h2>
          <p>{copy.dashboard.routeSummary}</p>
        </div>
        <div className="routeBoard">
          {copy.routeSteps.map((step) => (
            <article key={step.step} className="routeCard">
              <span className="routeIndex">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboardSection">
        <div className="sectionHeading">
          <p className="eyebrow">{copy.dashboard.interventionEyebrow}</p>
          <h2>{copy.dashboard.interventionTitle}</h2>
          <p>{copy.dashboard.interventionSummary}</p>
        </div>
        <div className="interventionBoard">
          <article className="interventionCard interventionCardReference">
            <div className="interventionCardMeta">
              <span>{copy.common.referenceBranch}</span>
              <code>{data.baselineRun.scenario.scenario_id}</code>
            </div>
            <h3>{baselineTitle}</h3>
            <p>
              {localizeScenarioDescription(
                locale,
                data.baselineRun.scenario.scenario_id,
                data.baselineRun.scenario.description
              )}
            </p>
            <div className="deltaBadgeRow">
              <span className="deltaBadge">{copy.metrics.budgetExposed}: {formatTurn(locale, data.baselineRun.summary.budget_exposed_turn)}</span>
              <span className="deltaBadge">{copy.metrics.ledgerPublic}: {formatTurn(locale, data.baselineRun.summary.ledger_public_turn)}</span>
              <span className="deltaBadge">{copy.metrics.evacuation}: {formatTurn(locale, data.baselineRun.summary.evacuation_turn)}</span>
            </div>
            <div className="artifactChipRow">
              <span className="artifactChip">{copy.brand.sourceArtifactLabel}</span>
              <code>artifacts/demo/{data.baselineRun.branch.summary_path}</code>
            </div>
          </article>

          {data.comparisonOverviews.map((overview) => {
            const summaryLines = buildOverviewLines(locale, overview).slice(0, 3);
            return (
              <article key={overview.run.key} className="interventionCard">
                <div className="interventionCardMeta">
                  <span>{localizeScenarioTitle(locale, overview.run.scenario.scenario_id, overview.run.label)}</span>
                  <code>{overview.run.scenario.scenario_id}</code>
                </div>
                <h3>{localizeScenarioTitle(locale, overview.run.scenario.scenario_id, overview.run.scenario.title)}</h3>
                <p>{localizeScenarioDescription(locale, overview.run.scenario.scenario_id, overview.run.scenario.description)}</p>
                <div className="deltaBadgeRow">
                  <span className="deltaBadge">
                    {copy.metrics.budgetExposed}: {formatDeltaLabel(locale, overview.budgetExposureDelta)}
                  </span>
                  <span className="deltaBadge">
                    {copy.metrics.ledgerPublic}: {formatDeltaLabel(locale, overview.ledgerDelta)}
                  </span>
                  <span className="deltaBadge">
                    {copy.metrics.evacuation}: {formatDeltaLabel(locale, overview.evacuationDelta)}
                  </span>
                  <span className="deltaBadge">
                    {copy.metrics.divergentTurns}: {overview.divergentTurnCount}
                  </span>
                  <span className="deltaBadge">
                    {overview.routeOnly ? copy.common.routeOnlyDelta : copy.common.timingDrift}
                  </span>
                  {overview.knowledgeShift ? (
                    <span className="deltaBadge">{copy.common.knowledgeShift}</span>
                  ) : null}
                </div>
                <ul className="summaryList">
                  {summaryLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="cardActions">
                  <Link className="linkPill" href={`/review#trace-${overview.run.key}`}>
                    {copy.dashboard.openTrace}
                  </Link>
                  <Link className="linkPill" href="/review#claims">
                    {copy.dashboard.openClaims}
                  </Link>
                  <Link className="linkPill" href="/review#reference">
                    {copy.dashboard.openReference}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboardSection">
        <div className="sectionHeading">
          <p className="eyebrow">{copy.dashboard.storyboardEyebrow}</p>
          <h2>{copy.dashboard.storyboardTitle}</h2>
        </div>
        <div className="storyboardGrid">
          {data.comparisonOverviews.map((overview) => (
            <article key={overview.run.key} className="storyboardCard">
              <div className="interventionCardMeta">
                <span>{localizeScenarioTitle(locale, overview.run.scenario.scenario_id, overview.run.scenario.title)}</span>
                <code>{formatDivergentTurnCount(locale, overview.divergentTurnCount)}</code>
              </div>
              <div className="storyboardRows">
                {overview.rows.slice(0, 2).map((row) => (
                  <article key={`${overview.run.key}-${row.turnIndex}`} className="storyboardRow">
                    <div className="storyboardRowTop">
                      <strong>T{row.turnIndex}</strong>
                      <span className="pill">{copy.common.rawArtifact}</span>
                    </div>
                    <div className="storyboardColumns">
                      <div className="storyboardTurn">
                        <span>{copy.common.baseline}</span>
                        {row.reference ? (
                          <>
                            <strong>{localizeActionType(locale, row.reference.turn.action_type)}</strong>
                            <p>{row.reference.turn.rationale}</p>
                          </>
                        ) : (
                          <p>{copy.review.noDivergence}</p>
                        )}
                      </div>
                      <div className="storyboardTurn">
                        <span>{copy.common.candidate}</span>
                        {row.candidate ? (
                          <>
                            <strong>{localizeActionType(locale, row.candidate.turn.action_type)}</strong>
                            <p>{row.candidate.turn.rationale}</p>
                          </>
                        ) : (
                          <p>{copy.review.noDivergence}</p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="dashboardSplit">
        <section className="dashboardSection">
          <div className="sectionHeading">
            <p className="eyebrow">{copy.dashboard.claimEyebrow}</p>
            <h2>{copy.dashboard.claimTitle}</h2>
            <p>
              {locale === "zh-CN"
                ? "首页只保留论点结构摘要，不直接摊开原始 claim 文本和证据摘录。"
                : "The dashboard keeps only the claim structure in view and leaves raw claim text and evidence excerpts for deeper review."}
            </p>
          </div>
          <div className="claimSnapshotGrid">
            {keyClaims.map((drilldown) => {
              const { claim, evidenceChunks, relatedTurns } = drilldown;
              const sourceDocuments = summarizeClaimSources(drilldown);
              return (
              <article key={claim.claim_id} className="claimSnapshotCard">
                <div className="interventionCardMeta">
                  <span>{claim.claim_id}</span>
                  <span className="pill">{localizeClaimLabel(locale, claim.label)}</span>
                </div>
                <div className="artifactChipRow">
                  <span className="artifactChip">{formatEvidenceCount(locale, evidenceChunks.length)}</span>
                  <span className="artifactChip">{formatRelatedTurnCount(locale, relatedTurns.length)}</span>
                  <span className="artifactChip">{formatDocumentCount(locale, sourceDocuments.length)}</span>
                </div>
                <p className="subtle">
                  {locale === "zh-CN"
                    ? "这条论点已被证据链约束，详情可在深度审阅页按需展开。"
                    : "This claim stays evidence-bound, with the raw text and excerpts deferred to deep review."}
                </p>
                <div className="miniList">
                  {sourceDocuments.slice(0, 2).map((document) => (
                    <article key={document.key} className="miniCard">
                      <strong>{document.title}</strong>
                      <p>
                        {locale === "zh-CN"
                          ? `关联 ${document.count} 条证据摘录`
                          : `${document.count} linked evidence excerpt${document.count === 1 ? "" : "s"}`}
                      </p>
                    </article>
                  ))}
                </div>
              </article>
            )})}
          </div>
        </section>

        <section className="dashboardSection">
          <div className="sectionHeading">
            <p className="eyebrow">{copy.dashboard.evalEyebrow}</p>
            <h2>{copy.dashboard.evalTitle}</h2>
            <p>{copy.dashboard.scorecardNote}</p>
          </div>
          <div className="briefSummaryGrid">
            {topMetrics.map(({ key, label, value }) => (
              <article key={key} className="briefCard">
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <div className="dashboardCallout">
            <p className="subtle">{formatEvalPosture(locale, data.evalSummary.eval_name, data.evalSummary.status)}</p>
            <div className="cardActions">
              <Link className="surfaceAction surfaceActionPrimary" href="/review">
                {copy.dashboard.openReview}
              </Link>
              <Link className="surfaceAction" href="/review#advanced-operations">
                {copy.rubric.openLegacy}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
