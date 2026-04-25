"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ButtonLink } from "./button-link";
import { ContextCard } from "./context-card";
import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { AppLocale } from "../lib/locale-shared";
import { withSimulationSession } from "../lib/simulation-session";

export type PerturbationOption = {
  branchId: string;
  scenarioKey: string;
  title: string;
  description: string;
  kind: string;
  target: string;
  timing: string;
  summary: string;
  runtime?: {
    kind: string;
    targetId: string;
    actorId: string;
    timing: string;
    parameters: Record<string, string | number>;
  };
};

type DraftState = {
  provider: "openai_compatible" | "hosted_openai" | "deterministic_only";
  kind: string;
  target: string;
  timing: string;
  summary: string;
  model: string;
};

type PresetPerturbationComposerProps = {
  locale: AppLocale;
  worldId: string;
  baselineScenarioId: string;
  runtimeHrefBase?: string;
  worldHref?: string;
  perturbHref?: string;
  initialSessionId?: string;
  initialFromNodeId?: string;
  initialFromNodeLabel?: string;
  baselineTitle: string;
  options: PerturbationOption[];
  initialBranchId?: string;
  initialDraft?: Partial<DraftState>;
  showStaticExplainPreview?: boolean;
};

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

function scoreOption(option: PerturbationOption, draft: DraftState) {
  let score = 0;

  if (option.kind === draft.kind) {
    score += 3;
  }
  if (option.target === draft.target) {
    score += 3;
  }
  if (option.timing === draft.timing) {
    score += 2;
  }

  const normalizedSummary = draft.summary.trim().toLowerCase();
  if (normalizedSummary.length > 0) {
    const optionText = `${option.title} ${option.description} ${option.summary}`.toLowerCase();
    const tokens = normalizedSummary
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);
    score += tokens.filter((token) => optionText.includes(token)).length;
  }

  return score;
}

