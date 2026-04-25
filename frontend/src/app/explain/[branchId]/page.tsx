import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BranchHistoryRail } from "../../components/branch-history-rail";
import { ButtonLink } from "../../components/button-link";
import { ContextCard } from "../../components/context-card";
import { PageHero } from "../../components/page-hero";
import { SectionHeading } from "../../components/section-heading";
import { SimulationSessionStrip } from "../../components/simulation-session-strip";
import { StatusPill } from "../../components/status-pill";
import { SurfaceCard } from "../../components/surface-card";
import { WorkbenchTopBar } from "../../components/workbench-top-bar";
import { loadEvidenceExplain } from "../../lib/branch-analysis-data";
import { getCopy } from "../../lib/copy";
import { getAppLocale } from "../../lib/locale";
import { buildMainPathNavigation } from "../../lib/main-path-navigation";
import { presetPerturbationMetadata } from "../../lib/preset-perturbations";
import {
  formatDocumentCount,
  formatEvidenceCount,
  formatRelatedTurnCount,
  friendlyWorldName,
  localizeActionType,
  localizeClaimLabel,
  localizeScenarioTitle
} from "../../lib/presenters";
import { readSimulationSession, withSimulationSession } from "../../lib/simulation-session";
import type { ClaimDrilldown } from "../../lib/workbench-data";

type PageProps = {
  params: Promise<{
    branchId: string;
  }>;
  searchParams?: Promise<{
    branch?: string;
    kind?: string;
    target?: string;
    timing?: string;
    summary?: string;
  }>;
};

function normalizeScenarioKey(scenarioId: string) {
  return scenarioId.startsWith("scenario_") ? scenarioId.slice("scenario_".length) : scenarioId;
}

function summarizeClaimSources(drilldown: ClaimDrilldown) {
  return Array.from(
    drilldown.evidenceChunks.reduce((map, entry) => {
      const key = entry.document?.document_id ?? entry.chunk.document_id;
      const current = map.get(key);
      map.set(key, {
        key,
        title: entry.document?.title ?? entry.chunk.document_id,
        count: (current?.count ?? 0) + 1
      });
      return map;
    }, new Map<string, { key: string; title: string; count: number }>())
  ).map(([, value]) => value);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAppLocale();
  return {
    title: locale === "zh-CN" ? "Mirror 证据解释" : "Mirror Evidence Explain",
    description:
      locale === "zh-CN"
        ? "用论点、相关回合和证据摘录解释某条分支为什么会改变。"
        : "Explain why a branch changed through claims, related turns, and evidence excerpts."
  };
}

