// biome-ignore-all lint/style/noRestrictedImports: we need to import from source here.
import { defineConfig } from "cva";
import { extendTailwindMerge } from "tailwind-merge";

function isValidTextSize(cn: string) {
  // Any class that starts with this prefix is valid.
  // eg. `--text-body`, `--text-h1`, `--text-display`.
  return ["display", "h1", "h2", "h3", "lead", "body", "small", "label", "eyebrow", "button", "mono", "caption"].some((val) =>
    cn.startsWith(val)
  );
}

// @see https://github.com/dcastil/tailwind-merge/blob/v3.3.0/docs/configuration.md#theme
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [isValidTextSize],
    },
  },
});

export const { cva, cx, compose } = defineConfig({
  hooks: {
    onComplete: twMerge,
  },
});

export type { VariantProps } from "cva";
export type ClassValues = Parameters<typeof cx>;
