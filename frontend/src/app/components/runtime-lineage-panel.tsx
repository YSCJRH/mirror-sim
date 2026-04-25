import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { RuntimeLineageEntry } from "../lib/runtime-session-data";
import type { LocalizedRuntimePerturbation } from "../lib/world-product-data";

type RuntimeLineagePanelProps = {
  locale: "en" | "zh-CN";
  lineage: RuntimeLineageEntry[];
  currentNodeId: string;
  labelForNode?: (node: RuntimeLineageEntry["node"]) => string;
  describePerturbation?: (
    node: RuntimeLineageEntry["node"]
  ) => LocalizedRuntimePerturbation | null;
};

function summarizeParameters(parameters?: Record<string, unknown>) {
  if (!parameters) {
    return [];
  }

  return Object.entries(parameters)
    .filter(([, value]) => value !== null && value !== undefined && `${value}`.trim().length > 0)
    .map(([key, value]) => `${key}: ${String(value)}`);
}

export function RuntimeLineagePanel({
  locale,
  lineage,
  currentNodeId,
  labelForNode,
  describePerturbation,
}: RuntimeLineagePanelProps) {
  return (
    <div className="branchComparisonGrid">
      {lineage.map((entry) => {
        const active = entry.node.node_id === currentNodeId;
        const parameterLines = summarizeParameters(entry.node.perturbation?.parameters);
        const displayLabel = labelForNode ? labelForNode(entry.node) : entry.node.label;
        const perturbation = describePerturbation
          ? describePerturbation(entry.node)
          : entry.node.perturbation
            ? {
                kind: entry.node.perturbation.kind,
                target: entry.node.perturbation.target_id,
                timing: entry.node.perturbation.timing,
                summary: entry.node.perturbation.summary,
              }
            : null;

        return (
          <SurfaceCard
            key={entry.node.node_id}
            className="branchComparisonCard"
            tone={active ? "accent" : "strong"}
            as="article"
            >
            <div className="interventionCardMeta">
              <StatusPill tone={active ? "accent" : "subtle"}>
                {entry.isRoot
                  ? locale === "zh-CN"
                    ? "基线"
                    : "Baseline"
                  : locale === "zh-CN"
                    ? `扰动 ${entry.depth}`
                    : `Perturbation ${entry.depth}`}
              </StatusPill>
              <StatusPill tone="subtle">{entry.node.node_id}</StatusPill>
            </div>
            <h3>{displayLabel}</h3>
            {entry.isRoot ? (
              <p className="subtle">
                {locale === "zh-CN"
                  ? "这是这次实验的起点，也是所有后续分叉共享的共同基线。"
                  : "This is the root checkpoint for the session and the shared starting point for all later branches."}
              </p>
            ) : (
              <>
                <div className="artifactChipRow">
                  <StatusPill>{perturbation?.kind ?? "unknown"}</StatusPill>
                  <StatusPill>{perturbation?.target ?? "unknown"}</StatusPill>
                  <StatusPill>{perturbation?.timing ?? "unknown"}</StatusPill>
                </div>
                <p className="subtle">{perturbation?.summary ?? displayLabel}</p>
                {parameterLines.length > 0 ? (
                  <div className="miniList">
                    {parameterLines.map((line) => (
                      <SurfaceCard key={line} className="miniCard" as="div">
                        <p>{line}</p>
                      </SurfaceCard>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </SurfaceCard>
        );
      })}
    </div>
  );
}
