import Link from "next/link";
import type { Metadata } from "next";

import { LanguageSwitch } from "../components/language-switch";
import { ReviewRubricPanel } from "../components/review-rubric-panel";
import { ReviewScorecard } from "../review-scorecard";
import { getCopy } from "../lib/copy";
import { getAppLocale } from "../lib/locale";
import {
  buildOverviewLines,
  formatEvalPosture,
  formatScenarioMeta,
  friendlyWorldName,
  localizeActionType,
  localizeBranchLabel,
  localizeClaimLabel,
  localizeDocumentKind,
  localizeGraphStatKey,
  localizeScenarioDescription,
  localizeScenarioTitle
} from "../lib/presenters";
import { loadWorkbenchData } from "../lib/workbench-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  return {
    title: locale === "zh-CN" ? "Mirror 深度审阅工作区" : "Mirror Deep Review Workspace",
    description:
      locale === "zh-CN"
        ? "Mirror 的双语深度审阅页，围绕评分卡、轨迹、论点和参考面板组织。"
        : "Bilingual deep review workspace for scorecard, trace, claims, and reference inspection in Mirror."
  };
}

export default async function ReviewPage() {
  const locale = await getAppLocale();
  const copy = getCopy(locale);
  const data = await loadWorkbenchData();
  const worldName = friendlyWorldName(locale, data.graph.world_id);
  const divergentTurns =
    data.reportComparison?.rows.map(({ turnIndex, reference, candidate }) => ({
      turnIndex,
      baselineTurnId: reference?.turn.turn_id ?? null,
      baselineAction: reference?.turn.action_type ?? null,
      interventionTurnId: candidate?.turn.turn_id ?? null,
      interventionAction: candidate?.turn.action_type ?? null
    })) ?? [];

  return (
    <main className="workbenchPage reviewPage">
      <header className="topBar">
        <div className="topBarBrand">
          <p className="eyebrow">{copy.brand.eyebrow}</p>
          <div className="topBarLinks">
            <Link href="/">{copy.brand.dashboardLabel}</Link>
            <span className="topBarActive">{copy.brand.reviewLabel}</span>
          </div>
        </div>
        <LanguageSwitch locale={locale} />
      </header>

      <section className="reviewHero">
        <div className="reviewHeroCopy">
          <p className="eyebrow">{copy.review.stripTitle}</p>
          <h1>{copy.review.title}</h1>
          <p className="lede">{copy.review.lede}</p>
        </div>
        <div className="reviewHeroMeta">
          <article className="briefCard briefCardDark">
            <span>{copy.brand.worldLabel}</span>
            <strong>{worldName}</strong>
          </article>
          <article className="briefCard">
            <span>{copy.metrics.interventionBranches}</span>
            <strong>{data.comparisonRuns.length}</strong>
          </article>
          <article className="briefCard">
            <span>{copy.metrics.evidenceLinkedClaims}</span>
            <strong>{data.claims.length}</strong>
          </article>
          <article className="briefCard">
            <span>{copy.metrics.evalStatus}</span>
            <strong>{formatEvalPosture(locale, data.evalSummary.eval_name, data.evalSummary.status)}</strong>
          </article>
        </div>
        <div className="sectionSwitch">
          <Link className="sectionLink" href="/">
            {copy.review.backToDashboard}
          </Link>
          <a className="sectionLink" href="#scorecard">
            {copy.review.sectionNav.scorecard}
          </a>
          <a className="sectionLink" href="#trace-claims">
            {copy.review.sectionNav.traceClaims}
          </a>
          <a className="sectionLink" href="#reference">
            {copy.review.sectionNav.reference}
          </a>
          <a className="sectionLink" href="#advanced-operations">
            {copy.review.sectionNav.advanced}
          </a>
        </div>
      </section>

      <ReviewRubricPanel
        locale={locale}
        rubricRows={data.rubricRows}
        claimCount={data.claims.length}
        divergentTurnCount={data.totalDivergentTurnCount}
        evalName={data.evalSummary.eval_name}
        evalStatus={data.evalSummary.status}
      />

      <section className="dashboardSection" id="trace-claims">
        <div className="sectionHeading">
          <p className="eyebrow">{copy.review.sectionNav.traceClaims}</p>
          <h2>{copy.review.traceTitle}</h2>
          <p>{copy.review.traceSummary}</p>
        </div>
        <div className="interventionBoard reviewInterventionBoard">
          {data.comparisonOverviews.map((overview) => {
            const lines = buildOverviewLines(locale, overview);
            return (
              <article key={overview.run.key} id={`trace-${overview.run.key}`} className="interventionCard">
                <div className="interventionCardMeta">
                  <span>{localizeScenarioTitle(locale, overview.run.scenario.scenario_id, overview.run.scenario.title)}</span>
                  <code>{overview.run.scenario.scenario_id}</code>
                </div>
                <h3>{localizeBranchLabel(locale, overview.run.scenario.scenario_id, overview.run.label)}</h3>
                <ul className="summaryList">
                  {lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {overview.rows.length > 0 ? (
                  <div className="storyboardRows">
                    {overview.rows.slice(0, 3).map((row) => (
                      <article key={`${overview.run.key}-${row.turnIndex}`} className="storyboardRow">
                        <div className="storyboardRowTop">
                          <strong>T{row.turnIndex}</strong>
                          <span className="pill">{overview.run.branch.branch_id}</span>
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
                ) : (
                  <p className="subtle">{copy.review.noDivergence}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboardSection" id="claims">
        <div className="sectionHeading">
          <p className="eyebrow">{copy.review.claimsTitle}</p>
          <h2>{copy.review.claimsSummary}</h2>
        </div>
        <div className="claimSnapshotGrid">
          {data.claimDrilldowns.map(({ claim, evidenceChunks, relatedTurns }) => (
            <article key={claim.claim_id} className="claimSnapshotCard claimSnapshotCardExpanded">
              <div className="interventionCardMeta">
                <span>{claim.claim_id}</span>
                <span className="pill">{localizeClaimLabel(locale, claim.label)}</span>
              </div>
              <p>{claim.text}</p>
              <div className="claimEvidence">
                {claim.evidence_ids.map((evidenceId) => (
                  <code key={evidenceId}>{evidenceId}</code>
                ))}
              </div>
              <div className="subsectionBlock">
                <h3>{copy.common.jumpToEvidence}</h3>
                <div className="miniList">
                  {evidenceChunks.map(({ chunk, document }) => (
                    <article key={chunk.chunk_id} className="miniCard">
                      <strong>{document?.title ?? chunk.document_id}</strong>
                      <p>{chunk.text}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="subsectionBlock">
                <h3>{copy.common.jumpToTrace}</h3>
                <div className="miniList">
                  {relatedTurns.map((entry) => (
                    <article key={entry.turn.turn_id} className="miniCard">
                      <strong>{entry.turn.turn_id}</strong>
                      <p>{entry.turn.rationale}</p>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboardSection" id="reference">
        <div className="sectionHeading">
          <p className="eyebrow">{copy.review.sectionNav.reference}</p>
          <h2>{copy.review.referenceTitle}</h2>
          <p>{copy.review.referenceSummary}</p>
        </div>
        <div className="dashboardSplit">
          <article className="referenceCard">
            <div className="interventionCardMeta">
              <span>{copy.review.rawReportTitle}</span>
              <code>artifacts/demo/report/report.md</code>
            </div>
            <p>{copy.review.rawReportSummary}</p>
            <pre className="artifactPre artifactPreCompact">{data.report}</pre>
          </article>

          <article className="referenceCard">
            <div className="interventionCardMeta">
              <span>{copy.review.graphTitle}</span>
              <code>artifacts/demo/graph/graph.json</code>
            </div>
            <div className="briefSummaryGrid">
              {Object.entries(data.graph.stats).map(([key, value]) => (
                <article key={key} className="briefCard">
                  <span>{localizeGraphStatKey(locale, key)}</span>
                  <strong>{value}</strong>
                </article>
              ))}
            </div>
          </article>
        </div>

        <div className="dashboardSplit">
          <article className="referenceCard">
            <div className="interventionCardMeta">
              <span>{copy.review.scenariosTitle}</span>
              <code>artifacts/demo/scenario</code>
            </div>
            <div className="miniList">
              {data.runs.map((run) => (
                <article key={run.key} className="miniCard">
                  <strong>{localizeScenarioTitle(locale, run.scenario.scenario_id, run.scenario.title)}</strong>
                  <p>{localizeScenarioDescription(locale, run.scenario.scenario_id, run.scenario.description)}</p>
                  <div className="claimEvidence">
                    <code>{run.scenario.scenario_id}</code>
                    <code>{formatScenarioMeta(locale, "branch_count", run.scenario.branch_count)}</code>
                    <code>{formatScenarioMeta(locale, "turn_budget", run.scenario.turn_budget)}</code>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="referenceCard">
            <div className="interventionCardMeta">
              <span>{copy.review.documentTitle}</span>
              <code>artifacts/demo/ingest/documents.jsonl</code>
            </div>
            <div className="miniList">
              {data.documents.map((document) => (
                <article key={document.document_id} className="miniCard">
                  <strong>{document.title}</strong>
                  <div className="claimEvidence">
                    <code>{document.document_id}</code>
                    <code>{localizeDocumentKind(locale, document.kind)}</code>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="dashboardSection" id="advanced-operations">
        <div className="sectionHeading">
          <p className="eyebrow">{copy.review.sectionNav.advanced}</p>
          <h2>{copy.review.advancedTitle}</h2>
          <p>{copy.review.advancedSummary}</p>
        </div>
        <details className="editorialDrawer">
          <summary className="editorialDrawerSummary">
            <div>
              <strong>{copy.review.legacyOperationsTitle}</strong>
              <span>{copy.review.legacyOperationsSummary}</span>
            </div>
            <span className="pill">{copy.review.legacyOperationsDisclosure}</span>
          </summary>
          <div className="editorialDrawerBody">
            <p className="editorialDrawerNote">
              {locale === "zh-CN"
                ? "下方面板为了兼容旧工作流暂时保留英文文案。当前推荐的双语审阅路径仍以上面的评分卡、轨迹、论点和参考面板为主。"
                : "The panel below remains English-first for compatibility with the older workflow. The primary bilingual review path stays in the scorecard, trace, claims, and reference sections above."}
            </p>
            <div lang="en">
              <ReviewScorecard
                rubricRows={data.rubricRows}
                claimCount={data.claims.length}
                divergentTurnCount={data.reportComparison?.divergentTurnCount ?? 0}
                evalName={data.evalSummary.eval_name}
                evalStatus={data.evalSummary.status}
                claimPackets={data.claims.map((claim) => ({
                  claimId: claim.claim_id,
                  text: claim.text,
                  relatedTurnIds: claim.related_turn_ids.filter(Boolean)
                }))}
                divergentTurns={divergentTurns}
              />
            </div>
          </div>
        </details>
      </section>
    </main>
  );
}
