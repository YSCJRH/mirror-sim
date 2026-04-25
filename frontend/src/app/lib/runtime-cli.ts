import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { resolveProductWorldPaths } from "./world-paths";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(process.cwd(), "..");
const pythonCommand = process.env.PYTHON ?? "python";

async function runMirrorCli(
  args: string[],
  runtimeEnv: Record<string, string | undefined> = {}
) {
  try {
    const { stdout } = await execFileAsync(
      pythonCommand,
      ["-m", "backend.app.cli", ...args],
      {
        cwd: repoRoot,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          ...Object.fromEntries(
            Object.entries(runtimeEnv).filter((entry): entry is [string, string] => Boolean(entry[1]))
          ),
        },
      }
    );
    return JSON.parse(stdout);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to execute Mirror runtime command.";
    throw new Error(message);
  }
}

export async function startRuntimeSession(
  worldId: string,
  scenarioId: string,
  decisionProvider?: string,
  decisionModel?: string
) {
  const args = [
    "start-session",
    "--world",
    worldId,
    "--scenario",
    scenarioId,
  ];
  if (decisionProvider && decisionProvider.trim()) {
    args.push("--decision-provider", decisionProvider.trim());
  }
  if (decisionModel && decisionModel.trim()) {
    args.push("--decision-model", decisionModel.trim());
  }
  return runMirrorCli(args);
}

export async function createRuntimeWorld(spec: Record<string, unknown>) {
  return runMirrorCli([
    "create-world",
    "--spec",
    JSON.stringify(spec),
  ]);
}

export async function generateRuntimeBranch(
  worldId: string,
  sessionId: string,
  fromNode: string,
  perturbation: Record<string, unknown>,
  credentials?: {
    apiKey?: string;
    baseUrl?: string;
    betaUserId?: string;
  }
) {
  const args = [
    "generate-branch",
    "--session",
    sessionId,
    "--from",
    fromNode,
    "--perturbation",
    JSON.stringify(perturbation),
    "--artifacts-root",
    resolveProductWorldPaths(worldId).artifactsRoot,
  ];
  if (credentials?.betaUserId) {
    args.push("--beta-user-id", credentials.betaUserId);
  }
  return runMirrorCli(args, {
    OPENAI_API_KEY: credentials?.apiKey,
    OPENAI_BASE_URL: credentials?.baseUrl,
    MIRROR_BETA_USER_ID: credentials?.betaUserId,
  });
}

export async function rollbackRuntimeSession(worldId: string, sessionId: string, toNode: string) {
  return runMirrorCli([
    "rollback-session",
    "--session",
    sessionId,
    "--to",
    toNode,
    "--artifacts-root",
    resolveProductWorldPaths(worldId).artifactsRoot,
  ]);
}
