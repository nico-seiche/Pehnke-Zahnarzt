import type * as React from "react";
import { Icon, type IconName } from "~/components/icon";
import { cva, type VariantProps } from "~/features/style/utils";

const styles = cva({
  base: "reveal flex gap-12 rounded-md px-20 py-16",
  variants: {
    tone: {
      info: "bg-state-info-bg text-state-info-fg",
      success: "bg-state-success-bg text-state-success-fg",
      warning: "bg-state-warning-bg text-state-warning-fg",
      danger: "bg-state-danger-bg text-state-danger-fg",
    },
  },
  defaultVariants: {
    tone: "info",
  },
});

const TONE_ICON: Record<NonNullable<VariantProps<typeof styles>["tone"]>, IconName> = {
  info: "info",
  success: "check-circle",
  warning: "triangle-alert",
  danger: "circle-alert",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof styles> & { title?: string }) {
  return (
    <div role="status" className={styles({ tone, className })} {...props}>
      <Icon name={TONE_ICON[tone ?? "info"]} className="mt-2 shrink-0 text-[19px]" />
      <div className="flex flex-1 flex-col gap-4">
        {title && <strong className="font-sans font-semibold text-small">{title}</strong>}
        {children && <div className="font-sans text-small">{children}</div>}
      </div>
    </div>
  );
}
