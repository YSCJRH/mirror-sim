import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");

export type ProductWorldPaths = {
  worldId: string;
  dataRoot: string;
  artifactsRoot: string;
  productPath: string;
  graphPath: string;
  personasPath: string;
  baselineScenarioPath: string;
};

export function resolveProductWorldPaths(worldId: string): ProductWorldPaths {
  if (worldId === "fog-harbor-east-gate") {
    const dataRoot = path.join(repoRoot, "data", "demo");
    return {
      worldId,
      dataRoot,
      artifactsRoot: path.join(repoRoot, "artifacts", "demo"),
      productPath: path.join(dataRoot, "config", "product.json"),
      graphPath: path.join(repoRoot, "artifacts", "demo", "graph", "graph.json"),
      personasPath: path.join(repoRoot, "artifacts", "demo", "personas", "personas.json"),
      baselineScenarioPath: path.join(dataRoot, "scenarios", "baseline.yaml"),
    };
  }

  const runtimeRoot = path.join(repoRoot, "state", "worlds", worldId);
  const runtimeProductPath = path.join(runtimeRoot, "config", "product.json");
  if (existsSync(runtimeProductPath)) {
    return {
      worldId,
      dataRoot: runtimeRoot,
      artifactsRoot: path.join(repoRoot, "state", "artifacts", "worlds", worldId),
      productPath: runtimeProductPath,
      graphPath: path.join(repoRoot, "state", "artifacts", "worlds", worldId, "graph", "graph.json"),
      personasPath: path.join(repoRoot, "state", "artifacts", "worlds", worldId, "personas", "personas.json"),
      baselineScenarioPath: path.join(runtimeRoot, "scenarios", "baseline.yaml"),
    };
  }

  const repoWorldRoot = path.join(repoRoot, "data", "worlds", worldId);
  return {
    worldId,
    dataRoot: repoWorldRoot,
    artifactsRoot: path.join(repoRoot, "artifacts", "worlds", worldId),
    productPath: path.join(repoWorldRoot, "config", "product.json"),
    graphPath: path.join(repoRoot, "artifacts", "worlds", worldId, "graph", "graph.json"),
    personasPath: path.join(repoRoot, "artifacts", "worlds", worldId, "personas", "personas.json"),
    baselineScenarioPath: path.join(repoWorldRoot, "scenarios", "baseline.yaml"),
  };
}

export async function listProductWorldIds() {
  const worlds = ["fog-harbor-east-gate"];
  for (const root of [
    path.join(repoRoot, "state", "worlds"),
    path.join(repoRoot, "data", "worlds"),
  ]) {
    try {
      const entries = await readdir(root);
      for (const entry of entries) {
        const candidate = path.join(root, entry);
        const productPath = path.join(candidate, "config", "product.json");
        if ((await stat(candidate)).isDirectory() && existsSync(productPath)) {
          worlds.push(entry);
        }
      }
    } catch {
      continue;
    }
  }

  return Array.from(new Set(worlds));
}
