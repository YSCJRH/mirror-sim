import { NextResponse } from "next/server";

import { startRuntimeSession } from "../../../lib/runtime-cli";
import { normalizeLocale } from "../../../lib/locale-shared";
import { publicDemoDisabledMessage, publicDemoMutationsDisabled } from "../../../lib/public-demo-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveLocale(body: { locale?: string }, request: Request) {
  return normalizeLocale(body.locale) ?? normalizeLocale(request.headers.get("accept-language")) ?? "zh-CN";
}

function validateHostedAccess(body: { betaAccessCode?: string }) {
  if (process.env.MIRROR_HOSTED_MODEL_ENABLED !== "1") {
    return "Hosted model access is disabled.";
  }
  if (!process.env.MIRROR_HOSTED_OPENAI_API_KEY) {
    return "Hosted model access is missing a server-side API key.";
  }
  if (!process.env.MIRROR_HOSTED_DECISION_MODEL && !process.env.MIRROR_DECISION_MODEL) {
    return "Hosted model access is missing a configured model.";
  }
  if (!process.env.MIRROR_BETA_ACCESS_CODE) {
    return "Hosted model access requires a configured beta access code.";
  }
  if (body.betaAccessCode !== process.env.MIRROR_BETA_ACCESS_CODE) {
    return "Hosted model access code is invalid.";
  }
  return null;
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

    if (body.decisionProvider === "hosted_openai") {
      const hostedError = validateHostedAccess(body);
      if (hostedError) {
        return NextResponse.json({ error: hostedError }, { status: 403 });
      }
    }

    if (
      body.decisionProvider === "openai_compatible" &&
      !body.decisionModel &&
      !process.env.MIRROR_DECISION_MODEL
    ) {
      return NextResponse.json(
        {
          error:
            locale === "zh-CN"
              ? "使用模型驱动模式时，必须提供模型名称。"
              : "A decision model is required for openai_compatible sessions.",
        },
        { status: 400 }
      );
    }

    const payload = await startRuntimeSession(
      body.worldId,
      body.scenarioId,
      body.decisionProvider,
      body.decisionModel
    );
    return NextResponse.json(payload);
  } catch (error) {
    const locale = resolveLocale(body, request);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : locale === "zh-CN"
              ? "启动实验失败。"
              : "Failed to start runtime session.",
      },
      { status: 500 }
    );
  }
}
