import { ContextCard } from "./context-card";
import type { AppLocale } from "../lib/locale-shared";
import type { RuntimeDecisionSummary } from "../lib/runtime-session-data";

type DecisionProvider = "openai_compatible" | "hosted_openai" | "deterministic_only";

type RuntimeDecisionContextCardProps = {
  locale: AppLocale;
  summary: RuntimeDecisionSummary | null;
  configuredProvider?: DecisionProvider | null;
  configuredModel?: string | null;
};

function providerLabel(
  locale: AppLocale,
  provider?: DecisionProvider | null
) {
  if (provider === "deterministic_only") {
    return locale === "zh-CN" ? "仅规则模式" : "Deterministic only";
  }
  if (provider === "hosted_openai") {
    return "Hosted GPT";
  }
  if (provider === "openai_compatible") {
    return locale === "zh-CN" ? "OpenAI 兼容" : "OpenAI-compatible";
  }
  return locale === "zh-CN" ? "等待生成" : "Waiting";
}

function providerModeLabel(locale: AppLocale, mode: string) {
  if (locale !== "zh-CN") {
    return mode;
  }

  switch (mode) {
    case "hosted_openai":
      return "Hosted GPT";
    case "openai_compatible":
      return "模型选择";
    case "deterministic_fallback":
      return "规则回退";
    case "replay_cache":
      return "缓存重放";
    default:
      return mode;
  }
}

function formatSummary(
  locale: AppLocale,
  summary: RuntimeDecisionSummary | null,
  configuredProvider?: DecisionProvider | null,
  configuredModel?: string | null
) {
  if (!summary) {
    return {
      value:
        configuredModel ||
        providerLabel(locale, configuredProvider) ||
        (locale === "zh-CN" ? "尚未生成" : "Not generated yet"),
      detail:
        locale === "zh-CN"
          ? configuredModel
            ? "当前会话已经配置了决策模型。生成分支之后，这里会显示实际调用和回退情况。"
            : "当前节点还没有生成决策记录。生成分支之后，这里会显示实际模型和回退情况。"
          : configuredModel
            ? "This session already has a configured decision model. After live generation, this card will show the actual calls and fallback behavior."
            : "This node does not have a decision trace yet. After live generation, this card will show the actual model and fallback behavior.",
    };
  }

  const value =
    summary.modelId ||
    (configuredProvider === "deterministic_only"
      ? locale === "zh-CN"
        ? "仅回退模式"
        : "Fallback only"
      : locale === "zh-CN"
        ? "未记录模型"
        : "Model not recorded");
  const detail =
    locale === "zh-CN"
      ? `${summary.decisionCount} 次决策 / ${summary.fallbackCount} 次回退 / ${summary.replayCount} 次缓存重放`
      : `${summary.decisionCount} decisions / ${summary.fallbackCount} fallbacks / ${summary.replayCount} replays`;

  return { value, detail };
}

export function RuntimeDecisionContextCard({
  locale,
  summary,
  configuredProvider,
  configuredModel,
}: RuntimeDecisionContextCardProps) {
  const formatted = formatSummary(locale, summary, configuredProvider, configuredModel);
  const modeSummary =
    summary && summary.providerModes.length > 0
      ? summary.providerModes.map((mode) => providerModeLabel(locale, mode)).join("、")
      : configuredProvider
        ? providerLabel(locale, configuredProvider)
        : locale === "zh-CN"
          ? "等待生成"
          : "Waiting";
  const promptSummary = summary?.promptVersion
    ? locale === "zh-CN"
      ? `提示模板 ${summary.promptVersion} / 模式: ${modeSummary}`
      : `prompt ${summary.promptVersion} / modes: ${modeSummary}`
    : modeSummary;

  return (
    <ContextCard
      label={locale === "zh-CN" ? "决策模型" : "Decision model"}
      value={formatted.value}
      summary={formatted.detail.length > 0 ? `${formatted.detail} / ${promptSummary}` : promptSummary}
    />
  );
}
