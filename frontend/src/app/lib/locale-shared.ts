export const MIRROR_LANG_COOKIE = "mirror-lang";
export type AppLocale = "en" | "zh-CN";

export function normalizeLocale(value: string | undefined | null): AppLocale | null {
  if (!value) {
    return null;
  }

  const lowered = value.toLowerCase();
  if (lowered === "en") {
    return "en";
  }
  if (lowered === "zh-cn" || lowered.startsWith("zh")) {
    return "zh-CN";
  }
  return null;
}