export default async function BranchExplainPage({ params, searchParams }: PageProps) {
  const { branchId } = await params;
  const locale = await getAppLocale();
  const copy = getCopy(locale);
  const data = await loadEvidenceExplain(branchId);

  if (!data) {
    notFound();
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const branchTitle = localizeScenarioTitle(
    locale,
    data.overview.run.scenario.scenario_id,
    data.overview.run.scenario.title
  );
  const worldName = friendlyWorldName(locale, data.graph.world_id);
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
        ? presetMetadata?.summary.zh ?? branchTitle
        : presetMetadata?.summary.en ?? branchTitle
  });

  const navigationItems = buildMainPathNavigation(
    locale,
    "explain",
    data.overview.run.branch.branch_id,
    session
  );
  const relatedTurnIdSet = new Set(data.relatedTurnIds);
  const composerHref = withSimulationSession("/perturb", session, {
    branchId: data.overview.run.branch.branch_id
  });
  const changesHref = withSimulationSession(`/changes/${data.overview.run.branch.branch_id}`, session, {
    branchId: data.overview.run.branch.branch_id
  });

  return (
    <main className="workbenchPage">
      <WorkbenchTopBar locale={locale} eyebrow={copy.brand.eyebrow} items={navigationItems} />

      <PageHero
        eyebrow={locale === "zh-CN" ? "证据解释" : "Evidence explain"}
        title={
          locale === "zh-CN"
            ? `${branchTitle} 为什么会这样`
            : `Why ${branchTitle} changes the story`
        }
        lede={
          locale === "zh-CN"
            ? "解释页把关键变化和证据链绑在一起：先看相关论点，再看回合与摘录，最后才打开原始文本。"
            : "The explain view binds the key change to its evidence chain: start with claims, then related turns and excerpts, and only then open the raw text."
        }
        support={
          locale === "zh-CN"
            ? `当前世界：${worldName}。当前分支：${branchTitle}。这里解释的是当前候选分支，不是实时新生成的分支。`
            : `Current world: ${worldName}. Current branch: ${branchTitle}. This page explains the current candidate branch, not a live generated branch.`
        }
        variant="review"
        actions={
          <>
            <ButtonLink href={composerHref} variant="ghost">
              {locale === "zh-CN" ? "继续修改扰动" : "Try another perturbation"}
            </ButtonLink>
            <ButtonLink href={changesHref} variant="primary">
              {locale === "zh-CN" ? "回到变化页" : "Back to changes"}
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
              label={locale === "zh-CN" ? "当前分支" : "Current branch"}
              value={branchTitle}
            />
            <ContextCard
              label={locale === "zh-CN" ? "相关论点" : "Relevant claims"}
              value={String(data.relevantClaims.length)}
            />
            <ContextCard
              label={copy.metrics.divergentTurns}
              value={String(data.overview.divergentTurnCount)}
            />
          </div>
        }
      />

      <SimulationSessionStrip
        locale={locale}
        mode="explain"
        branchId={data.overview.run.branch.branch_id}
        branchTitle={branchTitle}
        session={session}
      />

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "分支历史" : "Branch history"}
          title={
            locale === "zh-CN"
              ? "解释页也应该允许你随时回到基线或切换到别的扰动。"
              : "The explanation page should also let you jump back to baseline or switch to another perturbation."
          }
          description={
            locale === "zh-CN"
              ? "真正的回退与重新生成要等运行时 contract；这里先把分支历史与切换路径固定下来。"
              : "True rollback and regeneration wait for the runtime contract; this layer fixes the branch-history and switching model first."
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
          eyebrow={locale === "zh-CN" ? "解释层" : "Explain layer"}
          title={
            locale === "zh-CN"
              ? "这些论点和证据解释了为什么会出现这条变化。"
              : "These claims and excerpts explain why this branch changes the outcome."
          }
          description={
            locale === "zh-CN"
              ? "这里默认只显示和当前分支分歧回合相关的论点；如果没有直接命中，就退回到当前 compare 的代表性论点。"
              : "This view defaults to claims tied to the branch's divergent turns; if no direct hits exist, it falls back to representative claims in the current compare context."
          }
        />
        <div className="claimSnapshotGrid">
          {data.relevantClaims.map((drilldown) => {
            const sourceDocuments = summarizeClaimSources(drilldown);
            const filteredTurns = drilldown.relatedTurns.filter((entry) =>
              relatedTurnIdSet.has(entry.turn.turn_id)
            );

            return (
              <SurfaceCard
                key={drilldown.claim.claim_id}
                className="claimSnapshotCard claimSnapshotCardExpanded"
                interactive
              >
                <div className="interventionCardMeta">
                  <StatusPill tone="subtle">{drilldown.claim.claim_id}</StatusPill>
                  <StatusPill tone="accent">
                    {localizeClaimLabel(locale, drilldown.claim.label)}
                  </StatusPill>
                </div>
                <div className="artifactChipRow">
                  <StatusPill>{formatEvidenceCount(locale, drilldown.evidenceChunks.length)}</StatusPill>
                  <StatusPill>{formatRelatedTurnCount(locale, filteredTurns.length)}</StatusPill>
                  <StatusPill>{formatDocumentCount(locale, sourceDocuments.length)}</StatusPill>
                </div>
                <p className="subtle">{drilldown.claim.text}</p>

                <div className="subsectionBlock">
                  <h3>{locale === "zh-CN" ? "相关回合" : "Related turns"}</h3>
                  <div className="miniList">
                    {filteredTurns.map((entry) => (
                      <SurfaceCard key={entry.turn.turn_id} className="miniCard" as="article">
                        <strong>{entry.turn.turn_id}</strong>
                        <p>
                          {localizeActionType(locale, entry.turn.action_type)}
                          {" / "}
                          {entry.turn.rationale}
                        </p>
                      </SurfaceCard>
                    ))}
                  </div>
                </div>

                <div className="subsectionBlock">
                  <h3>{locale === "zh-CN" ? "来源文档" : "Source documents"}</h3>
                  <div className="miniList">
                    {sourceDocuments.map((document) => (
                      <SurfaceCard key={document.key} className="miniCard" as="article">
                        <strong>{document.title}</strong>
                        <p>
                          {locale === "zh-CN"
                            ? `关联 ${document.count} 条证据摘录`
                            : `${document.count} linked evidence excerpt${document.count === 1 ? "" : "s"}`}
                        </p>
                      </SurfaceCard>
                    ))}
                  </div>
                </div>

                <details className="inlineDetails">
                  <summary className="inlineDetailsSummary">
                    {locale === "zh-CN" ? "打开原始摘录" : "Open raw excerpts"}
                  </summary>
                  <div className="inlineDetailsBody">
                    <div className="miniList">
                      {drilldown.evidenceChunks.map(({ chunk, document }) => (
                        <SurfaceCard key={chunk.chunk_id} className="miniCard" as="article">
                          <strong>{document?.title ?? chunk.document_id}</strong>
                          <p>{chunk.text}</p>
                        </SurfaceCard>
                      ))}
                    </div>
                  </div>
                </details>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <div className="dashboardSplit">
        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "返回路径" : "Route back"}
            title={
              locale === "zh-CN"
                ? "解释看清之后，回到变化页或进入 Analyst Mode。"
                : "Once the explanation is clear, return to the changes page or open Analyst Mode."
            }
          />
          <SurfaceCard className="dashboardCallout" tone="accent">
            <div className="cardActions">
              <ButtonLink href={composerHref} variant="ghost">
                {locale === "zh-CN" ? "回到扰动编辑器" : "Return to composer"}
              </ButtonLink>
              <ButtonLink href={changesHref} variant="primary">
                {locale === "zh-CN" ? "回到变化页" : "Back to changes"}
              </ButtonLink>
              <ButtonLink href="/review" variant="secondary">
                {locale === "zh-CN" ? "打开 Analyst Mode" : "Open Analyst Mode"}
              </ButtonLink>
            </div>
          </SurfaceCard>
        </section>

        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "切换分支" : "Switch branch"}
            title={
              locale === "zh-CN"
                ? "如果你要比较另一条扰动，可以直接跳到它的解释页。"
                : "If you want to compare another perturbation, jump straight to its explain page."
            }
          />
          <div className="miniList">
            {data.branchOptions
              .filter((option) => option.branchId !== data.overview.run.branch.branch_id)
              .map((option) => (
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
