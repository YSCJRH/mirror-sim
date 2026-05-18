import { NextResponse } from "next/server";

import { startRuntimeSession } from "../../../lib/runtime-cli";
import { normalizeLocale } from "../../../lib/locale-shared";
import { publicDemoDisabledMessage, publicDemoMutationsDisabled } from "../../../lib/public-demo-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveLocale(body: { locale?: string }, request: Request) {
  return normalizeLocale(body.locale) ?? normalizeLocale(request.headers.get("accept-language")) ?? "zh-CN";
}

function hostedAccessAllowed(body: { betaAccessCode?: string }) {
  return (
    process.env.MIRROR_HOSTED_MODEL_ENABLED === "1" &&
    Boolean(process.env.MIRROR_HOSTED_OPENAI_API_KEY) &&
    Boolean(process.env.MIRROR_HOSTED_DECISION_MODEL || process.env.MIRROR_DECISION_MODEL) &&
    Boolean(process.env.MIRROR_BETA_ACCESS_CODE) &&
    body.betaAccessCode === process.env.MIRROR_BETA_ACCESS_CODE
  );
}

function hostedAccessError(locale: "en" | "zh-CN") {
  return locale === "zh-CN" ? "托管模型访问当前不可用。" : "Hosted model access is unavailable.";
}

export async function POST(request: Request) {
  let body: {
    worldId?: string;
    scenarioId?: string;
    decisionProvider?: string;
    decisionModel?: string;
    betaAccessCode?: string;
    locale?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
    const locale = resolveLocale(body, request);

    if (publicDemoMutationsDisabled()) {
      return NextResponse.json({ error: publicDemoDisabledMessage(locale) }, { status: 403 });
    }

    if (!body.worldId || !body.scenarioId) {
      return NextResponse.json(
        {
          error:
            locale === "zh-CN"
              ? "必须提供世界编号和基线场景编号。"
              : "worldId and scenarioId are required.",
        },
        { status: 400 }
      );
    }

    const decisionProvider = body.decisionProvider?.trim() || "openai_compatible";
    const decisionModel = body.decisionModel?.trim();

    if (decisionProvider === "hosted_openai") {
      if (!hostedAccessAllowed(body)) {
        return NextResponse.json({ error: hostedAccessError(locale) }, { status: 403 });
      }
    }

    if (decisionProvider === "openai_compatible" && !decisionModel) {
      return NextResponse.json(
        {
          error:
            locale === "zh-CN"
              ? "模型驱动模式当前不可用。"
              : "Model-driven sessions are unavailable.",
        },
        { status: 400 }
      );
    }

    const payload = await startRuntimeSession(
      body.worldId,
      body.scenarioId,
      decisionProvider,
      decisionModel
    );
    return NextResponse.json(payload);
  } catch (error) {
    const locale = resolveLocale(body, request);
    return NextResponse.json(
      {
        error: locale === "zh-CN" ? "启动实验失败。" : "Failed to start runtime session.",
      },
      { status: 500 }
    );
  }
}
