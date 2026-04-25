export type PublicDemoArtifactKind = "text" | "json" | "jsonl";

export type PublicDemoArtifactDefinition = {
  id: string;
  label: string;
  description: string;
  kind: PublicDemoArtifactKind;
  mediaType: string;
  relativePath: string;
};

export type PublicDemoManifestEntry = Omit<PublicDemoArtifactDefinition, "relativePath">;

export const PUBLIC_DEMO_ARTIFACTS = [
  {
    id: "demo.report",
    label: "Canonical report",
    description: "Precomputed Fog Harbor narrative report with claim-linked evidence.",
    kind: "text",
    mediaType: "text/markdown; charset=utf-8",
    relativePath: "artifacts/demo/report/report.md"
  },
  {
    id: "demo.claims",
    label: "Claims",
    description: "Structured report claims. Each claim keeps its label and evidence ids.",
    kind: "json",
    mediaType: "application/json; charset=utf-8",
    relativePath: "artifacts/demo/report/claims.json"
  },
  {
    id: "demo.eval_summary",
    label: "Evaluation summary",
    description: "Deterministic evaluation status and metrics for the canonical demo.",
    kind: "json",
    mediaType: "application/json; charset=utf-8",
    relativePath: "artifacts/demo/eval/summary.json"
  },
  {
    id: "demo.compare",
    label: "Branch comparison",
    description: "Reference branch and deterministic what-if branch comparison metadata.",
    kind: "json",
    mediaType: "application/json; charset=utf-8",
    relativePath: "artifacts/demo/compare/scenario_fog_harbor_phase44_matrix/compare.json"
  },
  {
    id: "demo.documents",
    label: "Evidence documents",
    description: "Canonical fictional/authorized evidence document index.",
    kind: "jsonl",
    mediaType: "application/x-ndjson; charset=utf-8",
    relativePath: "artifacts/demo/ingest/documents.jsonl"
  },
  {
    id: "demo.chunks",
    label: "Evidence chunks",
    description: "Evidence chunks referenced by claims and turns.",
    kind: "jsonl",
    mediaType: "application/x-ndjson; charset=utf-8",
    relativePath: "artifacts/demo/ingest/chunks.jsonl"
  },
  {
    id: "demo.graph",
    label: "World graph",
    description: "Bounded Fog Harbor entities, relations, events, and evidence links.",
    kind: "json",
    mediaType: "application/json; charset=utf-8",
    relativePath: "artifacts/demo/graph/graph.json"
  },
  {
    id: "demo.rubric",
    label: "Human review rubric",
    description: "Review rubric used to interpret claims, evidence, and replay quality.",
    kind: "text",
    mediaType: "text/markdown; charset=utf-8",
    relativePath: "docs/rubrics/human-review.md"
  }
] as const satisfies readonly PublicDemoArtifactDefinition[];

export type PublicDemoArtifactId = (typeof PUBLIC_DEMO_ARTIFACTS)[number]["id"];

export function publicDemoManifest(): PublicDemoManifestEntry[] {
  return PUBLIC_DEMO_ARTIFACTS.map(({ relativePath: _relativePath, ...entry }) => entry);
}

export function findPublicDemoArtifact(id: string): PublicDemoArtifactDefinition | null {
  return PUBLIC_DEMO_ARTIFACTS.find((artifact) => artifact.id === id) ?? null;
}