function getCopy(locale: AppLocale) {
  if (locale === "zh-CN") {
    return {
      worldStart: "世界起点",
      baseline: "基线",
      backToWorld: "回到世界",
      presetPerturbation: "预设扰动",
      selectPerturbation: "使用这个扰动",
      composerLabel: "扰动编辑器",
      generationMode: "分支生成",
      composerTitle: "先写一个扰动草案，再交给系统生成新的分支节点。",
      composerSummary: "主按钮会创建或复用当前会话，并从现在的起点继续往下分叉。",
      provider: "模型接入方式",
      providerHelp: {
        openai_compatible: "自带 API key，适合正式接入兼容接口。",
        hosted_openai: "使用服务端托管 GPT，只需要 Beta 访问码。",
        deterministic_only: "不调用模型，最快也最稳定，适合先看流程。",
      },
      kind: "扰动类型",
      target: "目标对象",
      timing: "施加时机",
      summary: "扰动摘要",
      summaryPlaceholder: "描述这次扰动会阻断、延后、转移或放大什么。",
      model: "模型名称",
      modelPlaceholder: "例如 gpt-5.4 或你接入的兼容模型",
      bestMatch: "当前最接近的预设",
      generatedBranch: "参考模板",
      fromNodeLabel: "当前起点",
      previewLabel: "生成预览",
      previewTitle: "如果现在点击生成，系统会从这个起点继续分叉，而不是回到最初基线。",
      generate: "生成分支",
      previewExplain: "先看静态解释",
      tryAnother: "换一个扰动",
      baselineSummary: "从这里开始施加扰动。预设匹配只负责帮你更快进入真实的分支生成流程。",
      sessionLabel: "当前实验",
      generating: "正在生成...",
      runtimeHint: "主按钮会进入这次分支的结果页；次按钮仍保留静态解释作为参考。",
      sessionLocked: "当前实验的模型接入方式和模型名称会锁定在创建时的配置；如需更换，请新开一个实验。",
      apiKey: "模型接口密钥",
      apiBaseUrl: "模型接口地址",
      betaAccessCode: "Beta 访问码",
      missingMapping: "当前扰动还没有接入运行时生成链路。",
      startFailed: "启动会话失败。",
      generateFailed: "生成分支失败。",
      keyHint: "当前接入方式需要浏览器会话内的模型接口密钥。这个密钥不会写入任何会话产物。",
      hostedHint: "托管 GPT 只使用服务端密钥；浏览器只提交 Beta 访问码，不会发送 OpenAI API key。",
      providerOptions: {
        openai_compatible: "OpenAI 兼容接口",
        hosted_openai: "托管 GPT",
        deterministic_only: "仅规则推演",
      },
    };
  }

  return {
    worldStart: "World start",
    baseline: "Baseline",
    backToWorld: "Back to world",
    presetPerturbation: "Preset perturbation",
    selectPerturbation: "Select perturbation",
    composerLabel: "Perturbation Composer",
    generationMode: "Runtime generation",
    composerTitle: "Write a perturbation draft first, then hand it to the runtime to generate a candidate node.",
    composerSummary: "The primary action creates or reuses a runtime session and continues branching from the current checkpoint.",
    provider: "Decision provider",
    providerHelp: {
      openai_compatible: "Bring your own API key for a compatible endpoint.",
      hosted_openai: "Use the server-hosted GPT path with a beta access code.",
      deterministic_only: "Skip model calls for the fastest rule-only walkthrough.",
    },
    kind: "Perturbation kind",
    target: "Target",
    timing: "Timing",
    summary: "Perturbation summary",
    summaryPlaceholder: "Describe what this perturbation blocks, delays, redirects, or amplifies.",
    model: "Decision model",
    modelPlaceholder: "For example: gpt-5.4 or another compatible GPT model",
    bestMatch: "Best current match",
    generatedBranch: "Static reference branch",
    fromNodeLabel: "Branch from",
    previewLabel: "Generation preview",
    previewTitle: "If you generate now, runtime will continue from this checkpoint instead of restarting from baseline.",
    generate: "Generate live branch",
    previewExplain: "Preview static explanation",
    tryAnother: "Try another perturbation",
    baselineSummary: "Start from the baseline and apply a perturbation here. The preset match now only acts as a bridge into live runtime generation.",
    sessionLabel: "Runtime session",
    generating: "Generating...",
    runtimeHint: "The primary action opens the live session workspace; the secondary action keeps the static explain surface as a reference.",
    sessionLocked: "This session's provider and model are locked to the values used at session creation. Start a new session to change them.",
    apiKey: "API key",
    apiBaseUrl: "API base URL",
    betaAccessCode: "Beta access code",
    missingMapping: "This perturbation is not yet connected to a runtime mapping.",
    startFailed: "Failed to start runtime session.",
    generateFailed: "Failed to generate runtime branch.",
    keyHint: "This provider needs an API key in browser session storage. The key is never written into session artifacts.",
    hostedHint: "Hosted GPT uses the server-side key and a private beta access code. No API key is sent from the browser.",
    providerOptions: {
      openai_compatible: "OpenAI-compatible",
      hosted_openai: "Hosted GPT",
      deterministic_only: "Deterministic only",
    },
  };
}

