import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "../../components/button-link";
import { ContextCard } from "../../components/context-card";
import { PageHero } from "../../components/page-hero";
import { RuntimeDecisionContextCard } from "../../components/runtime-decision-context-card";
import { RuntimeLineagePanel } from "../../components/runtime-lineage-panel";
import { RuntimeSessionActions } from "../../components/runtime-session-actions";
import { SectionHeading } from "../../components/section-heading";
import { StatusPill } from "../../components/status-pill";
import { SurfaceCard } from "../../components/surface-card";
import { WorkbenchTopBar } from "../../components/workbench-top-bar";
import { getAppLocale } from "../../lib/locale";
import { friendlyWorldName, formatDeltaLabel, formatTurn } from "../../lib/presenters";
import { loadRuntimeSessionWorkspace } from "../../lib/runtime-session-data";

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  searchParams?: Promise<{
    node?: string;
  }>;
};

function numericValue(value: unknown) {
  return typeof value === "number" ? value : null;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Mirror Live Runtime Session",
    description: "Inspect the current generated session branch and continue branching from any checkpoint.",
  };
}

export default async function RuntimeSessionPage({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const locale = await getAppLocale();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspace = await loadRuntimeSessionWorkspace(sessionId, resolvedSearchParams?.node);

  if (!workspace) {
    notFound();
  }

  const worldName = friendlyWorldName(locale, workspace.graph.world_id);
  const activeNode = workspace.selectedNode;
  const isRootNode = activeNode.node_id === workspace.session.root_node_id;
  const parentNode = activeNode.parent_node_id
    ? workspace.session.nodes.find((node) => node.node_id === activeNode.parent_node_id) ?? null
    : null;
  const composerHref = `/perturb?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;
  const explainHref = `/runtime/${sessionId}/explain?node=${encodeURIComponent(activeNode.node_id)}`;
  const reportHref = `/runtime/${sessionId}/report?node=${encodeURIComponent(activeNode.node_id)}`;
  const navigationItems = [
    {
      href: "/",
      label: locale === "zh-CN" ? "世界" : "World",
      active: false,
    },
    {
      href: composerHref,
      label: locale === "zh-CN" ? "扰动" : "Perturb",
      active: false,
    },
    {
      href: `/runtime/${sessionId}?node=${encodeURIComponent(activeNode.node_id)}`,
      label: locale === "zh-CN" ? "Live Session" : "Live Session",
      active: true,
    },
    {
      href: explainHref,
      label: locale === "zh-CN" ? "Live Explain" : "Live Explain",
      active: false,
    },
    {
      href: reportHref,
      label: locale === "zh-CN" ? "Live Report" : "Live Report",
      active: false,
    },
    {
      href: "/review",
      label: "Analyst Mode",
      active: false,
    },
  ];

  const compareDelta = workspace.compareDelta;
  const candidateSummary = workspace.candidateRun?.summary ?? null;
  const referenceSummary = workspace.referenceRun?.summary ?? null;
  const budgetOutcome = compareDelta?.outcome_deltas.budget_exposed_turn;
  const ledgerOutcome = compareDelta?.outcome_deltas.ledger_public_turn;
  const evacuationOutcome = compareDelta?.outcome_deltas.evacuation_turn;
  const outcomeCards =
    compareDelta && referenceSummary && candidateSummary
      ? [
          {
            label: locale === "zh-CN" ? "预算曝光" : "Budget exposure",
            delta: formatDeltaLabel(locale, numericValue(budgetOutcome?.delta)),
            reference: formatTurn(locale, numericValue(budgetOutcome?.reference)),
            candidate: formatTurn(locale, numericValue(budgetOutcome?.candidate)),
          },
          {
            label: locale === "zh-CN" ? "账本公开" : "Ledger publication",
            delta: formatDeltaLabel(locale, numericValue(ledgerOutcome?.delta)),
            reference: formatTurn(locale, numericValue(ledgerOutcome?.reference)),
            candidate: formatTurn(locale, numericValue(ledgerOutcome?.candidate)),
          },
          {
            label: locale === "zh-CN" ? "疏散触发" : "Evacuation",
            delta: formatDeltaLabel(locale, numericValue(evacuationOutcome?.delta)),
            reference: formatTurn(locale, numericValue(evacuationOutcome?.reference)),
            candidate: formatTurn(locale, numericValue(evacuationOutcome?.candidate)),
          },
        ]
      : [];

  return (
    <main className="workbenchPage">
      <WorkbenchTopBar
        locale={locale}
        eyebrow="Mirror Engine / Runtime Session"
        items={navigationItems}
      />

      <PageHero
        eyebrow={locale === "zh-CN" ? "运行时分支" : "Runtime branch"}
        title={
          isRootNode
            ? locale === "zh-CN"
              ? "当前仍在基线 checkpoint"
              : "You are still on the baseline checkpoint"
            : activeNode.label
        }
        lede={
          isRootNode
            ? locale === "zh-CN"
              ? `当前 live session 还停留在 ${worldName} 的基线节点。回到 composer 施加扰动，就会从这里生成新的 child node。`
              : `The current live session is still on the baseline node for ${worldName}. Return to the composer to apply a perturbation and generate a child node from here.`
            : locale === "zh-CN"
              ? `你现在看到的是 ${worldName} 里的真实 runtime node。新的扰动可以直接从当前 checkpoint 继续分叉，不需要重新回到基线。`
              : `You are looking at a real runtime node in ${worldName}. New perturbations can continue branching directly from this checkpoint instead of restarting from baseline.`
        }
        support={
          locale === "zh-CN"
            ? "当前 live session 已经支持从任意现有节点继续生成子分支；回退只会移动 active pointer，不会删除既有节点。"
            : "This live session now supports generating child branches from any existing node. Rollback only moves the active pointer and does not delete prior nodes."
        }
        variant="review"
        actions={
          <>
            <ButtonLink href={composerHref} variant="primary">
              {locale === "zh-CN" ? "从当前节点继续扰动" : "Continue from this node"}
            </ButtonLink>
            <ButtonLink href={explainHref} variant="secondary">
              {locale === "zh-CN" ? "打开 live explain" : "Open live explain"}
            </ButtonLink>
            <ButtonLink href={reportHref} variant="ghost">
              {locale === "zh-CN" ? "打开 live report" : "Open live report"}
            </ButtonLink>
            {parentNode ? (
              <RuntimeSessionActions
                sessionId={sessionId}
                targetNodeId={parentNode.node_id}
                locale={locale}
                label={locale === "zh-CN" ? "回退到父节点" : "Rollback to parent"}
                pendingLabel={locale === "zh-CN" ? "正在回退到父节点..." : "Rolling back to parent..."}
              />
            ) : null}
            {!isRootNode ? (
              <RuntimeSessionActions
                sessionId={sessionId}
                targetNodeId={workspace.session.root_node_id}
                locale={locale}
                label={locale === "zh-CN" ? "回退到基线" : "Rollback to baseline"}
                pendingLabel={locale === "zh-CN" ? "正在回退到基线..." : "Rolling back to baseline..."}
              />
            ) : null}
            <ButtonLink href="/review" variant="ghost">
              {locale === "zh-CN" ? "打开 Analyst Mode" : "Open Analyst Mode"}
            </ButtonLink>
          </>
        }
        aside={
          <div className="contextCardGrid contextCardGridCompact">
            <ContextCard
              label={locale === "zh-CN" ? "当前世界" : "Current world"}
              value={worldName}
              tone="accent"
            />
            <ContextCard label="Session" value={workspace.session.session_id} code />
            <ContextCard label="Active node" value={workspace.session.active_node_id} code />
            <RuntimeDecisionContextCard
              locale={locale}
              summary={workspace.decisionSummary}
              configuredProvider={workspace.session.decision_config?.provider}
              configuredModel={workspace.session.decision_config?.model_id}
            />
            <ContextCard
              label={locale === "zh-CN" ? "父节点" : "Parent node"}
              value={parentNode?.label ?? (locale === "zh-CN" ? "基线" : "Baseline")}
            />
          </div>
        }
      />

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "扰动谱系" : "Perturbation lineage"}
          title={
            locale === "zh-CN"
              ? "先看当前节点叠加了哪些扰动，再判断这次分叉为什么会变成现在这样。"
              : "Read the cumulative perturbation stack first, then inspect why this branch now looks the way it does."
          }
          description={
            locale === "zh-CN"
              ? "每一层都代表一次已执行的扰动。当前节点的行为来自这条完整谱系，而不只是最后一次输入。"
              : "Each layer represents one executed perturbation. The current node is shaped by this full lineage, not just the latest input."
          }
        />
        <RuntimeLineagePanel
          locale={locale}
          lineage={workspace.lineage}
          currentNodeId={activeNode.node_id}
        />
      </section>

      <section className="dashboardSection">
        <SectionHeading
          eyebrow={locale === "zh-CN" ? "会话树" : "Session tree"}
          title={
            locale === "zh-CN"
              ? "先看这次 live session 里已经长出了哪些 checkpoint。"
              : "Inspect which checkpoints already exist inside this live session."
          }
          description={
            locale === "zh-CN"
              ? "现在每个节点都可以重新作为起点继续分叉。"
              : "Every node in this tree can now act as a new branching checkpoint."
          }
        />
        <div className="branchComparisonGrid">
          {workspace.session.nodes.map((node) => {
            const active = node.node_id === activeNode.node_id;
            const nodeComposerHref = `/perturb?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(node.node_id)}`;

            return (
              <SurfaceCard
                key={node.node_id}
                className="branchComparisonCard"
                tone={active ? "accent" : "strong"}
                as="article"
              >
                <div className="interventionCardMeta">
                  <StatusPill tone={active ? "accent" : "subtle"}>
                    {active
                      ? locale === "zh-CN"
                        ? "当前节点"
                        : "Active node"
                      : locale === "zh-CN"
                        ? "会话节点"
                        : "Session node"}
                  </StatusPill>
                  <StatusPill tone="subtle">{node.node_id}</StatusPill>
                </div>
                <h3>{node.label}</h3>
                <p className="subtle">
                  {node.parent_node_id
                    ? locale === "zh-CN"
                      ? `父节点: ${node.parent_node_id}`
                      : `Parent node: ${node.parent_node_id}`
                    : locale === "zh-CN"
                      ? "这是基线 checkpoint。"
                      : "This is the baseline checkpoint."}
                </p>
                <div className="cardActions">
                  <ButtonLink
                    href={`/runtime/${sessionId}?node=${encodeURIComponent(node.node_id)}`}
                    variant="ghost"
                  >
                    {locale === "zh-CN" ? "查看节点" : "Open node"}
                  </ButtonLink>
                  <ButtonLink href={nodeComposerHref} variant="secondary">
                    {locale === "zh-CN" ? "从这里继续分叉" : "Branch from here"}
                  </ButtonLink>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      {compareDelta && workspace.referenceRun && workspace.candidateRun ? (
        <>
          <section className="dashboardSection">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "结果对比" : "Outcome deltas"}
              title={
                locale === "zh-CN"
                  ? "这里展示当前节点相对父 checkpoint 的真实结果差异。"
                  : "This shows the real outcome deltas between the active node and its parent checkpoint."
              }
            />
            <div className="contextCardGrid">
              {outcomeCards.map((card) => (
                <SurfaceCard key={card.label} className="contextCard" tone="strong" as="article">
                  <span className="contextCardLabel">{card.label}</span>
                  <strong className="contextCardValue">{card.delta}</strong>
                  <p className="contextCardSummary">
                    {locale === "zh-CN"
                      ? `父节点 ${card.reference} / 当前 ${card.candidate}`
                      : `Parent ${card.reference} / Current ${card.candidate}`}
                  </p>
                </SurfaceCard>
              ))}
            </div>
          </section>

          <section className="dashboardSection">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "分歧回合" : "Divergent turns"}
              title={
                locale === "zh-CN"
                  ? "这里只看当前节点与父节点真正开始分叉的回合。"
                  : "Inspect only the turns where the current node diverges from its parent."
              }
            />
            <div className="storyboardRows">
              {workspace.rows.map((row) => (
                <SurfaceCard key={`${activeNode.node_id}-${row.turnIndex}`} className="storyboardRow" as="div">
                  <div className="storyboardRowTop">
                    <strong>T{row.turnIndex}</strong>
                    <StatusPill tone="subtle">{activeNode.node_id}</StatusPill>
                  </div>
                  <div className="storyboardColumns">
                    <div className="storyboardTurn">
                      <span>{locale === "zh-CN" ? "父节点" : "Parent"}</span>
                      {row.reference ? (
                        <>
                          <strong>{row.reference.turn.action_type}</strong>
                          <p>{row.reference.turn.rationale}</p>
                        </>
                      ) : (
                        <p>
                          {locale === "zh-CN"
                            ? "该回合没有记录动作。"
                            : "No action recorded on this turn."}
                        </p>
                      )}
                    </div>
                    <div className="storyboardTurn">
                      <span>{locale === "zh-CN" ? "当前节点" : "Current node"}</span>
                      {row.candidate ? (
                        <>
                          <strong>{row.candidate.turn.action_type}</strong>
                          <p>{row.candidate.turn.rationale}</p>
                        </>
                      ) : (
                        <p>
                          {locale === "zh-CN"
                            ? "该回合没有记录动作。"
                            : "No action recorded on this turn."}
                        </p>
                      )}
                    </div>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "下一步" : "Next step"}
            title={
              locale === "zh-CN"
                ? "当前还没有 parent-vs-child compare，先从这里继续生成一个子分支。"
                : "There is no parent-vs-child compare yet. Continue from this checkpoint to generate a child branch."
            }
          />
          <SurfaceCard className="dashboardCallout" tone="accent">
            <div className="cardActions">
              <ButtonLink href={composerHref} variant="primary">
                {locale === "zh-CN" ? "打开 composer" : "Open composer"}
              </ButtonLink>
              <ButtonLink href={reportHref} variant="secondary">
                {locale === "zh-CN" ? "打开 live report" : "Open live report"}
              </ButtonLink>
            </div>
          </SurfaceCard>
        </section>
      )}
    </main>
  );
}
