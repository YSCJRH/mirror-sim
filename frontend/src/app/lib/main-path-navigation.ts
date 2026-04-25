import type { AppLocale } from "./locale-shared";
import type { SimulationSession } from "./simulation-session";
import { withSimulationSession } from "./simulation-session";

export type MainPathKey = "world" | "perturb" | "changes" | "explain" | "review";

export type MainPathNavItem = {
  href: string;
  label: string;
  active: boolean;
};

export function buildMainPathNavigation(
  locale: AppLocale,
  active: MainPathKey,
  branchId: string,
  session?: Partial<SimulationSession>
): MainPathNavItem[] {
  const labels =
    locale === "zh-CN"
      ? {
          world: "世界",
          perturb: "扰动",
          changes: "分支",
          explain: "解释",
          review: "Analyst Mode"
        }
      : {
          world: "World",
          perturb: "Perturb",
          changes: "Branches",
          explain: "Explain",
          review: "Analyst Mode"
        };

  return [
    {
      href: "/",
      label: labels.world,
      active: active === "world"
    },
    {
      href: "/perturb",
      label: labels.perturb,
      active: active === "perturb"
    },
    {
      href: withSimulationSession(`/changes/${branchId}`, session ?? {}, {
        branchId
      }),
      label: labels.changes,
      active: active === "changes"
    },
    {
      href: withSimulationSession(`/explain/${branchId}`, session ?? {}, {
        branchId
      }),
      label: labels.explain,
      active: active === "explain"
    },
    {
      href: "/review",
      label: labels.review,
      active: active === "review"
    }
  ];
}
