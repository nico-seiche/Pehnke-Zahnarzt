import type { motion, useInView } from "motion/react";
import type * as React from "react";

/** Shared Motion `viewport.margin` when `viewport` is omitted or partial. */
export const MOTION_VIEWPORT_MARGIN = "0px 0px -10% 0px";

/** Default `motion.*` `viewport` — used when `viewport` is not passed. */
export const MOTION_VIEWPORT = {
  margin: MOTION_VIEWPORT_MARGIN,
  once: true,
} as const satisfies Exclude<React.ComponentProps<typeof motion.div>["viewport"], false | undefined>;

/** Same shape as `motion.div`'s `viewport` prop. */
export type MotionViewport = React.ComponentProps<typeof motion.div>["viewport"];

/** Omitted → `MOTION_VIEWPORT`. `false` disables viewport tracking on Motion (`whileInView`). */
export type MotionViewportInput = MotionViewport | false;

type UseInViewOptions = NonNullable<Parameters<typeof useInView>[1]>;

/** Default when `viewport` is omitted; `false` passes through for Motion. */
export function resolveMotionViewport(viewport: MotionViewportInput | undefined): MotionViewport {
  if (viewport === false) {
    return false as unknown as MotionViewport;
  }

  if (viewport === undefined) {
    return MOTION_VIEWPORT;
  }

  return viewport;
}

/** `useInView` options matching `resolveMotionViewport` (same `margin` / `once` / `amount` as `whileInView`). */
export function viewportToUseInViewOptions(viewport: MotionViewportInput | undefined): UseInViewOptions {
  if (viewport === false) {
    return { initial: true, once: true };
  }

  const vp = resolveMotionViewport(viewport);

  if (typeof vp !== "object" || vp === null) {
    return { initial: true, once: true };
  }

  return {
    margin: (vp.margin ?? MOTION_VIEWPORT_MARGIN) as UseInViewOptions["margin"],
    once: vp.once !== false,
    amount: vp.amount,
    initial: false,
  };
}
