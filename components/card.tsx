import type * as React from "react";
import { cva, type VariantProps } from "~/features/style/utils";

const styles = cva({
  base: "rounded-card p-24 transition-[box-shadow,transform] duration-240 ease-out",
  variants: {
    variant: {
      raised: "border border-border-subtle bg-surface-card shadow-sm",
      flat: "border border-transparent bg-surface-alt",
      tint: "border border-brand-soft bg-surface-tint",
      outline: "border border-border-default bg-surface-card",
      deep: "border border-transparent bg-surface-deep text-blue-100 shadow-lg",
    },
    interactive: {
      true: "hover:-translate-y-[3px] hover:cursor-pointer hover:shadow-md",
      false: "",
    },
  },
  defaultVariants: {
    variant: "raised",
    interactive: false,
  },
});

export function Card({ className, variant, interactive, ...props }: React.ComponentProps<"div"> & VariantProps<typeof styles>) {
  return <div className={styles({ variant, interactive, className })} {...props} />;
}
