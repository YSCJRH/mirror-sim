import { NextResponse } from "next/server";

import packageJson from "../../../../package.json";
import { isPublicDemoMode } from "../../lib/public-demo-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: packageJson.version,
    publicDemoMode: isPublicDemoMode(),
    commit:
      process.env.MIRROR_COMMIT_SHA ??
      process.env.GITHUB_SHA ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      "unknown"
  });
}
