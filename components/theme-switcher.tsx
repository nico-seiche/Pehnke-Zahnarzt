"use client";

import { useClickOutside, useDisclosure } from "@mantine/hooks";
import * as React from "react";
import { Icon } from "~/components/icon";
import { COLOR_THEME_STORAGE_KEY, type ColorTheme, isColorTheme } from "~/features/style/color-theme";
import { cx } from "~/features/style/utils";

const THEMES: { value: ColorTheme; label: string; swatch: string }[] = [
  { value: "blue", label: "Blau", swatch: "#2ba3dc" },
  { value: "mint", label: "Mint", swatch: "#33aaa3" },
  { value: "beige", label: "Beige", swatch: "#a9803c" },
  { value: "turquoise", label: "Türkis", swatch: "#1c9d95" },
  { value: "lavender", label: "Lavendel", swatch: "#7e5cc7" },
  { value: "sage", label: "Salbei", swatch: "#6a964f" },
];

function applyTheme(theme: ColorTheme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing / blocked storage — the pick just won't persist across visits.
  }
}

/** Floating button that switches the site's accent color scheme. */
export function ThemeSwitcher() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [theme, setTheme] = React.useState<ColorTheme>("blue");
  const ref = useClickOutside<HTMLDivElement>(close);

  React.useEffect(() => {
    const current = document.documentElement.dataset.theme;

    if (isColorTheme(current)) {
      setTheme(current);
    }
  }, []);

  function handleSelect(next: ColorTheme) {
    setTheme(next);
    applyTheme(next);
    close();
  }

  return (
    <div ref={ref} className="fixed right-16 bottom-16 z-50 flex flex-col items-end gap-8 sm:right-24 sm:bottom-24">
      {opened && (
        <div className="reveal-group grid grid-cols-3 gap-16 rounded-panel bg-surface-card p-16 shadow-lg">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={theme === t.value}
              aria-label={t.label}
              onClick={() => handleSelect(t.value)}
              className="flex cursor-pointer flex-col items-center gap-6"
            >
              <span
                className={cx(
                  "size-32 shrink-0 rounded-full border-2 transition-transform duration-160 ease-out hover:scale-110",
                  theme === t.value ? "border-text-heading" : "border-transparent"
                )}
                style={{ backgroundColor: t.swatch }}
              />
              <span className="font-sans text-caption text-text-muted">{t.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-label="Farbschema wählen"
        aria-expanded={opened}
        className="flex size-52 cursor-pointer items-center justify-center rounded-full bg-brand text-text-on-brand shadow-brand transition-transform duration-160 ease-out hover:scale-105 active:scale-95"
      >
        <Icon name="sparkles" className="text-[22px]" />
      </button>
    </div>
  );
}
