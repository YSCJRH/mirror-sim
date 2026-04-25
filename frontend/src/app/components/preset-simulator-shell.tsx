"use client";

import { useState } from "react";

import { ButtonLink } from "./button-link";
import { SectionHeading } from "./section-heading";
import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { AppLocale } from "../lib/locale-shared";

export type PresetSimulatorBranch = {
  branchId: string;
  title: string;
  description: string;
  summaryLines: string[];
  divergentTurnCount: number;
  routeOnly: boolean;
  knowledgeShift: boolean;
  deltaLabels: Array<{
    label: string;
    value: string;
  }>;
};

type PresetSimulatorShellProps = {
  locale: AppLocale;
  baselineTitle: string;
  baselineDescription: string;
  initialBranchId: string;
  branches: PresetSimulatorBranch[];
};

export function PresetSimulatorShell({
  locale,
  baselineTitle,
  baselineDescription,
  initialBranchId,
  branches
}: PresetSimulatorShellProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(initialBranchId);
  const selectedBranch = branches.find((branch) => branch.branchId === selectedBranchId) ?? null;

  return (
    <section className="dashboardSection dashboardSectionAccent">
      <SectionHeading
        eyebrow={locale === "zh-CN" ? "模拟器壳层" : "Simulator shell"}
        title={
          locale === "zh-CN"
            ? "先在首页选择预设扰动，再进入分支工作区。"
            : "Choose a preset perturbation here before you enter the branch workspace."
        }
        description={
          locale === "zh-CN"
            ? "这一层先把“选择扰动、切换当前分支、回到基线”的交互心智搭起来。现在还是预设分支，不是任意自由注入。"
            : "This layer establishes the interaction model of choosing a perturbation, switching the current branch, and rolling back to baseline. It still works with preset branches instead of freeform injection."
        }
      />

      <div className="simulatorShell">
        <div className="simulatorRail">
          <SurfaceCard
            className={`simulatorBranchCard${selectedBranch ? "" : " simulatorBranchCardActive"}`}
            tone={selectedBranch ? "default" : "accent"}
            as="div"
          >
            <div className="interventionCardMeta">
              <StatusPill tone={selectedBranch ? "subtle" : "accent"}>
                {locale === "zh-CN" ? "基线" : "Baseline"}
              </StatusPill>
              <StatusPill tone="subtle">
                {locale === "zh-CN" ? "世界起点" : "World start"}
              </StatusPill>
            </div>
            <h3>{baselineTitle}</h3>
            <p>{baselineDescription}</p>
            <button
              type="button"
              className={`simulatorToggle${selectedBranch ? "" : " simulatorToggleActive"}`}
              onClick={() => setSelectedBranchId(null)}
            >
              {locale === "zh-CN" ? "回到基线" : "Rollback to baseline"}
            </button>
          </SurfaceCard>

          {branches.map((branch) => {
            const active = branch.branchId === selectedBranch?.branchId;

            return (
              <SurfaceCard
                key={branch.branchId}
                className={`simulatorBranchCard${active ? " simulatorBranchCardActive" : ""}`}
                tone={active ? "accent" : "default"}
                as="div"
              >
                <div className="interventionCardMeta">
                  <StatusPill tone={active ? "accent" : "subtle"}>
                    {locale === "zh-CN" ? "预设扰动" : "Preset perturbation"}
                  </StatusPill>
                  <StatusPill tone="subtle">
                    {branch.divergentTurnCount}
                    {locale === "zh-CN" ? " 个分歧回合" : " divergent turns"}
                  </StatusPill>
                </div>
                <h3>{branch.title}</h3>
                <p>{branch.description}</p>
                <button
                  type="button"
                  className={`simulatorToggle${active ? " simulatorToggleActive" : ""}`}
                  onClick={() => setSelectedBranchId(branch.branchId)}
                >
                  {locale === "zh-CN" ? "设为当前分支" : "Select branch"}
                </button>
              </SurfaceCard>
            );
          })}
        </div>

        <div className="simulatorWorkspace">
          <SurfaceCard className="simulatorComposer" tone="strong" as="div">
            <div className="interventionCardMeta">
              <StatusPill tone="accent">
                {locale === "zh-CN" ? "扰动编辑器" : "Perturbation composer"}
              </StatusPill>
              <StatusPill tone="subtle">
                {locale === "zh-CN" ? "预设模式" : "Preset mode"}
              </StatusPill>
            </div>
            <h3>
              {locale === "zh-CN"
                ? "当前先用预设扰动练习世界分支。"
                : "Use preset perturbations to rehearse world branching for now."}
            </h3>
            <p>
              {locale === "zh-CN"
                ? "下一阶段真正的模拟器会把这里换成可编辑扰动、生成分支和回退控制。现在先用这些预设项把交互闭环搭起来。"
                : "The next simulator phase will replace this with editable perturbations, branch generation, and rollback controls. For now, these presets build the interaction loop."}
            </p>
            <div className="simulatorPresetRow">
              {branches.map((branch) => {
                const active = branch.branchId === selectedBranch?.branchId;
                return (
                  <button
                    key={branch.branchId}
                    type="button"
                    className={`simulatorToggle${active ? " simulatorToggleActive" : ""}`}
                    onClick={() => setSelectedBranchId(branch.branchId)}
                  >
                    {branch.title}
                  </button>
                );
              })}
            </div>
          </SurfaceCard>

          <SurfaceCard
            className="simulatorPreview"
            tone={selectedBranch ? "accent" : "default"}
            as="div"
          >
            <div className="interventionCardMeta">
              <StatusPill tone={selectedBranch ? "accent" : "subtle"}>
                {selectedBranch
                  ? locale === "zh-CN"
                    ? "当前分支"
                    : "Current branch"
                  : locale === "zh-CN"
                    ? "当前状态"
                    : "Current state"}
              </StatusPill>
              <StatusPill tone="subtle">
                {selectedBranch
                  ? locale === "zh-CN"
                    ? "已应用预设扰动"
                    : "Preset applied"
                  : locale === "zh-CN"
                    ? "仍在基线"
                    : "Still on baseline"}
              </StatusPill>
            </div>

            <h3>{selectedBranch ? selectedBranch.title : baselineTitle}</h3>
            <p>{selectedBranch ? selectedBranch.description : baselineDescription}</p>

            {selectedBranch ? (
              <>
                <div className="deltaBadgeRow">
                  {selectedBranch.deltaLabels.map((entry) => (
                    <StatusPill key={entry.label}>
                      {entry.label}: {entry.value}
                    </StatusPill>
                  ))}
                  <StatusPill>{selectedBranch.divergentTurnCount}</StatusPill>
                  <StatusPill tone={selectedBranch.knowledgeShift ? "accent" : "subtle"}>
                    {selectedBranch.knowledgeShift
                      ? locale === "zh-CN"
                        ? "知识传播已改变"
                        : "Knowledge shift"
                      : locale === "zh-CN"
                        ? "知识传播稳定"
                        : "Knowledge stable"}
                  </StatusPill>
                  <StatusPill tone={selectedBranch.routeOnly ? "subtle" : "accent"}>
                    {selectedBranch.routeOnly
                      ? locale === "zh-CN"
                        ? "纯路径变化"
                        : "Route-only drift"
                      : locale === "zh-CN"
                        ? "结果已改写"
                        : "Outcome rewritten"}
                  </StatusPill>
                </div>
                <ul className="summaryList">
                  {selectedBranch.summaryLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="cardActions">
                  <ButtonLink href={`/perturb?branch=${selectedBranch.branchId}`} variant="ghost">
                    {locale === "zh-CN" ? "回到扰动编辑器" : "Refine in composer"}
                  </ButtonLink>
                  <ButtonLink href={`/changes/${selectedBranch.branchId}`} variant="primary">
                    {locale === "zh-CN" ? "打开当前分支" : "Open branch workspace"}
                  </ButtonLink>
                  <ButtonLink href={`/explain/${selectedBranch.branchId}`} variant="secondary">
                    {locale === "zh-CN" ? "解释当前分支" : "Explain current branch"}
                  </ButtonLink>
                  <button
                    type="button"
                    className="simulatorToggle"
                    onClick={() => setSelectedBranchId(null)}
                  >
                    {locale === "zh-CN" ? "回到基线" : "Rollback to baseline"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="subtle">
                  {locale === "zh-CN"
                    ? "你现在仍在基线世界里。选择一条预设扰动，就会进入一条新的候选分支。"
                    : "You are still on the baseline world. Choose a preset perturbation to move into a candidate branch."}
                </p>
                <div className="cardActions">
                  <ButtonLink href="/perturb" variant="primary">
                    {locale === "zh-CN" ? "去施加扰动" : "Go to perturbation composer"}
                  </ButtonLink>
                </div>
              </>
            )}
          </SurfaceCard>
        </div>
      </div>
    </section>
  );
}
