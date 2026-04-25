import type { AppLocale } from "./locale-shared";

type Copy = {
  brand: {
    eyebrow: string;
    worldLabel: string;
    compareArtifactLabel: string;
    sourceArtifactLabel: string;
    dashboardLabel: string;
    reviewLabel: string;
    legacyLabel: string;
  };
  dashboard: {
    productEyebrow: string;
    title: string;
    lede: string;
    orientationCards: Array<{
      title: string;
      summary: string;
    }>;
    supportNote: string;
    contextEyebrow: string;
    contextTitle: string;
    contextSummary: string;
    contextWorldSummary: string;
    contextPairSummary: string;
    contextArtifactSummary: string;
    contextPostureSummary: string;
    currentPair: string;
    loadedBranches: string;
    interventionCount: string;
    jumpToReview: string;
    jumpToReference: string;
    routeEyebrow: string;
    routeTitle: string;
    routeSummary: string;
    interventionEyebrow: string;
    interventionTitle: string;
    interventionSummary: string;
    storyboardEyebrow: string;
    storyboardTitle: string;
    claimEyebrow: string;
    claimTitle: string;
    evalEyebrow: string;
    evalTitle: string;
    scorecardNote: string;
    openReview: string;
    openTrace: string;
    openClaims: string;
    openReference: string;
  };
  routeSteps: Array<{
    step: string;
    title: string;
    summary: string;
  }>;
  metrics: {
    scenarioBranches: string;
    interventionBranches: string;
    delayedLedger: string;
    delayedEvacuation: string;
    routeOnly: string;
    knowledgeShift: string;
    budgetExposed: string;
    ledgerPublic: string;
    evacuation: string;
    divergentTurns: string;
    evidenceLinkedClaims: string;
    evalStatus: string;
  };
  review: {
    title: string;
    lede: string;
    backToDashboard: string;
    stripTitle: string;
    sectionNav: {
      scorecard: string;
      traceClaims: string;
      reference: string;
      advanced: string;
    };
    scorecardTitle: string;
    scorecardSummary: string;
    traceTitle: string;
    traceSummary: string;
    claimsTitle: string;
    claimsSummary: string;
    referenceTitle: string;
    referenceSummary: string;
    advancedTitle: string;
    advancedSummary: string;
    legacyOperationsTitle: string;
    legacyOperationsSummary: string;
    legacyOperationsDisclosure: string;
    rawReportTitle: string;
    rawReportSummary: string;
    documentTitle: string;
    graphTitle: string;
    scenariosTitle: string;
    openSourceArtifact: string;
    noDivergence: string;
    noTarget: string;
  };
  rubric: {
    title: string;
    helper: string;
    notesLabel: string;
    notesPlaceholder: string;
    dimensionsComplete: string;
    evidenceTracked: string;
    divergentTurns: string;
    evalPosture: string;
    recommendationLabel: string;
    recommendationReady: string;
    recommendationFollowup: string;
    recommendationHold: string;
    recommendationIncomplete: string;
    openLegacy: string;
    scoreLegend: string;
    averageLabel: string;
  };
  common: {
    referenceBranch: string;
    routeOnlyDelta: string;
    timingDrift: string;
    knowledgeShift: string;
    baseline: string;
    candidate: string;
    rawArtifact: string;
    jumpToReview: string;
    jumpToTrace: string;
    jumpToClaims: string;
    jumpToEvidence: string;
    jumpToEval: string;
  };
};

