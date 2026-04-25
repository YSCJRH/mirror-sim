import type { Metadata } from "next";

import { BranchHistoryRail } from "../components/branch-history-rail";
import { BranchTreeMap } from "../components/branch-tree-map";
import { ContextCard } from "../components/context-card";
import { PageHero } from "../components/page-hero";
import { PresetPerturbationComposer } from "../components/preset-perturbation-composer";
import { SectionHeading } from "../components/section-heading";
import { WorkbenchTopBar } from "../components/workbench-top-bar";
import { loadWorldContext } from "../lib/branch-analysis-data";
import { getAppLocale } from "../lib/locale";
import { buildMainPathNavigation } from "../lib/main-path-navigation";
import {
  friendlyWorldName,
  localizeScenarioDescription,
  localizeScenarioTitle,
} from "../lib/presenters";
import { presetPerturbationMetadata } from "../lib/preset-perturbations";
import { loadRuntimeSessionWorkspace } from "../lib/runtime-session-data";
import { readSimulationSession } from "../lib/simulation-session";

function normalizeScenarioKey(scenarioId: string) {
  return scenarioId.startsWith("scenario_") ? scenarioId.slice("scenario_".length) : scenarioId;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  return {
    title: locale === "zh-CN" ? "Mirror 扰动编辑器" : "Mirror Perturbation Composer",
    description:
      locale === "zh-CN"
        ? "先给出扰动，再生成候选分支并进入变化工作区。"
        : "Define a perturbation first, then generate a candidate branch and open the change workspace.",
  };
}

