import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "secondary",
  className = ""
}: ButtonLinkProps) {
  const classes = [
    "buttonLink",
    variant === "primary"
      ? "buttonLinkPrimary"
      : variant === "ghost"
        ? "buttonLinkGhost"
        : "buttonLinkSecondary",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={classes} href={href}>
      {children}
    </Link>
  );
}