const englishCopy: Copy = {
  brand: {
    eyebrow: "Mirror Engine / Evidence-backed What-if Review",
    worldLabel: "Current world",
    compareArtifactLabel: "Compare artifact",
    sourceArtifactLabel: "Source artifact",
    dashboardLabel: "Home",
    reviewLabel: "Deep review",
    legacyLabel: "Legacy compatibility"
  },
  dashboard: {
    productEyebrow: "What Mirror does",
    title: "Explore a constrained world through replayable, evidence-backed what-if comparisons.",
    lede:
      "You are looking at the Fog Harbor demo workspace. This homepage explains the current world, the active compare artifact, and the fastest path into review before any heavier tooling gets in the way.",
    orientationCards: [
      {
        title: "What Mirror is",
        summary: "Mirror compares alternative branches in a bounded world and keeps the result traceable back to evidence and replayable turns."
      },
      {
        title: "What this page shows",
        summary: "Start here to understand the current world, the current branch pair, and whether anything important changed before opening deep review."
      },
      {
        title: "What to do next",
        summary: "Use the primary action to enter the guided review path, or open the reference surfaces first if you want to inspect evidence before scoring."
      }
    ],
    supportNote:
      "First visit? Read the current context cards below, then follow the recommended four-step path before opening any legacy tooling.",
    contextEyebrow: "Current session",
    contextTitle: "Know the world, the active compare, and the current posture before you dig deeper.",
    contextSummary:
      "These cards answer three first-visit questions quickly: which world is loaded, which comparison is currently in focus, and whether the current branch set looks healthy enough to keep reviewing.",
    contextWorldSummary:
      "All branch comparisons, claims, and evidence on this page are grounded in this bounded demo world.",
    contextPairSummary:
      "This is the branch pair currently surfaced for the homepage summary and the first deep-review pass.",
    contextArtifactSummary:
      "This durable compare artifact is the top-level comparison source of truth for the current homepage view.",
    contextPostureSummary:
      "Use the eval posture as the integrity check before you spend time in the deeper workspace.",
    currentPair: "Current report pair",
    loadedBranches: "canonical scenario branches",
    interventionCount: "intervention comparisons against baseline",
    jumpToReview: "Open deep review",
    jumpToReference: "View reference & evidence",
    routeEyebrow: "Recommended path",
    routeTitle: "If this is your first visit, use these four steps to understand the current run.",
    routeSummary:
      "The homepage should orient you before it overwhelms you. Move from comparison to trace, then to evidence and eval, and only then decide whether deep review is worth opening.",
    interventionEyebrow: "Intervention board",
    interventionTitle: "Each intervention gets a strong summary card: impact first, drill-down second.",
    interventionSummary:
      "The cards below emphasize outcome shifts, route-only drift, and where to jump next instead of repeating full artifact payloads.",
    storyboardEyebrow: "Trace storyboard",
    storyboardTitle: "Preview only the turns that actually diverge.",
    claimEyebrow: "Claims and eval",
    claimTitle: "Keep the evidence-linked claims and integrity posture readable at a glance.",
    evalEyebrow: "Integrity snapshot",
    evalTitle: "Stop at the decision point on the homepage, then open deeper analysis only when the branch story is clear.",
    scorecardNote:
      "The heavy scorecard, routing logic, and old packet surfaces still exist, but they are secondary. The homepage now focuses on orientation first and advanced tooling second.",
    openReview: "Enter the guided review path",
    openTrace: "Open trace",
    openClaims: "Open claims",
    openReference: "Open reference"
  },
  routeSteps: [
    {
      step: "01",
      title: "Scan intervention impact",
      summary: "See which branch changes the outcome and which only changes the route."
    },
    {
      step: "02",
      title: "Replay divergent turns",
      summary: "Open the short storyboard before reading the full branch timeline."
    },
    {
      step: "03",
      title: "Check claims and evidence",
      summary: "Confirm which claims are grounded and which turns or chunks they depend on."
    },
    {
      step: "04",
      title: "Confirm eval posture",
      summary: "Use eval as the integrity gate before moving into deeper review."
    }
  ],
  metrics: {
    scenarioBranches: "Scenario branches",
    interventionBranches: "Intervention branches",
    delayedLedger: "Delayed ledger branches",
    delayedEvacuation: "Delayed evacuation branches",
    routeOnly: "Route-only branches",
    knowledgeShift: "Knowledge-shift branches",
    budgetExposed: "Budget exposed",
    ledgerPublic: "Ledger public",
    evacuation: "Evacuation",
    divergentTurns: "Divergent turns",
    evidenceLinkedClaims: "Evidence-linked claims",
    evalStatus: "Eval posture"
  },
  review: {
    title: "Deep review is where you score the branch, replay the divergent turns, and inspect the evidence before touching any legacy tools.",
    lede:
      "Use this page as the analysis-first workspace. Start with the scorecard, then move through trace, claims, and reference. Open the legacy compatibility tools only when the main review path is not enough.",
    backToDashboard: "Back to dashboard",
    stripTitle: "Analysis-first review",
    sectionNav: {
      scorecard: "Scorecard",
      traceClaims: "Trace & Claims",
      reference: "Reference",
      advanced: "Legacy Tools"
    },
    scorecardTitle: "Score the branch before you get lost in tooling.",
    scorecardSummary:
      "The review scorecard is now the primary deep-review surface. It summarizes confidence, weak dimensions, and whether the current branch is ready for deeper escalation or still needs evidence cleanup.",
    traceTitle: "Trace and claims",
    traceSummary:
      "Use these sections to connect divergent turns to the evidence-linked claims without reopening the entire raw branch history.",
    claimsTitle: "Claim drill-down",
    claimsSummary:
      "Claims stay evidence-linked and traceable. Each card shows the supporting chunks and the related turn chain.",
    referenceTitle: "Reference surfaces",
    referenceSummary:
      "These panels keep scenarios, graph context, documents, and the raw report reachable without letting them dominate the first read.",
    advancedTitle: "Legacy compatibility tools",
    advancedSummary:
      "Historical packet, delivery, and operational surfaces remain available for compatibility, but they are no longer the default path through review.",
    legacyOperationsTitle: "Legacy advanced workspace",
    legacyOperationsSummary:
      "Open this only when the scorecard, trace, claims, and reference path is not enough. It stays available for compatibility, not as the primary experience.",
    legacyOperationsDisclosure: "Open legacy tools",
    rawReportTitle: "Raw report artifact",
    rawReportSummary:
      "This panel shows the original artifact content. The UI around it is bilingual, but the artifact body itself stays source-authentic.",
    documentTitle: "Source documents",
    graphTitle: "Graph snapshot",
    scenariosTitle: "Scenario cards",
    openSourceArtifact: "Open source artifact",
    noDivergence: "No divergent turns are recorded for this branch.",
    noTarget: "No explicit target"
  },
  rubric: {
    title: "Review scorecard",
    helper:
      "Score the current branch across usefulness, credibility, explainability, and actionability before expanding heavier operations.",
    notesLabel: "Reviewer notes",
    notesPlaceholder: "Capture what still feels weak, what looks credible, and what should happen next.",
    dimensionsComplete: "Dimensions scored",
    evidenceTracked: "Evidence-linked claims",
    divergentTurns: "Divergent turns",
    evalPosture: "Eval posture",
    recommendationLabel: "Recommendation",
    recommendationReady:
      "This branch reads as strong enough to continue with deeper review or controlled sign-off.",
    recommendationFollowup:
      "This branch is usable, but at least one dimension still needs focused follow-up before a strong handoff.",
    recommendationHold:
      "Hold the branch here and revise the weakest dimensions before escalating further.",
    recommendationIncomplete: "Complete the scorecard before making a review recommendation.",
    openLegacy: "Open legacy compatibility tools",
    scoreLegend: "Low confidence -> high confidence",
    averageLabel: "Average"
  },
  common: {
    referenceBranch: "Reference branch",
    routeOnlyDelta: "Route-only delta",
    timingDrift: "Timing drift",
    knowledgeShift: "Knowledge shift",
    baseline: "Baseline",
    candidate: "Candidate",
    rawArtifact: "Raw artifact",
    jumpToReview: "Jump to review",
    jumpToTrace: "Trace",
    jumpToClaims: "Claims",
    jumpToEvidence: "Evidence",
    jumpToEval: "Eval"
  }
};

