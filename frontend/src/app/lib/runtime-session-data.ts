import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type {
  Claim,
  ChunkRow,
  CompareArtifact,
  CompareBranch,
  CompareBranchDelta,
  DocumentRow,
  GraphPayload,
  RunSummary,
  SnapshotPayload,
  TurnAction,
} from "./workbench-data";
import { resolveProductWorldPaths } from "./world-paths";

export type RuntimePerturbationPayload = {
  kind: string;
  target_id: string;
  timing: string;
  summary: string;
  parameters?: Record<string, unknown>;
  evidence_ids?: string[];
};

export type RuntimeSessionNodeRecord = {
  node_id: string;
  parent_node_id: string | null;
  status: "pending" | "running" | "succeeded" | "failed";
  label: string;
  node_path: string;
};

export type RuntimeSessionManifest = {
  session_id: string;
  world_id: string;
  scenario_id: string;
  root_node_id: string;
  active_node_id: string;
  decision_config?: {
    provider: "openai_compatible" | "hosted_openai" | "deterministic_only";
    model_id: string | null;
  };
  created_at: string;
  scenario_path?: string | null;
  session_path?: string | null;
  nodes: RuntimeSessionNodeRecord[];
};

export type RuntimeSessionNodeManifest = {
  node_id: string;
  session_id: string;
  parent_node_id: string | null;
  status: "pending" | "running" | "succeeded" | "failed";
  world_id: string;
  scenario_id: string;
  label: string;
  perturbation: RuntimePerturbationPayload | null;
  run_id: string | null;
  summary_path: string | null;
  trace_path: string | null;
  snapshot_dir: string | null;
  compare_path: string | null;
  report_path: string | null;
  claims_path: string | null;
  resolution_path: string | null;
  decision_trace_path: string | null;
  created_at: string;
  notes: string[];
};

export type RuntimeRunPayload = {
  branch: CompareBranch;
  summary: RunSummary;
  actions: TurnAction[];
  snapshots: SnapshotPayload[];
};

export type RuntimeComparisonRow = {
  turnIndex: number;
  reference: {
    turn: TurnAction;
    snapshot: SnapshotPayload | null;
  } | null;
  candidate: {
    turn: TurnAction;
    snapshot: SnapshotPayload | null;
  } | null;
};

export type RuntimeLineageEntry = {
  node: RuntimeSessionNodeManifest;
  depth: number;
  isRoot: boolean;
};

export type RuntimeDecisionTraceEntry = {
  run_id: string;
  turn_index: number;
  actor_id: string;
  provider_mode: string;
  model_id: string | null;
  prompt_version: string | null;
  input_hash: string;
  output_hash: string | null;
  available_choices: string[];
  selected_choice_index: number;
  selected_action_type: string;
  selected_target_id: string | null;
  rationale: string;
  validation_status: string;
  fallback_used: boolean;
};

export type RuntimeDecisionSummary = {
  decisionCount: number;
  fallbackCount: number;
  replayCount: number;
  providerModes: string[];
  modelId: string | null;
  promptVersion: string | null;
};

export type RuntimeSessionWorkspace = {
  session: RuntimeSessionManifest;
  selectedNode: RuntimeSessionNodeManifest;
  rootNode: RuntimeSessionNodeManifest;
  lineage: RuntimeLineageEntry[];
  decisionSummary: RuntimeDecisionSummary | null;
  graph: GraphPayload;
  reportText: string | null;
  compareArtifact: CompareArtifact | null;
  compareDelta: CompareBranchDelta | null;
  referenceRun: RuntimeRunPayload | null;
  candidateRun: RuntimeRunPayload | null;
  rows: RuntimeComparisonRow[];
  relevantClaims: RuntimeClaimDrilldown[];
};

export type RuntimeSessionLocator = {
  sessionId: string;
  activeNodeId: string;
  createdAt: string;
};

