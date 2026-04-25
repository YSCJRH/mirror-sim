import { NextResponse } from "next/server";

import { getPublicDemoArtifactSource } from "../../lib/artifact-source";
import { isPublicDemoMode } from "../../lib/public-demo-mode";
import { loadWorkbenchData } from "../../lib/workbench-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const source = getPublicDemoArtifactSource();
  const manifest = source.listManifest();
  const artifacts = await Promise.all(
    manifest.map(async (entry) => {
      try {
        if (entry.kind === "json") {
          await source.readJson(entry.id);
        } else if (entry.kind === "jsonl") {
          await source.readJsonl(entry.id);
        } else {
          await source.readText(entry.id);
        }

        return { id: entry.id, kind: entry.kind, status: "ok" };
      } catch {
        return { id: entry.id, kind: entry.kind, status: "missing" };
      }
    })
  );
  const workbench = await loadWorkbenchData()
    .then((data) => ({
      status: "ok",
      branchCount: data.compareArtifact.branches.length,
      comparisonCount: data.comparisonOverviews.length,
      claimCount: data.claims.length
    }))
    .catch(() => ({
      status: "missing",
      branchCount: 0,
      comparisonCount: 0,
      claimCount: 0
    }));
  const ready = artifacts.every((artifact) => artifact.status === "ok") && workbench.status === "ok";

  return NextResponse.json(
    {
      status: ready ? "ready" : "degraded",
      publicDemoMode: isPublicDemoMode(),
      artifacts,
      workbench
    },
    { status: ready ? 200 : 503 }
  );
}
