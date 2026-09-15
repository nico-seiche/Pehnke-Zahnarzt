"use client";

import * as React from "react";
import { type MotionViewportInput, resolveMotionViewport } from "~/features/motion/viewport";

/**
 * Wires Motion viewport events into React for scroll-in gating on the same node as `whileInView`
 * (no second `useInView`). When `viewport` is `false`, treat the scroll gate as always open.
 */
export function useViewportEnteredForGate(viewport: MotionViewportInput | undefined) {
  const vpResolved = React.useMemo(() => resolveMotionViewport(viewport), [viewport]);
  const viewportDisabled = viewport === false;
  const [entered, setEntered] = React.useState(false);

  const enteredForGate = viewportDisabled || entered;

  const onViewportEnter = React.useCallback(() => setEntered(true), []);

  const onViewportLeave = React.useCallback(() => {
    if (typeof vpResolved === "object" && vpResolved !== null && vpResolved.once === false) {
      setEntered(false);
    }
  }, [vpResolved]);

  return { enteredForGate, vpResolved, viewportDisabled, onViewportEnter, onViewportLeave };
}
