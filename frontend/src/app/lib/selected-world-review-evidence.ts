import { readFile } from "node:fs/promises";
import path from "node:path";

import { resolveProductWorldPaths } from "./world-paths";

type ClaimRow = {
  claim_id?: string;
  label?: string;
  evidence_ids?: string[];
};

type ChunkRow = {
  chunk_id: string;
};

type EvalSummary = {
  status?: string;
};

type ReviewReadiness = "ready" | "blocked";
type ReviewNextAction = "select-or-generate-runtime-branch" | "repair-selected-world-evidence";
type ReviewReadinessSignals = {
  artifactRootAvailable: boolean;
  evalPassed: boolean;
  reportClaimsPresent: boolean;
  claimsLabeled: boolean;
  claimsHaveEvidenceIds: boolean;
  evidenceIdsResolve: boolean;
};
type ReviewEvidenceActionability = {
  reviewReadiness: ReviewReadiness;
  nextAction: ReviewNextAction;
  nextActionReason: string;
  readinessSignals: ReviewReadinessSignals;
};

export type SelectedWorldReviewEvidenceBinding = {
  worldId: string;
  artifactRoot: string;
  evalSummaryPath: string;
  claimsPath: string;
  chunksPath: string;
  evalStatus: string;
  claimCount: number;
  claimsLabeled: boolean;
  claimsHaveEvidenceIds: boolean;
  claimEvidenceResolves: boolean;
  invalidEvidenceIds: string[];
  status: "ready" | "unavailable";
  unavailableReason: string | null;
  reviewReadiness: ReviewReadiness;
  nextAction: ReviewNextAction;
  nextActionReason: string;
  readinessSignals: ReviewReadinessSignals;
};

const repoRoot = path.resolve(process.cwd(), "..");

function repoRelative(absolutePath: string) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join("/");
}

async function readText(absolutePath: string) {
  return readFile(absolutePath, "utf-8");
}

async function readJson<T>(absolutePath: string) {
  return JSON.parse(await readText(absolutePath)) as T;
}

async function readJsonl<T>(absolutePath: string) {
  return (await readText(absolutePath))
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function buildReviewEvidenceActionability({
  status,
  evalStatus,
  claimCount,
  claimsLabeled,
  claimsHaveEvidenceIds,
  claimEvidenceResolves,
}: {
  status: "ready" | "unavailable";
  evalStatus: string;
  claimCount: number;
  claimsLabeled: boolean;
  claimsHaveEvidenceIds: boolean;
  claimEvidenceResolves: boolean;
}): ReviewEvidenceActionability {
  const readinessSignals = {
    artifactRootAvailable: status === "ready",
    evalPassed: evalStatus === "pass",
    reportClaimsPresent: claimCount > 0,
    claimsLabeled,
    claimsHaveEvidenceIds,
    evidenceIdsResolve: claimEvidenceResolves,
  };
  const reviewReadiness = Object.values(readinessSignals).every(Boolean) ? "ready" : "blocked";
  const nextAction =
    reviewReadiness === "ready" ? "select-or-generate-runtime-branch" : "repair-selected-world-evidence";
  const nextActionReason =
    reviewReadiness === "ready"
      ? "Evidence binding is ready; select an existing runtime branch or generate one live branch before deeper review."
      : "Repair selected-world evidence artifacts before relying on the review surface.";

  return {
    reviewReadiness,
    nextAction,
    nextActionReason,
    readinessSignals,
  };
}

function unavailableBinding(
  worldId: string,
  paths: {
    artifactsRoot: string;
    evalSummaryPath: string;
    claimsPath: string;
    chunksPath: string;
  },
  reason: string
): SelectedWorldReviewEvidenceBinding {
  return {
    worldId,
    artifactRoot: repoRelative(paths.artifactsRoot),
    evalSummaryPath: repoRelative(paths.evalSummaryPath),
    claimsPath: repoRelative(paths.claimsPath),
    chunksPath: repoRelative(paths.chunksPath),
    evalStatus: "missing",
    claimCount: 0,
    claimsLabeled: false,
    claimsHaveEvidenceIds: false,
    claimEvidenceResolves: false,
    invalidEvidenceIds: [],
    status: "unavailable",
    unavailableReason: reason,
    ...buildReviewEvidenceActionability({
      status: "unavailable",
      evalStatus: "missing",
      claimCount: 0,
      claimsLabeled: false,
      claimsHaveEvidenceIds: false,
      claimEvidenceResolves: false,
    }),
  };
}

export async function loadSelectedWorldReviewEvidenceBinding(
  worldId: string
): Promise<SelectedWorldReviewEvidenceBinding> {
  const paths = resolveProductWorldPaths(worldId);
  const evalSummaryPath = path.join(paths.artifactsRoot, "eval", "summary.json");
  const claimsPath = path.join(paths.artifactsRoot, "report", "claims.json");
  const chunksPath = path.join(paths.artifactsRoot, "ingest", "chunks.jsonl");
  const sourcePaths = {
    artifactsRoot: paths.artifactsRoot,
    evalSummaryPath,
    claimsPath,
    chunksPath,
  };

  try {
    const [evalSummary, claims, chunks] = await Promise.all([
      readJson<EvalSummary>(evalSummaryPath),
      readJson<ClaimRow[]>(claimsPath),
      readJsonl<ChunkRow>(chunksPath),
    ]);
    const validEvidenceIds = new Set(chunks.map((chunk) => chunk.chunk_id));
    const invalidEvidenceIds = Array.from(
      new Set(
        claims.flatMap((claim) =>
          (claim.evidence_ids ?? []).filter((evidenceId) => !validEvidenceIds.has(evidenceId))
        )
      )
    ).sort();
    const claimsLabeled = claims.every((claim) => Boolean(claim.label));
    const claimsHaveEvidenceIds = claims.every((claim) => Boolean(claim.evidence_ids?.length));
    const claimEvidenceResolves = claimsHaveEvidenceIds && invalidEvidenceIds.length === 0;
    const actionability = buildReviewEvidenceActionability({
      status: "ready",
      evalStatus: evalSummary.status ?? "missing",
      claimCount: claims.length,
      claimsLabeled,
      claimsHaveEvidenceIds,
      claimEvidenceResolves,
    });

    return {
      worldId,
      artifactRoot: repoRelative(paths.artifactsRoot),
      evalSummaryPath: repoRelative(evalSummaryPath),
      claimsPath: repoRelative(claimsPath),
      chunksPath: repoRelative(chunksPath),
      evalStatus: evalSummary.status ?? "missing",
      claimCount: claims.length,
      claimsLabeled,
      claimsHaveEvidenceIds,
      claimEvidenceResolves,
      invalidEvidenceIds,
      status: "ready",
      unavailableReason: null,
      ...actionability,
    };
  } catch (error) {
    return unavailableBinding(
      worldId,
      sourcePaths,
      error instanceof Error ? error.message : "Selected-world evidence artifacts are unavailable."
    );
  }
}
