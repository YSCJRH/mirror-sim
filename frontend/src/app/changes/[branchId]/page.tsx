import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BranchHistoryRail } from "../../components/branch-history-rail";
import { BranchComparisonBoard } from "../../components/branch-comparison-board";
import { ButtonLink } from "../../components/button-link";
import { ContextCard } from "../../components/context-card";
import { PageHero } from "../../components/page-hero";
import { SectionHeading } from "../../components/section-heading";
import { SimulationSessionStrip } from "../../components/simulation-session-strip";
import { StatusPill } from "../../components/status-pill";
import { SurfaceCard } from "../../components/surface-card";
import { WorkbenchTopBar } from "../../components/workbench-top-bar";
import { loadBranchChangeExplorer } from "../../lib/branch-analysis-data";
import { getCopy } from "../../lib/copy";
import { getAppLocale } from "../../lib/locale";
import { buildMainPathNavigation } from "../../lib/main-path-navigation";
import { presetPerturbationMetadata } from "../../lib/preset-perturbations";
import {
  formatDeltaLabel,
  formatTurn,
  friendlyWorldName,
  localizeActionType,
  localizeScenarioDescription,
  localizeScenarioTitle
} from "../../lib/presenters";
import { readSimulationSession, withSimulationSession } from "../../lib/simulation-session";

type PageProps = {
  params: Promise<{
    branchId: string;
  }>;
  searchParams?: Promise<{
    branch?: string;
    compare?: string;
    kind?: string;
    target?: string;
    timing?: string;
    summary?: string;
  }>;
};

function numericTurn(value: unknown) {
  return typeof value === "number" ? value : null;
}

function normalizeScenarioKey(scenarioId: string) {
  return scenarioId.startsWith("scenario_") ? scenarioId.slice("scenario_".length) : scenarioId;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  return {
    title: locale === "zh-CN" ? "Mirror 分支变化" : "Mirror Branch Changes",
    description:
      locale === "zh-CN"
        ? "查看某条扰动分支相对基线到底改变了什么。"
        : "Inspect what one perturbation branch changes relative to the baseline."
  };
}

