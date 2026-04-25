"use client";

import { useMemo, useState } from "react";

import { ButtonLink } from "./button-link";
import { ContextCard } from "./context-card";
import { StatusPill } from "./status-pill";
import { SurfaceCard } from "./surface-card";
import type { AppLocale } from "../lib/locale-shared";
import type { RubricRow } from "../lib/workbench-data";
import { getCopy } from "../lib/copy";
import { decisionFromScores } from "../review-scorecard/decision";
import {
  formatEvalPosture,
  localizeRubricRow
} from "../lib/presenters";

type ReviewRubricPanelProps = {
  locale: AppLocale;
  rubricRows: RubricRow[];
  claimCount: number;
  divergentTurnCount: number;
  evalName: string;
  evalStatus: string;
  followupHref?: string;
  followupLabel?: string;
};

function scoreLabel(locale: AppLocale, value: number | null) {
  if (value === null) {
    return locale === "zh-CN" ? "未评分" : "Unscored";
  }
  return `${value}/5`;
}

export function ReviewRubricPanel({
  locale,
  rubricRows,
  claimCount,
  divergentTurnCount,
  evalName,
  evalStatus,
  followupHref,
  followupLabel,
}: ReviewRubricPanelProps) {
  const copy = getCopy(locale);
  const [scores, setScores] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(rubricRows.map((row) => [row.dimension, null]))
  );
  const [notes, setNotes] = useState("");

  const selectedScores = useMemo(
    () => Object.values(scores).filter((value): value is number => value !== null),
    [scores]
  );
  const filledCount = selectedScores.length;
  const decision = useMemo(
    () => decisionFromScores(scores, rubricRows.length),
    [scores, rubricRows.length]
  );
  const recommendation =
    decision.tone === "ready"
      ? copy.rubric.recommendationReady
      : decision.tone === "followup"
        ? copy.rubric.recommendationFollowup
        : decision.tone === "hold"
          ? copy.rubric.recommendationHold
          : copy.rubric.recommendationIncomplete;
  const average =
    decision.average === "pending"
      ? locale === "zh-CN"
        ? "待定"
        : "Pending"
      : decision.average;

  return (
    <section className="rubricPanel panel panelAccent" id="scorecard">
      <div className="panelHeader">
        <p className="eyebrow">{copy.review.sectionNav.scorecard}</p>
        <h2>{copy.rubric.title}</h2>
        <p>{copy.rubric.helper}</p>
      </div>

      <div className="rubricSummaryGrid">
        <ContextCard label={copy.rubric.dimensionsComplete} value={`${filledCount}/${rubricRows.length}`} tone="accent" />
        <ContextCard label={copy.rubric.evidenceTracked} value={String(claimCount)} />
        <ContextCard label={copy.rubric.divergentTurns} value={String(divergentTurnCount)} />
        <ContextCard
          label={copy.rubric.evalPosture}
          value={formatEvalPosture(locale, evalName, evalStatus)}
        />
      </div>

      <div className="rubricGrid">
        {rubricRows.map((row) => {
          const localizedRow = localizeRubricRow(locale, row);
          return (
          <SurfaceCard key={row.dimension} className="rubricCard">
            <div className="rubricCardHeader">
              <div>
                <h3>{localizedRow.dimension}</h3>
                <p className="subtle">{scoreLabel(locale, scores[row.dimension])}</p>
              </div>
              <StatusPill tone="subtle">{copy.rubric.scoreLegend}</StatusPill>
            </div>
            <div className="scoreButtons">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`scoreButton${scores[row.dimension] === value ? " scoreButtonActive" : ""}`}
                  onClick={() => setScores((current) => ({ ...current, [row.dimension]: value }))}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="rubricAnchors">
              <p>
                <strong>1</strong> {localizedRow.one}
              </p>
              <p>
                <strong>3</strong> {localizedRow.three}
              </p>
              <p>
                <strong>5</strong> {localizedRow.five}
              </p>
            </div>
          </SurfaceCard>
        )})}
      </div>

      <div className="rubricNotes">
        <label htmlFor="reviewer-notes">{copy.rubric.notesLabel}</label>
        <textarea
          id="reviewer-notes"
          rows={5}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={copy.rubric.notesPlaceholder}
        />
      </div>

      <SurfaceCard className="rubricDecisionCard" tone="accent">
        <div>
          <p className="eyebrow">{copy.rubric.recommendationLabel}</p>
          <h3>{recommendation}</h3>
        </div>
        <div className="claimEvidence">
          <code>
            {copy.rubric.averageLabel}: {average}
          </code>
          {followupHref ? (
            <ButtonLink className="linkPill" href={followupHref} variant="ghost">
              {followupLabel ?? copy.rubric.openLegacy}
            </ButtonLink>
          ) : null}
        </div>
      </SurfaceCard>
    </section>
  );
}
