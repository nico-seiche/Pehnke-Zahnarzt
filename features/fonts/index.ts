import { Figtree, IBM_Plex_Mono, Outfit } from "next/font/google";

/**
 * Font substitution per the Penke design system (no original brand fonts supplied):
 * Outfit (display/headings), Figtree (body text), IBM Plex Mono (times, phone numbers).
 * Loaded on `<html>` so the `--font-*` variables exist for the `font-display` / `font-sans` /
 * `font-mono` Tailwind utilities (see `features/style/typography.css`).
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
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

export const fonts = [outfit, figtree, ibmPlexMono];
