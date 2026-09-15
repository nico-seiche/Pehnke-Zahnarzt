"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import { type AnimatedPosterOptions, buildPosterUrl, muxPosterDimensionsForPreview } from "~/features/mux/utils";
import { POSTER_PLAYER_MAX_EDGE, POSTER_PREVIEW_MAX_EDGE } from "~/features/sanity/media/constants";
import type { AnimatedThumbnailFragmentResult, VideoFragmentResult } from "~/features/sanity/media/fragment";
import type { CommonMediaProps } from "~/features/sanity/media/types";
import { createResponsiveRatios, parseAspectRatio } from "~/features/sanity/media/utils";
import { cx } from "~/features/style/utils";
import { run } from "~/features/utils/common";

const MuxPlayer = dynamic(() => import("~/features/mux/player").then((module) => module.MuxPlayer));

function toAnimatedPosterOptions(input?: AnimatedThumbnailFragmentResult | null): AnimatedPosterOptions | undefined {
  if (!input?.enabled) {
    return undefined;
  }

  return {
    start: input.start ?? undefined,
    end: input.end ?? undefined,
  };
}

export function SanityMuxVideo({
  video,
  aspectRatio,
  width,
  height,
  style,
  className,
  thumbnailTime,
  poster,
  animatedThumbnail,
  disablePoster = false,
  objectFit = "cover",
  objectPosition = "center",
  ...props
}: Omit<React.ComponentProps<typeof MuxPlayer>, keyof VideoFragmentResult | "aspectRatio" | "placeholder"> &
  CommonMediaProps & {
    disablePoster?: boolean;
    animatedThumbnail?: AnimatedThumbnailFragmentResult | null;
    video?: VideoFragmentResult | null;
  }) {
  const { playbackId, dimensions, thumbTime } = video ?? {};

  if (!playbackId) {
    return null;
  }

  const effectiveWidth = width ?? dimensions?.width;
  const naturalRatio = width && height ? width / height : undefined;
  const effectiveRatio = naturalRatio ?? aspectRatio ?? dimensions?.aspectRatio ?? 16 / 9;
  const posterAspectRatio = parseAspectRatio(effectiveRatio);
  const responsiveRatio = createResponsiveRatios(effectiveRatio);
  const animatedOptions = toAnimatedPosterOptions(animatedThumbnail);

  /** Tiny LQIP shown as a blurred backdrop only while the <mux-player> chunk loads. Always static — animating a 20px-blur backdrop is wasted bytes. */
  const previewSrc = run(() => {
    if (disablePoster || !playbackId) {
      return null;
    }

    return buildPosterUrl({
      playbackId,
      time: thumbTime,
      ...muxPosterDimensionsForPreview(posterAspectRatio, POSTER_PREVIEW_MAX_EDGE),
    });
  });

  /** Sharp poster handed to <mux-player>; visible until playback starts, so no blur is applied. */
  const playerPosterSrc = run(() => {
    if (disablePoster || !playbackId) {
      return undefined;
    }

    if (poster) {
      return poster;
    }

    return buildPosterUrl({
      playbackId,
      time: thumbTime,
      animated: animatedOptions,
      ...muxPosterDimensionsForPreview(posterAspectRatio, POSTER_PLAYER_MAX_EDGE),
    });
  });

  const wrapperStyles = {
    ...responsiveRatio.styles,
    "--desired-width": height ? "auto" : `${effectiveWidth}px`,
    "--desired-height": height ? `${height}px` : "auto",
    ...style,
  } as React.CSSProperties;

  const previewFallbackStyles = {
    filter: "blur(20px)",
    backgroundImage: previewSrc ? `url(${previewSrc})` : undefined,
    backgroundRepeat: "no-repeat",
    backgroundSize: objectFit,
    backgroundPosition: objectPosition,
  } as React.CSSProperties;

  return (
    <div
      style={wrapperStyles}
      className={cx(
        "relative isolate h-(--desired-height,auto) w-(--desired-width,auto) max-w-full overflow-hidden",
        responsiveRatio.className,
        className
      )}
    >
      <React.Suspense
        fallback={
          previewSrc ? (
            <div style={previewFallbackStyles} className="pointer-events-none absolute inset-0 -z-1 size-full" />
          ) : null
        }
      >
        <MuxPlayer
          playbackId={playbackId}
          thumbnailTime={thumbTime}
          objectFit={objectFit}
          objectPosition={objectPosition}
          poster={playerPosterSrc}
          placeholder={playerPosterSrc}
          className="absolute inset-0 z-1 size-full"
          {...props}
        />
      </React.Suspense>
    </div>
  );
}