export type RuntimeClaimDrilldown = {
  claim: Claim;
  evidenceChunks: Array<{
    chunk: ChunkRow;
    document: DocumentRow | null;
  }>;
  relatedRuntimeTurns: Array<{
    turn: TurnAction;
    snapshot: SnapshotPayload | null;
  }>;
};

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

async function listRuntimeSessionLocatorsForWorld(
  worldId: string
): Promise<RuntimeSessionLocator[]> {
  const artifactsRoot = resolveProductWorldPaths(worldId).artifactsRoot;
  const sessionsRoot = path.join(artifactsRoot, "sessions");

  try {
    const entries = await readdir(sessionsRoot, { withFileTypes: true });
    const manifests = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          try {
            const session = await readJson<RuntimeSessionManifest>(
              path.join(sessionsRoot, entry.name, "session.json")
            );
            return {
              sessionId: session.session_id,
              activeNodeId: session.active_node_id,
              createdAt: session.created_at,
            } satisfies RuntimeSessionLocator;
          } catch {
            return null;
          }
        })
    );

    return manifests
      .filter((manifest): manifest is RuntimeSessionLocator => Boolean(manifest))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
  } catch {
    return [];
  }
}

async function loadRunPayload(scopeRoot: string, branch: CompareBranch): Promise<RuntimeRunPayload> {
  const summary = await readJson<RunSummary>(path.join(scopeRoot, branch.summary_path));
  const actions = await readJsonl<TurnAction>(path.join(scopeRoot, branch.trace_path));
  const snapshots =
    branch.snapshot_dir.length > 0
      ? await Promise.all(
          Array.from({ length: summary.turn_budget }, (_, index) =>
            readJson<SnapshotPayload>(
              path.join(
                scopeRoot,
                branch.snapshot_dir,
                `turn-${String(index + 1).padStart(2, "0")}.json`
              )
            )
          )
        )
      : [];

  return {
    branch,
    summary,
    actions,
    snapshots,
  };
}

async function loadRuntimeClaimDrilldowns(
  artifactsRoot: string,
  candidateEntries: Array<{
    turn: TurnAction;
    snapshot: SnapshotPayload | null;
  }>,
  claimsPath?: string | null
): Promise<RuntimeClaimDrilldown[]> {
  let claims: Claim[] = [];
  try {
    claims = await readJson<Claim[]>(
      claimsPath
        ? path.join(artifactsRoot, claimsPath)
        : path.join(artifactsRoot, "report", "claims.json")
    );
  } catch {
    return [];
  }
  const [documents, chunks] = await Promise.all([
    readJsonl<DocumentRow>(path.join(artifactsRoot, "ingest", "documents.jsonl")),
    readJsonl<ChunkRow>(path.join(artifactsRoot, "ingest", "chunks.jsonl")),
  ]);
  const documentsById = new Map(documents.map((document) => [document.document_id, document]));
  const chunksById = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]));
  const candidateEvidenceIds = new Set(
    candidateEntries.flatMap((entry) => entry.turn.evidence_ids)
  );

  const ranked = claims
    .map((claim) => {
      const evidenceOverlap = claim.evidence_ids.filter((chunkId) =>
        candidateEvidenceIds.has(chunkId)
      ).length;
      const relatedRuntimeTurns = candidateEntries.filter((entry) =>
        entry.turn.evidence_ids.some((chunkId) => claim.evidence_ids.includes(chunkId))
      );
      const score = evidenceOverlap * 3 + relatedRuntimeTurns.length;

      return {
        claim,
        evidenceChunks: claim.evidence_ids
          .map((chunkId) => chunksById.get(chunkId))
          .filter((chunk): chunk is ChunkRow => Boolean(chunk))
          .map((chunk) => ({
            chunk,
            document: documentsById.get(chunk.document_id) ?? null,
          })),
        relatedRuntimeTurns,
        score,
      };
    })
    .sort((left, right) => right.score - left.score);

  const selected = ranked.some((entry) => entry.score > 0)
    ? ranked.filter((entry) => entry.score > 0).slice(0, 3)
    : ranked.slice(0, 3);

  return selected.map(({ claim, evidenceChunks, relatedRuntimeTurns }) => ({
    claim,
    evidenceChunks,
    relatedRuntimeTurns,
  }));
}

