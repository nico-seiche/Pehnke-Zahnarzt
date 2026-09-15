"use client";

import { composeRefs } from "@radix-ui/react-compose-refs";
import { useLenis } from "lenis/react";
import { type MotionStyle, motion, useScroll, useTransform } from "motion/react";
import * as React from "react";
import { cx } from "~/features/style/utils";
import { createResponsiveOverflow } from "./utils";

export function InnerParallax({
  overflow,
  direction = "y",
  className,
  ref: forwardedRef,
  children,
  style,
  ...rest
}: React.ComponentProps<"div"> & {
  overflow: number | string;
  direction?: "x" | "y";
}) {
  const internalRef = React.useRef<HTMLDivElement>(null);
  const { styles: overflowStyles, className: overflowClasses } = createResponsiveOverflow(overflow);

  // The page scrolls inside the Lenis container, not the window, so point
  // `useScroll` at Lenis' scroll surface instead of the default viewport.
  const lenis = useLenis();
  const container = React.useMemo(() => (lenis?.rootElement ? { current: lenis.rootElement } : undefined), [lenis]);

  const { scrollYProgress } = useScroll({
    container,
    target: internalRef,
    offset: ["start end", "end start"],
  });

  const translate = useTransform(scrollYProgress, (value) => {
    const delta = value * 2 - 1; // map 0..1 to -1..1
    return `calc(var(--parallax-overflow) * ${delta})`;
  });

  const dimensionStyle: MotionStyle =
    direction === "x"
      ? {
          width: "calc(100% + (2 * var(--parallax-overflow)))",
          left: "calc(-1 * var(--parallax-overflow))",
          x: translate,
        }
      : {
          height: "calc(100% + (2 * var(--parallax-overflow)))",
          top: "calc(-1 * var(--parallax-overflow))",
          y: translate,
        };

  return (
    <div
      ref={composeRefs(forwardedRef, internalRef)}
      className={cx(["relative overflow-hidden", className, ...overflowClasses])}
      style={{ ...overflowStyles, ...style }}
      {...rest}
    >
      <motion.div style={dimensionStyle} className="absolute inset-0">
        {children}
      </motion.div>
    </div>
  );
}
