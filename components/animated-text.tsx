"use client";

import SplitText from "@activetheory/split-text";
import { useDebouncedCallback, useWindowEvent } from "@mantine/hooks";
import { animate as motionAnimate, stagger } from "motion";
import { motion, usePresence } from "motion/react";
import * as React from "react";
import { useDraftMode } from "~/features/draft-mode/context";
import { usePrefersReducedMotion } from "~/features/motion/use-prefers-reduced-motion";
import { useViewportEnteredForGate } from "~/features/motion/use-viewport-entered";
import type { MotionViewportInput } from "~/features/motion/viewport";
import { cx } from "~/features/style/utils";
import { run } from "~/features/utils/common";

const REVEAL_EASE = [0.23, 1, 0.32, 1] as const;
const EXIT_EASE = [0.7, 0, 0.84, 0] as const;

type SplitHostInlineSnap = {
  width: string;
  maxWidth: string;
  minWidth: string;
};

function normalizeAriaLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function getTextFromNode(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (!node || typeof node === "boolean") {
    return "";
  }

  if (Array.isArray(node)) {
    return node.map(getTextFromNode).join("");
  }

  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return getTextFromNode(props.children);
  }

  return "";
}

function pruneEmptySplitLines(split: InstanceType<typeof SplitText>) {
  const lines = (split.lines ?? []) as unknown as Element[];

  lines.forEach((line) => {
    if ((line.textContent?.trim() ?? "").length > 0) {
      return;
    }

    line.remove();
  });
}

function setSplitLinesAriaHidden(split: InstanceType<typeof SplitText>, hidden: boolean) {
  const lines = (split.lines ?? []) as unknown as Element[];

  lines.forEach((line) => {
    if (hidden) {
      line.setAttribute("aria-hidden", "true");
      return;
    }

    line.removeAttribute("aria-hidden");
  });
}

function restoreSplitHostInlineSizing(el: HTMLElement, snap: SplitHostInlineSnap) {
  el.style.width = snap.width;
  el.style.maxWidth = snap.maxWidth;
  el.style.minWidth = snap.minWidth;
}

function clearSplitHostExpandos(el: HTMLElement) {
  if ("__isParent" in el) {
    Reflect.deleteProperty(el as object & { __isParent?: boolean }, "__isParent");
  }
}

function getConnectedLines(splits: InstanceType<typeof SplitText>[]): Element[] {
  return splits
    .flatMap((split) => (split.lines ?? []) as unknown as Element[])
    .filter((line) => line.isConnected && (line.textContent?.trim().length ?? 0) > 0);
}

function wrapLinesInRevealMasks(splits: InstanceType<typeof SplitText>[], maskSet: Set<HTMLElement>) {
  for (const split of splits) {
    const lines = (split.lines ?? []) as unknown as HTMLElement[];

    for (const line of lines) {
      const parent = line.parentNode;

      if (!parent || (parent instanceof HTMLElement && maskSet.has(parent))) {
        continue;
      }

      const mask = document.createElement("span");
      mask.dataset.animatedTextMask = "";
      mask.style.display = "block";
      mask.style.overflow = "hidden";
      parent.insertBefore(mask, line);
      mask.appendChild(line);
      maskSet.add(mask);
    }
  }
}

function unwrapLinesFromRevealMasks(maskSet: Set<HTMLElement>) {
  for (const mask of maskSet) {
    const parent = mask.parentNode;

    if (!parent) {
      continue;
    }

    while (mask.firstChild) {
      parent.insertBefore(mask.firstChild, mask);
    }

    mask.remove();
  }

  maskSet.clear();
}

function revertSplits(
  splits: InstanceType<typeof SplitText>[],
  sizingMap: Map<HTMLElement, SplitHostInlineSnap>,
  maskSet: Set<HTMLElement>
) {
  unwrapLinesFromRevealMasks(maskSet);

  for (const split of splits) {
    split.revert();
  }

  for (const [host, snap] of sizingMap) {
    restoreSplitHostInlineSizing(host, snap);
    clearSplitHostExpandos(host);
  }
}

