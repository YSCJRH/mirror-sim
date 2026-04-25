"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { RubricRow } from "../lib/workbench-data";
import type { ClaimPacket, DivergentTurn } from "../review-scorecard/types";

const ReviewScorecard = dynamic(
  () => import("../review-scorecard").then((module) => module.ReviewScorecard),
  {
    loading: () => <p className="editorialDrawerLoading">Loading legacy compatibility tools…</p>
  }
);

type LegacyOperationsPanelProps = {
  title: string;
  summary: string;
  disclosure: string;
  note: string;
  previewTitle: string;
  previewSummary: string;
  rubricRows: RubricRow[];
  claimCount: number;
  divergentTurnCount: number;
  evalName: string;
  evalStatus: string;
  claimPackets: ClaimPacket[];
  divergentTurns: DivergentTurn[];
};

export function LegacyOperationsPanel({
  title,
  summary,
  disclosure,
  note,
  previewTitle,
  previewSummary,
  rubricRows,
  claimCount,
  divergentTurnCount,
  evalName,
  evalStatus,
  claimPackets,
  divergentTurns
}: LegacyOperationsPanelProps) {
  const [shouldRenderScorecard, setShouldRenderScorecard] = useState(false);

  return (
    <details
      className="editorialDrawer"
      onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open) {
          setShouldRenderScorecard(true);
        }
      }}
    >
      <summary className="editorialDrawerSummary">
        <div>
          <strong>{title}</strong>
          <span>{summary}</span>
        </div>
        <StatusPill tone="accent">{disclosure}</StatusPill>
      </summary>
      <div className="editorialDrawerBody">
        <p className="editorialDrawerNote">{note}</p>
        {shouldRenderScorecard ? (
          <div lang="en">
            <ReviewScorecard
              rubricRows={rubricRows}
              claimCount={claimCount}
              divergentTurnCount={divergentTurnCount}
              evalName={evalName}
              evalStatus={evalStatus}
              claimPackets={claimPackets}
              divergentTurns={divergentTurns}
            />
          </div>
        ) : (
          <SurfaceCard className="editorialDrawerPreview" tone="strong" as="div">
            <strong>{previewTitle}</strong>
            <p>{previewSummary}</p>
          </SurfaceCard>
        )}
      </div>
    </details>
  );
}
