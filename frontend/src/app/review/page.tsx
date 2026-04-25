import type { Metadata } from "next";

import { ButtonLink } from "../components/button-link";
import { ContextCard } from "../components/context-card";
import { LegacyOperationsPanel } from "../components/legacy-operations-panel";
import { PageHero } from "../components/page-hero";
import { ReviewRubricPanel } from "../components/review-rubric-panel";
import { SectionHeading } from "../components/section-heading";
import { StatusPill } from "../components/status-pill";
import { SurfaceCard } from "../components/surface-card";
import { WorkbenchTopBar } from "../components/workbench-top-bar";
import { loadAnalystReview } from "../lib/branch-analysis-data";
import { getCopy } from "../lib/copy";
import { getAppLocale } from "../lib/locale";
import { buildMainPathNavigation } from "../lib/main-path-navigation";
import {
  buildOverviewLines,
  formatClaimCount,
  formatDocumentCount,
  formatEvalPosture,
  formatEvidenceCount,
  formatParagraphCount,
  formatRelatedTurnCount,
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
import type { ClaimDrilldown } from "../lib/workbench-data";

function summarizeClaimSources(drilldown: ClaimDrilldown) {
  return Array.from(
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
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  return {
    title: locale === "zh-CN" ? "Mirror Analyst Mode" : "Mirror Analyst Mode",
    description:
      locale === "zh-CN"
        ? "Mirror 的双语深度审阅页，围绕评分卡、轨迹、论点和参考面板组织。"
        : "Mirror's advanced analysis mode for scorecard, trace, claims, reference, and compatibility tools."
  };
}

export default async function ReviewPage() {
  const locale = await getAppLocale();
  const copy = getCopy(locale);
  const data = await loadAnalystReview();
  const worldName = friendlyWorldName(locale, data.graph.world_id);
  const featuredBranchId = data.reportComparisonRun.branch.branch_id;
  const navigationItems = buildMainPathNavigation(locale, "review", featuredBranchId);
  const reportParagraphCount = data.report.split(/\n\s*\n/).filter((block) => block.trim().length > 0).length;
  const divergentTurns =
    data.reportComparison?.rows.map(({ turnIndex, reference, candidate }) => ({
      turnIndex,
      baselineTurnId: reference?.turn.turn_id ?? null,
      baselineAction: reference?.turn.action_type ?? null,
      interventionTurnId: candidate?.turn.turn_id ?? null,
      interventionAction: candidate?.turn.action_type ?? null
    })) ?? [];
  const reviewContextCards = [
    {
      label: copy.brand.worldLabel,
      value: worldName,
      tone: "accent" as const
    },
    {
      label: copy.metrics.interventionBranches,
      value: String(data.comparisonRuns.length)
    },
    {
      label: copy.metrics.evidenceLinkedClaims,
      value: String(data.claims.length)
    },
    {
      label: copy.metrics.evalStatus,
      value: formatEvalPosture(locale, data.evalSummary.eval_name, data.evalSummary.status)
    }
  ];

  return (
    <main className="workbenchPage reviewPage">
      <WorkbenchTopBar locale={locale} eyebrow="Mirror Public Demo / Advanced" items={navigationItems} />

      <PageHero
        eyebrow="Advanced Analyst Mode"
        title="Use this deeper workspace after the public guided demo."
        lede="The public Phase 1 path starts with the guided Fog Harbor replay. This advanced review surface keeps the scorecard, traces, claims, references, and compatibility tools available for closer inspection of the same precomputed artifacts."
        variant="review"
        support="Read-only public deployments do not create worlds, upload corpora, call Hosted GPT, accept BYOK, or start new runs."
        actions={
          <div className="sectionSwitch">
            <ButtonLink className="sectionLink" href={`/changes/${featuredBranchId}`} variant="ghost">
              {locale === "zh-CN" ? "返回分支页面" : "Back to branches"}
            </ButtonLink>
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
        }
        aside={
          <div className="contextCardGrid contextCardGridCompact">
            {reviewContextCards.map((card) => (
              <ContextCard
                key={card.label}
                label={card.label}
                value={card.value}
                tone={card.tone ?? "default"}
              />
            ))}
          </div>
        }
      />

      <ReviewRubricPanel
        locale={locale}
        rubricRows={data.rubricRows}
        claimCount={data.claims.length}
        divergentTurnCount={data.totalDivergentTurnCount}
        evalName={data.evalSummary.eval_name}
        evalStatus={data.evalSummary.status}
        followupHref="#advanced-operations"
      />

      <section className="dashboardSection" id="trace-claims">
        <SectionHeading
          eyebrow={copy.review.sectionNav.traceClaims}
          title={copy.review.traceTitle}
          description={copy.review.traceSummary}
        />
        <div className="interventionBoard reviewInterventionBoard">
          {data.comparisonOverviews.map((overview) => {
            const lines = buildOverviewLines(locale, overview);
            return (
              <SurfaceCard
                key={overview.run.key}
                className="interventionCard"
                interactive
                as="article"
              >
                <div className="interventionCardMeta" id={`trace-${overview.run.key}`}>
                  <StatusPill tone="subtle">
                    {localizeScenarioTitle(locale, overview.run.scenario.scenario_id, overview.run.scenario.title)}
                  </StatusPill>
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
                      <SurfaceCard key={`${overview.run.key}-${row.turnIndex}`} className="storyboardRow" as="div">
                        <div className="storyboardRowTop">
                          <strong>T{row.turnIndex}</strong>
                          <StatusPill tone="subtle">{overview.run.branch.branch_id}</StatusPill>
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
                      </SurfaceCard>
                    ))}
                  </div>
                ) : (
                  <p className="subtle">{copy.review.noDivergence}</p>
                )}
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <section className="dashboardSection" id="claims">
        <SectionHeading
          eyebrow={copy.review.claimsTitle}
          title={copy.review.claimsSummary}
          description={
            locale === "zh-CN"
              ? "默认先看论点结构、来源文档和关联回合，只有在需要时再展开原始 claim 文本与证据摘录。"
              : "Default to the claim structure, source documents, and related turns; open the raw claim text and evidence excerpts only when needed."
          }
        />
        <div className="claimSnapshotGrid">
          {data.claimDrilldowns.map((drilldown) => {
            const { claim, evidenceChunks, relatedTurns } = drilldown;
            const sourceDocuments = summarizeClaimSources(drilldown);

            return (
              <SurfaceCard key={claim.claim_id} className="claimSnapshotCard claimSnapshotCardExpanded" interactive>
                <div className="interventionCardMeta">
                  <StatusPill tone="subtle">{claim.claim_id}</StatusPill>
                  <StatusPill tone="accent">{localizeClaimLabel(locale, claim.label)}</StatusPill>
                </div>
                <div className="artifactChipRow">
                  <StatusPill>{formatEvidenceCount(locale, evidenceChunks.length)}</StatusPill>
                  <StatusPill>{formatRelatedTurnCount(locale, relatedTurns.length)}</StatusPill>
                  <StatusPill>{formatDocumentCount(locale, sourceDocuments.length)}</StatusPill>
                </div>
                <p className="subtle">
                  {locale === "zh-CN"
                    ? "这条论点默认只展示结构摘要，原始文本和摘录被收在折叠层里。"
                    : "This claim now defaults to a structural summary, with the raw text and excerpts tucked behind an explicit drawer."}
                </p>
                <div className="subsectionBlock">
                  <h3>{locale === "zh-CN" ? "来源文档" : "Source documents"}</h3>
                  <div className="miniList">
                    {sourceDocuments.map((document) => (
                      <SurfaceCard key={document.key} className="miniCard" as="article">
                        <strong>{document.title}</strong>
                        <p>
                          {locale === "zh-CN"
                            ? `关联 ${document.count} 条证据摘录`
                            : `${document.count} linked evidence excerpt${document.count === 1 ? "" : "s"}`}
                        </p>
                      </SurfaceCard>
                    ))}
                  </div>
                </div>
                <div className="subsectionBlock">
                  <h3>{locale === "zh-CN" ? "关联回合" : "Related turns"}</h3>
                  <div className="miniList">
                    {relatedTurns.map((entry) => (
                      <SurfaceCard key={entry.turn.turn_id} className="miniCard" as="article">
                        <strong>{entry.turn.turn_id}</strong>
                        <p>
                          {localizeActionType(locale, entry.turn.action_type)}
                          {" · "}
                          {localizeScenarioTitle(locale, entry.scenarioKey, entry.scenarioTitle)}
                        </p>
                      </SurfaceCard>
                    ))}
                  </div>
                </div>
                <details className="inlineDetails">
                  <summary className="inlineDetailsSummary">
                    {locale === "zh-CN" ? "查看原始论点与证据摘录" : "Open raw claim and evidence excerpts"}
                  </summary>
                  <div className="inlineDetailsBody">
                    <div className="subsectionBlock">
                      <h3>{locale === "zh-CN" ? "原始论点文本" : "Raw claim text"}</h3>
                      <p>{claim.text}</p>
                    </div>
                    <div className="miniList">
                      {evidenceChunks.map(({ chunk, document }) => (
                        <SurfaceCard key={chunk.chunk_id} className="miniCard" as="article">
                          <strong>{document?.title ?? chunk.document_id}</strong>
                          <p>{chunk.text}</p>
                        </SurfaceCard>
                      ))}
                    </div>
                  </div>
                </details>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <section className="dashboardSection" id="reference">
        <SectionHeading
          eyebrow={copy.review.sectionNav.reference}
          title={copy.review.referenceTitle}
          description={copy.review.referenceSummary}
        />
        <div className="dashboardSplit">
          <SurfaceCard className="referenceCard">
            <div className="interventionCardMeta">
              <StatusPill tone="subtle">{copy.review.rawReportTitle}</StatusPill>
              <code>artifacts/demo/report/report.md</code>
            </div>
            <p>{copy.review.rawReportSummary}</p>
            <div className="artifactChipRow">
              <StatusPill>{formatParagraphCount(locale, reportParagraphCount)}</StatusPill>
              <StatusPill>{formatClaimCount(locale, data.claims.length)}</StatusPill>
            </div>
            <details className="inlineDetails">
              <summary className="inlineDetailsSummary">
                {locale === "zh-CN" ? "查看原始报告文本" : "Open raw report text"}
              </summary>
              <div className="inlineDetailsBody">
                <pre className="artifactPre artifactPreCompact">{data.report}</pre>
              </div>
            </details>
          </SurfaceCard>

          <SurfaceCard className="referenceCard">
            <div className="interventionCardMeta">
              <StatusPill tone="subtle">{copy.review.graphTitle}</StatusPill>
              <code>artifacts/demo/graph/graph.json</code>
            </div>
            <div className="contextCardGrid">
              {Object.entries(data.graph.stats).map(([key, value]) => (
                <ContextCard
                  key={key}
                  label={localizeGraphStatKey(locale, key)}
                  value={String(value)}
                />
              ))}
            </div>
          </SurfaceCard>
        </div>

        <div className="dashboardSplit">
          <SurfaceCard className="referenceCard">
            <div className="interventionCardMeta">
              <StatusPill tone="subtle">{copy.review.scenariosTitle}</StatusPill>
              <code>artifacts/demo/scenario</code>
            </div>
            <div className="miniList">
              {data.runs.map((run) => (
                <SurfaceCard key={run.key} className="miniCard" as="article">
                  <strong>{localizeScenarioTitle(locale, run.scenario.scenario_id, run.scenario.title)}</strong>
                  <p>{localizeScenarioDescription(locale, run.scenario.scenario_id, run.scenario.description)}</p>
                  <div className="claimEvidence">
                    <code>{run.scenario.scenario_id}</code>
                    <code>{formatScenarioMeta(locale, "branch_count", run.scenario.branch_count)}</code>
                    <code>{formatScenarioMeta(locale, "turn_budget", run.scenario.turn_budget)}</code>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="referenceCard">
            <div className="interventionCardMeta">
              <StatusPill tone="subtle">{copy.review.documentTitle}</StatusPill>
              <code>artifacts/demo/ingest/documents.jsonl</code>
            </div>
            <div className="miniList">
              {data.documents.map((document) => (
                <SurfaceCard key={document.document_id} className="miniCard" as="article">
                  <strong>{document.title}</strong>
                  <div className="claimEvidence">
                    <code>{document.document_id}</code>
                    <code>{localizeDocumentKind(locale, document.kind)}</code>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section className="dashboardSection" id="advanced-operations">
        <SectionHeading
          eyebrow={copy.review.sectionNav.advanced}
          title={copy.review.advancedTitle}
          description={copy.review.advancedSummary}
        />
        <LegacyOperationsPanel
          title={copy.review.legacyOperationsTitle}
          summary={copy.review.legacyOperationsSummary}
          disclosure={copy.review.legacyOperationsDisclosure}
          note={
            locale === "zh-CN"
              ? "下面这块工具继续保留英文优先的兼容工作流。默认双语主路径仍然是上面的评分卡、轨迹、论点和参考面板。"
              : "The panel below remains an English-first compatibility workflow. The default bilingual path stays in the scorecard, trace, claims, and reference sections above."
          }
          previewTitle={
            locale === "zh-CN" ? "默认先完成主路径判断" : "Finish the main review path first"
          }
          previewSummary={
            locale === "zh-CN"
              ? "只有当主路径不足以支持你的判断时，才展开历史工具。这样首页和深度审阅页都能保持分析优先。"
              : "Open the legacy tools only when the main path is not enough for your judgment. This keeps both the homepage and deep review focused on analysis first."
          }
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
      </section>
    </main>
  );
}
