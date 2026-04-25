import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "../../../components/button-link";
import { ContextCard } from "../../../components/context-card";
import { PageHero } from "../../../components/page-hero";
import { RuntimeDecisionContextCard } from "../../../components/runtime-decision-context-card";
import { RuntimeLineagePanel } from "../../../components/runtime-lineage-panel";
import { RuntimeSessionActions } from "../../../components/runtime-session-actions";
import { SectionHeading } from "../../../components/section-heading";
import { SurfaceCard } from "../../../components/surface-card";
import { WorkbenchTopBar } from "../../../components/workbench-top-bar";
import { getAppLocale } from "../../../lib/locale";
import { friendlyWorldName } from "../../../lib/presenters";
import { loadRuntimeSessionWorkspace } from "../../../lib/runtime-session-data";

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
  searchParams?: Promise<{
    node?: string;
  }>;
};

type ReportSection = {
  heading: string;
  lines: string[];
};

function parseReportSections(reportText: string) {
  const lines = reportText.split("\n");
  const sections: ReportSection[] = [];
  let current: ReportSection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) {
      if (current) {
        current.lines.push("");
      }
      continue;
    }

    if (line.startsWith("## ")) {
      if (current) {
        sections.push(current);
      }
      current = {
        heading: line.slice(3),
        lines: [],
      };
      continue;
    }

    if (line.startsWith("# ")) {
      continue;
    }

    if (!current) {
      current = {
        heading: "Overview",
        lines: [],
      };
    }
    current.lines.push(line);
  }

  if (current) {
    sections.push(current);
  }

  return sections;
}

function renderSectionLines(lines: string[]) {
  const tableLines = lines.filter((line) => line.startsWith("|"));
  const nonTableLines = lines.filter((line) => !line.startsWith("|"));

  return (
    <>
      {nonTableLines.map((line, index) => {
        if (!line) {
          return <div key={`spacer-${index}`} className="runtimeReportSpacer" />;
        }
        if (line.startsWith("- ")) {
          return (
            <li key={`bullet-${index}`} className="runtimeReportListItem">
              {line.slice(2)}
            </li>
          );
        }
        return (
          <p key={`paragraph-${index}`} className="runtimeReportParagraph">
            {line}
          </p>
        );
      })}
      {tableLines.length > 0 ? (
        <pre className="runtimeReportPre">{tableLines.join("\n")}</pre>
      ) : null}
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Mirror Live Runtime Report",
    description: "Read the node-scoped runtime report for the active live session node.",
  };
}

