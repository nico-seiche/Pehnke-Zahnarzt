import { Figtree, Fraunces, IBM_Plex_Mono } from "next/font/google";

/**
 * Fraunces (display/headings, editorial serif), Figtree (body text), IBM Plex Mono
 * (times, phone numbers). Loaded on `<html>` so the `--font-*` variables exist for the
 * `font-display` / `font-sans` / `font-mono` Tailwind utilities (see `features/style/typography.css`).
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-figtree",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const fonts = [fraunces, figtree, ibmPlexMono];
