import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "../../../../components/button-link";
import { ContextCard } from "../../../../components/context-card";
import { RuntimeDecisionContextCard } from "../../../../components/runtime-decision-context-card";
import { RuntimeLineagePanel } from "../../../../components/runtime-lineage-panel";
import { RuntimeSessionActions } from "../../../../components/runtime-session-actions";
import { SectionHeading } from "../../../../components/section-heading";
import { SurfaceCard } from "../../../../components/surface-card";
import { WorkbenchTopBar } from "../../../../components/workbench-top-bar";
import { getAppLocale } from "../../../../lib/locale";
import { loadRuntimeSessionWorkspaceForWorld } from "../../../../lib/runtime-session-data";
import {
  loadProductWorldConfig,
  localizeOutcomeLabel,
  localizeRuntimeNodeLabel,
  localizeRuntimePerturbation,
} from "../../../../lib/world-product-data";

type PageProps = {
  params: Promise<{ worldId: string; sessionId: string }>;
  searchParams?: Promise<{ node?: string }>;
};

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
        ? `${product.world_name} | Mirror 分支结果`
        : `${product.world_name} | Mirror Runtime`,
    description:
      locale === "zh-CN"
        ? "查看这个世界当前分支的结果、变化和回退入口。"
        : "Inspect the active live runtime node for one bounded world.",
  };
}

function outcomeCard(delta: unknown, candidate: unknown, locale: "en" | "zh-CN") {
  if (typeof delta === "number" && delta === 0) {
    return locale === "zh-CN" ? "没有变化" : "No change";
  }
  if (typeof delta === "number" && delta > 0) {
    return locale === "zh-CN" ? `延后 ${delta} 回合` : `Delayed by ${delta} turns`;
  }
  if (typeof delta === "number" && delta < 0) {
    return locale === "zh-CN" ? `提前 ${Math.abs(delta)} 回合` : `${Math.abs(delta)} turns earlier`;
  }
  return String(candidate ?? (locale === "zh-CN" ? "未记录" : "Unrecorded"));
}

export default async function WorldRuntimePage({ params, searchParams }: PageProps) {
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
    const parentNode = activeNode.parent_node_id
      ? workspace.session.nodes.find((node) => node.node_id === activeNode.parent_node_id) ?? null
      : null;
    const perturbHref = `/worlds/${worldId}/perturb?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;
    const worldHref = `/worlds/${worldId}?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;
    const reviewHref = `/worlds/${worldId}/review?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;
    const runtimeHref = `/worlds/${worldId}/runtime/${sessionId}?node=${encodeURIComponent(activeNode.node_id)}`;
    const explainHref = `/worlds/${worldId}/runtime/${sessionId}/explain?node=${encodeURIComponent(activeNode.node_id)}`;
    const reportHref = `/worlds/${worldId}/runtime/${sessionId}/report?node=${encodeURIComponent(activeNode.node_id)}`;

    return (
      <main className="workbenchPage">
        <WorkbenchTopBar
          locale={locale}
          eyebrow={locale === "zh-CN" ? "Mirror 引擎 / 私有 Beta" : "Mirror Engine / Private Beta"}
          items={[
            { href: "/", label: locale === "zh-CN" ? "世界入口" : "Launch Hub", active: false },
            { href: worldHref, label: locale === "zh-CN" ? "世界" : "World", active: false },
            { href: perturbHref, label: locale === "zh-CN" ? "扰动" : "Perturb", active: false },
            { href: runtimeHref, label: locale === "zh-CN" ? "结果" : "Runtime", active: true },
            { href: reviewHref, label: locale === "zh-CN" ? "审阅" : "Review", active: false },
          ]}
        />

        <section className="dashboardSection dashboardSectionAccent">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "当前分支" : "Current live node"}
            title={activeNodeLabel}
            description={
              locale === "zh-CN"
                ? `这条分支属于 ${product.world_name}，可以继续往下分叉，也可以回退到上一步。`
                : `This node belongs to ${product.world_name}. You can continue branching from it or roll back.`
            }
          />
          <div className="contextCardGrid">
            <ContextCard label={locale === "zh-CN" ? "世界" : "World"} value={product.world_name} tone="accent" />
            <ContextCard label={locale === "zh-CN" ? "实验编号" : "Session"} value={workspace.session.session_id} code />
            <ContextCard label={locale === "zh-CN" ? "分支编号" : "Node"} value={activeNode.node_id} code />
            <RuntimeDecisionContextCard
              locale={locale}
              summary={workspace.decisionSummary}
              configuredProvider={workspace.session.decision_config?.provider}
              configuredModel={workspace.session.decision_config?.model_id}
            />
          </div>
          <div className="cardActions">
            <ButtonLink href={perturbHref} variant="primary">
              {locale === "zh-CN" ? "继续施加扰动" : "Continue from this node"}
            </ButtonLink>
            <ButtonLink href={explainHref} variant="secondary">
              {locale === "zh-CN" ? "查看解释" : "Open explain"}
            </ButtonLink>
            <ButtonLink href={reportHref} variant="ghost">
              {locale === "zh-CN" ? "查看报告" : "Open report"}
            </ButtonLink>
            {parentNode ? (
              <RuntimeSessionActions
                worldId={worldId}
                sessionId={sessionId}
                targetNodeId={parentNode.node_id}
                locale={locale}
                label={locale === "zh-CN" ? "回退到父节点" : "Rollback to parent"}
                returnHref={`/worlds/${worldId}/perturb?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(parentNode.node_id)}`}
              />
            ) : null}
          </div>
        </section>

        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "扰动谱系" : "Perturbation lineage"}
            title={locale === "zh-CN" ? "先看这条分支是怎么叠出来的" : "Read how this branch was accumulated first"}
          />
          <RuntimeLineagePanel
            locale={locale}
            lineage={workspace.lineage}
            currentNodeId={activeNode.node_id}
            labelForNode={(node) => localizeRuntimeNodeLabel(product, node, locale)}
            describePerturbation={(node) => localizeRuntimePerturbation(product, node)}
          />
        </section>

        {workspace.compareDelta ? (
          <section className="dashboardSection">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "结果变化" : "Outcome deltas"}
              title={locale === "zh-CN" ? "相对父节点的关键变化" : "Key changes against the parent node"}
            />
            <div className="contextCardGrid">
              {Object.entries(workspace.compareDelta.outcome_deltas).map(([key, value]) => (
                <SurfaceCard key={key} className="contextCard" tone="strong" as="article">
                  <span className="contextCardLabel">{localizeOutcomeLabel(product, key)}</span>
                  <strong className="contextCardValue">
                    {outcomeCard(value.delta, value.candidate, locale)}
                  </strong>
                </SurfaceCard>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    );
  } catch {
    notFound();
  }
}
