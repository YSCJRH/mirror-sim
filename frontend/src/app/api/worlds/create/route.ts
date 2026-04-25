import { NextResponse } from "next/server";

import { createRuntimeWorld } from "../../../lib/runtime-cli";
import { normalizeLocale } from "../../../lib/locale-shared";
import { publicDemoDisabledMessage, publicDemoMutationsDisabled } from "../../../lib/public-demo-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveLocale(body: Record<string, unknown>, request: Request) {
  const bodyLocale = typeof body.locale === "string" ? normalizeLocale(body.locale) : null;
  return bodyLocale ?? normalizeLocale(request.headers.get("accept-language")) ?? "zh-CN";
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;

    if (publicDemoMutationsDisabled()) {
      return NextResponse.json(
        { error: publicDemoDisabledMessage(resolveLocale(body, request)) },
        { status: 403 }
      );
    }

    const payload = await createRuntimeWorld(body);
    return NextResponse.json(payload);
  } catch (error) {
    const locale = resolveLocale(body, request);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : locale === "zh-CN"
              ? "创建受约束世界失败。"
              : "Failed to create bounded incident world.",
      },
      { status: 500 }
    );
  }
}
