import { ButtonLink } from "./button-link";
import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { AppLocale } from "../lib/locale-shared";

type BranchTreeMapProps = {
  locale: AppLocale;
  baselineTitle: string;
  activeBranchId?: string | null;
  branches: Array<{
    branchId: string;
    title: string;
    summary: string;
  }>;
};

export function BranchTreeMap({
  locale,
  baselineTitle,
  activeBranchId = null,
  branches
}: BranchTreeMapProps) {
  return (
    <div className="branchTreeMap">
      <SurfaceCard className="branchTreeRoot" tone={activeBranchId ? "strong" : "accent"} as="div">
        <div className="interventionCardMeta">
          <StatusPill tone={activeBranchId ? "subtle" : "accent"}>
            {locale === "zh-CN" ? "基线" : "Baseline"}
          </StatusPill>
          <StatusPill tone="subtle">
            {locale === "zh-CN" ? "世界起点" : "World start"}
          </StatusPill>
        </div>
        <h3>{baselineTitle}</h3>
        <p>
          {locale === "zh-CN"
            ? "所有扰动分支都从这条基线故事线上分叉。"
            : "Every perturbation branch forks from this baseline story."}
        </p>
        <div className="cardActions">
          <ButtonLink href="/perturb" variant="ghost">
            {locale === "zh-CN" ? "回到基线" : "Rollback to baseline"}
          </ButtonLink>
        </div>
      </SurfaceCard>

      <div className="branchTreeChildren">
        {branches.map((branch) => {
          const active = branch.branchId === activeBranchId;
          return (
            <SurfaceCard
              key={branch.branchId}
              className={`branchTreeNode${active ? " branchTreeNodeActive" : ""}`}
              tone={active ? "accent" : "default"}
              as="div"
            >
              <div className="interventionCardMeta">
                <StatusPill tone={active ? "accent" : "subtle"}>
                  {active
                    ? locale === "zh-CN"
                      ? "当前分支"
                      : "Current branch"
                    : locale === "zh-CN"
                      ? "候选分支"
                      : "Candidate branch"}
                </StatusPill>
                <StatusPill tone="subtle">{branch.branchId}</StatusPill>
              </div>
              <h3>{branch.title}</h3>
              <p>{branch.summary}</p>
              <div className="cardActions">
                <ButtonLink href={`/perturb?branch=${branch.branchId}`} variant="ghost">
                  {locale === "zh-CN" ? "试这个扰动" : "Try this perturbation"}
                </ButtonLink>
                <ButtonLink href={`/changes/${branch.branchId}`} variant="ghost">
                  {locale === "zh-CN" ? "看变化" : "View changes"}
                </ButtonLink>
              </div>
            </SurfaceCard>
          );
        })}
      </div>
    </div>
  );
}
