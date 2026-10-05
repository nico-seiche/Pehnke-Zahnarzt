export const COLOR_THEME_STORAGE_KEY = "pk-color-theme";

export const COLOR_THEMES = ["sage", "blue", "mint", "beige", "turquoise", "lavender"] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number];

export function isColorTheme(value: unknown): value is ColorTheme {
  return typeof value === "string" && (COLOR_THEMES as readonly string[]).includes(value);
}
