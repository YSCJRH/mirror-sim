"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ButtonLink } from "./button-link";
import { ContextCard } from "./context-card";
import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { AppLocale } from "../lib/locale-shared";
import { presetPerturbationMetadata } from "../lib/preset-perturbations";
import { withMergedSearchParams } from "../lib/simulation-session";

export type MinimalHomeOption = {
  branchId: string;
  scenarioKey: string;
  title: string;
  description: string;
  kind: string;
  target: string;
  timing: string;
  summary: string;
};

type DraftState = {
  branchId: string;
  kind: string;
  target: string;
  timing: string;
  summary: string;
};

export type MinimalHomeCurrentState = {
  worldName: string;
  checkpointLabel: string;
  statusLabel: string;
  summary: string;
  baselineSummary: string;
  sessionId?: string;
  activeNodeId?: string;
  parentNodeId?: string | null;
  parentLabel?: string | null;
  rootNodeId?: string;
};

export type MinimalHomeResult = {
  mode: "empty" | "ready";
  title: string;
  summary: string;
  branchSummary: string;
  firstChangeSummary?: string;
  outcomeCards: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  divergentTurns: Array<{
    turnLabel: string;
    summary: string;
    detail: string;
  }>;
  advancedHref?: string;
};

type MinimalHomeShellProps = {
  locale: AppLocale;
  worldId: string;
  baselineScenarioId: string;
  baselineTitle: string;
  baselineDescription: string;
  currentState: MinimalHomeCurrentState;
  result: MinimalHomeResult;
  options: MinimalHomeOption[];
  initialSessionId?: string;
  initialNodeId?: string;
  initialBranchId?: string;
  initialDraft?: Partial<DraftState>;
};

