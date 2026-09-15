import type MuxPlayerElement from "@mux/mux-player";
import type { MuxPlayerProps } from "@mux/mux-player-react";
import MuxReactPlayer from "@mux/mux-player-react/lazy";
import type * as React from "react";
import { preload } from "react-dom";

export function MuxPlayer({
  ref,
  playbackId,
  priority,
  style,
  noControls,
  loop,
  autoPlay,
  poster,
  placeholder,
  // Since we use the lazy player, its strongly recommended to use an aspect ratio
  // or else there will be layout shifts while the player loads.
  aspectRatio = 16 / 9,
  thumbnailTime = 1,
  disableCookies = true,
  disableTracking = true,
  objectFit = "cover",
  objectPosition = "center",
  minResolution = "480p",
  maxResolution = "2160p",
  ...props
}: Omit<MuxPlayerProps, "theme"> & {
  ref?: React.Ref<MuxPlayerElement>;
  priority?: boolean;
  noControls?: boolean;
  aspectRatio?: string | number;
  objectFit?: "cover" | "contain";
  objectPosition?: "center" | "top" | "bottom" | "left" | "right";
}) {
  if (priority) {
    const preloadSrc = poster ?? placeholder;

    if (preloadSrc) {
      preload(preloadSrc, {
        as: "image",
        fetchPriority: "high",
      });
    }
  }

  // @see https://www.mux.com/docs/guides/player-customize-look-and-feel#available-css-variables
  const playerStyles = {
    "--media-object-fit": objectFit,
    "--pip-button": "none",
    "--media-object-position": objectPosition,
    "--loading-indicator": "none",
    "--controls": noControls ? "none" : undefined,
    "--dialog": "none",
    "--controls-backdrop-color": "transparent",
    "--media-background-color": "transparent",
    "--live-button": "none",
    "--seek-backward-button": "none",
    "--seek-forward-button": "none",
    "--airplay-button": "none",
    "--rendition-menu-button": "none",
    "--playback-rate-button": "none",
    "--cast-button": "none",
    aspectRatio,
  } as React.CSSProperties;

  return (
    <MuxReactPlayer
      ref={ref}
      playbackId={playbackId}
      disableCookies={disableCookies}
      disableTracking={disableTracking}
      minResolution={minResolution}
      maxResolution={maxResolution}
      thumbnailTime={thumbnailTime}
      poster={poster ?? undefined}
      placeholder={placeholder ?? undefined}
      autoPlay={autoPlay ? "muted" : undefined}
      loading={priority ? "page" : "viewport"}
      loop={loop}
      preload={priority ? "auto" : "metadata"}
      style={{ ...playerStyles, ...style }}
      accentColor="var(--color-theme-accent)"
      {...props}
    />
  );
}