function createSplits(
  host: HTMLElement,
  sizingMap: Map<HTMLElement, SplitHostInlineSnap>,
  splitSelector?: string,
  ariaLabel?: string
): InstanceType<typeof SplitText>[] {
  const splitHosts = run(() => {
    if (!splitSelector) {
      return [host];
    }

    const matches = Array.from(host.querySelectorAll<HTMLElement>(splitSelector));
    return matches.length === 0 ? [host] : matches;
  });

  return splitHosts.map((splitHost) => {
    sizingMap.set(splitHost, {
      width: splitHost.style.width,
      maxWidth: splitHost.style.maxWidth,
      minWidth: splitHost.style.minWidth,
    });

    const split = new SplitText(splitHost, { type: "lines", noBalance: true });
    pruneEmptySplitLines(split);

    if (ariaLabel) {
      setSplitLinesAriaHidden(split, true);
    }

    return split;
  });
}

function useFontsReady() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const fontsApi = document.fonts;

    if (!fontsApi || fontsApi.status === "loaded") {
      setReady(true);
      return;
    }

    let cancelled = false;
    void fontsApi.ready.then(() => {
      if (!cancelled) {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}

export type AnimatedTextProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  staggerDelay?: number;
  duration?: number;
  animationDelay?: number;
  revert?: boolean;
  /** Passed to Motion's `viewport` on the wrapper (same API as `motion.div`). Defaults to `MOTION_VIEWPORT` when omitted. Pass `false` to skip viewport gating. */
  viewport?: MotionViewportInput;
  /** Use `div` when wrapping block-level content (e.g. full rich text) so SplitText spans all lines in order. */
  as?: "span" | "div";
  /** Optional selector for text-only split targets inside the host. */
  splitSelector?: string;
  /** Motion `exit` target — only takes effect when the component is a direct child of `AnimatePresence`. */
  exit?: React.ComponentProps<typeof motion.div>["exit"];
};

export function AnimatedText({
  children,
  className,
  ariaLabel,
  staggerDelay = 0.1,
  duration = 1,
  animationDelay = 0,
  revert = false,
  viewport,
  as = "span",
  splitSelector,
  exit,
}: AnimatedTextProps) {
  const isDraft = useDraftMode();
  const [isPresent, safeToRemove] = usePresence();
  const { enteredForGate, vpResolved, viewportDisabled, onViewportEnter, onViewportLeave } = useViewportEnteredForGate(viewport);
  const shouldPlayIntro = isDraft || enteredForGate;
  const reduceMotion = usePrefersReducedMotion();
  const fontsReady = useFontsReady();

  const [isReady, setIsReady] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isSplitActive, setIsSplitActive] = React.useState(false);

  const hidden = !isDraft && !isVisible;
  const ref = React.useRef<HTMLElement | null>(null);
  const splitRefs = React.useRef<InstanceType<typeof SplitText>[]>([]);
  const sizingMapRef = React.useRef<Map<HTMLElement, SplitHostInlineSnap>>(new Map());
  const maskElementsRef = React.useRef<Set<HTMLElement>>(new Set());
  const lastAnimatedWholeHostRef = React.useRef(false);
  const animationRef = React.useRef<ReturnType<typeof motionAnimate> | null>(null);

  const shouldSplitLines = !reduceMotion && !isDraft;
  const canSplitLines = !shouldSplitLines || fontsReady;

  const reactAriaLabel = React.useMemo(() => {
    if (ariaLabel && ariaLabel.trim().length > 0) {
      return normalizeAriaLabel(ariaLabel);
    }

    const text = normalizeAriaLabel(getTextFromNode(children));
    return text.length > 0 ? text : undefined;
  }, [ariaLabel, children]);

  const [domAriaLabel, setDomAriaLabel] = React.useState<string | undefined>(undefined);
  const resolvedAriaLabel = reactAriaLabel ?? domAriaLabel;

  React.useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    setIsReady(false);

    if (shouldSplitLines && canSplitLines) {
      const host = ref.current;
      if (!reactAriaLabel) {
        const text = normalizeAriaLabel(host.textContent ?? "");
        setDomAriaLabel(text.length > 0 ? text : undefined);
      }

      const splits = createSplits(host, sizingMapRef.current, splitSelector, resolvedAriaLabel);
      wrapLinesInRevealMasks(splits, maskElementsRef.current);
      splitRefs.current = splits;
      setIsSplitActive(splits.length > 0);
    } else {
      sizingMapRef.current.clear();
      splitRefs.current = [];
      setIsSplitActive(false);
    }

    setIsReady(true);

    return () => {
      revertSplits(splitRefs.current, sizingMapRef.current, maskElementsRef.current);
      sizingMapRef.current.clear();
      splitRefs.current = [];
      setIsSplitActive(false);
    };
  }, [shouldSplitLines, canSplitLines, reactAriaLabel, resolvedAriaLabel, splitSelector]);

  React.useEffect(() => {
    lastAnimatedWholeHostRef.current = false;

    if (isDraft || !isReady || !ref.current) {
      return;
    }

    if (!shouldPlayIntro) {
      return;
    }

    if (reduceMotion) {
      setIsVisible(true);
      return;
    }

    const lineTargets = getConnectedLines(splitRefs.current);
    const useLines = lineTargets.length > 0 && shouldSplitLines;

    setIsVisible(true);

    const targets = useLines ? lineTargets : ref.current;
    const delayOption = useLines ? stagger(staggerDelay, { startDelay: animationDelay }) : animationDelay;
    lastAnimatedWholeHostRef.current = !useLines;

    animationRef.current?.cancel();

    let completionCancelled = false;

    const yKeyframes = useLines ? ["100%", "0%"] : [8, 0];
    const animation = motionAnimate(
      targets,
      { opacity: [0, 1], y: yKeyframes },
      { delay: delayOption, duration, ease: REVEAL_EASE }
    );

    animationRef.current = animation;

    void animation.then(() => {
      animationRef.current = null;

      if (completionCancelled || !(revert && splitRefs.current.length > 0)) {
        return;
      }

      revertSplits(splitRefs.current, sizingMapRef.current, maskElementsRef.current);
      sizingMapRef.current.clear();
      splitRefs.current = [];
      setIsSplitActive(false);
    });

    return () => {
      completionCancelled = true;
      animation.cancel();
      animationRef.current = null;

      if (lastAnimatedWholeHostRef.current && ref.current) {
        ref.current.style.removeProperty("opacity");
        ref.current.style.removeProperty("transform");
      }
    };
  }, [animationDelay, duration, isDraft, isReady, reduceMotion, revert, shouldPlayIntro, shouldSplitLines, staggerDelay]);

  React.useEffect(() => {
    if (isPresent) {
      return;
    }

    animationRef.current?.cancel();
    animationRef.current = null;

    if (reduceMotion || !isSplitActive) {
      safeToRemove?.();
      return;
    }

    const lineTargets = getConnectedLines(splitRefs.current);

    if (lineTargets.length === 0) {
      safeToRemove?.();
      return;
    }

    const exitAnim = motionAnimate(
      lineTargets,
      { opacity: [1, 0], y: ["0%", "-100%"] },
      { delay: stagger(staggerDelay * 0.6), duration: duration * 0.55, ease: EXIT_EASE }
    );

    void exitAnim.then(() => {
      safeToRemove?.();
    });

    return () => {
      exitAnim.cancel();
    };
  }, [isPresent, isSplitActive, reduceMotion, staggerDelay, duration, safeToRemove]);

  const handleResizeResplit = useDebouncedCallback(() => {
    if (animationRef.current || !ref.current) {
      return;
    }

    revertSplits(splitRefs.current, sizingMapRef.current, maskElementsRef.current);
    sizingMapRef.current.clear();

    const splits = createSplits(ref.current, sizingMapRef.current, splitSelector, resolvedAriaLabel);
    wrapLinesInRevealMasks(splits, maskElementsRef.current);
    splitRefs.current = splits;
    setIsSplitActive(splits.length > 0);
  }, 200);

  const resizeResplitActive = !revert && shouldSplitLines && canSplitLines && isVisible && isPresent;

  React.useEffect(() => {
    if (!resizeResplitActive) {
      handleResizeResplit.cancel();
    }
  }, [resizeResplitActive, handleResizeResplit]);

  useWindowEvent("resize", () => {
    if (!resizeResplitActive) {
      return;
    }

    handleResizeResplit();
  });

  const rootClassName = cx(
    as === "span" && !shouldSplitLines && "inline-block max-w-full align-top",
    as === "div" && "block w-full",
    className
  );

  const motionCommon = {
    onViewportEnter: viewportDisabled ? undefined : onViewportEnter,
    onViewportLeave: viewportDisabled ? undefined : onViewportLeave,
    viewport: vpResolved,
    role: isSplitActive && resolvedAriaLabel ? ("text" as const) : undefined,
    "aria-label": isSplitActive ? resolvedAriaLabel : undefined,
    style: hidden ? { visibility: "hidden" as const } : undefined,
    className: rootClassName,
    exit: isSplitActive ? undefined : exit,
  };

  if (as === "div") {
    return (
      <motion.div ref={ref as React.Ref<HTMLDivElement>} {...motionCommon}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.span ref={ref as React.Ref<HTMLSpanElement>} {...motionCommon}>
      {children}
    </motion.span>
  );
}