export default async function RuntimeReportPage({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const locale = await getAppLocale();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const workspace = await loadRuntimeSessionWorkspace(sessionId, resolvedSearchParams?.node);

  if (!workspace) {
    notFound();
  }

  const worldName = friendlyWorldName(locale, workspace.graph.world_id);
  const activeNode = workspace.selectedNode;
  const parentNode = activeNode.parent_node_id
    ? workspace.session.nodes.find((node) => node.node_id === activeNode.parent_node_id) ?? null
    : null;
  const composerHref = `/perturb?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(activeNode.node_id)}`;
  const runtimeHref = `/runtime/${sessionId}?node=${encodeURIComponent(activeNode.node_id)}`;
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
      href: runtimeHref,
      label: locale === "zh-CN" ? "Live Session" : "Live Session",
      active: false,
    },
    {
      href: explainHref,
      label: locale === "zh-CN" ? "Live Explain" : "Live Explain",
      active: false,
    },
    {
      href: reportHref,
      label: locale === "zh-CN" ? "Live Report" : "Live Report",
      active: true,
    },
    {
      href: "/review",
      label: "Analyst Mode",
      active: false,
    },
  ];

  const sections = workspace.reportText ? parseReportSections(workspace.reportText) : [];

  return (
    <main className="workbenchPage">
      <WorkbenchTopBar
        locale={locale}
        eyebrow="Mirror Engine / Runtime Report"
        items={navigationItems}
      />

      <PageHero
        eyebrow={locale === "zh-CN" ? "实时报告" : "Live report"}
        title={activeNode.label}
        lede={
          workspace.reportText
            ? locale === "zh-CN"
              ? `这里展示 ${worldName} 当前 live node 自己的 node-scoped report.md，而不是静态 demo 报告。`
              : `This page renders the node-scoped report.md for the current live node in ${worldName}, not the static demo report.`
            : locale === "zh-CN"
              ? "当前节点还没有独立的 node-scoped report artifact。先回到 composer 继续生成或刷新这个节点。"
              : "This node does not yet have a node-scoped runtime report artifact. Return to the composer and generate or refresh this node first."
        }
        support={
          workspace.reportText
            ? locale === "zh-CN"
              ? "live session 现在不只停在 outcome 和 claims 层，也已经具备节点级报告交付面。"
              : "The live session no longer stops at outcomes and claims. It now has a node-scoped report delivery surface."
            : locale === "zh-CN"
              ? "缺少 artifact 时会明确显示空态，而不是假装展示静态 demo 报告。"
              : "When report artifacts are missing, this route now exposes an explicit empty state instead of pretending to show the static demo report."
        }
        variant="review"
        actions={
          <>
            <ButtonLink href={runtimeHref} variant="primary">
              {locale === "zh-CN" ? "回到 live session" : "Back to live session"}
            </ButtonLink>
            <ButtonLink href={explainHref} variant="secondary">
              {locale === "zh-CN" ? "打开 live explain" : "Open live explain"}
            </ButtonLink>
            <ButtonLink href={composerHref} variant="ghost">
              {locale === "zh-CN" ? "从当前节点继续扰动" : "Continue from this node"}
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
            {activeNode.node_id !== workspace.session.root_node_id ? (
              <RuntimeSessionActions
                sessionId={sessionId}
                targetNodeId={workspace.session.root_node_id}
                locale={locale}
                label={locale === "zh-CN" ? "回退到基线" : "Rollback to baseline"}
                pendingLabel={locale === "zh-CN" ? "正在回退到基线..." : "Rolling back to baseline..."}
              />
            ) : null}
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
              label={locale === "zh-CN" ? "报告状态" : "Report status"}
              value={workspace.reportText ? "ready" : "missing"}
            />
          </div>
        }
      />

      {workspace.reportText ? (
        <>
          <section className="dashboardSection">
            <SectionHeading
              eyebrow={locale === "zh-CN" ? "扰动谱系" : "Perturbation lineage"}
              title={
                locale === "zh-CN"
                  ? "先看这份报告对应的是哪条累计扰动链。"
                  : "Read which cumulative perturbation chain this report belongs to before scanning the report itself."
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
              eyebrow={locale === "zh-CN" ? "节点报告" : "Node report"}
              title={
                locale === "zh-CN"
                  ? "当前 live node 的 report.md 已经作为正式交付面接入。"
                  : "The current live node report.md is now wired in as a first-class delivery surface."
              }
              description={
                locale === "zh-CN"
                  ? "这份报告来自当前 runtime node 自己的 artifacts。"
                  : "This report comes from the runtime node's own artifacts."
              }
            />
            <div className="runtimeReportStack">
              {sections.map((section) => (
                <SurfaceCard
                  key={section.heading}
                  className="runtimeReportSection"
                  tone="strong"
                  as="article"
                >
                  <h3>{section.heading}</h3>
                  <div className="runtimeReportBody">{renderSectionLines(section.lines)}</div>
                </SurfaceCard>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="dashboardSection">
          <SectionHeading
            eyebrow={locale === "zh-CN" ? "空态" : "Empty state"}
            title={
              locale === "zh-CN"
                ? "当前节点还没有可读取的 runtime report artifact。"
                : "This node does not yet have a readable runtime report artifact."
            }
          />
          <SurfaceCard className="dashboardCallout" tone="accent">
            <div className="cardActions">
              <ButtonLink href={composerHref} variant="primary">
                {locale === "zh-CN" ? "回到 composer" : "Back to composer"}
              </ButtonLink>
              <ButtonLink href={runtimeHref} variant="secondary">
                {locale === "zh-CN" ? "回到 live session" : "Back to live session"}
              </ButtonLink>
            </div>
          </SurfaceCard>
        </section>
      )}
    </main>
  );
}
