"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ContextCard } from "./context-card";
import { SurfaceCard } from "./surface-card";
import { StatusPill } from "./status-pill";
import type { AppLocale } from "../lib/locale-shared";
import {
  getWorldTemplatePresets,
  type WorldTemplatePreset,
  type WorldTemplateRoleSlot as RoleSlot,
  type WorldTemplateUploadedDocument as UploadedDocument,
} from "../lib/world-template-presets";

const roleSlots: Array<{ slot: RoleSlot; en: string; zh: string }> = [
  { slot: "records_lead", en: "Records lead", zh: "记录负责人" },
  { slot: "field_operator", en: "Field operator", zh: "现场负责人" },
  { slot: "observer", en: "Observer", zh: "观察员" },
  { slot: "decision_lead", en: "Decision lead", zh: "决策负责人" },
];

type CreateWorldWizardProps = {
  locale: AppLocale;
};

function emptyRoles() {
  return {
    records_lead: { name: "", publicRole: "" },
    field_operator: { name: "", publicRole: "" },
    observer: { name: "", publicRole: "" },
    decision_lead: { name: "", publicRole: "" },
  };
}

function emptyOutcomes() {
  return {
    evidence_public_turn: "",
    response_turn: "",
    public_event_status: "",
    response_triggered: "",
    risk_known_by: "",
  };
}

function localizeDocumentKind(locale: AppLocale, kind: string) {
  if (locale !== "zh-CN") {
    return kind;
  }

  switch (kind) {
    case "memo":
      return "备忘录";
    case "note":
      return "记录";
    default:
      return kind;
  }
}

