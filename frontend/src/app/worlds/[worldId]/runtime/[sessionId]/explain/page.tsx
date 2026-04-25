import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "../../../../../components/button-link";
import { ContextCard } from "../../../../../components/context-card";
import { RuntimeDecisionContextCard } from "../../../../../components/runtime-decision-context-card";
import { SectionHeading } from "../../../../../components/section-heading";
import { StatusPill } from "../../../../../components/status-pill";
import { SurfaceCard } from "../../../../../components/surface-card";
import { WorkbenchTopBar } from "../../../../../components/workbench-top-bar";
import { getAppLocale } from "../../../../../lib/locale";
import {
  formatDocumentCount,
  formatEvidenceCount,
  formatRelatedTurnCount,
  localizeActionType,
  localizeClaimLabel,
} from "../../../../../lib/presenters";
import { loadRuntimeSessionWorkspaceForWorld } from "../../../../../lib/runtime-session-data";
import { loadProductWorldConfig, localizeRuntimeNodeLabel } from "../../../../../lib/world-product-data";

type PageProps = {
  params: Promise<{ worldId: string; sessionId: string }>;
  searchParams?: Promise<{ node?: string }>;
};

function summarizeClaimSources(
  evidenceChunks: Array<{
    chunk: { document_id: string };
    document: { document_id: string; title: string } | null;
  }>
) {
  return Array.from(
    evidenceChunks.reduce((map, entry) => {
      const key = entry.document?.document_id ?? entry.chunk.document_id;
      const current = map.get(key);
      map.set(key, {
        key,
        title: entry.document?.title ?? entry.chunk.document_id,
        count: (current?.count ?? 0) + 1,
      });
      return map;
    }, new Map<string, { key: string; title: string; count: number }>())
  ).map(([, value]) => value);
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
        ? `${product.world_name} | Mirror 分支解释`
        : `${product.world_name} | Mirror Explain`,
    description:
      locale === "zh-CN"
        ? "查看当前分支背后的解释链、证据片段和相关回合。"
        : "Inspect runtime claims, evidence, and related turns for one live node.",
  };
}

