import type * as React from "react";
import { Slot } from "~/components/slot/slot";
import { Slottable } from "~/components/slot/slottable";
import { cva, type VariantProps } from "~/features/style/utils";

const styles = cva({
  base: [
    "inline-flex w-fit min-w-0 shrink-0 cursor-pointer items-center justify-center gap-8 whitespace-nowrap",
    "rounded-control border border-transparent font-sans text-button",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-160 ease-out",
    "hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.975]",
    "motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0",
    "disabled:pointer-events-none disabled:opacity-45 disabled:hover:translate-y-0",
  ],
  variants: {
    variant: {
      primary: "bg-brand text-text-on-brand shadow-brand hover:bg-brand-strong",
      secondary: "bg-brand-soft text-brand-deep hover:brightness-95",
      outline: "border-border-brand bg-transparent text-brand-strong hover:border-brand hover:bg-brand-tint",
      ghost: "bg-transparent text-brand-strong hover:bg-brand-tint",
      onDark: "bg-white text-brand-deep hover:bg-brand-tint",
    },
    size: {
      sm: "h-36 px-16 text-small",
      md: "h-44 px-24",
      lg: "h-52 px-32 text-body",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export function Button({
  children,
  className,
  asChild,
  leftIcon,
  rightIcon,
  variant,
  size,
  disabled,
  // Don't apply default type if we don't know what kind of component we will render.
  type = asChild ? undefined : "button",
  ...props
}: Omit<React.ComponentProps<"button">, "size"> &
  VariantProps<typeof styles> & {
    asChild?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  }) {
  const Component = asChild ? Slot : "button";

  return (
    <Component disabled={disabled} type={type} className={styles({ variant, size, className })} {...props}>
      <Slottable asChild={asChild} child={children}>
        {(child) => (
          <>
            {leftIcon}
            {child}
            {rightIcon}
          </>
        )}
      </Slottable>
    </Component>
  );
}