function scoreOption(option: MinimalHomeOption, draft: DraftState) {
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

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

export function MinimalHomeShell({
  locale,
  worldId,
  baselineScenarioId,
  baselineTitle,
  baselineDescription,
  currentState,
  result,
  options,
  initialSessionId,
  initialNodeId,
  initialBranchId,
  initialDraft,
}: MinimalHomeShellProps) {
  const router = useRouter();
  const initialOption =
    options.find((option) => option.branchId === initialBranchId) ?? options[0] ?? null;
  const skipInitialSelectionSync = useRef(true);
  const [selectedBranchId, setSelectedBranchId] = useState(initialOption?.branchId ?? "");
  const [runtimeSessionId, setRuntimeSessionId] = useState(initialSessionId ?? "");
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<DraftState>({
    branchId: initialDraft?.branchId ?? initialOption?.branchId ?? "",
    kind: initialDraft?.kind ?? initialOption?.kind ?? "",
    target: initialDraft?.target ?? initialOption?.target ?? "",
    timing: initialDraft?.timing ?? initialOption?.timing ?? "",
    summary: initialDraft?.summary ?? initialOption?.summary ?? "",
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

    setDraft({
      branchId: selectedOption.branchId,
      kind: selectedOption.kind,
      target: selectedOption.target,
      timing: selectedOption.timing,
      summary: selectedOption.summary,
    });
  }, [selectedOption]);

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

  const fromNodeId = initialNodeId ?? currentState.activeNodeId ?? currentState.rootNodeId ?? "node_root";

  function buildHomeHref(overrides: Record<string, string | undefined>) {
    return withMergedSearchParams("/", {
      session: runtimeSessionId || currentState.sessionId,
      node: initialNodeId ?? currentState.activeNodeId,
      branch: matchedOption.branchId,
      kind: draft.kind,
      target: draft.target,
      timing: draft.timing,
      summary: draft.summary,
      ...overrides,
    });
  }

  async function handleGenerate() {
    const runtimePreset = presetPerturbationMetadata[matchedOption.scenarioKey]?.runtime;
    if (!runtimePreset) {
      setRuntimeError(
        locale === "zh-CN"
          ? "当前扰动还没有接入 runtime 映射。"
          : "This perturbation is not yet connected to runtime."
      );
      return;
    }

    startTransition(async () => {
      try {
        setRuntimeError(null);
        let resolvedSessionId = runtimeSessionId || currentState.sessionId || "";

        if (!resolvedSessionId) {
          const startResponse = await fetch("/api/runtime/start-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              worldId,
              scenarioId: baselineScenarioId,
            }),
          });
          const startPayload = (await startResponse.json()) as {
            error?: string;
            session_id?: string;
          };

          if (!startResponse.ok || !startPayload.session_id) {
            throw new Error(
              startPayload.error ??
                (locale === "zh-CN"
                  ? "启动 runtime session 失败。"
                  : "Failed to start runtime session.")
            );
          }

          resolvedSessionId = startPayload.session_id;
          setRuntimeSessionId(resolvedSessionId);
        }

        const generateResponse = await fetch("/api/runtime/generate-branch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId: resolvedSessionId,
            fromNode: fromNodeId,
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

        if (!generateResponse.ok || !generatePayload.session_id || !generatePayload.active_node_id) {
          throw new Error(
            generatePayload.error ??
              (locale === "zh-CN"
                ? "生成分支失败。"
                : "Failed to generate branch.")
          );
        }

        router.push(
          buildHomeHref({
            session: generatePayload.session_id,
            node: generatePayload.active_node_id,
            branch: matchedOption.branchId,
          })
        );
        router.refresh();
      } catch (error) {
        setRuntimeError(
          error instanceof Error
            ? error.message
            : locale === "zh-CN"
              ? "生成分支失败。"
              : "Failed to generate branch."
        );
      }
    });
  }

  async function handleRollback(targetNodeId: string) {
    const sessionId = runtimeSessionId || currentState.sessionId;
    if (!sessionId) {
      return;
    }

    startTransition(async () => {
      try {
        setRuntimeError(null);
        const rollbackResponse = await fetch("/api/runtime/rollback-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            toNode: targetNodeId,
          }),
        });
        const rollbackPayload = (await rollbackResponse.json()) as {
          error?: string;
          active_node_id?: string;
        };

        if (!rollbackResponse.ok || !rollbackPayload.active_node_id) {
          throw new Error(
            rollbackPayload.error ??
              (locale === "zh-CN"
                ? "回退失败。"
                : "Failed to rollback.")
          );
        }

        router.push(
          buildHomeHref({
            session: sessionId,
            node: rollbackPayload.active_node_id,
          })
        );
        router.refresh();
      } catch (error) {
        setRuntimeError(
          error instanceof Error
            ? error.message
            : locale === "zh-CN"
              ? "回退失败。"
              : "Failed to rollback."
        );
      }
    });
  }

  return (
    <div className="minimalHomeShell">
      <SurfaceCard className="minimalHomePanel minimalHomeCurrentPanel" tone="strong" as="section">
        <div className="interventionCardMeta">
          <StatusPill tone="accent">
            {locale === "zh-CN" ? "当前情况" : "Current state"}
          </StatusPill>
          <StatusPill tone="subtle">{currentState.statusLabel}</StatusPill>
        </div>
        <h1 className="minimalHomeTitle">{currentState.checkpointLabel}</h1>
        <p className="minimalHomeLead">{currentState.summary}</p>
        <div className="contextCardGrid contextCardGridCompact">
          <ContextCard
            label={locale === "zh-CN" ? "世界" : "World"}
            value={currentState.worldName}
            summary={baselineDescription}
            tone="accent"
          />
          <ContextCard
            label={locale === "zh-CN" ? "当前 checkpoint" : "Current checkpoint"}
            value={currentState.checkpointLabel}
            summary={currentState.baselineSummary}
          />
        </div>
        <div className="cardActions minimalHomeActions">
          {currentState.parentNodeId ? (
            <button
              type="button"
              className="simulatorToggle"
              onClick={() => void handleRollback(currentState.parentNodeId!)}
              disabled={isPending}
            >
              {locale === "zh-CN" ? "回退到父节点" : "Rollback to parent"}
            </button>
          ) : null}
          {currentState.activeNodeId &&
          currentState.rootNodeId &&
          currentState.activeNodeId !== currentState.rootNodeId ? (
            <button
              type="button"
              className="simulatorToggle"
              onClick={() => void handleRollback(currentState.rootNodeId!)}
              disabled={isPending}
            >
              {locale === "zh-CN" ? "重置到基线" : "Reset to baseline"}
            </button>
          ) : null}
        </div>
      </SurfaceCard>

      <SurfaceCard className="minimalHomePanel minimalHomePerturbationPanel" tone="accent" as="section">
        <div className="interventionCardMeta">
          <StatusPill tone="accent">
            {locale === "zh-CN" ? "施加的扰动" : "Apply perturbation"}
          </StatusPill>
          <StatusPill tone="subtle">
            {locale === "zh-CN" ? "预设 + 轻编辑" : "Preset + light edit"}
          </StatusPill>
        </div>
        <h2 className="minimalHomePanelTitle">
          {locale === "zh-CN"
            ? "先选一个扰动，再轻量改写。"
            : "Pick one perturbation, then tweak it lightly."}
        </h2>
        <p className="minimalHomePanelSummary">
          {locale === "zh-CN"
            ? "首页只保留最少输入：扰动类型、目标、时机、摘要。生成之后，结果会直接在右侧刷新。"
            : "The homepage keeps only the minimum input: kind, target, timing, and summary. After generation, the result refreshes in place."}
        </p>
        <div className="simulatorPresetRow minimalHomePresetRow">
          {options.map((option) => {
            const active = option.branchId === selectedBranchId;
            return (
              <button
                key={option.branchId}
                type="button"
                className={`simulatorToggle${active ? " simulatorToggleActive" : ""}`}
                onClick={() => setSelectedBranchId(option.branchId)}
              >
                {option.title}
              </button>
            );
          })}
        </div>
        <div className="composerGrid minimalHomeComposerGrid">
          <label className="composerField">
            <span>{locale === "zh-CN" ? "扰动类型" : "Kind"}</span>
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
            <span>{locale === "zh-CN" ? "目标" : "Target"}</span>
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
            <span>{locale === "zh-CN" ? "时机" : "Timing"}</span>
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
            <span>{locale === "zh-CN" ? "摘要" : "Summary"}</span>
            <textarea
              rows={4}
              value={draft.summary}
              placeholder={
                locale === "zh-CN"
                  ? "描述这次扰动会阻断、延后、转移或放大什么。"
                  : "Describe what this perturbation blocks, delays, redirects, or amplifies."
              }
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  summary: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="contextCardGrid contextCardGridCompact">
          <ContextCard
            label={locale === "zh-CN" ? "当前锚点" : "Current anchor"}
            value={matchedOption.title}
            summary={matchedOption.description}
            tone="accent"
          />
        </div>
        <div className="cardActions minimalHomeActions">
          <button
            type="button"
            className="buttonLink buttonLinkPrimary"
            onClick={() => void handleGenerate()}
            disabled={isPending}
          >
            {isPending
              ? locale === "zh-CN"
                ? "正在生成..."
                : "Generating..."
              : locale === "zh-CN"
                ? "生成分支"
                : "Generate branch"}
          </button>
        </div>
        {runtimeError ? <p className="subtle">{runtimeError}</p> : null}
      </SurfaceCard>

      <SurfaceCard className="minimalHomePanel minimalHomeResultPanel" tone="strong" as="section">
        <div className="interventionCardMeta">
          <StatusPill tone="accent">
            {locale === "zh-CN" ? "得到的分支" : "Resulting branch"}
          </StatusPill>
          <StatusPill tone="subtle">
            {result.mode === "ready"
              ? locale === "zh-CN"
                ? "已刷新"
                : "Updated"
              : locale === "zh-CN"
                ? "等待生成"
                : "Waiting"}
          </StatusPill>
        </div>
        <h2 className="minimalHomePanelTitle">{result.title}</h2>
        <p className="minimalHomePanelSummary">{result.summary}</p>
        <div className="contextCardGrid contextCardGridCompact">
          <ContextCard
            label={locale === "zh-CN" ? "这次分支" : "This branch"}
            value={result.title}
            summary={result.branchSummary}
            tone={result.mode === "ready" ? "accent" : "default"}
          />
          {result.firstChangeSummary ? (
            <ContextCard
              label={locale === "zh-CN" ? "第一处变化" : "First visible change"}
              value={result.firstChangeSummary}
              summary={
                locale === "zh-CN"
                  ? "这是用户最先能看到分支偏离基线的地方。"
                  : "This is the first place where the branch visibly departs from baseline."
              }
            />
          ) : null}
        </div>

        {result.mode === "ready" ? (
          <>
            <div className="contextCardGrid">
              {result.outcomeCards.map((card) => (
                <ContextCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  summary={card.detail}
                  tone="strong"
                />
              ))}
            </div>
            <div className="minimalHomeTurnList">
              {result.divergentTurns.map((entry) => (
                <SurfaceCard key={entry.turnLabel} className="minimalHomeTurnCard" as="div">
                  <div className="interventionCardMeta">
                    <StatusPill tone="subtle">{entry.turnLabel}</StatusPill>
                  </div>
                  <strong>{entry.summary}</strong>
                  <p className="subtle">{entry.detail}</p>
                </SurfaceCard>
              ))}
            </div>
            {result.advancedHref ? (
              <div className="cardActions minimalHomeActions">
                <ButtonLink href={result.advancedHref} variant="secondary">
                  Advanced
                </ButtonLink>
              </div>
            ) : null}
          </>
        ) : (
          <div className="cardActions minimalHomeActions">
            <span className="subtle">
              {locale === "zh-CN"
                ? "生成后，这里只显示结果，不显示解释。"
                : "After generation, this panel will show only the result, not the explanation."}
            </span>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
