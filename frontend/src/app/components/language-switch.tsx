"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { MIRROR_LANG_COOKIE, type AppLocale } from "../lib/locale-shared";

type LanguageSwitchProps = {
  locale: AppLocale;
};

export function LanguageSwitch({ locale }: LanguageSwitchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `${MIRROR_LANG_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="languageSwitch" aria-label="Language switch / 语言切换">
      <button
        type="button"
        className={`languageButton${locale === "zh-CN" ? " languageButtonActive" : ""}`}
        onClick={() => setLocale("zh-CN")}
        aria-pressed={locale === "zh-CN"}
        aria-label="切换到中文"
        title="切换到中文"
        disabled={isPending}
      >
        中文
      </button>
      <button
        type="button"
        className={`languageButton${locale === "en" ? " languageButtonActive" : ""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        aria-label="Switch to English"
        title="Switch to English"
        disabled={isPending}
      >
        EN
      </button>
    </div>
  );
}