export default async function BranchChangePage({ params, searchParams }: PageProps) {
  const { branchId } = await params;
  const locale = await getAppLocale();
  const copy = getCopy(locale);
  const data = await loadBranchChangeExplorer(branchId);

  if (!data) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const worldName = friendlyWorldName(locale, data.graph.world_id);
  const branchTitle = localizeScenarioTitle(
    locale,
    data.overview.run.scenario.scenario_id,
    data.overview.run.scenario.title
  );
  const branchDescription = localizeScenarioDescription(
    locale,
    data.overview.run.scenario.scenario_id,
    data.overview.run.scenario.description
  );
  const presetMetadata =
    presetPerturbationMetadata[normalizeScenarioKey(data.overview.run.scenario.scenario_id)];
  const session = readSimulationSession(resolvedSearchParams, {
    branchId: data.overview.run.branch.branch_id,
    kind:
      locale === "zh-CN"
        ? presetMetadata?.kind.zh ?? "预设扰动"
        : presetMetadata?.kind.en ?? "Preset perturbation",
    target:
      locale === "zh-CN"
        ? presetMetadata?.target.zh ?? worldName
        : presetMetadata?.target.en ?? worldName,
    timing:
      locale === "zh-CN"
        ? presetMetadata?.timing.zh ?? "当前窗口"
        : presetMetadata?.timing.en ?? "Current window",
    summary:
      locale === "zh-CN"
        ? presetMetadata?.summary.zh ?? branchDescription
        : presetMetadata?.summary.en ?? branchDescription
  });

  const navigationItems = buildMainPathNavigation(
    locale,
    "changes",
    data.overview.run.branch.branch_id,
    session
  );
  const budgetOutcome = data.overview.delta.outcome_deltas.budget_exposed_turn ?? {
    reference: null,
    candidate: null
  };
  const ledgerOutcome = data.overview.delta.outcome_deltas.ledger_public_turn ?? {
    reference: null,
    candidate: null
  };
  const evacuationOutcome = data.overview.delta.outcome_deltas.evacuation_turn ?? {
    reference: null,
    candidate: null
  };
  const otherBranches = data.branchOptions.filter((option) => option.branchId !== data.overview.run.branch.branch_id);
  const compareBranchId =
    resolvedSearchParams?.compare &&
    data.comparisonOverviews.some((overview) => overview.run.branch.branch_id === resolvedSearchParams.compare)
      ? resolvedSearchParams.compare
      : otherBranches[0]?.branchId;
  const compareOverview =
    data.comparisonOverviews.find((overview) => overview.run.branch.branch_id === compareBranchId) ?? null;
  const composerHref = withSimulationSession("/perturb", session, {
    branchId: data.overview.run.branch.branch_id
  });
  const explainHref = withSimulationSession(`/explain/${data.overview.run.branch.branch_id}`, session, {
    branchId: data.overview.run.branch.branch_id
  });

  const outcomeCards = [
    {
      label: locale === "zh-CN" ? "预算曝光" : "Budget exposure",
      delta: formatDeltaLabel(locale, data.overview.budgetExposureDelta),
      reference: formatTurn(locale, numericTurn(budgetOutcome.reference)),
      candidate: formatTurn(locale, numericTurn(budgetOutcome.candidate))
    },
    {
      label: locale === "zh-CN" ? "账本公开" : "Ledger publication",
      delta: formatDeltaLabel(locale, data.overview.ledgerDelta),
      reference: formatTurn(locale, numericTurn(ledgerOutcome.reference)),
      candidate: formatTurn(locale, numericTurn(ledgerOutcome.candidate))
    },
    {
      label: locale === "zh-CN" ? "疏散触发" : "Evacuation",
      delta: formatDeltaLabel(locale, data.overview.evacuationDelta),
      reference: formatTurn(locale, numericTurn(evacuationOutcome.reference)),
      candidate: formatTurn(locale, numericTurn(evacuationOutcome.candidate))
    }
  ];

  return (
    <main className="workbenchPage">
      <WorkbenchTopBar locale={locale} eyebrow={copy.brand.eyebrow} items={navigationItems} />

      <PageHero
        eyebrow={locale === "zh-CN" ? "关键变化" : "Branch changes"}
        title={
          locale === "zh-CN"
            ? `${branchTitle} 如何改写基线故事`
            : `${branchTitle} rewrites the baseline story`
        }
        lede={
          locale === "zh-CN"
            ? `你现在看到的是 ${worldName} 里的当前候选分支。这里先回答结果改了什么、从哪一回合开始偏离，再决定要不要进入解释或 Analyst Mode。`
            : `You are looking at the current candidate branch in ${worldName}. This page answers what changed and where the branch first diverged before you open explanation or Analyst Mode.`
        }
        support={
          locale === "zh-CN"
            ? `${branchDescription} 现在这一步仍然是预设分支映射，还不是运行时实时生成。`
            : `${branchDescription} This stage still uses preset branch mapping rather than live runtime generation.`
        }
        variant="review"
        actions={
          <>
            <ButtonLink href={composerHref} variant="ghost">
              {locale === "zh-CN" ? "继续修改扰动" : "Try another perturbation"}
            </ButtonLink>
            <ButtonLink href={explainHref} variant="primary">
              {locale === "zh-CN" ? "解释这条变化" : "Explain this change"}
            </ButtonLink>
            <ButtonLink href="/review" variant="secondary">
              {locale === "zh-CN" ? "打开 Analyst Mode" : "Open Analyst Mode"}
            </ButtonLink>
          </>
        }
        aside={
          <div className="contextCardGrid contextCardGridCompact">
            <ContextCard label={copy.brand.worldLabel} value={worldName} tone="accent" />
            <ContextCard
              label={locale === "zh-CN" ? "当前扰动" : "Current perturbation"}
              value={branchTitle}
            />
            <ContextCard
              label={copy.metrics.divergentTurns}
              value={String(data.overview.divergentTurnCount)}
            />
            <ContextCard
              label={copy.brand.compareArtifactLabel}
              value={data.compareArtifact.compare_id}
              code
            />
          </div>
        }
      />

      <SimulationSessionStrip
        locale={locale}
        mode="changes"
        branchId={data.overview.run.branch.branch_id}
        branchTitle={branchTitle}
        session={session}
      />

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "分支历史" : "Branch history"}
          title={
            locale === "zh-CN"
              ? "把当前分支放回基线与其他扰动的历史里看。"
              : "Place the current branch back into its baseline and sibling history."
          }
          description={
            locale === "zh-CN"
              ? "这里先固定未来模拟器里的回退与重试心智；真正的 checkpoint 回退要等下一阶段 contract。"
              : "This fixes the rollback and refork mental model first. True checkpoint rollback waits for the next contract phase."
          }
        />
        <BranchHistoryRail
          locale={locale}
          baselineTitle={localizeScenarioTitle(
            locale,
            data.baselineRun.scenario.scenario_id,
            data.baselineRun.scenario.title
          )}
          currentBranchId={data.overview.run.branch.branch_id}
          currentBranchTitle={branchTitle}
          session={session}
          branches={data.branchOptions.map((option) => ({
            branchId: option.branchId,
            title: localizeScenarioTitle(locale, option.scenarioId, option.title)
          }))}
        />
      </section>

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "变化摘要" : "Change summary"}
          title={
            locale === "zh-CN"
              ? "先读关键变化，再决定是否需要完整解释。"
              : "Read the key changes first, then decide whether you need the full explanation."
          }
          description={
            locale === "zh-CN"
              ? "这一层优先回答结果有没有变、变化幅度有多大，以及风险认知是否改道。"
              : "This layer answers whether outcomes moved, how much they moved, and whether risk awareness rerouted."
          }
        />
        <div className="routeBoard">
          {data.overview.summaryLines.map((line, index) => (
            <SurfaceCard key={line} className="routeCard" interactive>
              <StatusPill tone={index === 3 ? "accent" : "subtle"}>
                {index === 3
                  ? locale === "zh-CN"
                    ? "认知传播"
                    : "Knowledge shift"
                  : locale === "zh-CN"
                    ? "结果变化"
                    : "Outcome shift"}
              </StatusPill>
              <p>{line}</p>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "结果对比" : "Outcome deltas"}
          title={
            locale === "zh-CN"
              ? "把基线时间点和扰动时间点放在一起看。"
              : "Put the baseline timing and perturbation timing side by side."
          }
          description={
            locale === "zh-CN"
              ? "这一组卡片只讲结果层，不把你拖进整条轨迹。"
              : "These cards stay at the outcome layer instead of dragging you into the full trace."
          }
        />
        <div className="contextCardGrid">
          {outcomeCards.map((card) => (
            <SurfaceCard key={card.label} className="contextCard" tone="strong" as="article">
              <span className="contextCardLabel">{card.label}</span>
              <strong className="contextCardValue">{card.delta}</strong>
              <p className="contextCardSummary">
                {locale === "zh-CN"
                  ? `基线 ${card.reference} / 扰动 ${card.candidate}`
                  : `Baseline ${card.reference} / Perturbation ${card.candidate}`}
              </p>
            </SurfaceCard>
          ))}
          <SurfaceCard className="contextCard" tone="accent" as="article">
            <span className="contextCardLabel">
              {locale === "zh-CN" ? "分支特征" : "Branch signature"}
            </span>
            <strong className="contextCardValue">
              {data.overview.routeOnly
                ? locale === "zh-CN"
                  ? "纯路径漂移"
                  : "Route-only drift"
                : locale === "zh-CN"
                  ? "结果已改写"
                  : "Outcome rewritten"}
            </strong>
            <p className="contextCardSummary">
              {data.overview.knowledgeShift
                ? locale === "zh-CN"
                  ? "风险认知传播也发生了变化。"
                  : "Risk-awareness propagation changed as well."
                : locale === "zh-CN"
                  ? "风险认知集合仍与基线一致。"
                  : "Risk-awareness set stays aligned with baseline."}
            </p>
          </SurfaceCard>
        </div>
      </section>

      {compareOverview ? (
        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "分支对比" : "Branch comparison"}
            title={
              locale === "zh-CN"
                ? "把当前扰动和另一条候选分支并排放在同一个实验里比较。"
                : "Put the current perturbation beside another candidate branch inside the same experiment."
            }
            description={
              locale === "zh-CN"
                ? "这层让你不用反复跳页，也能看清不同扰动会把世界往哪里推。"
                : "This layer lets you compare how different perturbations push the world without bouncing between pages."
            }
          />
          <BranchComparisonBoard
            locale={locale}
            currentOverview={data.overview}
            compareOverview={compareOverview}
            compareOptions={data.comparisonOverviews.filter(
              (overview) => overview.run.branch.branch_id !== data.overview.run.branch.branch_id
            )}
            session={session}
          />
        </section>
      ) : null}

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "分歧回合" : "Divergent turns"}
          title={
            locale === "zh-CN"
              ? "只看真正分歧的回合，不重读整条故事线。"
              : "Inspect only the turns that actually diverge instead of replaying the whole story."
          }
        />
        <div className="storyboardRows">
          {data.overview.rows.map((row) => (
            <SurfaceCard key={`${data.overview.run.key}-${row.turnIndex}`} className="storyboardRow" as="div">
              <div className="storyboardRowTop">
                <strong>T{row.turnIndex}</strong>
                <StatusPill tone="subtle">{data.overview.run.branch.branch_id}</StatusPill>
              </div>
              <div className="storyboardColumns">
                <div className="storyboardTurn">
                  <span>{copy.common.baseline}</span>
                  {row.reference ? (
                    <>
                      <strong>{localizeActionType(locale, row.reference.turn.action_type)}</strong>
                      <p>{row.reference.turn.rationale}</p>
                    </>
                  ) : (
                    <p>{copy.review.noDivergence}</p>
                  )}
                </div>
                <div className="storyboardTurn">
                  <span>{copy.common.candidate}</span>
                  {row.candidate ? (
                    <>
                      <strong>{localizeActionType(locale, row.candidate.turn.action_type)}</strong>
                      <p>{row.candidate.turn.rationale}</p>
                    </>
                  ) : (
                    <p>{copy.review.noDivergence}</p>
                  )}
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <div className="dashboardSplit">
        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "下一步" : "Next step"}
            title={
              locale === "zh-CN"
                ? "变化看清之后，再决定是否进入解释或高级分析。"
                : "Once the change is clear, decide whether you need explanation or advanced analysis."
            }
          />
          <SurfaceCard className="dashboardCallout" tone="accent">
            <div className="cardActions">
              <ButtonLink href={composerHref} variant="ghost">
                {locale === "zh-CN" ? "回到扰动编辑器" : "Return to composer"}
              </ButtonLink>
              <ButtonLink href={explainHref} variant="primary">
                {locale === "zh-CN" ? "打开解释页面" : "Open explanation"}
              </ButtonLink>
              <ButtonLink href="/review" variant="secondary">
                {locale === "zh-CN" ? "打开 Analyst Mode" : "Open Analyst Mode"}
              </ButtonLink>
            </div>
          </SurfaceCard>
        </section>

        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "其他扰动" : "Other perturbations"}
            title={
              locale === "zh-CN"
                ? "如果你要横向比较，可以从这里切到其他分支。"
                : "Switch here if you want to compare another perturbation branch."
            }
          />
          <div className="miniList">
            {otherBranches.map((option) => (
              <SurfaceCard key={option.branchId} className="miniCard" as="article">
                <strong>{localizeScenarioTitle(locale, option.scenarioId, option.title)}</strong>
                <div className="cardActions">
                  <ButtonLink
                    href={withSimulationSession(`/changes/${option.branchId}`, session, {
                      branchId: option.branchId
                    })}
                    variant="ghost"
                  >
                    {locale === "zh-CN" ? "查看变化" : "View changes"}
                  </ButtonLink>
                  <ButtonLink
                    href={withSimulationSession(`/explain/${option.branchId}`, session, {
                      branchId: option.branchId
                    })}
                    variant="ghost"
                  >
                    {locale === "zh-CN" ? "查看解释" : "View explanation"}
                  </ButtonLink>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
