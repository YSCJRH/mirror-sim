import { ButtonLink } from "./button-link";
import { ContextCard } from "./context-card";
import { SectionHeading } from "./section-heading";
import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { RuntimeSessionWorkspace } from "../lib/runtime-session-data";
import type { ProductWorldConfig } from "../lib/world-product-data";
import { localizeOutcomeLabel } from "../lib/world-product-data";
import { localizeClaimLabel } from "../lib/presenters";

type RuntimeReviewBriefProps = {
  locale: "en" | "zh-CN";
  product: ProductWorldConfig;
  workspace: RuntimeSessionWorkspace;
  explainHref?: string;
  reportHref?: string;
};

function formatOutcomeValue(
  locale: "en" | "zh-CN",
  delta: unknown,
  candidate: unknown
) {
  if (typeof delta === "number" && delta === 0) {
    return locale === "zh-CN" ? "没有变化" : "No change";
  }
  if (typeof delta === "number" && delta > 0) {
    return locale === "zh-CN" ? `延后 ${delta} 回合` : `Delayed by ${delta} turns`;
  }
  if (typeof delta === "number" && delta < 0) {
    return locale === "zh-CN"
      ? `提前 ${Math.abs(delta)} 回合`
      : `${Math.abs(delta)} turns earlier`;
  }
  return String(candidate ?? (locale === "zh-CN" ? "未记录" : "Unrecorded"));
}

function extractReportPreview(reportText: string | null) {
  if (!reportText) {
    return [];
  }

  const sections = reportText
    .split(/\r?\n\r?\n+/)
    .map((section) => section.trim())
    .filter(Boolean)
    .filter((section) => !section.startsWith("#"));

  return sections.slice(0, 2);
}