export default async function WorldRuntimeExplainPage({ params, searchParams }: PageProps) {
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

    return (
      <main className="workbenchPage">
        <WorkbenchTopBar
          locale={locale}
          eyebrow={locale === "zh-CN" ? "Mirror 引擎 / 私有 Beta" : "Mirror Engine / Private Beta"}
          items={[
            { href: "/", label: locale === "zh-CN" ? "世界入口" : "Launch Hub", active: false },
            { href: worldHref, label: locale === "zh-CN" ? "世界" : "World", active: false },
            { href: perturbHref, label: locale === "zh-CN" ? "扰动" : "Perturb", active: false },
            { href: explainHref, label: locale === "zh-CN" ? "解释" : "Explain", active: true },
            { href: reviewHref, label: locale === "zh-CN" ? "审阅" : "Review", active: false },
          ]}
        />

        <section className="dashboardSection dashboardSectionAccent">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "为什么会这样" : "Explain layer"}
            title={activeNodeLabel}
            description={
              locale === "zh-CN"
                ? `这里解释 ${product.world_name} 当前分支为什么会发展成现在这样。`
                : `This page explains why the current live node in ${product.world_name} looks the way it does.`
            }
          />
          <div className="contextCardGrid">
            <ContextCard label={locale === "zh-CN" ? "实验编号" : "Session"} value={workspace.session.session_id} code />
            <ContextCard label={locale === "zh-CN" ? "分支编号" : "Node"} value={activeNode.node_id} code />
            <ContextCard
              label={locale === "zh-CN" ? "相关解释链" : "Relevant claims"}
              value={String(workspace.relevantClaims.length)}
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
            <ButtonLink href={reportHref} variant="secondary">
              {locale === "zh-CN" ? "查看报告" : "Open report"}
            </ButtonLink>
            <ButtonLink href={reviewHref} variant="ghost">
              {locale === "zh-CN" ? "回到审阅页" : "Open review"}
            </ButtonLink>
          </div>
        </section>

        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "解释链与证据" : "Claims and evidence"}
            title={
              locale === "zh-CN"
                ? "这些解释链最能说明当前分支为何会这样发展"
                : "These are the most relevant explanation chains for the current node"
            }
            description={
              locale === "zh-CN"
                ? "先看解释链，再看相关回合、来源文档和原始摘录。"
                : "Start with the explanation chain, then inspect turns, source documents, and raw excerpts."
            }
          />
          {workspace.relevantClaims.length > 0 ? (
            <div className="claimSnapshotGrid">
              {workspace.relevantClaims.map((drilldown) => {
                const sourceDocuments = summarizeClaimSources(drilldown.evidenceChunks);

                return (
                  <SurfaceCard
                    key={drilldown.claim.claim_id}
                    className="claimSnapshotCard claimSnapshotCardExpanded"
                    interactive
                  >
                    <div className="interventionCardMeta">
                      <StatusPill tone="subtle">{drilldown.claim.claim_id}</StatusPill>
                      <StatusPill tone="accent">
                        {localizeClaimLabel(locale, drilldown.claim.label)}
                      </StatusPill>
                    </div>
                    <h3>{drilldown.claim.text}</h3>
                    <div className="artifactChipRow">
                      <StatusPill>{formatEvidenceCount(locale, drilldown.evidenceChunks.length)}</StatusPill>
                      <StatusPill>{formatRelatedTurnCount(locale, drilldown.relatedRuntimeTurns.length)}</StatusPill>
                      <StatusPill>{formatDocumentCount(locale, sourceDocuments.length)}</StatusPill>
                    </div>

                    {drilldown.relatedRuntimeTurns.length > 0 ? (
                      <div className="subsectionBlock">
                        <h3>{locale === "zh-CN" ? "相关回合" : "Related turns"}</h3>
                        <div className="miniList">
                          {drilldown.relatedRuntimeTurns.map((entry) => (
                            <SurfaceCard key={entry.turn.turn_id} className="miniCard" as="article">
                              <strong>
                                {locale === "zh-CN"
                                  ? `T${entry.turn.turn_index} · ${localizeActionType(locale, entry.turn.action_type)}`
                                  : `${entry.turn.turn_id} · ${localizeActionType(locale, entry.turn.action_type)}`}
                              </strong>
                              <p>{entry.turn.rationale}</p>
                            </SurfaceCard>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {sourceDocuments.length > 0 ? (
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
                    ) : null}

                    {drilldown.evidenceChunks.length > 0 ? (
                      <details className="inlineDetails">
                        <summary className="inlineDetailsSummary">
                          {locale === "zh-CN" ? "查看原始摘录" : "Open raw excerpts"}
                        </summary>
                        <div className="inlineDetailsBody">
                          <div className="miniList">
                            {drilldown.evidenceChunks.map(({ chunk, document }) => (
                              <SurfaceCard key={chunk.chunk_id} className="miniCard" as="article">
                                <strong>{document?.title ?? chunk.document_id}</strong>
                                <p>{chunk.text}</p>
                              </SurfaceCard>
                            ))}
                          </div>
                        </div>
                      </details>
                    ) : null}
                  </SurfaceCard>
                );
              })}
            </div>
          ) : (
            <SurfaceCard className="dashboardCallout" tone="accent" as="article">
              <p className="subtle">
                {locale === "zh-CN"
                  ? "当前分支还没有筛出足够清楚的解释链。可以先回到结果页检查关键变化，或返回扰动台重新生成。"
                  : "This branch does not yet surface a clear explanation chain. Return to runtime or regenerate from perturb."}
              </p>
              <div className="cardActions">
                <ButtonLink href={runtimeHref} variant="secondary">
                  {locale === "zh-CN" ? "回到结果页" : "Back to runtime"}
                </ButtonLink>
                <ButtonLink href={perturbHref} variant="ghost">
                  {locale === "zh-CN" ? "回到扰动台" : "Back to perturb"}
                </ButtonLink>
              </div>
            </SurfaceCard>
          )}
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}
