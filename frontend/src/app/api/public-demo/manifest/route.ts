import { NextResponse } from "next/server";

import { getPublicDemoArtifactSource } from "../../../lib/artifact-source";

export const dynamic = "force-dynamic";

export async function GET() {
  const source = getPublicDemoArtifactSource();

  return NextResponse.json({
    demo: "fog-harbor",
    mode: "deterministic-only",
    mutation: "disabled",
    artifacts: source.listManifest()
  });
}
