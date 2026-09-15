import { type Screen, screens } from "./constants";

function parseRem(size: string) {
  return Number.parseFloat(size.replace("rem", ""));
}

/**
 * Parse a Tailwind className to split into responsive values.
 * @example
 * parseResponsiveValues("1 sm:4 lg:2")
 * // { DEFAULT: { value: 1 }, sm: { value: 4, resolvedWidth: "40rem" }, lg: { value: 2, resolvedWidth: "64rem" } }
 */
export function parseResponsiveValues(className: string) {
  const res = {} as Record<Screen | "DEFAULT", { value: string; resolvedWidth?: string }>;

  // Create a new regex pattern that matches all available screens.
  const bpRegexPattern = Object.keys(screens).join("|");
  const bpRegex = new RegExp(`^(${bpRegexPattern}):(.+)$`);

  // Split className string into parts and map to object.
  const parts = className.split(/\s+/);
  for (const part of parts) {
    const match = part.match(bpRegex);

    if (match) {
      const [, size, value] = match;

      if (value && size) {
        res[size as Screen] = { value, resolvedWidth: screens[size as Screen] };
      }
    } else {
      // No match means it's a default value.
      res.DEFAULT = { value: part };
    }
  }

  // Sort the result by media query value (largest first)
  // to mimic how the browser applies media query styles.
  const sortedEntries = Object.entries(res).sort(([, { resolvedWidth: sizeA }], [, { resolvedWidth: sizeB }]) => {
    if (!sizeA && !sizeB) {
      return 0;
    }

    if (!sizeA) {
      return 1;
    }

    if (!sizeB) {
      return -1;
    }

    return parseRem(sizeB) - parseRem(sizeA);
  });

  return Object.fromEntries(sortedEntries) as typeof res;
}
