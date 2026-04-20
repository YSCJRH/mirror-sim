import { cookies, headers } from "next/headers";

import { normalizeLocale, type AppLocale } from "./locale-shared";

export async function getAppLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get("mirror-lang")?.value);
  if (cookieLocale) {
    return cookieLocale;
  }

  const headerStore = await headers();
  const accepted = headerStore.get("accept-language");
  return normalizeLocale(accepted) ?? "en";
}

export function isChineseLocale(locale: AppLocale) {
  return locale === "zh-CN";
}
