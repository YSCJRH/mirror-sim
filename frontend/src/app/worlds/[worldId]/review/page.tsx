import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "../../../components/button-link";
import { ContextCard } from "../../../components/context-card";
import { ReviewRubricPanel } from "../../../components/review-rubric-panel";
import { RuntimeDecisionContextCard } from "../../../components/runtime-decision-context-card";
import { RuntimeLineagePanel } from "../../../components/runtime-lineage-panel";
import { RuntimeReviewBrief } from "../../../components/runtime-review-brief";
import { SectionHeading } from "../../../components/section-heading";
import { SurfaceCard } from "../../../components/surface-card";
import { WorkbenchTopBar } from "../../../components/workbench-top-bar";
import { getAppLocale } from "../../../lib/locale";
import {
  findLatestRuntimeSessionForWorld,
  loadRuntimeSessionWorkspaceForWorld,
} from "../../../lib/runtime-session-data";
import {
  loadProductWorldConfig,
  localizeRuntimeNodeLabel,
  localizeRuntimePerturbation,
} from "../../../lib/world-product-data";
import type { RubricRow } from "../../../lib/workbench-data";

type PageProps = {
  params: Promise<{ worldId: string }>;
  searchParams?: Promise<{ session?: string; node?: string }>;
};

function getAlphaRubricRows(locale: "en" | "zh-CN"): RubricRow[] {
  if (locale === "zh-CN") {
    return [
      {
        dimension: "有用性",
        one: "看起来还像占位结果。",
        three: "已经能看出分支差异，但还不足以放心交接。",
        five: "这条分支改了什么、下一步该做什么都很清楚。",
      },
      {
        dimension: "可信度",
        one: "支撑还比较弱，或者推断感太强。",
        three: "整体基本站得住，但关键缺口仍要核查。",
        five: "这条分支已经足够扎实，能支撑受控 Alpha 流程里的判断。",
      },
      {
        dimension: "可解释性",
        one: "很难沿着回合、解释链和证据追溯回来。",
        three: "大体能看懂推理路径，但还不够顺手。",
        five: "可以沿着结果页、解释页和报告页把这条分支讲清楚。",
      },
      {
        dimension: "可操作性",
        one: "看完之后仍然不知道下一步该做什么。",
        three: "大致有方向，但后续动作还不够明确。",
        five: "这条分支已经能支撑清楚的产品或操作判断。",
      },
    ];
  }

  return [
    {
      dimension: "Usefulness",
      one: "Still reads like a placeholder result.",
      three: "Shows a usable branch difference, but not enough to hand off confidently.",
      five: "Makes the branch impact and next action obvious.",
    },
    {
      dimension: "Credibility",
      one: "Feels weakly grounded or too speculative.",
      three: "Mostly grounded, but key gaps still need checking.",
      five: "The branch is grounded enough to trust for a controlled alpha workflow.",
    },
    {
      dimension: "Explainability",
      one: "Hard to trace back to turns, claims, or evidence.",
      three: "The reasoning path is partly readable.",
      five: "The branch can be replayed and explained clearly through runtime surfaces.",
    },
    {
      dimension: "Actionability",
      one: "No clear next action from this branch.",
      three: "There is a direction, but follow-up is still fuzzy.",
      five: "The branch supports a clear next product or operator decision.",
    },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ worldId: string }>;
}): Promise<Metadata> {
  const { worldId } = await params;
  const locale = await getAppLocale();
  const { product } = await loadProductWorldConfig(worldId, locale);
  return {
    title:
      locale === "zh-CN"
        ? `${product.world_name} | Mirror 审阅`
        : `${product.world_name} | Mirror Advanced Review`,
    description:
      locale === "zh-CN"
        ? "对当前世界的分支结果做审阅、评分和进一步判断。"
        : "Advanced review entry for one bounded world.",
  };
}

