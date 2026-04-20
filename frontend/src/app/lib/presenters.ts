import type {
  ComparisonOverview,
  CompareOutcomeDelta,
  RubricRow
} from "./workbench-data";
import type { AppLocale } from "./locale-shared";

type LocalizedRubricRow = {
  dimension: string;
  one: string;
  three: string;
  five: string;
};

const scenarioTitlesZh: Record<string, string> = {
  baseline: "东闸门基线响应",
  harbor_comms_failure: "港口通信故障导致预警转发延迟",
  mayor_signal_blocked: "潮汐预警期间市长信号受阻",
  reporter_detained: "记者发布前被拖延"
};

const scenarioDescriptionsZh: Record<string, string> = {
  baseline:
    "基线分支假设档案账本副本按时流转，除了语料中已经描述的危机之外，不再额外注入通信扰动。",
  harbor_comms_failure:
    "海水干扰使港口无线电在早期预警窗口离线，导致潮汐警报和维护账本副本的首次公开机会都被推迟。",
  mayor_signal_blocked:
    "陈宇在第一次预警尝试中无法联系赵科，因此副市长错过了直接的潮汐升级信号，即便账本仍按计划公开。",
  reporter_detained:
    "运送账本的记者被中途拦阻，因此维护记录副本进入公众决策链路的时间晚于基线。"
};

const evalNamesZh: Record<string, string> = {
  fog_harbor_phase44_matrix: "雾港场景矩阵评测"
};

const evalStatusesZh: Record<string, string> = {
  pass: "通过",
  fail: "失败",
  error: "错误",
  pending: "进行中",
  running: "运行中",
  blocked: "阻塞"
};

const evalMetricLabelsZh: Record<string, string> = {
  checks_total: "检查总数",
  checks_passed: "通过检查",
  scenario_count: "场景数",
  event_count: "事件数",
  baseline_evacuation_turn: "基线疏散回合",
  harbor_comms_failure_evacuation_turn: "通信故障分支疏散回合",
  mayor_signal_blocked_evacuation_turn: "信号受阻分支疏散回合",
  reporter_detained_evacuation_turn: "记者受阻分支疏散回合",
  baseline_ledger_public_turn: "基线账本公开回合",
  harbor_comms_failure_ledger_public_turn: "通信故障分支账本公开回合",
  mayor_signal_blocked_ledger_public_turn: "信号受阻分支账本公开回合",
  reporter_detained_ledger_public_turn: "记者受阻分支账本公开回合"
};

const graphStatLabelsZh: Record<string, string> = {
  entity_count: "实体数",
  relation_count: "关系数",
  event_count: "事件数",
  chunk_count: "文本块数"
};

const claimLabelsZh: Record<string, string> = {
  evidence_backed: "证据支撑"
};

const documentKindLabelsZh: Record<string, string> = {
  bulletin: "公告",
  dispatch_notes: "调度记录",
  inspection_report: "检查报告",
  ledger_copy: "账本副本",
  minutes: "会议纪要",
  vessel_log: "船只日志"
};

const actionTypeLabelsZh: Record<string, string> = {
  delay: "延迟",
  evacuate: "疏散",
  hide: "隐藏",
  inform: "通报",
  inspect: "检查",
  move: "转移",
  publish: "公开",
  request: "请求"
};

const rubricDimensionLabelsZh: Record<string, string> = {
  Usefulness: "有用性",
  Credibility: "可信度",
  Explainability: "可解释性",
  Actionability: "可行动性"
};

const rubricAnchorLabelsZh: Record<string, string> = {
  "Adds no new understanding": "没有带来新的理解",
  "Some useful contrast": "提供了一些有用对比",
  "Clearly clarifies branch differences": "能够清楚说明分支差异",
  "Reads like guesswork": "读起来像猜测",
  "Partly grounded": "部分有依据",
  "Evidence boundaries are clear": "证据边界清晰",
  "Hard to trace": "难以追踪复盘",
  "Mostly understandable": "大体可以理解",
  "Easy to replay from trace": "可以轻松从轨迹重放",
  "No next step is obvious": "看不出下一步",
  "Some follow-up hints": "给出了一些后续提示",
  "Clear next engineering/product step": "明确指向下一步工程或产品动作"
};

