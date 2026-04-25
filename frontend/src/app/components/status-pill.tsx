import type { ReactNode } from "react";

type StatusPillProps = {
  children: ReactNode;
  tone?: "default" | "accent" | "strong" | "subtle";
  className?: string;
};

export function StatusPill({
  children,
  tone = "default",
  className = ""
}: StatusPillProps) {
  const classes = [
    "statusPillShell",
    tone === "accent"
      ? "statusPillAccent"
      : tone === "strong"
        ? "statusPillStrong"
        : tone === "subtle"
          ? "statusPillSubtle"
          : "statusPillDefault",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
