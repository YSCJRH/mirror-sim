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
    title: string;
    lede: string;
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
    eyebrow: "Mirror Engine / Editorial Briefing Workbench",
    worldLabel: "Current world",
    compareArtifactLabel: "Compare artifact",
    sourceArtifactLabel: "Source artifact",
    dashboardLabel: "Dashboard",
    reviewLabel: "Deep review",
    legacyLabel: "Legacy operations"
  },
  dashboard: {
    title: "Read the outcome first, then decide where deeper review is actually worth your attention.",
    lede:
      "This dashboard turns the canonical compare artifact into an editorial briefing: what changed, what only drifted in route, which evidence path matters, and when to open the heavier review workspace.",
    currentPair: "Current report pair",
    loadedBranches: "canonical scenario branches",
    interventionCount: "intervention comparisons against baseline",
    jumpToReview: "Open deep review",
    jumpToReference: "Open reference surfaces",
    routeEyebrow: "Default path",
    routeTitle: "Move through compare, trace, evidence, and eval before opening heavier review machinery.",
    routeSummary:
      "The homepage now behaves like a briefing board, not a dump. It should tell you what changed, why it matters, and where to inspect next without forcing the whole workbench on first read.",
    interventionEyebrow: "Intervention board",
    interventionTitle: "Each intervention gets a strong summary card: impact first, drill-down second.",
    interventionSummary:
      "The cards below emphasize outcome shifts, route-only drift, and where to jump next instead of repeating full artifact payloads.",
    storyboardEyebrow: "Trace storyboard",
    storyboardTitle: "Preview only the turns that actually diverge.",
    claimEyebrow: "Claims and eval",
    claimTitle: "Keep the evidence-linked claims and integrity posture readable at a glance.",
    evalEyebrow: "Review handoff",
    evalTitle: "Use the dashboard to decide whether you should continue into deep review or stop at the current briefing.",
    scorecardNote:
      "The full review scorecard, routing logic, and historical heavy surfaces still exist, but they now live behind the deep review workspace.",
    openReview: "Open review workspace",
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
    title: "Deep review keeps the scorecard front and center, then lets trace, claims, reference, and advanced operations stack behind it.",
    lede:
      "This view is the operator workspace. Start with the scorecard, then move into trace and claims, consult references only when needed, and keep the legacy heavy tooling behind an explicit advanced boundary.",
    backToDashboard: "Back to dashboard",
    stripTitle: "Review strip",
    sectionNav: {
      scorecard: "Scorecard",
      traceClaims: "Trace & Claims",
      reference: "Reference",
      advanced: "Advanced Operations"
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
    advancedTitle: "Advanced operations",
    advancedSummary:
      "Heavy historical packet, delivery, and legacy operational surfaces remain available, but they are explicitly secondary to the review path.",
    legacyOperationsTitle: "Legacy operations workspace",
    legacyOperationsSummary:
      "Use this only when you need the older packet-heavy review tooling. It remains available, but no longer defines the page.",
    legacyOperationsDisclosure: "Open legacy operations",
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
    openLegacy: "Open legacy operations workspace",
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
    eyebrow: "Mirror Engine / 编辑部指挥台工作区",
    worldLabel: "当前世界",
    compareArtifactLabel: "Compare 产物",
    sourceArtifactLabel: "原始产物",
    dashboardLabel: "总览台",
    reviewLabel: "深度审阅",
    legacyLabel: "历史操作面"
  },
  dashboard: {
    title: "先读结果，再判断哪里值得继续深挖。",
    lede:
      "这个首页把 canonical compare artifact 组织成一块编辑部 briefing board：哪条干预改变了结果，哪条只是改变了路径，证据链该从哪里看起，以及什么时候才值得打开更重的审阅工作区。",
    currentPair: "当前报告对比",
    loadedBranches: "canonical 场景分支",
    interventionCount: "相对 baseline 的干预对比",
    jumpToReview: "进入深度审阅",
    jumpToReference: "打开参考面板",
    routeEyebrow: "默认路径",
    routeTitle: "先走 compare、trace、evidence、eval，再决定是否进入更重的审阅机制。",
    routeSummary:
      "首页现在应该像一块 briefing board，而不是一页 dump。它先告诉你发生了什么、为什么重要、下一步该看哪里。",
    interventionEyebrow: "干预摘要板",
    interventionTitle: "每条 intervention 都先给出强摘要卡，再给 drill-down。",
    interventionSummary:
      "下面的卡片优先强调结果变化、纯路径漂移，以及下一步查看入口，而不是重复整块 artifact 内容。",
    storyboardEyebrow: "Trace 分镜",
    storyboardTitle: "只预览真正发生分歧的 turn。",
    claimEyebrow: "Claims 与 Eval",
    claimTitle: "让 evidence-linked claims 和完整性状态可以一眼扫读。",
    evalEyebrow: "审阅交接",
    evalTitle: "用首页先判断是否需要继续进入深度审阅，而不是默认把整套重型工具全部打开。",
    scorecardNote:
      "完整的 review scorecard、routing 逻辑和历史重型 surface 依然保留，但它们现在统一收进深度审阅工作区。",
    openReview: "进入审阅工作区",
    openTrace: "查看 trace",
    openClaims: "查看 claims",
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
      title: "回放分歧 turn",
      summary: "先看短分镜，再决定是否需要打开完整分支时间线。"
    },
    {
      step: "03",
      title: "核对 claims 与证据",
      summary: "确认哪些 claim 是被证据支撑的，以及它们依赖哪些 turn 或 chunk。"
    },
    {
      step: "04",
      title: "确认 eval 状态",
      summary: "把 eval 当作完整性门槛，再决定是否继续更深的审阅。"
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
    divergentTurns: "分歧 turns",
    evidenceLinkedClaims: "证据关联 claims",
    evalStatus: "Eval 状态"
  },
  review: {
    title: "深度审阅把 scorecard 放在最前面，trace、claims、reference 和 advanced operations 都退到它之后。",
    lede:
      "这里是操作员工作区。先完成 scorecard，再看 trace 与 claims；只有在需要时才进入 reference，并把历史重型 tooling 放在明确的 advanced 边界之后。",
    backToDashboard: "返回总览台",
    stripTitle: "审阅摘要条",
    sectionNav: {
      scorecard: "评分卡",
      traceClaims: "Trace 与 Claims",
      reference: "参考面板",
      advanced: "高级操作"
    },
    scorecardTitle: "先给当前分支打分，再决定是否值得掉进重型工具。",
    scorecardSummary:
      "评分卡现在是深度审阅的主入口。它先总结可信度、薄弱维度，以及当前分支是否值得继续升级审阅，还是先补证据。",
    traceTitle: "Trace 与 Claims",
    traceSummary:
      "用这里把分歧 turns 与 evidence-linked claims 连起来，而不是一上来就重新打开整条原始 branch 历史。",
    claimsTitle: "Claim drill-down",
    claimsSummary:
      "Claims 继续保持 evidence-linked 和可追踪。每张卡片都展示支撑它的 chunks 和相关 turns。",
    referenceTitle: "参考面板",
    referenceSummary:
      "这些面板让 scenarios、graph、documents 和原始 report 都可达，但不会再主导首读体验。",
    advancedTitle: "高级操作",
    advancedSummary:
      "历史上的 packet、delivery 和重型操作 surface 继续保留，但它们明确退居为次级路径。",
    legacyOperationsTitle: "历史操作工作区",
    legacyOperationsSummary:
      "只有当你确实需要旧的 packet-heavy review tooling 时才打开这里。它仍然可用，但不再定义整个页面。",
    legacyOperationsDisclosure: "打开历史操作面",
    rawReportTitle: "原始报告产物",
    rawReportSummary:
      "这个面板展示原始 artifact 内容。外围 UI 是双语的，但 artifact 正文本体保持源内容原样。",
    documentTitle: "源文档",
    graphTitle: "图谱快照",
    scenariosTitle: "场景卡片",
    openSourceArtifact: "打开原始产物",
    noDivergence: "这个分支没有记录到分歧 turn。",
    noTarget: "没有显式 target"
  },
  rubric: {
    title: "审阅评分卡",
    helper:
      "在展开更重的操作面之前，先从 usefulness、credibility、explainability 和 actionability 四个维度为当前分支打分。",
    notesLabel: "审阅备注",
    notesPlaceholder: "记录哪里还薄弱、哪里已经可信，以及下一步应该怎么推进。",
    dimensionsComplete: "已评分维度",
    evidenceTracked: "证据关联 claims",
    divergentTurns: "分歧 turns",
    evalPosture: "Eval 状态",
    recommendationLabel: "当前建议",
    recommendationReady: "这个分支已经足够稳，可以继续进入更深审阅或受控 sign-off。",
    recommendationFollowup: "这个分支可以继续，但至少还有一个维度需要补强后再做强交接。",
    recommendationHold: "先停在这里，补齐最弱维度后再继续升级。",
    recommendationIncomplete: "先完成评分卡，再给出审阅建议。",
    openLegacy: "打开历史操作工作区",
    scoreLegend: "低信心 -> 高信心",
    averageLabel: "平均分"
  },
  common: {
    referenceBranch: "参考分支",
    routeOnlyDelta: "仅路径变化",
    timingDrift: "时间漂移",
    knowledgeShift: "知识扩散变化",
    baseline: "Baseline",
    candidate: "Candidate",
    rawArtifact: "原始产物",
    jumpToReview: "跳到审阅",
    jumpToTrace: "Trace",
    jumpToClaims: "Claims",
    jumpToEvidence: "证据",
    jumpToEval: "Eval"
  }
};

export function getCopy(locale: AppLocale): Copy {
  return locale === "zh-CN" ? chineseCopy : englishCopy;
}
