"use client";

import type { DotLottie } from "@lottiefiles/dotlottie-web";
import { useInViewport } from "@mantine/hooks";
import dynamic from "next/dynamic";
import * as React from "react";
import type { LottieFragmentResult } from "~/features/sanity/media/fragment";
import type { CommonMediaProps } from "~/features/sanity/media/types";
import { createResponsiveRatios, parseAspectRatio } from "~/features/sanity/media/utils";
import { cx } from "~/features/style/utils";

const DotLottieReact = dynamic(() => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact), { ssr: false });

type SanityLottieProps = CommonMediaProps & {
  lottie?: LottieFragmentResult | null;
};

/**
 * Outer flex shell fills the layout slot; inner box holds `aspect-[var(--mx-ratio)]` so `size-full` from
 * `SanityMedia` (shared with video) does not sit on the same node as `aspect-ratio` and win over it in CSS.
 */
export function SanityLottie({
  lottie,
  aspectRatio,
  width: widthProp,
  height: heightProp,
  className,
  style,
  loop: loopFromParent,
  autoPlay: autoPlayFromParent,
}: SanityLottieProps) {
  const dotLottieRef = React.useRef<DotLottie | null>(null);
  const pendingLoadListenerRef = React.useRef<(() => void) | null>(null);
  const { ref: viewportRef, inViewport } = useInViewport<HTMLDivElement>();
  const { url, dimensions } = lottie ?? {};
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

  /** Reads latest in-view intent so async `load` handlers are not stuck with a stale `shouldPlay`. */
  const syncPlayback = React.useCallback(() => {
    const ctrl = dotLottieRef.current;

    if (!ctrl) {
      return;
    }

    if (shouldAutoplayInViewRef.current) {
      ctrl.play();
      return;
    }

    ctrl.pause();
  }, []);

  React.useEffect(() => {
    const ctrl = dotLottieRef.current;

    if (!ctrl) {
      return;
    }

    if (shouldAutoplayInView) {
      ctrl.play();
      return;
    }

    ctrl.pause();
  }, [shouldAutoplayInView]);

  const onDotLottieRef = React.useCallback(
    (instance: DotLottie | null) => {
      const prev = dotLottieRef.current;

      if (prev && pendingLoadListenerRef.current) {
        prev.removeEventListener("load", pendingLoadListenerRef.current);
        pendingLoadListenerRef.current = null;
      }

      dotLottieRef.current = instance;

      if (!instance) {
        return;
      }

      const runSync = () => {
        syncPlayback();

        queueMicrotask(syncPlayback);
      };

      if (instance.isLoaded) {
        runSync();
        return;
      }

      const handleLoad = () => {
        instance.removeEventListener("load", handleLoad);
        pendingLoadListenerRef.current = null;

        runSync();
      };

      pendingLoadListenerRef.current = handleLoad;
      instance.addEventListener("load", handleLoad);
    },
    [syncPlayback]
  );

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
        <React.Suspense
          fallback={
            <div
              className="absolute inset-0 -z-1 size-full"
              style={{ aspectRatio: ratioForCss, background: "color-mix(in srgb, currentColor 6%, transparent)" }}
              aria-hidden
            />
          }
        >
          <DotLottieReact
            dotLottieRefCallback={onDotLottieRef}
            src={url}
            loop={loop}
            autoplay={false}
            className="absolute inset-0 z-1 size-full"
            layout={{ fit: "contain" }}
            /** DotLottie defaults `freezeOnOffscreen: true`, which can call `freeze()` right after `play()` when its canvas IO disagrees with our wrapper (e.g. nested layout). We own in-view playback via `useInViewport`. */
            renderConfig={{ freezeOnOffscreen: false }}
          />
        </React.Suspense>
      </div>
    </div>
  );
}
