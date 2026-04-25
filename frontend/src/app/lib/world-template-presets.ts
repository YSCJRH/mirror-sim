import type { AppLocale } from "./locale-shared";

export type WorldTemplateUploadedDocument = {
  title: string;
  kind: string;
  text: string;
};

export type WorldTemplateRoleSlot =
  | "records_lead"
  | "field_operator"
  | "observer"
  | "decision_lead";

export type WorldTemplatePreset = {
  key: string;
  label: string;
  badge: string;
  worldName: string;
  worldSummary: string;
  authorizedContext: string;
  documents: WorldTemplateUploadedDocument[];
  roles: Record<WorldTemplateRoleSlot, { name: string; publicRole: string }>;
  riskAssetName: string;
  evidenceDocumentName: string;
  publicEventName: string;
  responseLocationName: string;
  outcomes: {
    evidence_public_turn: string;
    response_turn: string;
    public_event_status: string;
    response_triggered: string;
    risk_known_by: string;
  };
};

export function getWorldTemplatePresets(locale: AppLocale): WorldTemplatePreset[] {
  if (locale === "zh-CN") {
    return [
      {
        key: "harbor-alert",
        label: "港口预警",
        badge: "推荐起点",
        worldName: "港口预警桌",
        worldSummary:
          "围绕一份风险账本、一次对外公开和一条响应链，观察早期扰动如何改变预警节奏。",
        authorizedContext:
          "全部为本次测试中创建的虚构示例文本，只用于 Mirror 私有 alpha 的受约束世界模拟。",
        documents: [
          {
            title: "值班备忘录",
            kind: "memo",
            text:
              "值班记录显示，港口东侧的潮位异常需要在公开活动开始前完成内部确认。观察员已经给出第一轮提醒，但是否上升到正式响应，还要看账本证据是否及时公开。",
          },
          {
            title: "账本摘录",
            kind: "note",
            text:
              "账本中记录了连续三次超阈值异常。记录负责人掌握副本，但需要决定何时把这份材料送入决策环节，以免过早公开引发活动安排变化。",
          },
        ],
        roles: {
          records_lead: {
            name: "陈宇",
            publicRole: "保管异常账本，并决定何时把材料公开到决策链里。",
          },
          field_operator: {
            name: "苏和",
            publicRole: "持续检查港口设施状态，判断风险是否已经达到响应阈值。",
          },
          observer: {
            name: "林岚",
            publicRole: "观察现场变化，并把第一手预警往上游传递。",
          },
          decision_lead: {
            name: "何砚",
            publicRole: "负责决定活动是否按计划进行，还是进入响应模式。",
          },
        },
        riskAssetName: "东门潮位系统",
        evidenceDocumentName: "异常账本",
        publicEventName: "港口公开说明会",
        responseLocationName: "东门响应点",
        outcomes: {
          evidence_public_turn: "账本公开回合",
          response_turn: "响应触发回合",
          public_event_status: "说明会状态",
          response_triggered: "是否进入响应",
          risk_known_by: "风险认知传播",
        },
      },
      {
        key: "museum-night",
        label: "博物馆夜班",
        badge: "展陈模板",
        worldName: "博物馆夜班",
        worldSummary:
          "围绕一件夜间巡检异常、证据记录和开馆安排，分析扰动如何推迟公开与处置。",
        authorizedContext:
          "全部为虚构馆内值班材料和演示文本，仅用于本次产品测试，不包含任何真实机构数据。",
        documents: [
          {
            title: "夜巡摘记",
            kind: "memo",
            text:
              "夜巡记录显示，北厅湿度异常正在逼近展品保护阈值。值班观察员已经标注变化，但是否升级处置还取决于维护记录能否被及时送入管理层。",
          },
          {
            title: "维护记录副本",
            kind: "note",
            text:
              "维护副本显示，上一轮修复未完全解决传感器问题。记录负责人保留了完整副本，但公开时机会影响第二天的开馆安排。",
          },
        ],
        roles: {
          records_lead: {
            name: "赵宁",
            publicRole: "保管维护记录，并判断何时向管理链公开。",
          },
          field_operator: {
            name: "顾川",
            publicRole: "检查展厅设备状态，确认异常是否持续扩大。",
          },
          observer: {
            name: "季遥",
            publicRole: "观察夜间变化并传递第一轮预警。",
          },
          decision_lead: {
            name: "梁芷",
            publicRole: "负责决定第二天开馆安排与应急处置。",
          },
        },
        riskAssetName: "北厅湿度系统",
        evidenceDocumentName: "维护记录副本",
        publicEventName: "次日开馆安排",
        responseLocationName: "北厅处置点",
        outcomes: {
          evidence_public_turn: "记录公开回合",
          response_turn: "处置触发回合",
          public_event_status: "开馆状态",
          response_triggered: "是否进入处置",
          risk_known_by: "异常认知传播",
        },
      },
      {
        key: "newsroom-leak",
        label: "新闻室泄露",
        badge: "舆情模板",
        worldName: "新闻室泄露台",
        worldSummary:
          "围绕一份内部材料、一条记者线索和一次公开发布，观察扰动如何改变发布时间与响应路径。",
        authorizedContext:
          "全部为虚构新闻室示例语料，专门为 Mirror 测试编写，不包含真实记者、机构或真实案件。",
        documents: [
          {
            title: "记者线索单",
            kind: "memo",
            text:
              "记者收到匿名线索，显示内部材料可能已经外泄。观察员记录了第一轮传播迹象，但是否进入正式公开仍需等待材料副本核验。",
          },
          {
            title: "内部材料副本",
            kind: "note",
            text:
              "材料副本表明，部分关键信息尚未完成交叉核验。记录负责人掌握副本，但公开节奏会直接影响编辑部决定。",
          },
        ],
        roles: {
          records_lead: {
            name: "邵闻",
            publicRole: "保管材料副本，并控制公开前的交叉核验。",
          },
          field_operator: {
            name: "林澈",
            publicRole: "追踪线索源头并确认泄露范围。",
          },
          observer: {
            name: "周汀",
            publicRole: "观察传播迹象并把第一轮预警送入编辑链。",
          },
          decision_lead: {
            name: "许衡",
            publicRole: "决定新闻是否公开发布，还是暂缓处理。",
          },
        },
        riskAssetName: "内部发布链",
        evidenceDocumentName: "材料副本",
        publicEventName: "公开发布",
        responseLocationName: "编辑决策台",
        outcomes: {
          evidence_public_turn: "材料公开回合",
          response_turn: "响应触发回合",
          public_event_status: "发布状态",
          response_triggered: "是否进入响应",
          risk_known_by: "泄露认知传播",
        },
      },
    ];
  }

  return [
    {
      key: "harbor-alert",
      label: "Harbor Alert",
      badge: "Recommended",
      worldName: "Harbor Alert Desk",
      worldSummary:
        "Track how a risk ledger, one public disclosure, and one response chain shift under early perturbations.",
      authorizedContext:
        "All texts in this starter are fictional materials created for product testing and may be used in Mirror private alpha simulations.",
      documents: [
        {
          title: "Duty Memo",
          kind: "memo",
          text:
            "The duty memo says the east-gate tide anomaly must be confirmed before the public briefing begins. The observer has already sent an early warning, but escalation still depends on whether the ledger evidence is surfaced in time.",
        },
        {
          title: "Ledger Extract",
          kind: "note",
          text:
            "The ledger extract records three threshold-breaking anomalies. The records lead holds a clean copy, but its publication timing may affect whether the public briefing remains on schedule.",
        },
      ],
      roles: {
        records_lead: {
          name: "Chen Yu",
          publicRole: "Keeps the anomaly ledger and decides when it enters the decision loop.",
        },
        field_operator: {
          name: "Su He",
          publicRole: "Checks the harbor condition and judges whether the risk has crossed the response threshold.",
        },
        observer: {
          name: "Lin Lan",
          publicRole: "Watches the site and sends the first warning upstream.",
        },
        decision_lead: {
          name: "He Yan",
          publicRole: "Decides whether the public event stays on schedule or shifts into response mode.",
        },
      },
      riskAssetName: "East Gate Tide System",
      evidenceDocumentName: "Anomaly Ledger",
      publicEventName: "Harbor Briefing",
      responseLocationName: "East Gate Response Point",
      outcomes: {
        evidence_public_turn: "Ledger publication turn",
        response_turn: "Response turn",
        public_event_status: "Briefing status",
        response_triggered: "Response trigger",
        risk_known_by: "Risk knowledge spread",
      },
    },
    {
      key: "museum-night",
      label: "Museum Night",
      badge: "Exhibit starter",
      worldName: "Museum Night Shift",
      worldSummary:
        "Center the world on one night-shift anomaly, one evidence record, and one opening decision.",
      authorizedContext:
        "All materials in this starter are fictional demo content and do not contain data from any real institution.",
      documents: [
        {
          title: "Night Patrol Note",
          kind: "memo",
          text:
            "The night patrol note shows humidity in the north hall approaching the protection threshold. The observer has marked the shift, but escalation still depends on whether the maintenance record reaches management in time.",
        },
        {
          title: "Maintenance Copy",
          kind: "note",
          text:
            "The maintenance copy shows the previous fix did not fully resolve the sensor issue. The records lead holds a complete copy, but its release timing will affect the next day's opening decision.",
        },
      ],
      roles: {
        records_lead: {
          name: "Zhao Ning",
          publicRole: "Keeps the maintenance record and decides when it becomes visible upstream.",
        },
        field_operator: {
          name: "Gu Chuan",
          publicRole: "Checks the exhibit environment and confirms whether the anomaly is growing.",
        },
        observer: {
          name: "Ji Yao",
          publicRole: "Observes the night shift and delivers the first warning.",
        },
        decision_lead: {
          name: "Liang Zhi",
          publicRole: "Decides whether the museum opens as planned or enters a response posture.",
        },
      },
      riskAssetName: "North Hall Humidity System",
      evidenceDocumentName: "Maintenance Copy",
      publicEventName: "Morning Opening",
      responseLocationName: "North Hall Response Point",
      outcomes: {
        evidence_public_turn: "Record publication turn",
        response_turn: "Response turn",
        public_event_status: "Opening status",
        response_triggered: "Response trigger",
        risk_known_by: "Anomaly knowledge spread",
      },
    },
    {
      key: "newsroom-leak",
      label: "Newsroom Leak",
      badge: "Editorial starter",
      worldName: "Newsroom Leak Desk",
      worldSummary:
        "Focus on one internal document, one reporter lead, and one publication decision under perturbation.",
      authorizedContext:
        "All materials in this starter are fictional newsroom texts written for Mirror testing and do not refer to real people or organizations.",
      documents: [
        {
          title: "Reporter Lead Sheet",
          kind: "memo",
          text:
            "A reporter receives an anonymous lead suggesting the internal file may already be leaking. The observer records the first signal, but formal publication still depends on whether the copied file is verified in time.",
        },
        {
          title: "Internal File Copy",
          kind: "note",
          text:
            "The file copy shows that several details still need cross-checking. The records lead controls the copy, and its release timing directly affects the editorial decision.",
        },
      ],
      roles: {
        records_lead: {
          name: "Shao Wen",
          publicRole: "Keeps the file copy and controls pre-publication verification.",
        },
        field_operator: {
          name: "Lin Che",
          publicRole: "Tracks the source path and estimates the spread of the leak.",
        },
        observer: {
          name: "Zhou Ting",
          publicRole: "Observes the first propagation signals and moves them into the newsroom chain.",
        },
        decision_lead: {
          name: "Xu Heng",
          publicRole: "Decides whether the story is published or held back.",
        },
      },
      riskAssetName: "Internal Publishing Chain",
      evidenceDocumentName: "File Copy",
      publicEventName: "Public Release",
      responseLocationName: "Editorial Desk",
      outcomes: {
        evidence_public_turn: "File publication turn",
        response_turn: "Response turn",
        public_event_status: "Release status",
        response_triggered: "Response trigger",
        risk_known_by: "Leak knowledge spread",
      },
    },
  ];
}
