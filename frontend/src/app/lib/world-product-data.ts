import { readFile } from "node:fs/promises";

import type { AppLocale } from "./locale-shared";
import { findLatestRuntimeSessionForWorld, loadRuntimeSessionWorkspaceForWorld } from "./runtime-session-data";
import { resolveProductWorldPaths, listProductWorldIds } from "./world-paths";

type LocalizedText = Partial<Record<AppLocale, string>>;

export type ProductPerturbationOption = {
  key: string;
  title: string;
  title_i18n?: LocalizedText;
  description: string;
  description_i18n?: LocalizedText;
  kind: string;
  kind_i18n?: LocalizedText;
  target: string;
  target_i18n?: LocalizedText;
  timing: string;
  timing_i18n?: LocalizedText;
  summary: string;
  summary_i18n?: LocalizedText;
  runtime: {
    kind: string;
    targetId: string;
    actorId: string;
    timing: string;
    parameters: Record<string, string | number>;
  };
};

export type ProductWorldConfig = {
  world_id: string;
  world_name: string;
  world_name_i18n?: LocalizedText;
  world_summary: string;
  world_summary_i18n?: LocalizedText;
  baseline_scenario_id: string;
  baseline_title: string;
  baseline_title_i18n?: LocalizedText;
  baseline_description: string;
  baseline_description_i18n?: LocalizedText;
  decision_defaults?: {
    provider?: "openai_compatible" | "hosted_openai" | "deterministic_only";
    model?: string;
  };
  outcome_labels?: Record<string, string>;
  outcome_labels_i18n?: Partial<Record<AppLocale, Record<string, string>>>;
  perturbation_options: ProductPerturbationOption[];
};

export type ProductWorldSummary = {
  worldId: string;
  worldName: string;
  worldSummary: string;
  baselineTitle: string;
  baselineDescription: string;
  href: string;
  perturbHref: string;
  latestSession?: {
    sessionId: string;
    nodeId: string;
    nodeLabel: string;
    perturbHref: string;
    runtimeHref: string;
    reviewHref: string;
    createdAt: string;
  } | null;
};

type RuntimeNodeLike = {
  label: string;
  parent_node_id?: string | null;
  perturbation?: {
    kind: string;
    target_id: string;
    timing: string;
    summary: string;
  } | null;
};

export type LocalizedRuntimePerturbation = {
  kind: string;
  target: string;
  timing: string;
  summary: string;
};

async function readJson<T>(absolutePath: string) {
  return JSON.parse(await readFile(absolutePath, "utf-8")) as T;
}

function localizeText(locale: AppLocale, fallback: string, localized?: LocalizedText) {
  return localized?.[locale] ?? fallback;
}

function localizePerturbationOption(
  option: ProductPerturbationOption,
  locale: AppLocale
): ProductPerturbationOption {
  return {
    ...option,
    title: localizeText(locale, option.title, option.title_i18n),
    description: localizeText(locale, option.description, option.description_i18n),
    kind: localizeText(locale, option.kind, option.kind_i18n),
    target: localizeText(locale, option.target, option.target_i18n),
    timing: localizeText(locale, option.timing, option.timing_i18n),
    summary: localizeText(locale, option.summary, option.summary_i18n),
  };
}

function matchesPerturbationOption(
  option: ProductPerturbationOption,
  perturbation: NonNullable<RuntimeNodeLike["perturbation"]>
) {
  return (
    option.runtime.kind === perturbation.kind &&
    option.runtime.targetId === perturbation.target_id &&
    option.runtime.timing === perturbation.timing
  );
}

function matchedPerturbationOption(
  product: ProductWorldConfig,
  perturbation: NonNullable<RuntimeNodeLike["perturbation"]>
) {
  return product.perturbation_options.find((option) =>
    matchesPerturbationOption(option, perturbation)
  );
}

