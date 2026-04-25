import { SurfaceCard } from "./surface-card";

type ContextCardProps = {
  label: string;
  value: string;
  summary?: string;
  tone?: "default" | "accent" | "strong";
  code?: boolean;
  className?: string;
};

export function ContextCard({
  label,
  value,
  summary,
  tone = "default",
  code = false,
  className = ""
}: ContextCardProps) {
  return (
    <SurfaceCard className={`contextCard ${className}`.trim()} tone={tone}>
      <span className="contextCardLabel">{label}</span>
      {code ? <code className="contextCardCode">{value}</code> : <strong className="contextCardValue">{value}</strong>}
      {summary ? <p className="contextCardSummary">{summary}</p> : null}
    </SurfaceCard>
  );
}
