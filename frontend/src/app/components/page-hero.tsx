import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  lede: string;
  actions?: ReactNode;
  support?: string;
  aside?: ReactNode;
  variant?: "home" | "review";
};

export function PageHero({
  eyebrow,
  title,
  lede,
  actions,
  support,
  aside,
  variant = "home"
}: PageHeroProps) {
  return (
    <section className={`pageHero pageHero${variant === "home" ? "Home" : "Review"}`}>
      <div className="pageHeroAmbient pageHeroAmbientPrimary" aria-hidden="true" />
      <div className="pageHeroAmbient pageHeroAmbientSecondary" aria-hidden="true" />
      <div className="pageHeroGrid" aria-hidden="true" />
      <div className="pageHeroInner">
        <div className="pageHeroContent">
          <p className="pageHeroEyebrow">{eyebrow}</p>
          <h1 className="pageHeroTitle">{title}</h1>
          <p className="pageHeroLead">{lede}</p>
          {actions ? <div className="pageHeroActions">{actions}</div> : null}
          {support ? <p className="pageHeroSupport">{support}</p> : null}
        </div>
        {aside ? <div className="pageHeroAside">{aside}</div> : null}
      </div>
    </section>
  );
}
