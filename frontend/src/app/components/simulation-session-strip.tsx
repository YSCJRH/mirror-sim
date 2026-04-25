import { ButtonLink } from "./button-link";
import { ContextCard } from "./context-card";
import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { AppLocale } from "../lib/locale-shared";
import type { SimulationSession } from "../lib/simulation-session";
import { withSimulationSession } from "../lib/simulation-session";

type SimulationSessionStripProps = {
  locale: AppLocale;
  mode: "changes" | "explain";
  branchId: string;
  branchTitle: string;
  session: SimulationSession;
};

export function SimulationSessionStrip({
  locale,
  mode,
  branchId,
  branchTitle,
  session
}: SimulationSessionStripProps) {
  const copy =
    locale === "zh-CN"
      ? {
          eyebrow: "模拟会话",
          mode: "预设分支映射",
          title: "你当前看到的是一次持续中的扰动模拟会话。",
          summary:
            "这条会话条把当前扰动草案、当前候选分支和回退入口固定下来。现在底层仍然映射到预计算分支，但交互上已经更接近真实模拟器。",
          currentBranch: "当前分支",
          perturbationKind: "扰动类型",
          targetTiming: "目标 / 时机",
          draftSummary: "扰动摘要",
          refine: "继续修改扰动",
          secondary: mode === "changes" ? "查看解释" : "回到变化页",
          rollback: "回到基线",
          emptySummary: "当前会话还没有更细的扰动摘要，仍沿用预设分支的默认草案。 "
        }
      : {
          eyebrow: "Simulation session",
          mode: "Preset branch mapping",
          title: "You are now inside one continuous perturbation simulation session.",
          summary:
            "This strip keeps the current perturbation draft, candidate branch, and rollback entry visible. Under the hood it still maps to precomputed branches, but the interaction now behaves more like a real simulator.",
          currentBranch: "Current branch",
          perturbationKind: "Perturbation kind",
          targetTiming: "Target / timing",
          draftSummary: "Draft summary",
          refine: "Refine perturbation",
          secondary: mode === "changes" ? "Open explanation" : "Back to changes",
          rollback: "Rollback to baseline",
          emptySummary:
            "This session does not yet carry a richer freeform summary, so it is still using the preset branch draft."
        };

  const composerHref = withSimulationSession("/perturb", session, {
    branchId
  });
  const secondaryHref =
    mode === "changes"
      ? withSimulationSession(`/explain/${branchId}`, session, {
          branchId
        })
      : withSimulationSession(`/changes/${branchId}`, session, {
          branchId
        });

  return (
    <section className="dashboardSection">
      <SurfaceCard className="simulationSessionStrip" tone="strong" as="section">
        <div className="interventionCardMeta">
          <StatusPill tone="accent">{copy.eyebrow}</StatusPill>
          <StatusPill tone="subtle">{copy.mode}</StatusPill>
        </div>
        <h3>{copy.title}</h3>
        <p className="subtle">{copy.summary}</p>

        <div className="contextCardGrid contextCardGridCompact">
          <ContextCard label={copy.currentBranch} value={branchTitle} summary={branchId} tone="accent" />
          <ContextCard label={copy.perturbationKind} value={session.kind} />
          <ContextCard
            label={copy.targetTiming}
            value={session.target}
            summary={session.timing}
          />
          <SurfaceCard className="contextCard simulationSessionSummary" tone="default" as="article">
            <span className="contextCardLabel">{copy.draftSummary}</span>
            <p className="contextCardSummary">
              {session.summary || copy.emptySummary}
            </p>
          </SurfaceCard>
        </div>

        <div className="cardActions">
          <ButtonLink href={composerHref} variant="primary">
            {copy.refine}
          </ButtonLink>
          <ButtonLink href={secondaryHref} variant="secondary">
            {copy.secondary}
          </ButtonLink>
          <ButtonLink href="/perturb" variant="ghost">
            {copy.rollback}
          </ButtonLink>
        </div>
      </SurfaceCard>
    </section>
  );
}