async function loadRuntimeNodeLineage(
  session: RuntimeSessionManifest,
  nodeId: string,
  artifactsRoot: string
): Promise<RuntimeLineageEntry[]> {
  const recordsById = new Map(session.nodes.map((node) => [node.node_id, node]));
  const lineage: RuntimeLineageEntry[] = [];
  const visited = new Set<string>();
  let currentNodeId: string | null = nodeId;

  while (currentNodeId) {
    if (visited.has(currentNodeId)) {
      throw new Error(`Cycle detected while loading runtime lineage for ${currentNodeId}.`);
    }
    visited.add(currentNodeId);

    const record = recordsById.get(currentNodeId);
    if (!record) {
      throw new Error(`Missing runtime node record for ${currentNodeId}.`);
    }

    const node = await readJson<RuntimeSessionNodeManifest>(
      path.join(artifactsRoot, record.node_path)
    );
    lineage.push({
      node,
      depth: lineage.length,
      isRoot: node.parent_node_id === null,
    });
    currentNodeId = node.parent_node_id;
  }

  return lineage.reverse().map((entry, index) => ({
    ...entry,
    depth: index,
  }));
}

async function loadRuntimeDecisionSummary(
  sessionRoot: string,
  decisionTracePath?: string | null
): Promise<RuntimeDecisionSummary | null> {
  if (!decisionTracePath) {
    return null;
  }

  try {
    const entries = await readJsonl<RuntimeDecisionTraceEntry>(
      path.join(sessionRoot, decisionTracePath)
    );
    if (entries.length === 0) {
      return null;
    }

    return {
      decisionCount: entries.length,
      fallbackCount: entries.filter((entry) => entry.fallback_used).length,
      replayCount: entries.filter((entry) => entry.provider_mode === "replay_cache").length,
      providerModes: Array.from(new Set(entries.map((entry) => entry.provider_mode))),
      modelId: entries.find((entry) => entry.model_id)?.model_id ?? null,
      promptVersion: entries.find((entry) => entry.prompt_version)?.prompt_version ?? null,
    };
  } catch {
    return null;
  }
}

export async function loadRuntimeSessionWorkspace(
  sessionId: string,
  requestedNodeId?: string | null
): Promise<RuntimeSessionWorkspace | null> {
  return loadRuntimeSessionWorkspaceForWorld("fog-harbor-east-gate", sessionId, requestedNodeId);
}

