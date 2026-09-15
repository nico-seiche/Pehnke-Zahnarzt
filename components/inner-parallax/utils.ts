import { type Screen, screens } from "~/features/dom/constants";
import { parseResponsiveValues } from "~/features/dom/utils";

function normalizeValue(value: string): string {
  const trimmed = value.trim();
  // If it's a plain number (no units like px, %, vh, etc.), add px
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return `${trimmed}px`;
  }
  return trimmed;
}

export function createResponsiveOverflow(overflow: string | number) {
  // Normalize number to string with px unit before parsing
  const overflowString = typeof overflow === "number" ? `${overflow}px` : overflow;
  const parsed = parseResponsiveValues(overflowString);
  const breakpoints = Object.keys(screens) as [Screen];

  const result: Record<string, string> = {};

  // Always add the default value.
  const defaultValue = normalizeValue(parsed.DEFAULT?.value ?? overflowString);
  result["--parallax-overflow-DEFAULT"] = defaultValue;

  // We want to inherit the previous value if a screen is missing.
  let previousValue = defaultValue;

  for (const breakpoint of breakpoints) {
    const currentValue = normalizeValue(parsed[breakpoint]?.value || previousValue);
    result[`--parallax-overflow-${breakpoint}`] = currentValue;
    previousValue = currentValue;
  }

  return {
    styles: result,
    className: [
      "[--parallax-overflow:var(--parallax-overflow-DEFAULT)]",
      "sm:[--parallax-overflow:var(--parallax-overflow-sm)]",
      "md:[--parallax-overflow:var(--parallax-overflow-md)]",
      "lg:[--parallax-overflow:var(--parallax-overflow-lg)]",
      "xl:[--parallax-overflow:var(--parallax-overflow-xl)]",
      "2xl:[--parallax-overflow:var(--parallax-overflow-2xl)]",
    ],
  };
}
