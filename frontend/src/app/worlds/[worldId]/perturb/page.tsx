import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContextCard } from "../../../components/context-card";
import { PageHero } from "../../../components/page-hero";
import { PresetPerturbationComposer } from "../../../components/preset-perturbation-composer";
import { SectionHeading } from "../../../components/section-heading";
import { WorkbenchTopBar } from "../../../components/workbench-top-bar";
import { getAppLocale } from "../../../lib/locale";
import {
  findLatestRuntimeSessionForWorld,
  loadRuntimeSessionWorkspaceForWorld,
} from "../../../lib/runtime-session-data";
import { readSimulationSession } from "../../../lib/simulation-session";
import { loadProductWorldConfig, localizeRuntimeNodeLabel } from "../../../lib/world-product-data";

type PageProps = {
  params: Promise<{ worldId: string }>;
  searchParams?: Promise<{
    session?: string;
    node?: string;
    branch?: string;
    provider?: string;
    kind?: string;
    target?: string;
    timing?: string;
    summary?: string;
    model?: string;
  }>;
};

export async function generateMetadata({ params }: { params: Promise<{ worldId: string }> }): Promise<Metadata> {
  const { worldId } = await params;
  const locale = await getAppLocale();
  const { product } = await loadProductWorldConfig(worldId, locale);
  return {
    title:
      locale === "zh-CN"
        ? `${product.world_name} | Mirror 扰动台`
        : `${product.world_name} | Mirror Perturb`,
    description:
      locale === "zh-CN"
        ? "在这个世界里施加扰动，并生成新的分支结果。"
        : "Apply a structured perturbation inside one bounded world and generate a live branch.",
  };
}

export default async function WorldPerturbPage({ params, searchParams }: PageProps) {
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
    const selectedRuntimeNode = runtimeWorkspace?.selectedNode ?? null;
    const worldHref =
      selectedRuntimeNode && runtimeWorkspace
        ? `/worlds/${worldId}?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(selectedRuntimeNode.node_id)}`
        : `/worlds/${worldId}`;
    const reviewHref =
      selectedRuntimeNode && runtimeWorkspace
        ? `/worlds/${worldId}/review?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(selectedRuntimeNode.node_id)}`
        : `/worlds/${worldId}/review`;
    const perturbHref =
      selectedRuntimeNode && runtimeWorkspace
        ? `/worlds/${worldId}/perturb?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(selectedRuntimeNode.node_id)}`
        : `/worlds/${worldId}/perturb`;
    const initialSession = readSimulationSession(resolvedSearchParams, {
      branchId: resolvedSearchParams?.branch || product.perturbation_options[0]?.key || "",
      provider: runtimeWorkspace?.session.decision_config?.provider ?? product.decision_defaults?.provider ?? "openai_compatible",
      kind: resolvedSearchParams?.kind || product.perturbation_options[0]?.kind || "",
      target: resolvedSearchParams?.target || product.perturbation_options[0]?.target || "",
      timing: resolvedSearchParams?.timing || product.perturbation_options[0]?.timing || "",
      summary: resolvedSearchParams?.summary || product.perturbation_options[0]?.summary || "",
      model: runtimeWorkspace?.session.decision_config?.model_id ?? product.decision_defaults?.model ?? "",
    });

    return (
      <main className="workbenchPage">
        <WorkbenchTopBar
          locale={locale}
          eyebrow={locale === "zh-CN" ? "Mirror 引擎 / 私有 Beta" : "Mirror Engine / Private Beta"}
          items={[
            { href: "/", label: locale === "zh-CN" ? "世界入口" : "Launch Hub", active: false },
            { href: worldHref, label: locale === "zh-CN" ? "世界" : "World", active: false },
            { href: perturbHref, label: locale === "zh-CN" ? "扰动" : "Perturb", active: true },
            { href: reviewHref, label: locale === "zh-CN" ? "审阅" : "Review", active: false },
          ]}
        />

        <PageHero
          eyebrow={locale === "zh-CN" ? "扰动台" : "Perturbation composer"}
          title={
            locale === "zh-CN"
              ? `在 ${product.world_name} 中施加一个扰动`
              : `Apply one perturbation in ${product.world_name}`
          }
          lede={product.world_summary}
          support={
            locale === "zh-CN"
              ? "在这里选择模型接入方式、写下扰动，然后生成新的分支结果。"
              : "This is the main private-beta operator surface: choose model access, edit a perturbation, then generate one live branch."
          }
          variant="review"
          aside={
            <div className="contextCardGrid contextCardGridCompact">
              <ContextCard
                label={locale === "zh-CN" ? "当前世界" : "Current world"}
                value={product.world_name}
                tone="accent"
              />
              <ContextCard
                label={locale === "zh-CN" ? "基线故事" : "Baseline"}
                value={product.baseline_title}
              />
              {selectedRuntimeNode ? (
                <ContextCard
                  label={locale === "zh-CN" ? "当前起点" : "Current checkpoint"}
                  value={localizeRuntimeNodeLabel(product, selectedRuntimeNode, locale)}
                />
              ) : null}
            </div>
          }
        />

        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "可用扰动" : "Structured perturbations"}
            title={
              locale === "zh-CN"
                ? "这些扰动模板已经适配这个世界的规则边界"
                : "These perturbation templates are already mapped to this world's own decision schema"
            }
          />
          <PresetPerturbationComposer
            locale={locale}
            worldId={worldId}
            baselineScenarioId={product.baseline_scenario_id}
            runtimeHrefBase={`/worlds/${worldId}/runtime`}
            worldHref={worldHref}
            perturbHref={perturbHref}
            initialSessionId={resolvedSearchParams?.session}
            initialFromNodeId={selectedRuntimeNode?.node_id}
            initialFromNodeLabel={
              selectedRuntimeNode
                ? localizeRuntimeNodeLabel(product, selectedRuntimeNode, locale)
                : undefined
            }
            baselineTitle={product.baseline_title}
            options={product.perturbation_options.map((option) => ({
              branchId: option.key,
              scenarioKey: option.key,
              title: option.title,
              description: option.description,
              kind: option.kind,
              target: option.target,
              timing: option.timing,
              summary: option.summary,
              runtime: option.runtime,
            }))}
            initialBranchId={initialSession.branchId}
            initialDraft={{
              provider:
                initialSession.provider === "deterministic_only" || initialSession.provider === "hosted_openai"
                  ? initialSession.provider
                  : "openai_compatible",
              kind: initialSession.kind,
              target: initialSession.target,
              timing: initialSession.timing,
              summary: initialSession.summary,
              model: initialSession.model,
            }}
            showStaticExplainPreview={false}
          />
        </section>
      </main>
    );
  } catch {
    notFound();
  }
}
