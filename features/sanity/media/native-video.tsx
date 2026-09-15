import type * as React from "react";
import type { VideoFileFragmentResult } from "~/features/sanity/media/fragment";
import type { CommonMediaProps } from "~/features/sanity/media/types";
import { createResponsiveRatios } from "~/features/sanity/media/utils";
import { cx } from "~/features/style/utils";

type SanityNativeVideoProps = CommonMediaProps & {
  source?: VideoFileFragmentResult | null;
  /** From `videoOptions`: starts muted. Autoplay forces muted regardless (browser policy). */
  muted?: boolean;
  /** From `videoOptions` (`!controls`): hides native player controls. */
  noControls?: boolean;
  poster?: string;
  objectFit?: React.CSSProperties["objectFit"];
  objectPosition?: React.CSSProperties["objectPosition"];
};

/**
 * Native `<video>` renderer for a direct source: a self-hosted Sanity file URL or a
 * plain external URL (e.g. an .mp4 link). Mirrors the Mux player's sizing/aspect-ratio
 * wrapper so native and Mux videos lay out identically, with no Mux dependency.
 */
export function SanityNativeVideo({
  source,
  aspectRatio,
  width,
  height,
  style,
  className,
  loop,
  autoPlay,
  muted,
  noControls,
  poster,
  objectFit = "cover",
  objectPosition = "center",
}: SanityNativeVideoProps) {
  const { url, mimeType, dimensions } = source ?? {};

  if (!url) {
    return null;
  }

  const effectiveWidth = width ?? dimensions?.width;
  const naturalRatio = width && height ? width / height : undefined;
  const effectiveRatio = naturalRatio ?? aspectRatio ?? dimensions?.aspectRatio ?? 16 / 9;
  const responsiveRatio = createResponsiveRatios(effectiveRatio);

  // Browsers only allow autoplay when muted, so autoplay implies muted.
  const isMuted = autoPlay ? true : (muted ?? false);

  const wrapperStyles = {
    ...responsiveRatio.styles,
    "--desired-width": height ? "auto" : effectiveWidth != null ? `${effectiveWidth}px` : "auto",
    "--desired-height": height ? `${height}px` : "auto",
    ...style,
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
      <video
        className="absolute inset-0 z-1 size-full"
        style={{ objectFit, objectPosition }}
        autoPlay={autoPlay}
        muted={isMuted}
        loop={loop}
        controls={!noControls}
        playsInline
        poster={poster}
        preload={autoPlay ? "auto" : "metadata"}
      >
        <source src={url} type={mimeType ?? undefined} />
      </video>
    </div>
  );
}
