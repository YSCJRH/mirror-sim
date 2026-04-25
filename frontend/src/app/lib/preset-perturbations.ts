export type PresetPerturbationMetadata = {
  kind: {
    en: string;
    zh: string;
  };
  target: {
    en: string;
    zh: string;
  };
  timing: {
    en: string;
    zh: string;
  };
  summary: {
    en: string;
    zh: string;
  };
  runtime: {
    kind: "delay_document" | "block_contact" | "resource_failure";
    targetId: string;
    actorId: string;
    timing: string;
    parameters: Record<string, string | number>;
  };
};

export const presetPerturbationMetadata: Record<string, PresetPerturbationMetadata> = {
  harbor_comms_failure: {
    kind: {
      en: "Communication disruption",
      zh: "通信中断",
    },
    target: {
      en: "Harbor radio relay",
      zh: "港口无线电中继",
    },
    timing: {
      en: "Early warning window",
      zh: "早期预警窗口",
    },
    summary: {
      en: "Delay the harbor warning and the first chance to surface the ledger.",
      zh: "延后港口预警，以及账本首次进入公开链路的机会。",
    },
    runtime: {
      kind: "resource_failure",
      targetId: "entity_east_wharf",
      actorId: "persona_chen_yu",
      timing: "early_warning_window",
      parameters: {
        duration_turns: 3,
        cause: "saltwater_radio_interference",
      },
    },
  },
  mayor_signal_blocked: {
    kind: {
      en: "Contact block",
      zh: "联络受阻",
    },
    target: {
      en: "Deputy mayor signal path",
      zh: "副市长信号链路",
    },
    timing: {
      en: "First warning attempt",
      zh: "第一次预警尝试",
    },
    summary: {
      en: "Block the direct escalation path while keeping the ledger on schedule.",
      zh: "阻断直接升级链路，同时保持账本公开节奏不变。",
    },
    runtime: {
      kind: "block_contact",
      targetId: "persona_zhao_ke",
      actorId: "persona_chen_yu",
      timing: "first_warning_attempt",
      parameters: {
        cause: "courier_interception",
      },
    },
  },
  reporter_detained: {
    kind: {
      en: "Courier delay",
      zh: "递送拖延",
    },
    target: {
      en: "Ledger courier",
      zh: "账本递送者",
    },
    timing: {
      en: "Before publication",
      zh: "发布前",
    },
    summary: {
      en: "Delay the copied ledger before it reaches the public decision loop.",
      zh: "在账本进入公众决策链前将其拖延。",
    },
    runtime: {
      kind: "delay_document",
      targetId: "doc_ledger_copy",
      actorId: "entity_lin_lan",
      timing: "before_publication",
      parameters: {
        delay_turns: 2,
        cause: "courier_interruption",
      },
    },
  },
};
