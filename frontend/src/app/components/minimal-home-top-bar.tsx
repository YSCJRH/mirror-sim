import Link from "next/link";

import type { AppLocale } from "../lib/locale-shared";
import { LanguageSwitch } from "./language-switch";

export type MinimalHomeAdvancedLink = {
  href?: string;
  label: string;
  description: string;
  disabled?: boolean;
};

type MinimalHomeTopBarProps = {
  locale: AppLocale;
  advancedLinks: MinimalHomeAdvancedLink[];
};

export function MinimalHomeTopBar({
  locale,
  advancedLinks,
}: MinimalHomeTopBarProps) {
  return (
    <header className="minimalHomeTopBar">
      <div className="minimalHomeBrand">
        <span className="minimalHomeBrandMark">Mirror</span>
        <p className="minimalHomeBrandText">
          {locale === "zh-CN" ? "世界分支模拟器" : "World branch simulator"}
        </p>
      </div>

      <div className="minimalHomeTopBarActions">
        <details className="advancedMenu">
          <summary className="advancedMenuTrigger">
            {locale === "zh-CN" ? "Advanced" : "Advanced"}
          </summary>
          <div className="advancedMenuPanel">
            <p className="advancedMenuTitle">
              {locale === "zh-CN" ? "后台入口" : "Advanced entry"}
            </p>
            <div className="advancedMenuList">
              {advancedLinks.map((link) =>
                link.disabled || !link.href ? (
                  <div key={link.label} className="advancedMenuItem advancedMenuItemDisabled">
                    <strong>{link.label}</strong>
                    <p>{link.description}</p>
                  </div>
                ) : (
                  <Link key={link.href} href={link.href} className="advancedMenuItem">
                    <strong>{link.label}</strong>
                    <p>{link.description}</p>
                  </Link>
                )
              )}
            </div>
          </div>
        </details>
        <LanguageSwitch locale={locale} />
      </div>
    </header>
  );
}
