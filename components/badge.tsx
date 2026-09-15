import type * as React from "react";
import { cva, type VariantProps } from "~/features/style/utils";

const styles = cva({
  base: "inline-flex items-center gap-4 rounded-pill px-12 py-6 font-sans text-label tracking-[0.02em]",
  variants: {
    tone: {
      brand: "bg-brand-soft text-brand-deep",
      neutral: "bg-neutral-100 text-neutral-700",
      success: "bg-state-success-bg text-state-success-fg",
      warning: "bg-state-warning-bg text-state-warning-fg",
      danger: "bg-state-danger-bg text-state-danger-fg",
      mint: "bg-mint-100 text-mint-700",
    },
  },
  defaultVariants: {
    tone: "brand",
  },
});

export function Badge({
  className,
  tone,
  icon,
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof styles> & { icon?: React.ReactNode }) {
  return (
    <span className={styles({ tone, className })} {...props}>
      {icon}
      {children}
    </span>
  );
}