function normalizeScenarioKey(scenarioId: string | undefined) {
  if (!scenarioId) {
    return "";
  }
  return scenarioId.startsWith("scenario_") ? scenarioId.slice("scenario_".length) : scenarioId;
}

function formatTurnLabel(locale: AppLocale, turn: number | null | undefined) {
  if (typeof turn !== "number") {
    return locale === "zh-CN" ? "未触达" : "Not reached";
  }
  return `T${turn}`;
}

function formatCountSuffix(locale: AppLocale, value: number, singular: string, plural: string) {
  if (locale === "zh-CN") {
    return `${value} 回合`;
  }
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatItemCount(locale: AppLocale, value: number, singular: string, plural: string, zhUnit: string) {
  if (locale === "zh-CN") {
    return `${value} ${zhUnit}`;
  }
  return `${value} ${value === 1 ? singular : plural}`;
}

function localizeForZh(
  locale: AppLocale,
  mappings: Record<string, string>,
  key: string | undefined,
  fallback: string
) {
  if (locale !== "zh-CN" || !key) {
    return fallback;
  }
  return mappings[key] ?? fallback;
}

function summarizeTurnOutcome(
  locale: AppLocale,
  label: string,
  outcome: CompareOutcomeDelta | undefined
) {
  if (!outcome) {
    return locale === "zh-CN"
      ? `${label} 未在对比产物中记录。`
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
    ? `${label} 与基线保持同一时间点 ${formatTurnLabel(locale, resolvedCandidateTurn)}。`
    : `${label} stays on the baseline timing at ${formatTurnLabel(locale, resolvedCandidateTurn)}.`;
}

export function formatDeltaLabel(locale: AppLocale, delta: number | null) {
  if (delta === null) {
    return "n/a";
  }
  if (delta === 0) {
    return locale === "zh-CN" ? "0 回合" : "0 turns";
  }
  const prefix = delta > 0 ? "+" : "-";
  return locale === "zh-CN"
    ? `${prefix}${Math.abs(delta)} 回合`
    : `${prefix}${Math.abs(delta)} turn${Math.abs(delta) === 1 ? "" : "s"}`;
}

export function summarizeRiskShift(locale: AppLocale, outcome: CompareOutcomeDelta | undefined) {
  if (!outcome) {
    return locale === "zh-CN"
      ? "对比产物没有记录这条分支的风险认知变化。"
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
      ? "风险认知到达的角色集合与基线一致。"
      : "Risk awareness reaches the same actor set as baseline.";
  }

  if (removed.length > 0 && added.length === 0) {
    return locale === "zh-CN"
      ? `风险认知不再到达 ${removed.join("、")}。`
      : `Risk awareness no longer reaches ${removed.join(", ")} in this branch.`;
  }

  if (added.length > 0 && removed.length === 0) {
    return locale === "zh-CN"
      ? `风险认知扩展到了 ${added.join("、")}。`
      : `Risk awareness expands to ${added.join(", ")} in this branch.`;
  }

  return locale === "zh-CN"
    ? `风险认知路径发生改道：移除 ${removed.join("、")}，新增 ${added.join("、")}。`
    : `Risk awareness reroutes: removed ${removed.join(", ")}; added ${added.join(", ")}.`;
}

export function buildOverviewLines(locale: AppLocale, overview: ComparisonOverview) {
  return [
    summarizeTurnOutcome(
      locale,
      locale === "zh-CN" ? "预算曝光" : "Budget exposure",
      overview.delta.outcome_deltas.budget_exposed_turn
    ),
    summarizeTurnOutcome(
      locale,
      locale === "zh-CN" ? "账本公开" : "Ledger publication",
      overview.delta.outcome_deltas.ledger_public_turn
    ),
    summarizeTurnOutcome(
      locale,
      locale === "zh-CN" ? "疏散触发" : "Evacuation",
      overview.delta.outcome_deltas.evacuation_turn
    ),
    summarizeRiskShift(locale, overview.delta.outcome_deltas.risk_known_by)
  ];
}

export function friendlyWorldName(locale: AppLocale, worldId: string | undefined) {
  if (worldId === "fog-harbor-east-gate") {
    return locale === "zh-CN" ? "雾港东闸门危机" : "Fog Harbor East Gate";
  }
  return worldId ?? (locale === "zh-CN" ? "未知世界" : "Unknown world");
}

export function formatTurn(locale: AppLocale, turn: number | null | undefined) {
  return formatTurnLabel(locale, turn);
}

export function localizeScenarioTitle(locale: AppLocale, scenarioId: string | undefined, fallback: string) {
  return localizeForZh(locale, scenarioTitlesZh, normalizeScenarioKey(scenarioId), fallback);
}

export function localizeScenarioDescription(
  locale: AppLocale,
  scenarioId: string | undefined,
  fallback: string
) {
  return localizeForZh(locale, scenarioDescriptionsZh, normalizeScenarioKey(scenarioId), fallback);
}

export function localizeBranchLabel(locale: AppLocale, scenarioId: string | undefined, fallback: string) {
  const normalizedScenarioId = normalizeScenarioKey(scenarioId);
  if (locale !== "zh-CN") {
    return fallback;
  }
  if (normalizedScenarioId === "baseline") {
    return "基线分支";
  }
  return scenarioTitlesZh[normalizedScenarioId] ?? fallback;
}

export function localizeEvalName(locale: AppLocale, evalName: string) {
  return localizeForZh(locale, evalNamesZh, evalName, evalName);
}

export function localizeEvalStatus(locale: AppLocale, status: string) {
  return localizeForZh(locale, evalStatusesZh, status, status);
}

export function localizeEvalMetricKey(locale: AppLocale, key: string) {
  return localizeForZh(locale, evalMetricLabelsZh, key, key);
}

export function localizeGraphStatKey(locale: AppLocale, key: string) {
  return localizeForZh(locale, graphStatLabelsZh, key, key);
}

export function localizeClaimLabel(locale: AppLocale, label: string) {
  return localizeForZh(locale, claimLabelsZh, label, label);
}

export function localizeDocumentKind(locale: AppLocale, kind: string) {
  return localizeForZh(locale, documentKindLabelsZh, kind, kind);
}

export function localizeActionType(locale: AppLocale, actionType: string) {
  return localizeForZh(locale, actionTypeLabelsZh, actionType, actionType);
}

export function localizeRubricRow(locale: AppLocale, row: RubricRow): LocalizedRubricRow {
  if (locale !== "zh-CN") {
    return row;
  }

  return {
    dimension: rubricDimensionLabelsZh[row.dimension] ?? row.dimension,
    one: rubricAnchorLabelsZh[row.one] ?? row.one,
    three: rubricAnchorLabelsZh[row.three] ?? row.three,
    five: rubricAnchorLabelsZh[row.five] ?? row.five
  };
}

export function formatEvalPosture(locale: AppLocale, evalName: string, evalStatus: string) {
  return `${localizeEvalName(locale, evalName)}: ${localizeEvalStatus(locale, evalStatus)}`;
}

export function formatScenarioMeta(locale: AppLocale, key: "branch_count" | "turn_budget", value: number) {
  if (locale !== "zh-CN") {
    return `${key}=${value}`;
  }

  if (key === "branch_count") {
    return `分支数=${value}`;
  }

  return `回合预算=${value}`;
}

export function formatDivergentTurnCount(locale: AppLocale, value: number) {
  return locale === "zh-CN"
    ? `${value} 个分歧回合`
    : formatCountSuffix(locale, value, "divergent turn", "divergent turns");
}

export function formatEvidenceCount(locale: AppLocale, value: number) {
  return formatItemCount(locale, value, "evidence item", "evidence items", "份证据");
}

export function formatDocumentCount(locale: AppLocale, value: number) {
  return formatItemCount(locale, value, "source document", "source documents", "份来源文档");
}

export function formatRelatedTurnCount(locale: AppLocale, value: number) {
  return formatItemCount(locale, value, "related turn", "related turns", "个关联回合");
}

export function formatParagraphCount(locale: AppLocale, value: number) {
  return formatItemCount(locale, value, "report section", "report sections", "段报告内容");
}

export function formatClaimCount(locale: AppLocale, value: number) {
  return formatItemCount(locale, value, "claim", "claims", "条论点");
}