export function RuntimeReviewBrief({
  locale,
  product,
  workspace,
  explainHref,
  reportHref,
}: RuntimeReviewBriefProps) {
  const reportPreview = extractReportPreview(workspace.reportText);

  return (
    <>
      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "结果摘要" : "Current branch digest"}
          title={
            locale === "zh-CN"
              ? "先读这条分支改了什么"
              : "Read what this branch already changed first"
          }
          description={
            locale === "zh-CN"
              ? "在继续打开结果页、解释页和报告页之前，先看清关键结果、报告状态和解释线索。"
              : "Before opening deeper runtime / explain / report surfaces, inspect the key outcome shifts, report status, and explanation signals."
          }
        />
        <div className="contextCardGrid">
          <ContextCard
            label={locale === "zh-CN" ? "关键变化" : "Key changes"}
            value={String(workspace.rows.length)}
            summary={
              locale === "zh-CN"
                ? "相对父节点已经出现的关键分歧回合数量。"
                : "How many divergent turns now separate this node from its parent."
            }
            tone="accent"
          />
          <ContextCard
            label={locale === "zh-CN" ? "相关解释链" : "Relevant claims"}
            value={String(workspace.relevantClaims.length)}
            summary={
              locale === "zh-CN"
                ? "当前节点最相关的解释链数量。"
                : "How many explanation chains are currently most relevant."
            }
          />
          <ContextCard
            label={locale === "zh-CN" ? "报告状态" : "Report status"}
            value={
              workspace.reportText
                ? locale === "zh-CN"
                  ? "已生成"
                  : "ready"
                : locale === "zh-CN"
                  ? "缺失"
                  : "missing"
            }
            summary={
              locale === "zh-CN"
                ? workspace.reportText
                  ? "当前分支已经产出完整报告。"
                  : "当前分支还没有产出可读取的报告。"
                : workspace.reportText
                  ? "This node already has a node-scoped report."
                  : "This node does not have a report artifact yet."
            }
          />
        </div>
        {workspace.compareDelta ? (
          <div className="contextCardGrid">
            {Object.entries(workspace.compareDelta.outcome_deltas).map(([key, value]) => (
              <SurfaceCard key={key} className="contextCard" tone="strong" as="article">
                <span className="contextCardLabel">{localizeOutcomeLabel(product, key)}</span>
                <strong className="contextCardValue">
                  {formatOutcomeValue(locale, value.delta, value.candidate)}
                </strong>
              </SurfaceCard>
            ))}
          </div>
        ) : (
          <SurfaceCard className="dashboardCallout" tone="accent" as="article">
            <p className="subtle">
              {locale === "zh-CN"
                ? "这条分支还没有生成相对上一步的结果对比，所以这里暂时没有关键变化可读。"
                : "This node does not have a parent-vs-child compare artifact yet, so no outcome deltas are available here."}
            </p>
          </SurfaceCard>
        )}
      </section>

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "解释预览" : "Inline explanation preview"}
          title={
            locale === "zh-CN"
              ? "先在这一页决定要不要继续深挖"
              : "Decide whether deeper review is necessary from this page"
          }
          description={
            locale === "zh-CN"
              ? "这里先给出报告摘录和最相关解释链，足够支持一轮后台判断。"
              : "Use this report excerpt and top claims preview to make an initial alpha review decision before diving deeper."
          }
        />
        <div className="dashboardSplit">
          <SurfaceCard className="runtimeReportSection" tone="strong" as="article">
            <div className="interventionCardMeta">
              <StatusPill tone="accent">
                {locale === "zh-CN" ? "报告摘录" : "Report excerpt"}
              </StatusPill>
            </div>
            {reportPreview.length > 0 ? (
              <div className="runtimeReportStack">
                {reportPreview.map((paragraph) => (
                  <p key={paragraph} className="runtimeReportParagraph">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="subtle">
                {locale === "zh-CN"
                  ? "当前分支还没有可用的报告摘录。"
                  : "This node does not yet have a usable report excerpt."}
              </p>
            )}
            {reportHref ? (
              <div className="cardActions">
                <ButtonLink href={reportHref} variant="ghost">
                  {locale === "zh-CN" ? "打开完整报告" : "Open full report"}
                </ButtonLink>
              </div>
            ) : null}
          </SurfaceCard>

          <SurfaceCard className="runtimeReportSection" tone="strong" as="article">
            <div className="interventionCardMeta">
              <StatusPill tone="accent">
                {locale === "zh-CN" ? "解释线索" : "Explanation signals"}
              </StatusPill>
            </div>
            <p className="subtle">
              {locale === "zh-CN"
                ? workspace.relevantClaims.length > 0
                  ? `当前分支已经有 ${workspace.relevantClaims.length} 条最相关解释链，可以继续查看证据和相关回合。`
                  : "当前分支还没有筛出明显相关的解释链，建议先回看结果页或重新生成分支。"
                : workspace.relevantClaims.length > 0
                  ? `The current node already has ${workspace.relevantClaims.length} relevant claims, so explain is ready for evidence inspection.`
                  : "This node does not yet surface strong relevant claims, so check runtime or regenerate the branch first."}
            </p>
            {explainHref ? (
              <div className="cardActions">
                <ButtonLink href={explainHref} variant="ghost">
                  {locale === "zh-CN" ? "打开解释页" : "Open explain"}
                </ButtonLink>
              </div>
            ) : null}
          </SurfaceCard>
        </div>

        {workspace.relevantClaims.length > 0 ? (
          <div className="claimSnapshotGrid">
            {workspace.relevantClaims.slice(0, 3).map((drilldown) => {
              const documentCount = new Set(
                drilldown.evidenceChunks
                  .map(({ document }) => document?.document_id)
                  .filter((documentId): documentId is string => Boolean(documentId))
              ).size;

              return (
                <SurfaceCard
                  key={drilldown.claim.claim_id}
                  className="claimSnapshotCard claimSnapshotCardExpanded"
                  as="article"
                >
                  <div className="interventionCardMeta">
                    <StatusPill tone="subtle">{drilldown.claim.claim_id}</StatusPill>
                    <StatusPill tone="accent">{localizeClaimLabel(locale, drilldown.claim.label)}</StatusPill>
                  </div>
                  <h3>{drilldown.claim.text}</h3>
                  <p className="subtle">
                    {locale === "zh-CN"
                      ? `${drilldown.relatedRuntimeTurns.length} 个相关回合 / ${drilldown.evidenceChunks.length} 条证据片段 / ${documentCount} 份文档`
                      : `${drilldown.relatedRuntimeTurns.length} related turns / ${drilldown.evidenceChunks.length} evidence excerpts / ${documentCount} documents`}
                  </p>
                </SurfaceCard>
              );
            })}
          </div>
        ) : null}
      </section>
    </>
  );
}
