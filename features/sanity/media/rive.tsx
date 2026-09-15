"use client";

import { useInViewport } from "@mantine/hooks";
import * as RiveReact from "@rive-app/react-canvas";
import * as React from "react";
import type { RiveFragmentResult } from "~/features/sanity/media/fragment";
import type { CommonMediaProps } from "~/features/sanity/media/types";
import { createResponsiveRatios, parseAspectRatio } from "~/features/sanity/media/utils";
import { cx } from "~/features/style/utils";

type SanityRiveProps = CommonMediaProps & {
  rive?: RiveFragmentResult | null;
};

/**
 * Mirrors the Lottie layout wrapper so Rive respects shared media sizing/aspect-ratio behavior.
 */
export function SanityRive({
  rive,
  aspectRatio,
  width: widthProp,
  height: heightProp,
  className,
  style,
  loop: loopFromParent,
  autoPlay: autoPlayFromParent,
}: SanityRiveProps) {
  const { ref: viewportRef, inViewport } = useInViewport<HTMLDivElement>();
  const { url, dimensions } = rive ?? {};
  const effectiveWidth = widthProp ?? dimensions?.width;
  const naturalRatio = widthProp && heightProp ? widthProp / heightProp : undefined;
  const dimRatio = dimensions?.aspectRatio;
  const effectiveRatio = naturalRatio ?? aspectRatio ?? dimRatio ?? 16 / 9;
  const responsiveRatio = createResponsiveRatios(effectiveRatio);
  const loop = loopFromParent ?? false;
  const wantsAutoPlay = autoPlayFromParent ?? false;
  // Resource-saving policy: only autoplay while visible.
  const shouldAutoplayInView = inViewport && wantsAutoPlay;
  const shouldAutoplayInViewRef = React.useRef(shouldAutoplayInView);
  shouldAutoplayInViewRef.current = shouldAutoplayInView;

  const { rive: riveController, RiveComponent } = RiveReact.useRive(
    {
      src: url ?? "",
      autoplay: false,
      layout: new RiveReact.Layout({
        fit: RiveReact.Fit.Contain,
      }),
    },
    {
      useDevicePixelRatio: true,
    }
  );

  React.useEffect(() => {
    if (!riveController) {
      return;
    }

    if (shouldAutoplayInView) {
      riveController.play();
      return;
    }

    riveController.pause();
  }, [riveController, shouldAutoplayInView]);

  React.useEffect(() => {
    if (!riveController) {
      return;
    }

    if (loop) {
      const restartIfNeeded = () => {
        if (!shouldAutoplayInViewRef.current) {
          return;
        }

        riveController.play();
      };

      riveController.on(RiveReact.EventType.Stop, restartIfNeeded);
      return () => {
        riveController.off(RiveReact.EventType.Stop, restartIfNeeded);
      };
    }

    const stopAfterLoop = () => {
      riveController.stop();
    };

    riveController.on(RiveReact.EventType.Loop, stopAfterLoop);
    return () => {
      riveController.off(RiveReact.EventType.Loop, stopAfterLoop);
    };
  }, [riveController, loop]);

  if (!url) {
    return null;
  }

  const ratioForCss = parseAspectRatio(String(effectiveRatio));
  const wrapperStyles = {
    ...responsiveRatio.styles,
    "--desired-width": heightProp ? "auto" : effectiveWidth != null ? `${effectiveWidth}px` : "auto",
    "--desired-height": heightProp ? `${heightProp}px` : "auto",
    ...style,
  } as React.CSSProperties;

  return (
    <div
      ref={viewportRef}
      style={wrapperStyles}
      className={cx(
        "relative isolate flex h-full min-h-0 w-full min-w-0 max-w-full items-center justify-center overflow-hidden",
        className
      )}
    >
      <div
        className={cx(
          "relative isolate h-(--desired-height,auto) max-h-full min-h-0 w-(--desired-width,auto) min-w-0 max-w-full overflow-hidden",
          responsiveRatio.className
        )}
      >
        <RiveComponent
          className="absolute inset-0 z-1 size-full"
          style={{ aspectRatio: ratioForCss, background: "color-mix(in srgb, currentColor 6%, transparent)" }}
        />
      </div>
    </div>
  );
}