const chineseCopy: Copy = {
  brand: {
    eyebrow: "Mirror Engine / 带证据的 What-if 推演审阅",
    worldLabel: "当前世界",
    compareArtifactLabel: "对比产物",
    sourceArtifactLabel: "原始产物",
    dashboardLabel: "首页",
    reviewLabel: "深度审阅",
    legacyLabel: "历史兼容工具"
  },
  dashboard: {
    productEyebrow: "Mirror 是什么",
    title: "在受限世界中做可回放、带证据的 what-if 推演与比较。",
    lede:
      "你现在看到的是雾港演示世界的首页。这里会先说明当前世界、当前对比产物，以及最快进入主审阅路径的方式，而不是一上来就把整套重型工具摊开。",
    orientationCards: [
      {
        title: "这个项目做什么",
        summary: "Mirror 用受限世界里的多条分支对比来回答 what-if 问题，并把结论绑定到证据链和可回放的回合轨迹上。"
      },
      {
        title: "这个页面给你什么",
        summary: "先在首页弄清楚当前世界、当前对比和主要差异，再决定是否需要进入更深的分析工作区。"
      },
      {
        title: "下一步怎么走",
        summary: "如果你想按引导完成判断，就进入主审阅路径；如果你想先核对证据和原始材料，就先打开参考与证据。"
      }
    ],
    supportNote:
      "第一次登录时，建议先看下面的当前上下文卡片，再按推荐的四步路径往下读，不要直接跳进历史兼容工具。",
    contextEyebrow: "当前上下文",
    contextTitle: "先知道你正在看哪个世界、哪组对比，以及当前状态是否值得继续深挖。",
    contextSummary:
      "这些卡片先回答首次访问最关键的三个问题：当前加载的是哪个受限世界、首页聚焦的是哪组分支对比、这组结果当前看起来是否足够健康和可信。",
    contextWorldSummary:
      "这个首页上的分支、论点和证据都围绕这个受限演示世界组织，不是开放世界搜索结果。",
    contextPairSummary:
      "这是首页当前聚焦的分支对，用来支撑首轮摘要阅读和后续的深度审阅入口。",
    contextArtifactSummary:
      "这个 durable compare artifact 是当前首页所有对比信息的顶层来源，不是临时拼出来的页面状态。",
    contextPostureSummary:
      "把评测状态看成完整性检查，通过之后再决定是否值得进入更深的分析。",
    currentPair: "当前报告对比",
    loadedBranches: "标准场景分支",
    interventionCount: "相对基线的干预对比",
    jumpToReview: "进入深度审阅",
    jumpToReference: "查看参考与证据",
    routeEyebrow: "推荐路径",
    routeTitle: "如果你是第一次来，先按这四步理解当前这次推演。",
    routeSummary:
      "首页应该先帮助你完成定向，而不是先把你淹没在信息里。先看对比、再看轨迹，再核对证据与评测，最后再决定是否进入深度审阅。",
    interventionEyebrow: "干预摘要板",
    interventionTitle: "每条干预都先给出强摘要卡，再给出深入查看入口。",
    interventionSummary:
      "下面的卡片优先强调结果变化、纯路径漂移，以及下一步查看入口，而不是重复整块原始产物内容。",
    storyboardEyebrow: "轨迹分镜",
    storyboardTitle: "只预览真正发生分歧的回合。",
    claimEyebrow: "论点与评测",
    claimTitle: "让证据关联的论点与完整性状态可以一眼扫读。",
    evalEyebrow: "完整性快照",
    evalTitle: "首页只做到“是否值得继续”的判断点，等分支故事读清楚后，再进入更深的分析。",
    scorecardNote:
      "完整的评分卡、路由逻辑和旧数据包操作面依然保留，但它们已经退到次级位置。首页现在优先解决理解问题，而不是先展示重工具。",
    openReview: "进入主审阅路径",
    openTrace: "查看轨迹",
    openClaims: "查看论点",
    openReference: "查看参考"
  },
  routeSteps: [
    {
      step: "01",
      title: "扫描干预影响",
      summary: "先看哪条分支真正改变了结果，哪条只是改变了路线。"
    },
    {
      step: "02",
      title: "回放分歧回合",
      summary: "先看短分镜，再决定是否需要打开完整分支时间线。"
    },
    {
      step: "03",
      title: "核对论点与证据",
      summary: "确认哪些论点是被证据支撑的，以及它们依赖哪些回合或文本块。"
    },
    {
      step: "04",
      title: "确认评测状态",
      summary: "把评测当作完整性门槛，再决定是否继续更深的审阅。"
    }
  ],
  metrics: {
    scenarioBranches: "场景分支数",
    interventionBranches: "干预分支数",
    delayedLedger: "账本延后分支",
    delayedEvacuation: "疏散延后分支",
    routeOnly: "纯路径变化分支",
    knowledgeShift: "知识扩散变化分支",
    budgetExposed: "预算曝光",
    ledgerPublic: "账本公开",
    evacuation: "疏散触发",
    divergentTurns: "分歧回合",
    evidenceLinkedClaims: "证据关联论点",
    evalStatus: "评测状态"
  },
  review: {
    title: "深度审阅先让你给分支打分、回放分歧回合、核对证据，再决定是否需要打开历史工具。",
    lede:
      "这里是 analysis-first 的工作区。先完成评分卡，再进入轨迹、论点和参考；只有当主路径不足以支撑你的判断时，才打开历史兼容工具。",
    backToDashboard: "返回总览台",
    stripTitle: "分析优先审阅",
    sectionNav: {
      scorecard: "评分卡",
      traceClaims: "轨迹与论点",
      reference: "参考面板",
      advanced: "兼容工具"
    },
    scorecardTitle: "先给当前分支打分，再决定是否值得掉进重型工具。",
    scorecardSummary:
      "评分卡现在是深度审阅的主入口。它先总结可信度、薄弱维度，以及当前分支是否值得继续升级审阅，还是先补证据。",
    traceTitle: "轨迹与论点",
    traceSummary:
      "用这里把分歧回合与证据关联论点连起来，而不是一上来就重新打开整条原始分支历史。",
    claimsTitle: "论点下钻",
    claimsSummary:
      "论点继续保持证据关联和可追踪。每张卡片都展示支撑它的文本块和相关回合。",
    referenceTitle: "参考面板",
    referenceSummary:
      "这些面板让场景、图谱、文档和原始报告都可触达，但不再主导首读体验。",
    advancedTitle: "历史兼容工具",
    advancedSummary:
      "历史上的数据包、交付和重型操作面继续保留用于兼容，但它们已经不再是默认的审阅主路径。",
    legacyOperationsTitle: "历史高级工作区",
    legacyOperationsSummary:
      "只有当评分卡、轨迹、论点和参考主路径不足时，才打开这里。它的存在是为了兼容，而不是继续定义整个页面。",
    legacyOperationsDisclosure: "打开历史工具",
    rawReportTitle: "原始报告产物",
    rawReportSummary:
      "这个面板展示原始产物内容。外围界面是双语的，但产物正文保持源内容原样。",
    documentTitle: "源文档",
    graphTitle: "图谱快照",
    scenariosTitle: "场景卡片",
    openSourceArtifact: "打开原始产物",
    noDivergence: "这个分支没有记录到分歧回合。",
    noTarget: "没有明确目标"
  },
  rubric: {
    title: "审阅评分卡",
    helper:
      "在展开更重的操作面之前，先从有用性、可信度、可解释性和可行动性四个维度为当前分支打分。",
    notesLabel: "审阅备注",
    notesPlaceholder: "记录哪里还薄弱、哪里已经可信，以及下一步应该怎么推进。",
    dimensionsComplete: "已评分维度",
    evidenceTracked: "证据关联论点",
    divergentTurns: "分歧回合",
    evalPosture: "评测状态",
    recommendationLabel: "当前建议",
    recommendationReady: "这个分支已经足够稳，可以继续进入更深审阅或受控结论确认。",
    recommendationFollowup: "这个分支可以继续，但至少还有一个维度需要补强后再做强交接。",
    recommendationHold: "先停在这里，补齐最弱维度后再继续升级。",
    recommendationIncomplete: "先完成评分卡，再给出审阅建议。",
    openLegacy: "打开历史兼容工具",
    scoreLegend: "低信心 -> 高信心",
    averageLabel: "平均分"
  },
  common: {
    referenceBranch: "参考分支",
    routeOnlyDelta: "仅路径变化",
    timingDrift: "时间漂移",
    knowledgeShift: "知识扩散变化",
    baseline: "基线",
    candidate: "候选分支",
    rawArtifact: "原始产物",
    jumpToReview: "跳到审阅",
    jumpToTrace: "轨迹",
    jumpToClaims: "论点",
    jumpToEvidence: "证据",
    jumpToEval: "评测"
  }
};

export function getCopy(locale: AppLocale): Copy {
  return locale === "zh-CN" ? chineseCopy : englishCopy;
}
