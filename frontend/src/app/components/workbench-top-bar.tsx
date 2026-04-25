import Link from "next/link";

import type { AppLocale } from "../lib/locale-shared";
import type { MainPathNavItem } from "../lib/main-path-navigation";
import { LanguageSwitch } from "./language-switch";

type WorkbenchTopBarProps = {
  locale: AppLocale;
  eyebrow: string;
  items: MainPathNavItem[];
};

export function WorkbenchTopBar({
  locale,
  eyebrow,
  items
}: WorkbenchTopBarProps) {
  return (
    <header className="workbenchTopBar">
      <div className="workbenchTopBarBrand">
        <p className="workbenchTopBarEyebrow">{eyebrow}</p>
        <div className="workbenchTopBarLinks">
          {items.map((item) =>
            item.active ? (
              <span key={item.href} className="topBarActive" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            )
          )}
        </div>
      </div>
      <LanguageSwitch locale={locale} />
    </header>
  );
}