export async function loadRuntimeSessionWorkspaceForWorld(
  worldId: string,
  sessionId: string,
  requestedNodeId?: string | null
): Promise<RuntimeSessionWorkspace | null> {
  const artifactsRoot = resolveProductWorldPaths(worldId).artifactsRoot;
  const sessionRoot = path.join(artifactsRoot, "sessions", sessionId);
  const sessionPath = path.join(sessionRoot, "session.json");

  try {
    const [session, graph] = await Promise.all([
      readJson<RuntimeSessionManifest>(sessionPath),
      readJson<GraphPayload>(path.join(artifactsRoot, "graph", "graph.json")),
    ]);
    const selectedNodeId = session.nodes.some((node) => node.node_id === requestedNodeId)
      ? requestedNodeId ?? session.active_node_id
      : session.active_node_id;
    const selectedNodePath =
      session.nodes.find((node) => node.node_id === selectedNodeId)?.node_path ??
      session.nodes[0]?.node_path;
    const rootNodePath =
      session.nodes.find((node) => node.node_id === session.root_node_id)?.node_path ??
      session.nodes[0]?.node_path;

    if (!selectedNodePath || !rootNodePath) {
      return null;
    }

    const [selectedNode, rootNode, lineage] = await Promise.all([
      readJson<RuntimeSessionNodeManifest>(path.join(artifactsRoot, selectedNodePath)),
      readJson<RuntimeSessionNodeManifest>(path.join(artifactsRoot, rootNodePath)),
      loadRuntimeNodeLineage(session, selectedNodeId, artifactsRoot),
    ]);
    const decisionSummary = await loadRuntimeDecisionSummary(
      sessionRoot,
      selectedNode.decision_trace_path
    );

    if (!selectedNode.compare_path) {
      return {
        session,
        selectedNode,
        rootNode,
        lineage,
        decisionSummary,
        graph,
        reportText: selectedNode.report_path
          ? await readText(path.join(artifactsRoot, selectedNode.report_path))
          : null,
        compareArtifact: null,
        compareDelta: null,
        referenceRun: null,
        candidateRun: null,
        rows: [],
        relevantClaims: [],
      };
    }

    const compareArtifact = await readJson<CompareArtifact>(
      path.join(artifactsRoot, selectedNode.compare_path)
    );
    const referenceBranch =
      compareArtifact.branches.find((branch) => branch.is_reference) ??
      compareArtifact.branches[0];
    const candidateBranch =
      compareArtifact.branches.find((branch) => !branch.is_reference) ?? null;
    const compareDelta =
      candidateBranch
        ? compareArtifact.reference_deltas.find(
            (delta) => delta.branch_id === candidateBranch.branch_id
          ) ?? null
        : null;

    if (!referenceBranch || !candidateBranch || !compareDelta) {
      return {
        session,
        selectedNode,
        rootNode,
        lineage,
        decisionSummary,
        graph,
        reportText: selectedNode.report_path
          ? await readText(path.join(artifactsRoot, selectedNode.report_path))
          : null,
        compareArtifact,
        compareDelta: null,
        referenceRun: null,
        candidateRun: null,
        rows: [],
        relevantClaims: [],
      };
    }

    const [referenceRun, candidateRun] = await Promise.all([
      loadRunPayload(sessionRoot, referenceBranch),
      loadRunPayload(sessionRoot, candidateBranch),
    ]);
    const referenceTurns = new Map(
      referenceRun.actions.map((turn, index) => [
        turn.turn_id,
        { turn, snapshot: referenceRun.snapshots[index] ?? null },
      ])
    );
    const candidateTurns = new Map(
      candidateRun.actions.map((turn, index) => [
        turn.turn_id,
        { turn, snapshot: candidateRun.snapshots[index] ?? null },
      ])
    );
    const rows = compareDelta.divergent_turns.map((row) => ({
      turnIndex: row.turn_index,
      reference: row.reference_turn_id
        ? referenceTurns.get(row.reference_turn_id) ?? null
        : null,
      candidate: row.candidate_turn_id
        ? candidateTurns.get(row.candidate_turn_id) ?? null
        : null,
    }));
    const relevantClaims = await loadRuntimeClaimDrilldowns(
      artifactsRoot,
      rows.flatMap((row) => (row.candidate ? [row.candidate] : [])),
      selectedNode.claims_path
    );

    return {
      session,
      selectedNode,
      rootNode,
      lineage,
      decisionSummary,
      graph,
      reportText: selectedNode.report_path
        ? await readText(path.join(artifactsRoot, selectedNode.report_path))
        : null,
      compareArtifact,
      compareDelta,
      referenceRun,
      candidateRun,
      rows,
      relevantClaims,
    };
  } catch {
    return null;
  }
}

export async function findLatestRuntimeSessionForWorld(
  worldId: string
): Promise<RuntimeSessionLocator | null> {
  const sessions = await listRuntimeSessionLocatorsForWorld(worldId);
  return sessions[0] ?? null;
}
