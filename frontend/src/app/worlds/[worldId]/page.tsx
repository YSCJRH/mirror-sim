import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "../../components/button-link";
import { ContextCard } from "../../components/context-card";
import { SectionHeading } from "../../components/section-heading";
import { SurfaceCard } from "../../components/surface-card";
import { WorkbenchTopBar } from "../../components/workbench-top-bar";
import { getAppLocale } from "../../lib/locale";
import {
  findLatestRuntimeSessionForWorld,
  loadRuntimeSessionWorkspaceForWorld,
} from "../../lib/runtime-session-data";
import { loadProductWorldConfig, localizeRuntimeNodeLabel } from "../../lib/world-product-data";

type PageProps = {
  params: Promise<{ worldId: string }>;
  searchParams?: Promise<{ session?: string; node?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ worldId: string }> }): Promise<Metadata> {
  const { worldId } = await params;
  const locale = await getAppLocale();
  const { product } = await loadProductWorldConfig(worldId, locale);
  return {
    title:
      locale === "zh-CN"
        ? `${product.world_name} | Mirror 世界主页`
        : `${product.world_name} | Mirror World`,
    description:
      locale === "zh-CN"
        ? "查看当前世界、最近结果，并继续进入扰动台。"
        : "Read the current bounded world, review the latest result, and continue into the perturbation workspace.",
  };
}

export default async function WorldHomePage({ params, searchParams }: PageProps) {
  const { worldId } = await params;
  const locale = await getAppLocale();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  try {
    const [{ product }, latestSession] = await Promise.all([
      loadProductWorldConfig(worldId, locale),
      resolvedSearchParams?.session ? Promise.resolve(null) : findLatestRuntimeSessionForWorld(worldId),
    ]);
    const sessionId = resolvedSearchParams?.session ?? latestSession?.sessionId;
    const fallbackNodeId = resolvedSearchParams?.node ?? latestSession?.activeNodeId;
    const runtimeWorkspace = sessionId
      ? await loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)
      : null;

    const activeNode = runtimeWorkspace?.selectedNode ?? null;
    const latestResult =
      runtimeWorkspace &&
      activeNode &&
      activeNode.node_id !== runtimeWorkspace.session.root_node_id &&
      runtimeWorkspace.compareDelta
        ? {
            title: localizeRuntimeNodeLabel(product, activeNode, locale),
            summary:
              locale === "zh-CN"
                ? `这条分支相对上一步已经出现 ${runtimeWorkspace.rows.length} 处关键变化。`
                : `The current live branch now shows ${runtimeWorkspace.rows.length} key changes against its parent.`,
            href: `/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}?node=${encodeURIComponent(activeNode.node_id)}`,
          }
        : null;
    const worldHref =
      runtimeWorkspace && activeNode
        ? `/worlds/${worldId}?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(activeNode.node_id)}`
        : `/worlds/${worldId}`;
    const perturbHref =
      runtimeWorkspace && activeNode
        ? `/worlds/${worldId}/perturb?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(activeNode.node_id)}`
        : `/worlds/${worldId}/perturb`;
    const reviewHref =
      runtimeWorkspace && activeNode
        ? `/worlds/${worldId}/review?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(activeNode.node_id)}`
        : `/worlds/${worldId}/review`;

    return (
      <main className="workbenchPage">
        <WorkbenchTopBar
          locale={locale}
          eyebrow={locale === "zh-CN" ? "Mirror 引擎 / 世界主页" : "Mirror Engine / World Home"}
          items={[
            { href: "/", label: locale === "zh-CN" ? "世界入口" : "Launch Hub", active: false },
            { href: worldHref, label: locale === "zh-CN" ? "世界" : "World", active: true },
            { href: perturbHref, label: locale === "zh-CN" ? "扰动" : "Perturb", active: false },
            { href: reviewHref, label: locale === "zh-CN" ? "审阅" : "Review", active: false },
          ]}
        />

        <div className="minimalHomeShell">
          <SurfaceCard className="minimalHomePanel minimalHomeCurrentPanel" tone="strong" as="section">
            <h1 className="minimalHomeTitle">{product.world_name}</h1>
            <p className="minimalHomeLead">{product.world_summary}</p>
            <div className="contextCardGrid contextCardGridCompact">
              <ContextCard
                label={locale === "zh-CN" ? "基线故事" : "Baseline"}
                value={product.baseline_title}
                summary={product.baseline_description}
                tone="accent"
              />
              {activeNode ? (
                <ContextCard
                  label={locale === "zh-CN" ? "当前起点" : "Current checkpoint"}
                  value={localizeRuntimeNodeLabel(product, activeNode, locale)}
                  summary={
                    activeNode.node_id === runtimeWorkspace?.session.root_node_id
                      ? locale === "zh-CN"
                        ? "当前仍在基线，可以直接开始第一次扰动。"
                        : "You are still on baseline and can start the first perturbation."
                      : locale === "zh-CN"
                        ? "继续扰动会从这个节点往下分叉。"
                        : "Continuing perturbation will branch from this node."
                  }
                />
              ) : null}
            </div>
          </SurfaceCard>

          <SurfaceCard className="minimalHomePanel minimalHomePerturbationPanel" tone="accent" as="section">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "下一步" : "Current perturbation"}
              title={
                locale === "zh-CN"
                  ? "从这里开始施加扰动"
                  : "Enter the actual perturbation workspace from here"
              }
              description={
                locale === "zh-CN"
                  ? "模型接入、扰动编辑和分支生成都在扰动台里完成。"
                  : "The private beta path keeps provider/model/key entry and branch generation in the perturb workspace."
              }
            />
            <div className="cardActions">
              <ButtonLink href={perturbHref} variant="primary">
                {latestResult
                  ? locale === "zh-CN"
                    ? "从当前结果继续扰动"
                    : "Continue from current result"
                  : locale === "zh-CN"
                    ? "打开扰动台"
                    : "Open perturb"}
              </ButtonLink>
            </div>
          </SurfaceCard>

          <SurfaceCard className="minimalHomePanel minimalHomeResultPanel" tone="strong" as="section">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "当前结果" : "Current result"}
            title={
                latestResult
                  ? latestResult.title
                  : locale === "zh-CN"
                    ? "还没有结果"
                    : "No live branch result yet"
              }
              description={
                latestResult
                  ? latestResult.summary
                  : locale === "zh-CN"
                    ? "先进入扰动台生成一条分支，这里才会显示结果。"
                    : "Generate one live branch from the perturb workspace and the result will appear here."
              }
            />
            {latestResult ? (
              <div className="cardActions">
                <ButtonLink href={perturbHref} variant="primary">
                  {locale === "zh-CN" ? "继续分叉" : "Branch again"}
                </ButtonLink>
                <ButtonLink href={latestResult.href} variant="secondary">
                  {locale === "zh-CN" ? "打开结果页" : "Open live result"}
                </ButtonLink>
                <ButtonLink href={reviewHref} variant="ghost">
                  {locale === "zh-CN" ? "进入审阅" : "Open review"}
                </ButtonLink>
              </div>
            ) : null}
          </SurfaceCard>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
