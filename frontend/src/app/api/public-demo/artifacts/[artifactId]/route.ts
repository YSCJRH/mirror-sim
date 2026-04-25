import { NextResponse } from "next/server";

import {
  ArtifactNotFoundError,
  getPublicDemoArtifactSource,
  publicArtifactErrorMessage
} from "../../../../lib/artifact-source";
import { findPublicDemoArtifact } from "../../../../lib/public-demo-artifacts";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    artifactId: string;
  }>;
};

function sanitizePublicArtifactData(artifactId: string, data: unknown): unknown {
  if (artifactId === "demo.eval_summary" && data && typeof data === "object" && !Array.isArray(data)) {
    const { artifact_paths: _artifactPaths, ...summary } = data as Record<string, unknown>;
    return summary;
  }

  if (artifactId === "demo.compare" && data && typeof data === "object" && !Array.isArray(data)) {
    const compare = data as Record<string, unknown>;
    return {
      ...compare,
      branches: Array.isArray(compare.branches)
        ? compare.branches.map((branch) => {
            if (!branch || typeof branch !== "object" || Array.isArray(branch)) {
              return branch;
            }
            const {
              summary_path: _summaryPath,
              trace_path: _tracePath,
              snapshot_dir: _snapshotDir,
              ...publicBranch
            } = branch as Record<string, unknown>;
            return publicBranch;
          })
        : compare.branches
    };
  }

  if (artifactId === "demo.documents" && Array.isArray(data)) {
    return data.map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        return row;
      }
      const { source_path: _sourcePath, ...publicRow } = row as Record<string, unknown>;
      return publicRow;
    });
  }

  return data;
}

export async function GET(_request: Request, context: RouteContext) {
  const { artifactId } = await context.params;
  const source = getPublicDemoArtifactSource();
  const artifact = findPublicDemoArtifact(artifactId);

  if (!artifact) {
    return NextResponse.json(
      { error: "not_found", message: publicArtifactErrorMessage(new ArtifactNotFoundError(artifactId)) },
      { status: 404 }
    );
  }

  try {
    if (artifact.kind === "json") {
      const data = await source.readJson(artifact.id);
      return NextResponse.json({
        id: artifact.id,
        kind: artifact.kind,
        data: sanitizePublicArtifactData(artifact.id, data)
      });
    }

    if (artifact.kind === "jsonl") {
      const rows = await source.readJsonl(artifact.id);
      return NextResponse.json({
        id: artifact.id,
        kind: artifact.kind,
        rows: sanitizePublicArtifactData(artifact.id, rows)
      });
    }

    return NextResponse.json({
      id: artifact.id,
      kind: artifact.kind,
      content: await source.readText(artifact.id)
    });
  } catch (error) {
    return NextResponse.json(
      { error: "unavailable", message: publicArtifactErrorMessage(error) },
      { status: 503 }
    );
  }
}