type PageProps = {
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

export default async function PerturbPage({ searchParams }: PageProps) {
  const locale = await getAppLocale();
  const data = await loadWorldContext();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const runtimeWorkspace = resolvedSearchParams?.session
    ? await loadRuntimeSessionWorkspace(
        resolvedSearchParams.session,
        resolvedSearchParams.node
      )
    : null;
  const worldName = friendlyWorldName(locale, data.graph.world_id);
  const featuredBranchId = data.reportComparisonRun.branch.branch_id;
  const baselineTitle = localizeScenarioTitle(
    locale,
    data.baselineRun.scenario.scenario_id,
    data.baselineRun.scenario.title
  );
  const composerOptions = data.comparisonOverviews.map((overview) => {
    const scenarioKey = normalizeScenarioKey(overview.run.scenario.scenario_id);
    const metadata = presetPerturbationMetadata[scenarioKey];

    return {
      branchId: overview.run.branch.branch_id,
      scenarioKey,
      title: localizeScenarioTitle(
        locale,
        overview.run.scenario.scenario_id,
        overview.run.scenario.title
      ),
      description: localizeScenarioDescription(
        locale,
        overview.run.scenario.scenario_id,
        overview.run.scenario.description
      ),
      kind:
        locale === "zh-CN"
          ? metadata?.kind.zh ?? "预设扰动"
          : metadata?.kind.en ?? "Preset perturbation",
      target:
        locale === "zh-CN"
          ? metadata?.target.zh ?? "当前世界"
          : metadata?.target.en ?? "Current world",
      timing:
        locale === "zh-CN"
          ? metadata?.timing.zh ?? "当前窗口"
          : metadata?.timing.en ?? "Current window",
      summary:
        locale === "zh-CN"
          ? metadata?.summary.zh ?? "把这条预设扰动映射成一个候选分支。"
          : metadata?.summary.en ?? "Map this preset perturbation into a candidate branch.",
    };
  });
  const requestedBranchId = resolvedSearchParams?.branch;
  const initialBranchId =
    requestedBranchId && composerOptions.some((option) => option.branchId === requestedBranchId)
      ? requestedBranchId
      : featuredBranchId;
  const initialOption =
    composerOptions.find((option) => option.branchId === initialBranchId) ?? composerOptions[0];
  const initialSession = readSimulationSession(resolvedSearchParams, {
    branchId: initialBranchId,
    provider: runtimeWorkspace?.session.decision_config?.provider ?? "openai_compatible",
    kind: initialOption?.kind,
    target: initialOption?.target,
    timing: initialOption?.timing,
    summary: initialOption?.summary,
    model: runtimeWorkspace?.session.decision_config?.model_id ?? "",
  });
  const selectedRuntimeNode = runtimeWorkspace?.selectedNode ?? null;
  const navigationItems = buildMainPathNavigation(
    locale,
    "perturb",
    featuredBranchId,
    initialSession
  );

  return (
    <main className="workbenchPage">
      <WorkbenchTopBar
        locale={locale}
        eyebrow="Mirror Engine / Evidence-backed What-if Review"
        items={navigationItems}
      />

      <PageHero
        eyebrow={locale === "zh-CN" ? "扰动编辑器" : "Perturbation composer"}
        title={
          locale === "zh-CN"
            ? "先给出扰动，再生成候选分支。"
            : "Describe a perturbation first, then generate a candidate branch."
        }
        lede={
          locale === "zh-CN"
            ? selectedRuntimeNode
              ? `你现在在 ${worldName} 的 live perturbation composer。新的生成会从 ${selectedRuntimeNode.label} 继续分叉，而不是默默回到基线。`
              : `你现在在 ${worldName} 的扰动入口。先写扰动草案，再生成一个 live child branch 去看世界如何变化。`
            : selectedRuntimeNode
              ? `You are now in the live perturbation composer for ${worldName}. New generation will continue from ${selectedRuntimeNode.label} instead of silently resetting to baseline.`
              : `You are now in the perturbation entry for ${worldName}. Start with a perturbation draft, then generate a live child branch to inspect the world change.`
        }
        support={
          locale === "zh-CN"
            ? "当前已经支持基于所选 checkpoint 继续生成子分支；完全自由文本扰动和更丰富的 payload 仍是下一阶段。"
            : "This surface now supports generating child branches from the selected checkpoint; fully freeform perturbations and richer payloads remain a follow-up phase."
        }
        variant="review"
        aside={
          <div className="contextCardGrid contextCardGridCompact">
            <ContextCard
              label={locale === "zh-CN" ? "当前世界" : "Current world"}
              value={worldName}
              tone="accent"
            />
            <ContextCard
              label={locale === "zh-CN" ? "基线故事" : "Baseline story"}
              value={baselineTitle}
            />
            <ContextCard
              label={locale === "zh-CN" ? "预设扰动数" : "Preset perturbations"}
              value={String(composerOptions.length)}
            />
            {selectedRuntimeNode ? (
              <ContextCard
                label={locale === "zh-CN" ? "当前 checkpoint" : "Current checkpoint"}
                value={selectedRuntimeNode.label}
              />
            ) : null}
          </div>
        }
      />

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "分支历史" : "Branch history"}
          title={
            locale === "zh-CN"
              ? "先看基线和已有分支，再决定要施加哪条扰动。"
              : "Read the baseline and existing branch tree first, then decide which perturbation to apply."
          }
        />
        <BranchHistoryRail
          locale={locale}
          baselineTitle={baselineTitle}
          currentBranchId={featuredBranchId}
          currentBranchTitle={localizeScenarioTitle(
            locale,
            data.reportComparisonRun.scenario.scenario_id,
            data.reportComparisonRun.scenario.title
          )}
          branches={composerOptions.map((option) => ({
            branchId: option.branchId,
            title: option.title,
          }))}
        />
      </section>

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "分支树" : "Branch tree"}
          title={
            locale === "zh-CN"
              ? "在施加扰动前，先看世界会向哪些候选分支分叉。"
              : "Before you apply a perturbation, inspect which candidate branches the world can fork into."
          }
          description={
            locale === "zh-CN"
              ? "这层把扰动输入、分支树和后续变化页面串成一条路径。"
              : "This layer connects perturbation input, the branch tree, and the downstream change pages into one flow."
          }
        />
        <BranchTreeMap
          locale={locale}
          baselineTitle={baselineTitle}
          activeBranchId={initialBranchId}
          branches={composerOptions.map((option) => ({
            branchId: option.branchId,
            title: option.title,
            summary: option.summary,
          }))}
        />
      </section>

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "应用扰动" : "Apply perturbation"}
          title={
            locale === "zh-CN"
              ? "先用预设模板，模拟未来更自由的扰动输入流。"
              : "Use preset templates here to simulate the future perturbation input flow."
          }
          description={
            locale === "zh-CN"
              ? "这一步已经不只是静态映射，而是会在当前 session / checkpoint 上生成新的 live child branch。"
              : "This step no longer just remaps to a static demo branch. It now generates a new live child branch from the current session checkpoint."
          }
        />
        <PresetPerturbationComposer
          locale={locale}
          worldId={data.graph.world_id ?? "fog-harbor-east-gate"}
          baselineScenarioId={data.baselineRun.scenario.scenario_id}
          initialSessionId={resolvedSearchParams?.session}
          initialFromNodeId={selectedRuntimeNode?.node_id}
          initialFromNodeLabel={selectedRuntimeNode?.label}
          baselineTitle={baselineTitle}
          options={composerOptions}
          initialBranchId={initialBranchId}
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
        />
      </section>
    </main>
  );
}
