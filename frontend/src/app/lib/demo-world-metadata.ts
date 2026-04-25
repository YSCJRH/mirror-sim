type BilingualLabel = {
  en: string;
  zh: string;
};

// Canonical demo-world metadata stays here so generic presenters can remain world-agnostic.
export const canonicalWorldNames: Record<string, BilingualLabel> = {
  "fog-harbor-east-gate": {
    en: "Fog Harbor East Gate",
    zh: "雾港东闸门危机"
  }
};

export const scenarioTitlesZh: Record<string, string> = {
  baseline: "东闸门基线响应",
  harbor_comms_failure: "港口通信故障导致预警转发延迟",
  mayor_signal_blocked: "潮汐预警期间市长信号受阻",
  reporter_detained: "记者发布前被拖延"
};

export const scenarioDescriptionsZh: Record<string, string> = {
  baseline:
    "基线分支假设档案账本副本按时流转，除了语料中已经描述的危机之外，不再额外注入通信扰动。",
  harbor_comms_failure:
    "海水干扰使港口无线电在早期预警窗口离线，导致潮汐警报和维护账本副本的首次公开机会都被推迟。",
  mayor_signal_blocked:
    "陈宇在第一次预警尝试中无法联系赵科，因此副市长错过了直接的潮汐升级信号，即便账本仍按计划公开。",
  reporter_detained:
    "运送账本的记者被中途拦截，因此维护记录副本进入公众决策链路的时间晚于基线。"
};

export const evalNamesZh: Record<string, string> = {
  fog_harbor_phase44_matrix: "雾港场景矩阵评测",
  runtime_beta_review: "当前分支审阅"
};

export const evalStatusesZh: Record<string, string> = {
  pass: "通过",
  fail: "失败",
  error: "错误",
  pending: "进行中",
  running: "运行中",
  blocked: "阻塞"
};

export const evalMetricLabelsZh: Record<string, string> = {
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

export const graphStatLabelsZh: Record<string, string> = {
  entity_count: "实体数",
  relation_count: "关系数",
  event_count: "事件数",
  chunk_count: "文本块数"
};

export const claimLabelsZh: Record<string, string> = {
  evidence_backed: "证据支撑"
};

export const documentKindLabelsZh: Record<string, string> = {
  bulletin: "公告",
  dispatch_notes: "调度记录",
  inspection_report: "检查报告",
  ledger_copy: "账本副本",
  minutes: "会议纪要",
  vessel_log: "船只日志"
};

export const actionTypeLabelsZh: Record<string, string> = {
  delay: "延迟",
  evacuate: "疏散",
  hide: "隐藏",
  inform: "通报",
  inspect: "检查",
  move: "转移",
  publish: "公开",
  request: "请求"
};

export const rubricDimensionLabelsZh: Record<string, string> = {
  Usefulness: "有用性",
  Credibility: "可信度",
  Explainability: "可解释性",
  Actionability: "可行动性"
};

export const rubricAnchorLabelsZh: Record<string, string> = {
  "Adds no new understanding": "没有带来新的理解",
  "Some useful contrast": "提供了一些有用对比",
  "Clearly clarifies branch differences": "能够清晰说明分支差异",
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
