import { NextResponse } from "next/server";

import { rollbackRuntimeSession } from "../../../lib/runtime-cli";
import { normalizeLocale } from "../../../lib/locale-shared";
import { publicDemoDisabledMessage, publicDemoMutationsDisabled } from "../../../lib/public-demo-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveLocale(body: { locale?: string }, request: Request) {
  return normalizeLocale(body.locale) ?? normalizeLocale(request.headers.get("accept-language")) ?? "zh-CN";
}

export async function POST(request: Request) {
  let body: {
    worldId?: string;
    sessionId?: string;
    toNode?: string;
    locale?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
    const locale = resolveLocale(body, request);

    if (publicDemoMutationsDisabled()) {
      return NextResponse.json({ error: publicDemoDisabledMessage(locale) }, { status: 403 });
    }

    if (!body.worldId || !body.sessionId || !body.toNode) {
      return NextResponse.json(
        {
          error:
            locale === "zh-CN"
              ? "必须提供世界编号、实验编号和目标分支。"
              : "worldId, sessionId, and toNode are required.",
        },
        { status: 400 }
      );
    }

    const payload = await rollbackRuntimeSession(body.worldId, body.sessionId, body.toNode);
    return NextResponse.json(payload);
  } catch (error) {
    const locale = resolveLocale(body, request);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : locale === "zh-CN"
              ? "回退当前实验失败。"
              : "Failed to rollback runtime session.",
      },
      { status: 500 }
    );
  }
}
