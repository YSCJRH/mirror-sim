import { ButtonLink } from "./button-link";
import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { AppLocale } from "../lib/locale-shared";
import type { SimulationSession } from "../lib/simulation-session";
import { withSimulationSession } from "../lib/simulation-session";

type BranchHistoryRailProps = {
  locale: AppLocale;
  baselineTitle: string;
  currentBranchId: string;
  currentBranchTitle: string;
  session?: Partial<SimulationSession>;
  branches: Array<{
    branchId: string;
    title: string;
  }>;
};

export function BranchHistoryRail({
  locale,
  baselineTitle,
  currentBranchId,
  currentBranchTitle,
  session,
  branches
}: BranchHistoryRailProps) {
  return (
    <div className="simulatorRail">
      <SurfaceCard className="simulatorBranchCard" as="div">
        <div className="interventionCardMeta">
          <StatusPill tone="accent">{locale === "zh-CN" ? "基线" : "Baseline"}</StatusPill>
          <StatusPill tone="subtle">{locale === "zh-CN" ? "可回退点" : "Rollback point"}</StatusPill>
        </div>
        <h3>{baselineTitle}</h3>
        <p>
          {locale === "zh-CN"
            ? "随时回到世界起点，再试另一条预设扰动。"
            : "Return to the world start at any time, then try another preset perturbation."}
        </p>
        <ButtonLink href="/perturb" variant="ghost">
          {locale === "zh-CN" ? "回到基线" : "Rollback to baseline"}
        </ButtonLink>
      </SurfaceCard>

      <SurfaceCard className="simulatorBranchCard simulatorBranchCardActive" tone="accent" as="div">
        <div className="interventionCardMeta">
          <StatusPill tone="accent">{locale === "zh-CN" ? "当前分支" : "Current branch"}</StatusPill>
          <StatusPill tone="subtle">{currentBranchId}</StatusPill>
        </div>
        <h3>{currentBranchTitle}</h3>
        <p>
          {locale === "zh-CN"
            ? "当前页面围绕这条预设扰动分支展开。"
            : "This page is centered on the currently selected preset perturbation branch."}
        </p>
      </SurfaceCard>

      {branches
        .filter((branch) => branch.branchId !== currentBranchId)
        .map((branch) => (
          <SurfaceCard key={branch.branchId} className="simulatorBranchCard" as="div">
            <div className="interventionCardMeta">
              <StatusPill tone="subtle">{locale === "zh-CN" ? "其他分支" : "Other branch"}</StatusPill>
              <StatusPill tone="subtle">{branch.branchId}</StatusPill>
            </div>
            <h3>{branch.title}</h3>
            <div className="cardActions">
              <ButtonLink
                href={withSimulationSession("/perturb", session ?? {}, {
                  branchId: branch.branchId
                })}
                variant="ghost"
              >
                {locale === "zh-CN" ? "试这个扰动" : "Try this perturbation"}
              </ButtonLink>
              <ButtonLink
                href={withSimulationSession(`/changes/${branch.branchId}`, session ?? {}, {
                  branchId: branch.branchId
                })}
                variant="ghost"
              >
                {locale === "zh-CN" ? "切到分支" : "Switch branch"}
              </ButtonLink>
              <ButtonLink
                href={withSimulationSession(`/explain/${branch.branchId}`, session ?? {}, {
                  branchId: branch.branchId
                })}
                variant="ghost"
              >
                {locale === "zh-CN" ? "查看解释" : "Explain"}
              </ButtonLink>
            </div>
          </SurfaceCard>
        ))}
    </div>
  );
}
