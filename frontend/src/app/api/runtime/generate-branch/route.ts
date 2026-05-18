import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

import { generateRuntimeBranch } from "../../../lib/runtime-cli";
import { normalizeLocale } from "../../../lib/locale-shared";
import { publicDemoDisabledMessage, publicDemoMutationsDisabled } from "../../../lib/public-demo-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveLocale(body: { locale?: string }, request: Request) {
  return normalizeLocale(body.locale) ?? normalizeLocale(request.headers.get("accept-language")) ?? "zh-CN";
}

function hostedUserHash(body: { betaAccessCode?: string }, request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${body.betaAccessCode ?? ""}:${forwardedFor}:${userAgent}`)
    .digest("hex")
    .slice(0, 24);
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
    sessionId?: string;
    fromNode?: string;
    decisionProvider?: string;
    decisionApiKey?: string;
    decisionBaseUrl?: string;
    betaAccessCode?: string;
    perturbation?: Record<string, unknown>;
    locale?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
    const locale = resolveLocale(body, request);

    if (publicDemoMutationsDisabled()) {
      return NextResponse.json({ error: publicDemoDisabledMessage(locale) }, { status: 403 });
    }

    if (!body.worldId || !body.sessionId || !body.fromNode || !body.perturbation) {
      return NextResponse.json(
        {
          error:
            locale === "zh-CN"
              ? "必须提供世界编号、实验编号、起点分支和扰动内容。"
              : "worldId, sessionId, fromNode, and perturbation are required.",
        },
        { status: 400 }
      );
    }

    const decisionApiKey = body.decisionApiKey?.trim();
    const decisionBaseUrl = body.decisionBaseUrl?.trim();
    const decisionProvider = body.decisionProvider?.trim();

    if (!decisionProvider) {
      return NextResponse.json(
        {
          error:
            locale === "zh-CN"
              ? "必须提供运行时决策模式。"
              : "Runtime decision provider is required.",
        },
        { status: 400 }
      );
    }

    if (decisionProvider === "hosted_openai") {
      if (!hostedAccessAllowed(body)) {
        return NextResponse.json({ error: hostedAccessError(locale) }, { status: 403 });
      }
    }

    if (decisionProvider === "openai_compatible" && !decisionApiKey) {
      return NextResponse.json(
        {
          error:
            locale === "zh-CN"
              ? "模型驱动分支生成当前不可用。"
              : "Model-driven branch generation is unavailable.",
        },
        { status: 400 }
      );
    }

    const payload = await generateRuntimeBranch(body.worldId, body.sessionId, body.fromNode, body.perturbation, {
      apiKey: decisionApiKey,
      baseUrl: decisionBaseUrl,
      betaUserId: decisionProvider === "hosted_openai" ? hostedUserHash(body, request) : undefined,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const locale = resolveLocale(body, request);
    return NextResponse.json(
      {
        error: locale === "zh-CN" ? "生成分支失败。" : "Failed to generate runtime branch.",
      },
      { status: 500 }
    );
  }
}
