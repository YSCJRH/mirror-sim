import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "../../../components/button-link";
import { ContextCard } from "../../../components/context-card";
import { PageHero } from "../../../components/page-hero";
import { RuntimeDecisionContextCard } from "../../../components/runtime-decision-context-card";
import { RuntimeLineagePanel } from "../../../components/runtime-lineage-panel";
import { RuntimeSessionActions } from "../../../components/runtime-session-actions";
import { SectionHeading } from "../../../components/section-heading";
import { StatusPill } from "../../../components/status-pill";
import { SurfaceCard } from "../../../components/surface-card";
import { WorkbenchTopBar } from "../../../components/workbench-top-bar";
import { getAppLocale } from "../../../lib/locale";
import {
  friendlyWorldName,
  formatDocumentCount,
  formatEvidenceCount,
  formatRelatedTurnCount,
} from "../../../lib/presenters";
import { loadRuntimeSessionWorkspace } from "../../../lib/runtime-session-data";

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  searchParams?: Promise<{
    node?: string;
  }>;
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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Mirror Live Runtime Explain",
    description: "Explain the active runtime node through claims, turns, and evidence excerpts.",
  };
}

export default async function RuntimeExplainPage({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const locale = await getAppLocale();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspace = await loadRuntimeSessionWorkspace(sessionId, resolvedSearchParams?.node);

  if (!workspace) {
    notFound();
  }

  const worldName = friendlyWorldName(locale, workspace.graph.world_id);
  const activeNode = workspace.selectedNode;
  const isRootNode = activeNode.node_id === workspace.session.root_node_id;
  const composerHref = `/perturb?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;
  const runtimeHref = `/runtime/${sessionId}?node=${encodeURIComponent(activeNode.node_id)}`;
  const explainHref = `/runtime/${sessionId}/explain?node=${encodeURIComponent(activeNode.node_id)}`;
  const reportHref = `/runtime/${sessionId}/report?node=${encodeURIComponent(activeNode.node_id)}`;
  const parentNode = activeNode.parent_node_id
    ? workspace.session.nodes.find((node) => node.node_id === activeNode.parent_node_id) ?? null
    : null;
  const navigationItems = [
    {
      href: "/",
      label: locale === "zh-CN" ? "世界" : "World",
      active: false,
    },
    {
      href: composerHref,
      label: locale === "zh-CN" ? "扰动" : "Perturb",
      active: false,
    },
    {
      href: runtimeHref,
      label: locale === "zh-CN" ? "Live Session" : "Live Session",
      active: false,
    },
    {
      href: explainHref,
      label: locale === "zh-CN" ? "Live Explain" : "Live Explain",
      active: true,
    },
    {
      href: reportHref,
      label: locale === "zh-CN" ? "Live Report" : "Live Report",
      active: false,
    },
    {
      href: "/review",
      label: "Analyst Mode",
      active: false,
    },
  ];

  return (
    <main className="workbenchPage">
      <WorkbenchTopBar
        locale={locale}
        eyebrow="Mirror Engine / Runtime Explain"
        items={navigationItems}
      />

      <PageHero
        eyebrow={locale === "zh-CN" ? "实时解释" : "Live explain"}
        title={
          isRootNode
            ? locale === "zh-CN"
              ? "基线 checkpoint 还没有可解释的分支变化"
              : "The baseline checkpoint does not yet have branch-change explanation"
            : activeNode.label
        }
        lede={
          isRootNode
            ? locale === "zh-CN"
              ? `当前 session 还停留在 ${worldName} 的基线节点，所以 explain 层还没有真正的 parent-vs-child 证据链。先回到 composer 生成一个 child node。`
              : `The session is still on the baseline node for ${worldName}, so there is no parent-vs-child evidence chain yet. Return to the composer and generate a child node first.`
            : locale === "zh-CN"
              ? `这里把当前 live node 的变化和证据链绑在一起：先看 claims，再看 runtime 回合与原始摘录。新的扰动也可以从当前节点继续分叉。`
              : `This view binds the active live node to its evidence chain: start with claims, then inspect the runtime turns and raw excerpts. You can continue branching from this node as well.`
        }
        support={
          isRootNode
            ? locale === "zh-CN"
              ? "当 active node 还是 root checkpoint 时，explain 层只会提示你先去生成真实分支。"
              : "When the active node is still the root checkpoint, the explain layer only prompts you to generate a real child branch first."
            : locale === "zh-CN"
              ? "当前 explain 会优先读取当前 node 自己的 runtime claims；只有缺少 node-scoped artifacts 时才会回退 demo 资产。"
              : "This explain layer prefers the current node's own runtime claims and only falls back to demo assets when node-scoped artifacts are missing."
        }
        variant="review"
        actions={
          <>
            <ButtonLink href={composerHref} variant="primary">
              {locale === "zh-CN" ? "从当前节点继续扰动" : "Continue from this node"}
            </ButtonLink>
            <ButtonLink href={runtimeHref} variant="secondary">
              {locale === "zh-CN" ? "回到 live session" : "Back to live session"}
            </ButtonLink>
            <ButtonLink href={reportHref} variant="ghost">
              {locale === "zh-CN" ? "打开 live report" : "Open live report"}
            </ButtonLink>
            {parentNode ? (
              <RuntimeSessionActions
                sessionId={sessionId}
                targetNodeId={parentNode.node_id}
                locale={locale}
                label={locale === "zh-CN" ? "回退到父节点" : "Rollback to parent"}
                pendingLabel={locale === "zh-CN" ? "正在回退到父节点..." : "Rolling back to parent..."}
              />
            ) : null}
            {!isRootNode ? (
              <RuntimeSessionActions
                sessionId={sessionId}
                targetNodeId={workspace.session.root_node_id}
                locale={locale}
                label={locale === "zh-CN" ? "回退到基线" : "Rollback to baseline"}
                pendingLabel={locale === "zh-CN" ? "正在回退到基线..." : "Rolling back to baseline..."}
              />
            ) : null}
          </>
        }
        aside={
          <div className="contextCardGrid contextCardGridCompact">
            <ContextCard
              label={locale === "zh-CN" ? "当前世界" : "Current world"}
              value={worldName}
              tone="accent"
            />
            <ContextCard label="Session" value={workspace.session.session_id} code />
            <ContextCard label="Active node" value={workspace.session.active_node_id} code />
            <RuntimeDecisionContextCard
              locale={locale}
              summary={workspace.decisionSummary}
              configuredProvider={workspace.session.decision_config?.provider}
              configuredModel={workspace.session.decision_config?.model_id}
            />
            <ContextCard
              label={locale === "zh-CN" ? "相关 claims" : "Relevant claims"}
              value={String(workspace.relevantClaims.length)}
            />
          </div>
        }
      />

      {isRootNode ? (
        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "下一步" : "Next step"}
            title={
              locale === "zh-CN"
                ? "先生成一个 child node，再回来查看 live explain。"
                : "Generate a child node first, then come back to inspect live explain."
            }
          />
          <SurfaceCard className="dashboardCallout" tone="accent">
            <div className="cardActions">
              <ButtonLink href={composerHref} variant="primary">
                {locale === "zh-CN" ? "打开 composer" : "Open composer"}
              </ButtonLink>
              <ButtonLink href={runtimeHref} variant="secondary">
                {locale === "zh-CN" ? "回到 live session" : "Back to live session"}
              </ButtonLink>
            </div>
          </SurfaceCard>
        </section>
      ) : (
        <>
          <section className="dashboardSection">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "扰动谱系" : "Perturbation lineage"}
              title={
                locale === "zh-CN"
                  ? "先确认当前节点继承了哪些扰动，再去读 claims 和证据。"
                  : "Confirm which perturbations this node has inherited before reading claims and evidence."
              }
              description={
                locale === "zh-CN"
                  ? "这条链说明当前解释到底是在解释哪一串累计变化。"
                  : "This chain makes explicit which cumulative change stack the current explanation is actually describing."
              }
            />
            <RuntimeLineagePanel
              locale={locale}
              lineage={workspace.lineage}
              currentNodeId={activeNode.node_id}
            />
          </section>

          <section className="dashboardSection">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "解释层" : "Explain layer"}
              title={
                locale === "zh-CN"
                  ? "这些 claims 和摘录解释了为什么当前 live node 会把世界推向这个方向。"
                  : "These claims and excerpts explain why the current live node pushes the world in this direction."
              }
            />
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
                      <StatusPill tone="accent">{drilldown.claim.label}</StatusPill>
                    </div>
                    <div className="artifactChipRow">
                      <StatusPill>
                        {formatEvidenceCount(locale, drilldown.evidenceChunks.length)}
                      </StatusPill>
                      <StatusPill>
                        {formatRelatedTurnCount(locale, drilldown.relatedRuntimeTurns.length)}
                      </StatusPill>
                      <StatusPill>
                        {formatDocumentCount(locale, sourceDocuments.length)}
                      </StatusPill>
                    </div>
                    <p className="subtle">{drilldown.claim.text}</p>

                    <div className="subsectionBlock">
                      <h3>{locale === "zh-CN" ? "相关 runtime 回合" : "Related runtime turns"}</h3>
                      <div className="miniList">
                        {drilldown.relatedRuntimeTurns.map((entry) => (
                          <SurfaceCard key={entry.turn.turn_id} className="miniCard" as="article">
                            <strong>{entry.turn.turn_id}</strong>
                            <p>
                              {entry.turn.action_type}
                              {" / "}
                              {entry.turn.rationale}
                            </p>
                          </SurfaceCard>
                        ))}
                      </div>
                    </div>

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

                    <details className="inlineDetails">
                      <summary className="inlineDetailsSummary">
                        {locale === "zh-CN" ? "打开原始摘录" : "Open raw excerpts"}
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
                  </SurfaceCard>
                );
              })}
            </div>
          </section>

          <section className="dashboardSection">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "返回路径" : "Route back"}
              title={
                locale === "zh-CN"
                  ? "看完解释之后，可以继续扰动、回到 live session，或进入 Analyst Mode。"
                  : "Once the explanation is clear, continue perturbing, return to the live session, or enter Analyst Mode."
              }
            />
            <SurfaceCard className="dashboardCallout" tone="accent">
              <div className="cardActions">
                <ButtonLink href={composerHref} variant="ghost">
                  {locale === "zh-CN" ? "回到 composer" : "Return to composer"}
                </ButtonLink>
                <ButtonLink href={runtimeHref} variant="primary">
                  {locale === "zh-CN" ? "回到 live session" : "Back to live session"}
                </ButtonLink>
                <ButtonLink href="/review" variant="secondary">
                  {locale === "zh-CN" ? "打开 Analyst Mode" : "Open Analyst Mode"}
                </ButtonLink>
              </div>
            </SurfaceCard>
          </section>
        </>
      )}
    </main>
  );
}
