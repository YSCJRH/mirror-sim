import "./globals.css";

import { IBM_Plex_Mono, Inter } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getAppLocale } from "./lib/locale";

const displayFont = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"]
});

const uiFont = Inter({
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
  title: "Mirror | Evidence-backed What-if Review",
  description:
    "A bilingual workbench for constrained, replayable, evidence-backed what-if comparison in Mirror."
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