export default async function WorldReviewPage({ params, searchParams }: PageProps) {
  const { worldId } = await params;
  const locale = await getAppLocale();
  const alphaRubricRows = getAlphaRubricRows(locale);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  try {
    const [{ product }, latestSession] = await Promise.all([
      loadProductWorldConfig(worldId, locale),
      resolvedSearchParams?.session ? Promise.resolve(null) : findLatestRuntimeSessionForWorld(worldId),
    ]);
    const sessionId = resolvedSearchParams?.session ?? latestSession?.sessionId;
    const fallbackNodeId = resolvedSearchParams?.node ?? latestSession?.activeNodeId;
    const runtimeWorkspace = sessionId
      ? await loadRuntimeSessionWorkspaceForWorld(worldId, sessionId, fallbackNodeId)
      : null;

    const activeNode = runtimeWorkspace?.selectedNode ?? null;
    const runtimeHref =
      runtimeWorkspace && activeNode
        ? `/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}?node=${encodeURIComponent(activeNode.node_id)}`
        : undefined;
    const explainHref =
      runtimeWorkspace && activeNode
        ? `/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}/explain?node=${encodeURIComponent(activeNode.node_id)}`
        : undefined;
    const reportHref =
      runtimeWorkspace && activeNode
        ? `/worlds/${worldId}/runtime/${runtimeWorkspace.session.session_id}/report?node=${encodeURIComponent(activeNode.node_id)}`
        : undefined;
    const perturbHref =
      runtimeWorkspace && activeNode
        ? `/worlds/${worldId}/perturb?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(activeNode.node_id)}`
        : `/worlds/${worldId}/perturb`;
    const worldHref =
      runtimeWorkspace && activeNode
        ? `/worlds/${worldId}?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}&node=${encodeURIComponent(activeNode.node_id)}`
        : `/worlds/${worldId}`;
    const reviewHref =
      runtimeWorkspace?.session.session_id
        ? `/worlds/${worldId}/review?session=${encodeURIComponent(runtimeWorkspace.session.session_id)}${activeNode ? `&node=${encodeURIComponent(activeNode.node_id)}` : ""}`
        : `/worlds/${worldId}/review`;

    return (
      <main className="workbenchPage reviewPage">
        <WorkbenchTopBar
          locale={locale}
          eyebrow={locale === "zh-CN" ? "Mirror 引擎 / 私有 Beta" : "Mirror Engine / Private Beta"}
          items={[
            { href: "/", label: locale === "zh-CN" ? "世界入口" : "Launch Hub", active: false },
            { href: worldHref, label: locale === "zh-CN" ? "世界" : "World", active: false },
            { href: perturbHref, label: locale === "zh-CN" ? "扰动" : "Perturb", active: false },
            { href: reviewHref, label: locale === "zh-CN" ? "审阅" : "Review", active: true },
          ]}
        />

        <section className="dashboardSection dashboardSectionAccent">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "后台审阅" : "Advanced review"}
            title={
              locale === "zh-CN"
                ? `${product.world_name} 的审阅页`
                : `Alpha review for ${product.world_name}`
            }
            description={
              activeNode
                ? locale === "zh-CN"
                  ? "先做一轮审阅，再决定要不要继续看结果、解释或报告。"
                  : "This is the world-scoped advanced review surface: score first, then decide whether you need runtime / explain / report."
                : locale === "zh-CN"
                  ? "这个世界还没有当前分支。先进入扰动台生成一条分支，再回来做审阅。"
                  : "This world does not yet have an active live session. Generate one live branch in the perturb workspace first, then come back for advanced review."
            }
          />
          <div className="contextCardGrid">
            <ContextCard
              label={locale === "zh-CN" ? "世界" : "World"}
              value={product.world_name}
              summary={product.world_summary}
              tone="accent"
            />
            <ContextCard
              label={locale === "zh-CN" ? "基线故事" : "Baseline"}
              value={product.baseline_title}
              summary={product.baseline_description}
            />
            {runtimeWorkspace ? (
              <>
                <ContextCard label={locale === "zh-CN" ? "实验编号" : "Session"} value={runtimeWorkspace.session.session_id} code />
                <ContextCard label={locale === "zh-CN" ? "分支编号" : "Node"} value={activeNode?.node_id ?? runtimeWorkspace.session.active_node_id} code />
              </>
            ) : null}
            {runtimeWorkspace ? (
              <RuntimeDecisionContextCard
                locale={locale}
                summary={runtimeWorkspace.decisionSummary}
                configuredProvider={runtimeWorkspace.session.decision_config?.provider}
                configuredModel={runtimeWorkspace.session.decision_config?.model_id}
              />
            ) : null}
          </div>
          <div className="cardActions">
            <ButtonLink href={perturbHref} variant="primary">
              {locale === "zh-CN" ? "打开扰动台" : "Open perturb"}
            </ButtonLink>
            {runtimeHref ? (
              <ButtonLink href={runtimeHref} variant="secondary">
                {locale === "zh-CN" ? "回到结果页" : "Back to runtime"}
              </ButtonLink>
            ) : null}
            {explainHref ? (
              <ButtonLink href={explainHref} variant="ghost">
                {locale === "zh-CN" ? "查看解释" : "Open explain"}
              </ButtonLink>
            ) : null}
            {reportHref ? (
              <ButtonLink href={reportHref} variant="ghost">
                {locale === "zh-CN" ? "查看报告" : "Open report"}
              </ButtonLink>
            ) : null}
          </div>
        </section>

        {runtimeWorkspace ? (
          <>
            <ReviewRubricPanel
              locale={locale}
              rubricRows={alphaRubricRows}
              claimCount={runtimeWorkspace.relevantClaims.length}
              divergentTurnCount={runtimeWorkspace.rows.length}
              evalName="runtime_beta_review"
              evalStatus="pending"
              followupHref={runtimeHref ?? explainHref ?? reportHref}
              followupLabel={locale === "zh-CN" ? "继续查看详情" : "Open next surface"}
            />

            <RuntimeReviewBrief
              locale={locale}
              product={product}
              workspace={runtimeWorkspace}
              explainHref={explainHref}
              reportHref={reportHref}
            />

            <section className="dashboardSection">
              <SectionHeading
                eyebrow={locale === "zh-CN" ? "扰动谱系" : "Perturbation lineage"}
                title={
                  locale === "zh-CN"
                    ? "先看这条分支是从哪些扰动叠出来的"
                    : "Read the cumulative perturbation chain behind this branch first"
                }
              />
              <RuntimeLineagePanel
                locale={locale}
                lineage={runtimeWorkspace.lineage}
                currentNodeId={activeNode?.node_id ?? runtimeWorkspace.session.active_node_id}
                labelForNode={(node) => localizeRuntimeNodeLabel(product, node, locale)}
                describePerturbation={(node) => localizeRuntimePerturbation(product, node)}
              />
            </section>

            <section className="dashboardSection">
              <SectionHeading
                eyebrow={locale === "zh-CN" ? "审阅入口" : "Review entrypoints"}
                title={
                  locale === "zh-CN"
                    ? "如果这一页还不够，就继续往下打开这些页面"
                    : "If the scorecard says you need more context, continue into these runtime surfaces"
                }
              />
              <div className="branchComparisonGrid">
                <SurfaceCard className="branchComparisonCard" tone="strong" as="article">
                  <h3>{locale === "zh-CN" ? "结果页" : "Runtime result"}</h3>
                  <p className="subtle">
                    {locale === "zh-CN"
                      ? "看这条分支相对上一步到底改了什么。"
                      : "Inspect the key outcome deltas against the parent node."}
                  </p>
                  {runtimeHref ? (
                    <div className="cardActions">
                      <ButtonLink href={runtimeHref} variant="secondary">
                        {locale === "zh-CN" ? "打开结果页" : "Open runtime"}
                      </ButtonLink>
                    </div>
                  ) : null}
                </SurfaceCard>
                <SurfaceCard className="branchComparisonCard" tone="strong" as="article">
                  <h3>{locale === "zh-CN" ? "解释页" : "Explain"}</h3>
                  <p className="subtle">
                    {locale === "zh-CN"
                      ? "用解释链、证据片段和相关回合说明这条分支为什么会变成现在这样。"
                      : "Use claims, evidence, and related turns to explain why the branch looks this way."}
                  </p>
                  {explainHref ? (
                    <div className="cardActions">
                      <ButtonLink href={explainHref} variant="secondary">
                        {locale === "zh-CN" ? "打开解释页" : "Open explain"}
                      </ButtonLink>
                    </div>
                  ) : null}
                </SurfaceCard>
                <SurfaceCard className="branchComparisonCard" tone="strong" as="article">
                  <h3>{locale === "zh-CN" ? "报告页" : "Report"}</h3>
                  <p className="subtle">
                    {locale === "zh-CN"
                      ? "读这条分支自己的完整报告。"
                      : "Read the node-scoped runtime report for the current branch."}
                  </p>
                  {reportHref ? (
                    <div className="cardActions">
                      <ButtonLink href={reportHref} variant="secondary">
                        {locale === "zh-CN" ? "打开报告页" : "Open report"}
                      </ButtonLink>
                    </div>
                  ) : null}
                </SurfaceCard>
              </div>
            </section>
          </>
        ) : (
          <section className="dashboardSection">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "下一步" : "Next step"}
                title={
                  locale === "zh-CN"
                    ? "先生成一条分支，再回来做后台审阅"
                    : "Generate one live branch first, then come back for advanced review"
                }
            />
            <SurfaceCard className="dashboardCallout" tone="accent" as="article">
              <div className="cardActions">
                <ButtonLink href={perturbHref} variant="primary">
                  {locale === "zh-CN" ? "前往扰动台" : "Go to perturb"}
                </ButtonLink>
              </div>
            </SurfaceCard>
          </section>
        )}
      </main>
    );
  } catch {
    notFound();
  }
}
