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

    if (body.decisionProvider === "hosted_openai") {
      const hostedError = validateHostedAccess(body);
      if (hostedError) {
        return NextResponse.json({ error: hostedError }, { status: 403 });
      }
    }

    if (
      body.decisionProvider === "openai_compatible" &&
      !body.decisionApiKey &&
      !process.env.OPENAI_API_KEY
    ) {
      return NextResponse.json(
        {
          error:
            locale === "zh-CN"
              ? "使用 OpenAI 兼容接口时，必须提供模型接口密钥。"
              : "decisionApiKey is required for openai_compatible sessions.",
        },
        { status: 400 }
      );
    }

    const payload = await generateRuntimeBranch(body.worldId, body.sessionId, body.fromNode, body.perturbation, {
      apiKey: body.decisionApiKey,
      baseUrl: body.decisionBaseUrl,
      betaUserId: body.decisionProvider === "hosted_openai" ? hostedUserHash(body, request) : undefined,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const locale = resolveLocale(body, request);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : locale === "zh-CN"
              ? "生成分支失败。"
              : "Failed to generate runtime branch.",
      },
      { status: 500 }
    );
  }
}