function localizeProductWorldConfig(
  product: ProductWorldConfig,
  locale: AppLocale
): ProductWorldConfig {
  return {
    ...product,
    world_name: localizeText(locale, product.world_name, product.world_name_i18n),
    world_summary: localizeText(locale, product.world_summary, product.world_summary_i18n),
    baseline_title: localizeText(locale, product.baseline_title, product.baseline_title_i18n),
    baseline_description: localizeText(
      locale,
      product.baseline_description,
      product.baseline_description_i18n
    ),
    outcome_labels:
      product.outcome_labels_i18n?.[locale] ??
      product.outcome_labels ??
      {},
    perturbation_options: product.perturbation_options.map((option) =>
      localizePerturbationOption(option, locale)
    ),
  };
}

export async function loadProductWorldConfig(worldId: string, locale: AppLocale = "en") {
  const paths = resolveProductWorldPaths(worldId);
  const product = localizeProductWorldConfig(
    await readJson<ProductWorldConfig>(paths.productPath),
    locale
  );
  return {
    product,
    paths,
  };
}

export function localizeRuntimeNodeLabel(
  product: ProductWorldConfig,
  node: RuntimeNodeLike,
  locale: AppLocale
) {
  if (node.parent_node_id === null) {
    return product.baseline_title;
  }

  if (node.perturbation) {
    const matched = matchedPerturbationOption(product, node.perturbation);
    if (matched) {
      return matched.summary;
    }
    return node.perturbation.summary;
  }

  return locale === "zh-CN" && node.label === "Baseline checkpoint"
    ? "基线检查点"
    : node.label;
}

export function localizeOutcomeLabel(
  product: ProductWorldConfig,
  outcomeKey: string
) {
  return product.outcome_labels?.[outcomeKey] ?? outcomeKey;
}

export function localizeRuntimePerturbation(
  product: ProductWorldConfig,
  node: RuntimeNodeLike
): LocalizedRuntimePerturbation | null {
  if (!node.perturbation) {
    return null;
  }

  const matched = matchedPerturbationOption(product, node.perturbation);
  if (matched) {
    return {
      kind: matched.kind,
      target: matched.target,
      timing: matched.timing,
      summary: matched.summary,
    };
  }

  return {
    kind: node.perturbation.kind,
    target: node.perturbation.target_id,
    timing: node.perturbation.timing,
    summary: node.perturbation.summary,
  };
}

export async function listProductWorlds(locale: AppLocale = "en"): Promise<ProductWorldSummary[]> {
  const worldIds = await listProductWorldIds();
  const summaries = await Promise.all(
    worldIds.map(async (worldId) => {
      const { product } = await loadProductWorldConfig(worldId, locale);
      const latestSession = await findLatestRuntimeSessionForWorld(worldId);
      const latestWorkspace = latestSession
        ? await loadRuntimeSessionWorkspaceForWorld(
            worldId,
            latestSession.sessionId,
            latestSession.activeNodeId
          )
        : null;
      return {
        worldId,
        worldName: product.world_name,
        worldSummary: product.world_summary,
        baselineTitle: product.baseline_title,
        baselineDescription: product.baseline_description,
        href: `/worlds/${worldId}`,
        perturbHref: `/worlds/${worldId}/perturb`,
        latestSession: latestSession && latestWorkspace
          ? {
              sessionId: latestSession.sessionId,
              nodeId: latestWorkspace.selectedNode.node_id,
              nodeLabel: localizeRuntimeNodeLabel(
                product,
                latestWorkspace.selectedNode,
                locale
              ),
              perturbHref: `/worlds/${worldId}/perturb?session=${encodeURIComponent(latestSession.sessionId)}&node=${encodeURIComponent(latestWorkspace.selectedNode.node_id)}`,
              runtimeHref: `/worlds/${worldId}/runtime/${latestSession.sessionId}?node=${encodeURIComponent(latestWorkspace.selectedNode.node_id)}`,
              reviewHref: `/worlds/${worldId}/review?session=${encodeURIComponent(latestSession.sessionId)}&node=${encodeURIComponent(latestWorkspace.selectedNode.node_id)}`,
              createdAt: latestSession.createdAt,
            }
          : null,
      };
    })
  );
  return summaries.sort((left, right) => {
    const leftTime = left.latestSession ? new Date(left.latestSession.createdAt).getTime() : 0;
    const rightTime = right.latestSession ? new Date(right.latestSession.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}
