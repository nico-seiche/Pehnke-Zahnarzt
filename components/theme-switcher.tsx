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
];

function applyTheme(theme: ColorTheme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing / blocked storage — the pick just won't persist across visits.
  }
}

/** Floating button that switches the site's accent color scheme (blue / mint / beige). */
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
    <div ref={ref} className="fixed right-16 bottom-16 z-50 flex flex-col items-center gap-8 sm:right-24 sm:bottom-24">
      {opened && (
        <div className="reveal-group flex flex-col gap-8 rounded-pill bg-surface-card p-8 shadow-lg">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-label={`Farbschema ${t.label}`}
              aria-pressed={theme === t.value}
              onClick={() => handleSelect(t.value)}
              className={cx(
                "size-32 shrink-0 cursor-pointer rounded-full border-2 transition-transform duration-160 ease-out hover:scale-110",
                theme === t.value ? "border-text-heading" : "border-transparent"
              )}
              style={{ backgroundColor: t.swatch }}
            />
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
