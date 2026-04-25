import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "../../../../../components/button-link";
import { ContextCard } from "../../../../../components/context-card";
import { RuntimeDecisionContextCard } from "../../../../../components/runtime-decision-context-card";
import { SectionHeading } from "../../../../../components/section-heading";
import { SurfaceCard } from "../../../../../components/surface-card";
import { WorkbenchTopBar } from "../../../../../components/workbench-top-bar";
import { getAppLocale } from "../../../../../lib/locale";
import { loadRuntimeSessionWorkspaceForWorld } from "../../../../../lib/runtime-session-data";
import { loadProductWorldConfig, localizeRuntimeNodeLabel } from "../../../../../lib/world-product-data";

type PageProps = {
  params: Promise<{ worldId: string; sessionId: string }>;
  searchParams?: Promise<{ node?: string }>;
};

type ParsedReportBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string };

function parseReport(text: string): ParsedReportBlock[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const heading = /^(#+)\s+(.*)$/.exec(line);
      if (heading) {
        return {
          type: "heading" as const,
          level: heading[1].length,
          text: heading[2],
        };
      }

      return {
        type: "paragraph" as const,
        text: line,
      };
    });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ worldId: string; sessionId: string }>;
}): Promise<Metadata> {
  const { worldId } = await params;
  const locale = await getAppLocale();
  const { product } = await loadProductWorldConfig(worldId, locale);
  return {
    title:
      locale === "zh-CN"
        ? `${product.world_name} | Mirror 分支报告`
        : `${product.world_name} | Mirror Report`,
    description:
      locale === "zh-CN"
        ? "查看当前分支生成的完整报告。"
        : "Read the node-scoped runtime report for one bounded world.",
  };
}

export default async function WorldRuntimeReportPage({ params, searchParams }: PageProps) {
  const { worldId, sessionId } = await params;
  const locale = await getAppLocale();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  try {
    const [{ product }, workspace] = await Promise.all([
      loadProductWorldConfig(worldId, locale),
      loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, resolvedSearchParams?.node),
    ]);
    if (!workspace) {
      notFound();
    }
    const activeNode = workspace.selectedNode;
    const activeNodeLabel = localizeRuntimeNodeLabel(product, activeNode, locale);
    const worldHref = `/worlds/${worldId}?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;
    const perturbHref = `/worlds/${worldId}/perturb?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;
    const runtimeHref = `/worlds/${worldId}/runtime/${sessionId}?node=${encodeURIComponent(activeNode.node_id)}`;
    const explainHref = `/worlds/${worldId}/runtime/${sessionId}/explain?node=${encodeURIComponent(activeNode.node_id)}`;
    const reportHref = `/worlds/${worldId}/runtime/${sessionId}/report?node=${encodeURIComponent(activeNode.node_id)}`;
    const reviewHref = `/worlds/${worldId}/review?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;
    const reportBlocks = workspace.reportText ? parseReport(workspace.reportText) : [];

    return (
      <main className="workbenchPage">
        <WorkbenchTopBar
          locale={locale}
          eyebrow={locale === "zh-CN" ? "Mirror 引擎 / 私有 Beta" : "Mirror Engine / Private Beta"}
          items={[
            { href: "/", label: locale === "zh-CN" ? "世界入口" : "Launch Hub", active: false },
            { href: worldHref, label: locale === "zh-CN" ? "世界" : "World", active: false },
            { href: perturbHref, label: locale === "zh-CN" ? "扰动" : "Perturb", active: false },
            { href: reportHref, label: locale === "zh-CN" ? "报告" : "Report", active: true },
            { href: reviewHref, label: locale === "zh-CN" ? "审阅" : "Review", active: false },
          ]}
        />

        <section className="dashboardSection dashboardSectionAccent">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "分支报告" : "Node report"}
            title={activeNodeLabel}
            description={
              workspace.reportText
                ? locale === "zh-CN"
                  ? `这里显示 ${product.world_name} 当前分支自己的完整报告。`
                  : `This page renders the node-scoped report for the current ${product.world_name} node.`
                : locale === "zh-CN"
                  ? "当前分支还没有生成可读取的报告。"
                  : "This node does not yet have a generated report artifact."
            }
          />
          <div className="contextCardGrid">
            <ContextCard label={locale === "zh-CN" ? "实验编号" : "Session"} value={workspace.session.session_id} code />
            <ContextCard label={locale === "zh-CN" ? "分支编号" : "Node"} value={activeNode.node_id} code />
            <ContextCard
              label={locale === "zh-CN" ? "报告状态" : "Report status"}
              value={workspace.reportText ? (locale === "zh-CN" ? "已生成" : "ready") : (locale === "zh-CN" ? "缺失" : "missing")}
            />
            <RuntimeDecisionContextCard
              locale={locale}
              summary={workspace.decisionSummary}
              configuredProvider={workspace.session.decision_config?.provider}
              configuredModel={workspace.session.decision_config?.model_id}
            />
          </div>
          <div className="cardActions">
            <ButtonLink href={runtimeHref} variant="primary">
              {locale === "zh-CN" ? "回到结果页" : "Back to runtime"}
            </ButtonLink>
            <ButtonLink href={explainHref} variant="secondary">
              {locale === "zh-CN" ? "查看解释" : "Open explain"}
            </ButtonLink>
            <ButtonLink href={reviewHref} variant="ghost">
              {locale === "zh-CN" ? "回到审阅页" : "Open review"}
            </ButtonLink>
          </div>
        </section>

        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "报告正文" : "Report body"}
            title={locale === "zh-CN" ? "当前分支的完整报告" : "Full node-scoped report"}
            description={
              locale === "zh-CN"
                ? "先直接阅读结构化报告；需要时再展开原始文本。"
                : "Read the structured report first, then open the raw text if needed."
            }
          />
          <SurfaceCard className="runtimeReportCard" tone="strong" as="article">
            {reportBlocks.length > 0 ? (
              <div className="runtimeReportStack">
                {reportBlocks.map((block, index) =>
                  block.type === "heading" ? (
                    block.level <= 2 ? (
                      <h3 key={`${block.text}-${index}`}>{block.text}</h3>
                    ) : (
                      <h4 key={`${block.text}-${index}`}>{block.text}</h4>
                    )
                  ) : (
                    <p key={`${block.text}-${index}`} className="runtimeReportParagraph">
                      {block.text}
                    </p>
                  )
                )}
              </div>
            ) : (
              <p className="subtle">
                {locale === "zh-CN"
                  ? "请先在这个世界里生成一条分支，再回来查看这份报告。"
                  : "Generate one live branch in this world first, then come back to inspect the report."}
              </p>
            )}

            {workspace.reportText ? (
              <details className="inlineDetails">
                <summary className="inlineDetailsSummary">
                  {locale === "zh-CN" ? "查看原始报告文本" : "View raw report text"}
                </summary>
                <div className="inlineDetailsBody">
                  <pre className="runtimeReportPre">{workspace.reportText}</pre>
                </div>
              </details>
            ) : null}
          </SurfaceCard>
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}
