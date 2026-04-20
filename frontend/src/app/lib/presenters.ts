import type { ComparisonOverview, CompareOutcomeDelta } from "./workbench-data";
import type { AppLocale } from "./locale-shared";

function formatTurnLabel(locale: AppLocale, turn: number | null | undefined) {
  if (typeof turn !== "number") {
    return locale === "zh-CN" ? "未触发" : "Not reached";
  }
  return `T${turn}`;
}

export function formatDeltaLabel(locale: AppLocale, delta: number | null) {
  if (delta === null) {
    return locale === "zh-CN" ? "n/a" : "n/a";
  }
  if (delta === 0) {
    return locale === "zh-CN" ? "0 回合" : "0 turns";
  }
  const prefix = delta > 0 ? "+" : "-";
  return locale === "zh-CN"
    ? `${prefix}${Math.abs(delta)} 回合`
    : `${prefix}${Math.abs(delta)} turn${Math.abs(delta) === 1 ? "" : "s"}`;
}

function summarizeTurnOutcome(
  locale: AppLocale,
  label: string,
  outcome: CompareOutcomeDelta | undefined
) {
  if (!outcome) {
    return locale === "zh-CN"
      ? `${label} 未在 compare 产物中记录。`
      : `${label} is not recorded in the compare artifact.`;
  }

  const referenceTurn = typeof outcome.reference === "number" ? outcome.reference : undefined;
  const candidateTurn = typeof outcome.candidate === "number" ? outcome.candidate : undefined;

  if (referenceTurn === undefined && candidateTurn === undefined) {
    return locale === "zh-CN"
      ? `${label} 在两个分支中都没有发生。`
      : `${label} is not reached in either branch.`;
  }

  if (referenceTurn !== undefined && candidateTurn === undefined) {
    return locale === "zh-CN"
      ? `${label} 在这个分支中没有发生。`
      : `${label} never lands in this branch.`;
  }

  if (referenceTurn === undefined && candidateTurn !== undefined) {
    return locale === "zh-CN"
      ? `${label} 只在这个分支里于 ${formatTurnLabel(locale, candidateTurn)} 出现。`
      : `${label} appears only in this branch at ${formatTurnLabel(locale, candidateTurn)}.`;
  }

  const resolvedReferenceTurn = referenceTurn as number;
  const resolvedCandidateTurn = candidateTurn as number;
  const delta =
    typeof outcome.delta === "number" ? outcome.delta : resolvedCandidateTurn - resolvedReferenceTurn;

  if (delta > 0) {
    return locale === "zh-CN"
      ? `${label} 延后 ${delta} 回合，到 ${formatTurnLabel(locale, resolvedCandidateTurn)}。`
      : `${label} slips by ${delta} turn${delta === 1 ? "" : "s"} to ${formatTurnLabel(locale, resolvedCandidateTurn)}.`;
  }

  if (delta < 0) {
    return locale === "zh-CN"
      ? `${label} 提前 ${Math.abs(delta)} 回合，到 ${formatTurnLabel(locale, resolvedCandidateTurn)}。`
      : `${label} lands ${Math.abs(delta)} turn${Math.abs(delta) === 1 ? "" : "s"} earlier at ${formatTurnLabel(locale, resolvedCandidateTurn)}.`;
  }

  return locale === "zh-CN"
    ? `${label} 与 baseline 保持同一时间点 ${formatTurnLabel(locale, resolvedCandidateTurn)}。`
    : `${label} stays on the baseline timing at ${formatTurnLabel(locale, resolvedCandidateTurn)}.`;
}

export function summarizeRiskShift(locale: AppLocale, outcome: CompareOutcomeDelta | undefined) {
  if (!outcome) {
    return locale === "zh-CN"
      ? "compare 产物没有记录这条分支的风险扩散变化。"
      : "The compare artifact does not record any risk-awareness delta for this branch.";
  }

  const referenceActors = Array.isArray(outcome.reference)
    ? outcome.reference.filter((item): item is string => typeof item === "string")
    : [];
  const candidateActors = Array.isArray(outcome.candidate)
    ? outcome.candidate.filter((item): item is string => typeof item === "string")
    : [];

  const removed = referenceActors.filter((actorId) => !candidateActors.includes(actorId));
  const added = candidateActors.filter((actorId) => !referenceActors.includes(actorId));

  if (removed.length === 0 && added.length === 0) {
    return locale === "zh-CN"
      ? "风险认知到达的 actor 集合与 baseline 一致。"
      : "Risk awareness reaches the same actor set as baseline.";
  }

  if (removed.length > 0 && added.length === 0) {
    return locale === "zh-CN"
      ? `风险认知不再到达 ${removed.join(", ")}。`
      : `Risk awareness no longer reaches ${removed.join(", ")} in this branch.`;
  }

  if (added.length > 0 && removed.length === 0) {
    return locale === "zh-CN"
      ? `风险认知扩展到了 ${added.join(", ")}。`
      : `Risk awareness expands to ${added.join(", ")} in this branch.`;
  }

  return locale === "zh-CN"
    ? `风险认知路径发生改道：移除 ${removed.join(", ")}，新增 ${added.join(", ")}。`
    : `Risk awareness reroutes: removed ${removed.join(", ")}; added ${added.join(", ")}.`;
}

export function buildOverviewLines(locale: AppLocale, overview: ComparisonOverview) {
  return [
    summarizeTurnOutcome(locale, locale === "zh-CN" ? "预算曝光" : "Budget exposure", overview.delta.outcome_deltas.budget_exposed_turn),
    summarizeTurnOutcome(locale, locale === "zh-CN" ? "账本公开" : "Ledger publication", overview.delta.outcome_deltas.ledger_public_turn),
    summarizeTurnOutcome(locale, locale === "zh-CN" ? "疏散触发" : "Evacuation", overview.delta.outcome_deltas.evacuation_turn),
    summarizeRiskShift(locale, overview.delta.outcome_deltas.risk_known_by)
  ];
}

export function friendlyWorldName(locale: AppLocale, worldId: string | undefined) {
  if (worldId === "fog-harbor-east-gate") {
    return locale === "zh-CN" ? "雾港东闸危机" : "Fog Harbor East Gate";
  }
  return worldId ?? (locale === "zh-CN" ? "未知世界" : "Unknown world");
}

export function formatTurn(locale: AppLocale, turn: number | null | undefined) {
  return formatTurnLabel(locale, turn);
}
