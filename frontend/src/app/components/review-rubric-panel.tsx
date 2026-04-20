"use client";

import { useMemo, useState } from "react";

import type { AppLocale } from "../lib/locale-shared";
import type { RubricRow } from "../lib/workbench-data";
import { getCopy } from "../lib/copy";
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
  evalStatus
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
  const average =
    selectedScores.length > 0
      ? (selectedScores.reduce((sum, value) => sum + value, 0) / selectedScores.length).toFixed(1)
      : "0.0";

  const recommendation = useMemo(() => {
    if (filledCount < rubricRows.length) {
      return copy.rubric.recommendationIncomplete;
    }
    const minimum = Math.min(...selectedScores);
    const numericAverage = Number(average);
    if (numericAverage >= 4 && minimum >= 3) {
      return copy.rubric.recommendationReady;
    }
    if (numericAverage >= 3 && minimum >= 2) {
      return copy.rubric.recommendationFollowup;
    }
    return copy.rubric.recommendationHold;
  }, [average, copy.rubric, filledCount, rubricRows.length, selectedScores]);

  return (
    <section className="rubricPanel panel panelAccent" id="scorecard">
      <div className="panelHeader">
        <p className="eyebrow">{copy.review.sectionNav.scorecard}</p>
        <h2>{copy.rubric.title}</h2>
        <p>{copy.rubric.helper}</p>
      </div>

      <div className="rubricSummaryGrid">
        <article className="briefCard briefCardDark">
          <span>{copy.rubric.dimensionsComplete}</span>
          <strong>
            {filledCount}/{rubricRows.length}
          </strong>
        </article>
        <article className="briefCard">
          <span>{copy.rubric.evidenceTracked}</span>
          <strong>{claimCount}</strong>
        </article>
        <article className="briefCard">
          <span>{copy.rubric.divergentTurns}</span>
          <strong>{divergentTurnCount}</strong>
        </article>
        <article className="briefCard">
          <span>{copy.rubric.evalPosture}</span>
          <strong>{formatEvalPosture(locale, evalName, evalStatus)}</strong>
        </article>
      </div>

      <div className="rubricGrid">
        {rubricRows.map((row) => {
          const localizedRow = localizeRubricRow(locale, row);
          return (
          <article key={row.dimension} className="rubricCard">
            <div className="rubricCardHeader">
              <div>
                <h3>{localizedRow.dimension}</h3>
                <p className="subtle">{scoreLabel(locale, scores[row.dimension])}</p>
              </div>
              <span className="pill">{copy.rubric.scoreLegend}</span>
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
          </article>
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

      <div className="rubricDecisionCard">
        <div>
          <p className="eyebrow">{copy.rubric.recommendationLabel}</p>
          <h3>{recommendation}</h3>
        </div>
        <div className="claimEvidence">
          <code>
            {copy.rubric.averageLabel}: {average}
          </code>
          <a className="linkPill" href="#advanced-operations">
            {copy.rubric.openLegacy}
          </a>
        </div>
      </div>
    </section>
  );
}
