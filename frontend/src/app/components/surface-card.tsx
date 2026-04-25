import type { ReactNode } from "react";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "strong";
  interactive?: boolean;
  as?: "article" | "div" | "section";
};

export function SurfaceCard({
  children,
  className = "",
  tone = "default",
  interactive = false,
  as = "article"
}: SurfaceCardProps) {
  const Component = as;
  const classes = [
    "surfaceCard",
    tone === "accent"
      ? "surfaceCardAccent"
      : tone === "strong"
        ? "surfaceCardStrong"
        : "surfaceCardDefault",
    interactive ? "surfaceCardInteractive" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <Component className={classes}>{children}</Component>;
}
