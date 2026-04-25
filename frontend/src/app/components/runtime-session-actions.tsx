"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RuntimeSessionActionsProps = {
  worldId?: string;
  sessionId: string;
  targetNodeId: string;
  locale: "en" | "zh-CN";
  label?: string;
  pendingLabel?: string;
  returnHref?: string;
};

export function RuntimeSessionActions({
  worldId = "fog-harbor-east-gate",
  sessionId,
  targetNodeId,
  locale,
  label,
  pendingLabel,
  returnHref,
}: RuntimeSessionActionsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleRollback() {
    try {
      setIsPending(true);
      setErrorMessage(null);
      const response = await fetch("/api/runtime/rollback-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          worldId,
          sessionId,
          toNode: targetNodeId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to roll back the current session.");
      }

      router.push(
        returnHref ??
          `/perturb?session=${encodeURIComponent(sessionId)}&node=${encodeURIComponent(targetNodeId)}`
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : locale === "zh-CN"
            ? "回退当前实验失败。"
            : "Failed to roll back the current session."
      );
      setIsPending(false);
      return;
    }

    setIsPending(false);
  }

  return (
    <div className="runtimeActionBlock">
      <button
        type="button"
        className="simulatorToggle"
        onClick={handleRollback}
        disabled={isPending}
      >
        {isPending
          ? pendingLabel ??
            (locale === "zh-CN" ? "正在回退..." : "Rolling back...")
          : label ??
            (locale === "zh-CN" ? "回退到此节点" : "Rollback to this node")}
      </button>
      {errorMessage ? <p className="subtle">{errorMessage}</p> : null}
    </div>
  );
}
