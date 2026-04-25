import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  findPublicDemoArtifact,
  publicDemoManifest,
  type PublicDemoManifestEntry
} from "./public-demo-artifacts";

const repoRoot = path.resolve(process.cwd(), "..");
const demoArtifactRoot = "artifacts/demo/";

export class ArtifactNotFoundError extends Error {
  constructor(id: string) {
    super(`Artifact is not available in the public demo manifest: ${id}`);
    this.name = "ArtifactNotFoundError";
  }
}

export type ArtifactSource = {
  listManifest(): PublicDemoManifestEntry[];
  readText(id: string): Promise<string>;
  readJson<T>(id: string): Promise<T>;
  readJsonl<T>(id: string): Promise<T[]>;
  readTrustedDemoText(relativePath: string): Promise<string>;
  readTrustedDemoJson<T>(relativePath: string): Promise<T>;
  readTrustedDemoJsonl<T>(relativePath: string): Promise<T[]>;
};

function resolveRepoPath(relativePath: string) {
  return path.join(repoRoot, relativePath);
}

function parseJsonl<T>(text: string) {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function normalizeTrustedDemoPath(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/");

  if (path.isAbsolute(relativePath) || normalized.includes("..")) {
    throw new ArtifactNotFoundError("trusted-demo-path");
  }

  if (!normalized.startsWith(demoArtifactRoot)) {
    throw new ArtifactNotFoundError("trusted-demo-path");
  }

  return normalized;
}

export function getPublicDemoArtifactSource(): ArtifactSource {
  async function readAllowlistedText(id: string) {
    const artifact = findPublicDemoArtifact(id);

    if (!artifact) {
      throw new ArtifactNotFoundError(id);
    }

    return readFile(resolveRepoPath(artifact.relativePath), "utf-8");
  }

  async function readTrustedDemoText(relativePath: string) {
    return readFile(resolveRepoPath(normalizeTrustedDemoPath(relativePath)), "utf-8");
  }

  return {
    listManifest() {
      return publicDemoManifest();
    },
    async readText(id: string) {
      return readAllowlistedText(id);
    },
    async readJson<T>(id: string) {
      return JSON.parse(await readAllowlistedText(id)) as T;
    },
    async readJsonl<T>(id: string) {
      return parseJsonl<T>(await readAllowlistedText(id));
    },
    async readTrustedDemoText(relativePath: string) {
      return readTrustedDemoText(relativePath);
    },
    async readTrustedDemoJson<T>(relativePath: string) {
      return JSON.parse(await readTrustedDemoText(relativePath)) as T;
    },
    async readTrustedDemoJsonl<T>(relativePath: string) {
      return parseJsonl<T>(await readTrustedDemoText(relativePath));
    }
  };
}

export function publicArtifactErrorMessage(error: unknown) {
  if (error instanceof ArtifactNotFoundError) {
    return "The requested demo artifact is not part of the public allowlist.";
  }

  return "The public demo artifact is unavailable.";
}
