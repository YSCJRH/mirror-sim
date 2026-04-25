import { ButtonLink } from "./button-link";
import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { AppLocale } from "../lib/locale-shared";
import type { ComparisonOverview } from "../lib/workbench-data";
import type { SimulationSession } from "../lib/simulation-session";
import { buildSimulationSessionQuery, withMergedSearchParams } from "../lib/simulation-session";

type BranchComparisonBoardProps = {
  locale: AppLocale;
  currentOverview: ComparisonOverview;
  compareOverview: ComparisonOverview;
  compareOptions: ComparisonOverview[];
  session: SimulationSession;
};

function metricPills(locale: AppLocale, overview: ComparisonOverview) {
  const turnLabel = locale === "zh-CN" ? "分歧回合" : "Divergent turns";
  const budgetLabel = locale === "zh-CN" ? "预算曝光" : "Budget exposure";
  const ledgerLabel = locale === "zh-CN" ? "账本公开" : "Ledger publication";
  const evacuationLabel = locale === "zh-CN" ? "疏散触发" : "Evacuation";
  const formatDelta = (value: number | null) => {
    if (value === null) {
      return locale === "zh-CN" ? "无变化" : "No change";
    }
    if (value === 0) {
      return locale === "zh-CN" ? "同基线" : "Same as baseline";
    }

    const prefix = value > 0 ? "+" : "";
    return locale === "zh-CN" ? `${prefix}${value} 回合` : `${prefix}${value} turns`;
  };

  return [
    `${turnLabel}: ${overview.divergentTurnCount}`,
    `${budgetLabel}: ${formatDelta(overview.budgetExposureDelta)}`,
    `${ledgerLabel}: ${formatDelta(overview.ledgerDelta)}`,
    `${evacuationLabel}: ${formatDelta(overview.evacuationDelta)}`
  ];
}

export function BranchComparisonBoard({
  locale,
  currentOverview,
  compareOverview,
  compareOptions,
  session
}: BranchComparisonBoardProps) {
  const currentBranchId = currentOverview.run.branch.branch_id;
  const currentBranchTitle = currentOverview.run.scenario.title;
  const compareBranchId = compareOverview.run.branch.branch_id;
  const compareBranchTitle = compareOverview.run.scenario.title;
  const sessionQuery = buildSimulationSessionQuery(session);

  return (
    <div className="branchComparisonBoard">
      <div className="branchComparisonSelectorRow">
        {compareOptions.map((option) => {
          const active = option.run.branch.branch_id === compareBranchId;
          const href = withMergedSearchParams(`/changes/${currentBranchId}`, {
            ...Object.fromEntries(new URLSearchParams(sessionQuery).entries()),
            branch: currentBranchId,
            compare: option.run.branch.branch_id
          });

          return (
            <ButtonLink
              key={option.run.branch.branch_id}
              href={href}
              variant={active ? "primary" : "ghost"}
            >
              {option.run.scenario.title}
            </ButtonLink>
          );
        })}
      </div>

      <div className="branchComparisonGrid">
        <SurfaceCard className="branchComparisonCard" tone="accent" as="article">
          <div className="interventionCardMeta">
            <StatusPill tone="accent">
              {locale === "zh-CN" ? "当前分支" : "Current branch"}
            </StatusPill>
            <StatusPill tone="subtle">{currentBranchId}</StatusPill>
          </div>
          <h3>{currentBranchTitle}</h3>
          <p>{currentOverview.run.scenario.description}</p>
          <div className="deltaBadgeRow">
            {metricPills(locale, currentOverview).map((pill) => (
              <StatusPill key={pill}>{pill}</StatusPill>
            ))}
          </div>
          <ul className="summaryList">
            {currentOverview.summaryLines.slice(0, 3).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </SurfaceCard>

        <SurfaceCard className="branchComparisonCard" tone="strong" as="article">
          <div className="interventionCardMeta">
            <StatusPill tone="subtle">
              {locale === "zh-CN" ? "对比分支" : "Comparison branch"}
            </StatusPill>
            <StatusPill tone="subtle">{compareBranchId}</StatusPill>
          </div>
          <h3>{compareBranchTitle}</h3>
          <p>{compareOverview.run.scenario.description}</p>
          <div className="deltaBadgeRow">
            {metricPills(locale, compareOverview).map((pill) => (
              <StatusPill key={pill}>{pill}</StatusPill>
            ))}
          </div>
          <ul className="summaryList">
            {compareOverview.summaryLines.slice(0, 3).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </SurfaceCard>
      </div>
    </div>
  );
}