export function PresetPerturbationComposer({
  locale,
  worldId,
  baselineScenarioId,
  runtimeHrefBase = "/runtime",
  worldHref = "/",
  perturbHref = "/perturb",
  initialSessionId,
  initialFromNodeId,
  initialFromNodeLabel,
  baselineTitle,
  options,
  initialBranchId,
  initialDraft,
  showStaticExplainPreview = true,
}: PresetPerturbationComposerProps) {
  const router = useRouter();
  const copy = getCopy(locale);
  const initialOption =
    options.find((option) => option.branchId === initialBranchId) ?? options[0] ?? null;
  const skipInitialSelectionSync = useRef(true);
  const [selectedBranchId, setSelectedBranchId] = useState(initialOption?.branchId ?? "");
  const [sessionId, setSessionId] = useState(initialSessionId ?? "");
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [apiKey, setApiKey] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("https://api.openai.com/v1");
  const [betaAccessCode, setBetaAccessCode] = useState("");
  const fromNodeId = initialFromNodeId ?? "node_root";
  const fromNodeLabel = initialFromNodeLabel ?? baselineTitle;
  const [draft, setDraft] = useState<DraftState>({
    provider:
      initialDraft?.provider === "deterministic_only" || initialDraft?.provider === "hosted_openai"
        ? initialDraft.provider
        : "openai_compatible",
    kind: initialDraft?.kind ?? initialOption?.kind ?? "",
    target: initialDraft?.target ?? initialOption?.target ?? "",
    timing: initialDraft?.timing ?? initialOption?.timing ?? "",
    summary: initialDraft?.summary ?? initialOption?.summary ?? "",
    model: initialDraft?.model ?? "",
  });

  const selectedOption = useMemo(
    () => options.find((option) => option.branchId === selectedBranchId) ?? initialOption,
    [initialOption, options, selectedBranchId]
  );

  useEffect(() => {
    if (!selectedOption) {
      return;
    }

    if (skipInitialSelectionSync.current) {
      skipInitialSelectionSync.current = false;
      return;
    }

    setDraft((current) => ({
      provider: current.provider,
      kind: selectedOption.kind,
      target: selectedOption.target,
      timing: selectedOption.timing,
      summary: selectedOption.summary,
      model: current.model,
    }));
  }, [selectedOption]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setApiKey(window.sessionStorage.getItem("mirror-openai-api-key") ?? "");
    setApiBaseUrl(
      window.sessionStorage.getItem("mirror-openai-base-url") ??
        "https://api.openai.com/v1"
    );
    setBetaAccessCode(window.sessionStorage.getItem("mirror-beta-access-code") ?? "");
    if (!sessionId) {
      const storedProvider = window.sessionStorage.getItem("mirror-decision-provider");
      const storedModel = window.sessionStorage.getItem("mirror-decision-model");
      if (
        storedProvider === "openai_compatible" ||
        storedProvider === "hosted_openai" ||
        storedProvider === "deterministic_only"
      ) {
        setDraft((current) => ({
          ...current,
          provider: storedProvider,
          model: storedProvider === "openai_compatible" ? storedModel ?? current.model : "",
        }));
      } else if (storedModel) {
        setDraft((current) => ({ ...current, model: storedModel }));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || sessionId) {
      return;
    }
    window.sessionStorage.setItem("mirror-decision-provider", draft.provider);
    if (draft.provider === "openai_compatible" && draft.model.trim()) {
      window.sessionStorage.setItem("mirror-decision-model", draft.model.trim());
    }
  }, [draft.model, draft.provider, sessionId]);

  const matchedOption = useMemo(() => {
    const ranked = [...options].sort(
      (left, right) => scoreOption(right, draft) - scoreOption(left, draft)
    );
    return ranked[0] ?? null;
  }, [draft, options]);

  const kinds = uniqueValues(options.map((option) => option.kind));
  const targets = uniqueValues(options.map((option) => option.target));
  const timings = uniqueValues(options.map((option) => option.timing));

  if (!initialOption || !matchedOption) {
    return null;
  }

  const sessionQuery = {
    branchId: matchedOption.branchId,
    provider: draft.provider,
    kind: draft.kind,
    target: draft.target,
    timing: draft.timing,
    summary: draft.summary,
    model: draft.model,
  };
  const matchedExplainHref = showStaticExplainPreview
    ? withSimulationSession(`/explain/${matchedOption.branchId}`, sessionQuery)
    : null;

  async function generateRuntimeBranch() {
    const runtimePreset = matchedOption.runtime;
    if (!runtimePreset) {
      setRuntimeError(copy.missingMapping);
      return;
    }

    try {
      setRuntimeError(null);
      let resolvedSessionId = sessionId;

      if (!resolvedSessionId) {
        const startResponse = await fetch("/api/runtime/start-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locale,
            worldId,
            scenarioId: baselineScenarioId,
            decisionProvider: draft.provider,
            decisionModel:
              draft.provider === "openai_compatible" ? draft.model.trim() || undefined : undefined,
            betaAccessCode:
              draft.provider === "hosted_openai" ? betaAccessCode.trim() || undefined : undefined,
          }),
        });
        const startPayload = (await startResponse.json()) as {
          error?: string;
          session_id?: string;
        };

        if (!startResponse.ok || !startPayload.session_id) {
          throw new Error(startPayload.error ?? copy.startFailed);
        }

        resolvedSessionId = startPayload.session_id;
        setSessionId(resolvedSessionId);
      }

      const generateResponse = await fetch("/api/runtime/generate-branch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          sessionId: resolvedSessionId,
          fromNode: fromNodeId,
          decisionProvider: draft.provider,
          decisionApiKey:
            draft.provider === "openai_compatible" ? apiKey.trim() || undefined : undefined,
          decisionBaseUrl:
            draft.provider === "openai_compatible"
              ? apiBaseUrl.trim() || undefined
              : undefined,
          betaAccessCode:
            draft.provider === "hosted_openai" ? betaAccessCode.trim() || undefined : undefined,
          perturbation: {
            kind: runtimePreset.kind,
            target_id: runtimePreset.targetId,
            timing: runtimePreset.timing,
            summary: draft.summary,
            parameters: {
              ...runtimePreset.parameters,
              actor_id: runtimePreset.actorId,
            },
          },
        }),
      });
      const generatePayload = (await generateResponse.json()) as {
        error?: string;
        session_id?: string;
        active_node_id?: string;
      };

      if (!generateResponse.ok || !generatePayload.session_id) {
        throw new Error(generatePayload.error ?? copy.generateFailed);
      }

      const activeNodeId = generatePayload.active_node_id;
      router.push(
        activeNodeId
          ? `${runtimeHrefBase}/${generatePayload.session_id}?node=${encodeURIComponent(activeNodeId)}`
          : `${runtimeHrefBase}/${generatePayload.session_id}`
      );
      router.refresh();
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : copy.generateFailed);
    }
  }

  const providerOptions = [
    {
      value: "openai_compatible" as const,
      label: copy.providerOptions.openai_compatible,
    },
    {
      value: "hosted_openai" as const,
      label: copy.providerOptions.hosted_openai,
    },
    {
      value: "deterministic_only" as const,
      label: copy.providerOptions.deterministic_only,
    },
  ];

  return (
    <div className="simulatorShell">
      <div className="simulatorRail">
        <SurfaceCard className="simulatorBranchCard" tone="accent" as="div">
          <div className="interventionCardMeta">
            <StatusPill tone="accent">{copy.worldStart}</StatusPill>
            <StatusPill tone="subtle">{copy.baseline}</StatusPill>
          </div>
          <h3>{baselineTitle}</h3>
          <p>{copy.baselineSummary}</p>
          <ButtonLink href={worldHref} variant="ghost">
            {copy.backToWorld}
          </ButtonLink>
        </SurfaceCard>

        {options.map((option) => {
          const active = option.branchId === selectedOption?.branchId;
          return (
            <SurfaceCard
              key={option.branchId}
              className={`simulatorBranchCard${active ? " simulatorBranchCardActive" : ""}`}
              tone={active ? "accent" : "default"}
              as="div"
            >
              <div className="interventionCardMeta">
                <StatusPill tone={active ? "accent" : "subtle"}>
                  {copy.presetPerturbation}
                </StatusPill>
                <StatusPill tone="subtle">{option.kind}</StatusPill>
              </div>
              <h3>{option.title}</h3>
              <p>{option.summary}</p>
              <button
                type="button"
                className={`simulatorToggle${active ? " simulatorToggleActive" : ""}`}
                onClick={() => setSelectedBranchId(option.branchId)}
              >
                {copy.selectPerturbation}
              </button>
            </SurfaceCard>
          );
        })}
      </div>

      <div className="simulatorWorkspace">
        <SurfaceCard className="simulatorComposer" tone="strong" as="div">
          <div className="interventionCardMeta">
            <StatusPill tone="accent">{copy.composerLabel}</StatusPill>
            <StatusPill tone="subtle">{copy.generationMode}</StatusPill>
          </div>
          <h3>{copy.composerTitle}</h3>
          <p>{copy.composerSummary}</p>

          <div className="composerGrid">
            <label className="composerField">
              <span>{copy.provider}</span>
              <select
                value={draft.provider}
                disabled={Boolean(sessionId)}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    provider: event.target.value as "openai_compatible" | "hosted_openai" | "deterministic_only",
                    model:
                      event.target.value === "openai_compatible" ? current.model : "",
                  }))
                }
              >
                {providerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small className="composerFieldHint">{copy.providerHelp[draft.provider]}</small>
            </label>

            <label className="composerField">
              <span>{copy.kind}</span>
              <select
                value={draft.kind}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    kind: event.target.value,
                  }))
                }
              >
                {kinds.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="composerField">
              <span>{copy.target}</span>
              <select
                value={draft.target}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    target: event.target.value,
                  }))
                }
              >
                {targets.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="composerField">
              <span>{copy.timing}</span>
              <select
                value={draft.timing}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    timing: event.target.value,
                  }))
                }
              >
                {timings.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="composerField composerFieldWide">
              <span>{copy.summary}</span>
              <textarea
                rows={4}
                value={draft.summary}
                placeholder={copy.summaryPlaceholder}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
              />
            </label>

            {draft.provider === "openai_compatible" ? (
              <label className="composerField composerFieldWide">
                <span>{copy.model}</span>
                <input
                  type="text"
                  value={draft.model}
                  placeholder={copy.modelPlaceholder}
                  disabled={Boolean(sessionId)}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      model: event.target.value,
                    }))
                  }
                />
              </label>
            ) : null}

            {draft.provider === "openai_compatible" ? (
              <>
                <label className="composerField composerFieldWide">
                  <span>{copy.apiKey}</span>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => {
                      const value = event.target.value;
                      setApiKey(value);
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem("mirror-openai-api-key", value);
                      }
                    }}
                  />
                </label>

                <label className="composerField composerFieldWide">
                  <span>{copy.apiBaseUrl}</span>
                  <input
                    type="text"
                    value={apiBaseUrl}
                    onChange={(event) => {
                      const value = event.target.value;
                      setApiBaseUrl(value);
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem("mirror-openai-base-url", value);
                      }
                    }}
                  />
                </label>
              </>
            ) : null}

            {draft.provider === "hosted_openai" ? (
              <label className="composerField composerFieldWide">
                <span>{copy.betaAccessCode}</span>
                <input
                  type="password"
                  value={betaAccessCode}
                  onChange={(event) => {
                    const value = event.target.value;
                    setBetaAccessCode(value);
                    if (typeof window !== "undefined") {
                      window.sessionStorage.setItem("mirror-beta-access-code", value);
                    }
                  }}
                />
              </label>
            ) : null}
          </div>

          <div className="contextCardGrid">
            <ContextCard
              label={copy.provider}
              value={
                providerOptions.find((option) => option.value === draft.provider)?.label ??
                draft.provider
              }
            />
            <ContextCard label={copy.bestMatch} value={matchedOption.title} tone="accent" />
            <ContextCard label={copy.generatedBranch} value={matchedOption.branchId} code />
            <ContextCard label={copy.fromNodeLabel} value={fromNodeLabel} />
            {draft.provider === "openai_compatible" && draft.model.trim() ? (
              <ContextCard label={copy.model} value={draft.model.trim()} />
            ) : null}
          </div>
        </SurfaceCard>

        <SurfaceCard className="simulatorPreview" tone="accent" as="div">
          <div className="interventionCardMeta">
            <StatusPill tone="accent">{copy.previewLabel}</StatusPill>
            <StatusPill tone="subtle">{matchedOption.branchId}</StatusPill>
            <StatusPill tone="subtle">{`${copy.fromNodeLabel}: ${fromNodeLabel}`}</StatusPill>
            {sessionId ? (
              <StatusPill tone="subtle">{`${copy.sessionLabel}: ${sessionId}`}</StatusPill>
            ) : null}
          </div>
          <h3>{copy.previewTitle}</h3>
          <p>{matchedOption.summary}</p>
          <div className="cardActions">
            <button
              type="button"
              className="buttonLink buttonLinkPrimary"
              onClick={() => startTransition(() => void generateRuntimeBranch())}
              disabled={isPending}
            >
              {isPending ? copy.generating : copy.generate}
            </button>
            {matchedExplainHref ? (
              <ButtonLink href={matchedExplainHref} variant="secondary">
                {copy.previewExplain}
              </ButtonLink>
            ) : null}
            <ButtonLink href={perturbHref} variant="ghost">
              {copy.tryAnother}
            </ButtonLink>
          </div>
          {runtimeError ? <p className="subtle">{runtimeError}</p> : null}
          {draft.provider === "openai_compatible" && !apiKey.trim() ? (
            <p className="subtle">{copy.keyHint}</p>
          ) : null}
          {draft.provider === "hosted_openai" ? <p className="subtle">{copy.hostedHint}</p> : null}
          {sessionId ? <p className="subtle">{copy.sessionLocked}</p> : null}
          <p className="subtle">{copy.runtimeHint}</p>
        </SurfaceCard>
      </div>
    </div>
  );
}
