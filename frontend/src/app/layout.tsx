import "./globals.css";

import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getAppLocale } from "./lib/locale";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"]
});

const uiFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"]
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: "Mirror Workbench | Mirror 工作台",
  description:
    "Bilingual editorial workbench for constrained, evidence-backed scenario comparison in Mirror."
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getAppLocale();

  return (
    <html lang={locale}>
      <body className={`${displayFont.variable} ${uiFont.variable} ${monoFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