export function CreateWorldWizard({ locale }: CreateWorldWizardProps) {
  const router = useRouter();
  const starterPresets = useMemo(() => getWorldTemplatePresets(locale), [locale]);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [worldName, setWorldName] = useState("");
  const [worldSummary, setWorldSummary] = useState("");
  const [authorizedContext, setAuthorizedContext] = useState("");
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [roles, setRoles] = useState<Record<RoleSlot, { name: string; publicRole: string }>>(
    emptyRoles()
  );
  const [riskAssetName, setRiskAssetName] = useState("");
  const [evidenceDocumentName, setEvidenceDocumentName] = useState("");
  const [publicEventName, setPublicEventName] = useState("");
  const [responseLocationName, setResponseLocationName] = useState("");
  const [outcomes, setOutcomes] = useState(emptyOutcomes());

  const copy = useMemo(
    () =>
      locale === "zh-CN"
        ? {
            steps: [
              "世界基础",
              "授权文本",
              "角色与身份",
              "基线与扰动模板",
              "校验与发布",
            ],
            next: "下一步",
            back: "上一步",
            publish: "创建世界并进入扰动台",
            uploading: "正在创建世界...",
            presetTitle: "快速开始模板",
            presetHint: "先选一个模板，系统会自动填好世界、角色、关键对象、结果标签和示例文本。",
            clearPreset: "清空预设",
            worldName: "世界名称",
            worldSummary: "世界简介",
            authorizedContext: "数据授权说明",
            authorizedContextHelp:
              "说明你为什么可以把这些文本用于建世界。例如：'全部为我编写的虚构测试文本'，或'团队内部 demo 材料，已获明确授权，仅用于私有 alpha 测试'。",
            authorizationConfirmed: "我确认这些文本属于虚构内容或已获明确授权",
            uploadDocs: "上传授权文本",
            addFilesHint:
              "支持 `.txt` / `.md` 文本文件。若你已经选择快速模板，系统会自动带入示例文本，你也可以继续追加自己的材料。",
            riskAsset: "风险对象",
            evidenceDocument: "证据文档",
            publicEvent: "公共事件",
            responseLocation: "响应地点",
            outcomeEvidence: "证据公开回合标签",
            outcomeResponse: "响应触发回合标签",
            outcomeEvent: "公共事件状态标签",
            outcomeTrigger: "是否进入响应标签",
            outcomeKnowledge: "风险认知传播标签",
            reviewTitle: "发布前检查",
            reviewSummary:
              "确认世界名称、数据授权、角色、关键对象与结果标签都已经准备好，再发布到私有 Alpha 主路径。",
            createTitle: "创建世界",
            currentPreset: "当前模板",
            starterLoaded: "模板示例文本已经载入，你也可以继续追加自己的授权材料。",
            namePlaceholder: "姓名或角色名",
            rolePlaceholder: "公开职责",
          }
        : {
            steps: [
              "World basics",
              "Authorized corpus",
              "Entity and persona review",
              "Baseline and perturbation template review",
              "Validation and publish",
            ],
            next: "Next",
            back: "Back",
            publish: "Create world and open perturb",
            uploading: "Creating world...",
            presetTitle: "Quick start presets",
            presetHint:
              "Pick a starter and Mirror will prefill the world, roles, objects, outcomes, and sample texts.",
            clearPreset: "Start blank",
            worldName: "World name",
            worldSummary: "World summary",
            authorizedContext: "Data authorization note",
            authorizedContextHelp:
              "State why Mirror is allowed to use this corpus. Example: 'All texts are fictional test content written by me', or 'Internal demo materials, explicitly authorized for private beta testing only.'",
            authorizationConfirmed: "I confirm this corpus is fictional or explicitly authorized",
            uploadDocs: "Upload authorized text files",
            addFilesHint:
              "Use `.txt` or `.md` files. If you selected a starter preset, sample texts are already loaded and you can still add your own files.",
            riskAsset: "Risk asset",
            evidenceDocument: "Evidence document",
            publicEvent: "Public event",
            responseLocation: "Response location",
            outcomeEvidence: "Evidence publication label",
            outcomeResponse: "Response turn label",
            outcomeEvent: "Public event status label",
            outcomeTrigger: "Response trigger label",
            outcomeKnowledge: "Risk knowledge label",
            reviewTitle: "Pre-publish check",
            reviewSummary:
              "Confirm the world name, data authorization, roles, objects, and outcome labels before publishing.",
            createTitle: "Create World",
            currentPreset: "Current preset",
            starterLoaded:
              "Starter sample texts are already loaded. You can still add your own authorized files.",
            namePlaceholder: "Name",
            rolePlaceholder: "Public role",
          },
    [locale]
  );

  function applyPreset(preset: WorldTemplatePreset) {
    setSelectedPresetKey(preset.key);
    setWorldName(preset.worldName);
    setWorldSummary(preset.worldSummary);
    setAuthorizedContext(preset.authorizedContext);
    setAuthorizationConfirmed(true);
    setDocuments(preset.documents);
    setRoles(preset.roles);
    setRiskAssetName(preset.riskAssetName);
    setEvidenceDocumentName(preset.evidenceDocumentName);
    setPublicEventName(preset.publicEventName);
    setResponseLocationName(preset.responseLocationName);
    setOutcomes(preset.outcomes);
  }

  function clearPreset() {
    setSelectedPresetKey(null);
    setWorldName("");
    setWorldSummary("");
    setAuthorizedContext("");
    setAuthorizationConfirmed(false);
    setDocuments([]);
    setRoles(emptyRoles());
    setRiskAssetName("");
    setEvidenceDocumentName("");
    setPublicEventName("");
    setResponseLocationName("");
    setOutcomes(emptyOutcomes());
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files) {
      return;
    }
    const loaded = await Promise.all(
      Array.from(files).map(async (file) => ({
        title: file.name.replace(/\.[^.]+$/, ""),
        kind: file.name.endsWith(".md") ? "memo" : "note",
        text: await file.text(),
      }))
    );
    setDocuments((current) => {
      const merged = [...current];
      for (const document of loaded) {
        if (!merged.some((item) => item.title === document.title)) {
          merged.push(document);
        }
      }
      return merged;
    });
  }

  async function handleSubmit() {
    try {
      setError(null);
      setIsSubmitting(true);
      const response = await fetch("/api/worlds/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          world_name: worldName,
          world_summary: worldSummary,
          authorized_context: authorizedContext,
          authorization_confirmed: authorizationConfirmed,
          documents,
          roles: roleSlots.map((item) => ({
            slot: item.slot,
            name: roles[item.slot].name,
            public_role: roles[item.slot].publicRole,
          })),
          risk_asset_name: riskAssetName,
          evidence_document_name: evidenceDocumentName,
          public_event_name: publicEventName,
          response_location_name: responseLocationName,
          tracked_outcomes: [
            { field: "evidence_public_turn", label: outcomes.evidence_public_turn },
            { field: "response_turn", label: outcomes.response_turn },
            { field: "public_event_status", label: outcomes.public_event_status },
            { field: "response_triggered", label: outcomes.response_triggered },
            { field: "risk_known_by", label: outcomes.risk_known_by },
          ],
        }),
      });
      const payload = (await response.json()) as { error?: string; world_id?: string };
      if (!response.ok || !payload.world_id) {
        throw new Error(payload.error ?? "Failed to create world.");
      }
      router.push(`/worlds/${payload.world_id}/perturb`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : locale === "zh-CN"
            ? "创建世界失败。"
            : "Failed to create world."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedPreset =
    starterPresets.find((preset) => preset.key === selectedPresetKey) ?? null;

  const canProceed =
    (step === 1 && worldName.trim() && worldSummary.trim() && authorizedContext.trim()) ||
    (step === 2 && documents.length > 0 && authorizationConfirmed) ||
    (step === 3 &&
      roleSlots.every((role) => roles[role.slot].name.trim() && roles[role.slot].publicRole.trim())) ||
    (step === 4 &&
      riskAssetName.trim() &&
      evidenceDocumentName.trim() &&
      publicEventName.trim() &&
      responseLocationName.trim() &&
      Object.values(outcomes).every((value) => value.trim())) ||
    step === 5;

  return (
    <div className="dashboardSection">
      <SurfaceCard className="minimalHomeShell" tone="strong" as="section">
        <div className="interventionCardMeta">
          <StatusPill tone="accent">{copy.createTitle}</StatusPill>
          <StatusPill tone="subtle">{copy.steps[step - 1]}</StatusPill>
        </div>

        {step === 1 ? (
          <div className="composerGrid">
            <div className="composerField composerFieldWide">
              <span>{copy.presetTitle}</span>
              <p className="subtle">{copy.presetHint}</p>
              <div className="branchComparisonGrid">
                {starterPresets.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    className={`surfaceCard branchComparisonCard wizardPresetCard${selectedPresetKey === preset.key ? " simulatorBranchCardActive" : ""}`}
                    onClick={() => applyPreset(preset)}
                  >
                    <div className="interventionCardMeta">
                      <StatusPill tone={selectedPresetKey === preset.key ? "accent" : "subtle"}>
                        {preset.badge}
                      </StatusPill>
                    </div>
                    <h3>{preset.label}</h3>
                    <p className="subtle">{preset.worldSummary}</p>
                  </button>
                ))}
              </div>
              <div className="cardActions">
                <button type="button" className="simulatorToggle" onClick={clearPreset}>
                  {copy.clearPreset}
                </button>
              </div>
            </div>

            <label className="composerField composerFieldWide">
              <span>{copy.worldName}</span>
              <input value={worldName} onChange={(event) => setWorldName(event.target.value)} />
            </label>

            <label className="composerField composerFieldWide">
              <span>{copy.worldSummary}</span>
              <textarea
                rows={4}
                value={worldSummary}
                onChange={(event) => setWorldSummary(event.target.value)}
              />
            </label>

            <label className="composerField composerFieldWide">
              <span>{copy.authorizedContext}</span>
              <textarea
                rows={4}
                value={authorizedContext}
                onChange={(event) => setAuthorizedContext(event.target.value)}
              />
              <p className="subtle">{copy.authorizedContextHelp}</p>
            </label>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="composerGrid">
            <label className="composerField composerFieldWide">
              <span>{copy.uploadDocs}</span>
              <input
                type="file"
                accept=".md,.txt,text/plain,text/markdown"
                multiple
                onChange={(event) => void handleFilesSelected(event.target.files)}
              />
            </label>
            <p className="subtle">{copy.addFilesHint}</p>
            <label className="composerField composerFieldWide">
              <span>
                <input
                  type="checkbox"
                  checked={authorizationConfirmed}
                  onChange={(event) => setAuthorizationConfirmed(event.target.checked)}
                />{" "}
                {copy.authorizationConfirmed}
              </span>
            </label>
            {selectedPreset ? (
              <ContextCard
                label={copy.currentPreset}
                value={selectedPreset.label}
                summary={copy.starterLoaded}
                tone="accent"
              />
            ) : null}
            {documents.map((document) => (
              <ContextCard
                key={document.title}
                label={localizeDocumentKind(locale, document.kind)}
                value={document.title}
                summary={
                  locale === "zh-CN"
                    ? `${document.text.length} 字`
                    : `${document.text.length} chars`
                }
              />
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="composerGrid">
            {roleSlots.map((role) => (
              <div key={role.slot} className="composerField composerFieldWide">
                <span>{locale === "zh-CN" ? role.zh : role.en}</span>
                <input
                  value={roles[role.slot].name}
                  placeholder={copy.namePlaceholder}
                  onChange={(event) =>
                    setRoles((current) => ({
                      ...current,
                      [role.slot]: {
                        ...current[role.slot],
                        name: event.target.value,
                      },
                    }))
                  }
                />
                <textarea
                  rows={3}
                  value={roles[role.slot].publicRole}
                  placeholder={copy.rolePlaceholder}
                  onChange={(event) =>
                    setRoles((current) => ({
                      ...current,
                      [role.slot]: {
                        ...current[role.slot],
                        publicRole: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="composerGrid">
            <label className="composerField">
              <span>{copy.riskAsset}</span>
              <input value={riskAssetName} onChange={(event) => setRiskAssetName(event.target.value)} />
            </label>
            <label className="composerField">
              <span>{copy.evidenceDocument}</span>
              <input
                value={evidenceDocumentName}
                onChange={(event) => setEvidenceDocumentName(event.target.value)}
              />
            </label>
            <label className="composerField">
              <span>{copy.publicEvent}</span>
              <input value={publicEventName} onChange={(event) => setPublicEventName(event.target.value)} />
            </label>
            <label className="composerField">
              <span>{copy.responseLocation}</span>
              <input
                value={responseLocationName}
                onChange={(event) => setResponseLocationName(event.target.value)}
              />
            </label>
            <label className="composerField composerFieldWide">
              <span>{copy.outcomeEvidence}</span>
              <input
                value={outcomes.evidence_public_turn}
                onChange={(event) =>
                  setOutcomes((current) => ({ ...current, evidence_public_turn: event.target.value }))
                }
              />
            </label>
            <label className="composerField composerFieldWide">
              <span>{copy.outcomeResponse}</span>
              <input
                value={outcomes.response_turn}
                onChange={(event) =>
                  setOutcomes((current) => ({ ...current, response_turn: event.target.value }))
                }
              />
            </label>
            <label className="composerField composerFieldWide">
              <span>{copy.outcomeEvent}</span>
              <input
                value={outcomes.public_event_status}
                onChange={(event) =>
                  setOutcomes((current) => ({ ...current, public_event_status: event.target.value }))
                }
              />
            </label>
            <label className="composerField composerFieldWide">
              <span>{copy.outcomeTrigger}</span>
              <input
                value={outcomes.response_triggered}
                onChange={(event) =>
                  setOutcomes((current) => ({ ...current, response_triggered: event.target.value }))
                }
              />
            </label>
            <label className="composerField composerFieldWide">
              <span>{copy.outcomeKnowledge}</span>
              <input
                value={outcomes.risk_known_by}
                onChange={(event) =>
                  setOutcomes((current) => ({ ...current, risk_known_by: event.target.value }))
                }
              />
            </label>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="contextCardGrid">
            <ContextCard label={copy.worldName} value={worldName} summary={worldSummary} tone="accent" />
            <ContextCard
              label={copy.authorizedContext}
              value={
                authorizationConfirmed
                  ? locale === "zh-CN"
                    ? "已确认"
                    : "ok"
                  : locale === "zh-CN"
                    ? "待确认"
                    : "missing"
              }
              summary={authorizedContext}
            />
            <ContextCard label={copy.uploadDocs} value={String(documents.length)} />
            <ContextCard label={copy.riskAsset} value={riskAssetName} />
            <ContextCard label={copy.evidenceDocument} value={evidenceDocumentName} />
            <ContextCard label={copy.publicEvent} value={publicEventName} />
            <ContextCard label={copy.responseLocation} value={responseLocationName} />
            <ContextCard
              label={locale === "zh-CN" ? "角色数量" : "Roles"}
              value={String(roleSlots.length)}
              summary={roleSlots.map((role) => roles[role.slot].name).filter(Boolean).join(locale === "zh-CN" ? "、" : ", ")}
            />
            <ContextCard
              label={locale === "zh-CN" ? "结果标签" : "Outcome labels"}
              value={String(Object.values(outcomes).filter(Boolean).length)}
              summary={Object.values(outcomes).filter(Boolean).join(locale === "zh-CN" ? "、" : ", ")}
            />
            {selectedPreset ? (
              <ContextCard label={copy.currentPreset} value={selectedPreset.label} />
            ) : null}
            <ContextCard label={copy.reviewTitle} value={copy.reviewSummary} />
          </div>
        ) : null}

        <div className="cardActions minimalHomeActions">
          {step > 1 ? (
            <button type="button" className="simulatorToggle" onClick={() => setStep(step - 1)}>
              {copy.back}
            </button>
          ) : null}
          {step < 5 ? (
            <button
              type="button"
              className="buttonLink buttonLinkPrimary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
            >
              {copy.next}
            </button>
          ) : (
            <button
              type="button"
              className="buttonLink buttonLinkPrimary"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting || !canProceed}
            >
              {isSubmitting ? copy.uploading : copy.publish}
            </button>
          )}
        </div>

        {error ? <p className="subtle">{error}</p> : null}
      </SurfaceCard>
    </div>
  );
}
