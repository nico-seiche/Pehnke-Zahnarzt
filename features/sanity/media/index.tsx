import type * as React from "react";
import type { ImageFragmentResult, MediaFragmentResult, VideoFragmentResult } from "~/features/sanity/media/fragment";
import { SanityImage } from "~/features/sanity/media/image";
import { getImageSrc } from "~/features/sanity/media/image/utils";
import { SanityLottie } from "~/features/sanity/media/lottie";
import { SanityMuxVideo } from "~/features/sanity/media/mux-video";
import { SanityNativeVideo } from "~/features/sanity/media/native-video";
import { SanityRive } from "~/features/sanity/media/rive";
import type { CommonMediaProps } from "~/features/sanity/media/types";

type VideoProps = Omit<React.ComponentProps<typeof SanityMuxVideo>, keyof CommonMediaProps | keyof VideoFragmentResult>;
type VideoFileProps = Omit<React.ComponentProps<typeof SanityNativeVideo>, keyof CommonMediaProps | "source">;
type ImageProps = Omit<React.ComponentProps<typeof SanityImage>, keyof CommonMediaProps | keyof ImageFragmentResult>;
type RiveProps = Omit<React.ComponentProps<typeof SanityRive>, keyof CommonMediaProps | "rive">;
type LottieProps = Omit<React.ComponentProps<typeof SanityLottie>, keyof CommonMediaProps | "lottie">;

export function SanityMedia({
  media,
  loop,
  autoPlay,
  imageProps = {},
  videoProps = {},
  videoFileProps = {},
  riveProps = {},
  lottieProps = {},
  ...props
}: CommonMediaProps & {
  imageProps?: ImageProps;
  videoProps?: VideoProps;
  videoFileProps?: VideoFileProps;
  riveProps?: RiveProps;
  lottieProps?: LottieProps;
  media?: MediaFragmentResult | null;
}) {
  if (!media) {
    return null;
  }

  const {
    type,
    image,
    video,
    videoFile,
    videoUrl,
    videoCover,
    videoOptions,
    animatedThumbnail,
    rive,
    riveOptions,
    lottie,
    lottieOptions,
    aspectRatio: nativeRatio,
  } = media;
  const commonProps = { aspectRatio: nativeRatio, ...props };

  switch (type) {
    case "image": {
      return <SanityImage image={image} {...commonProps} {...imageProps} />;
    }

    case "videoMux": {
      const posterUrl = videoCover?._id ? getImageSrc(videoCover, {}) : undefined;

      return (
        // @ts-expect-error - MuxPlayer style vs React.CSSProperties
        <SanityMuxVideo
          video={video}
          poster={posterUrl}
          animatedThumbnail={animatedThumbnail}
          loop={loop}
          autoPlay={autoPlay}
          {...commonProps}
          {...videoOptions}
          {...videoProps}
        />
      );
    }

    case "videoFile":
    case "videoUrl": {
      return (
        <SanityNativeVideo
          source={videoFile ?? videoUrl}
          loop={loop}
          autoPlay={autoPlay}
          {...commonProps}
          {...videoOptions}
          {...videoFileProps}
        />
      );
    }

    case "rive": {
      return <SanityRive rive={rive} loop={loop} autoPlay={autoPlay} {...commonProps} {...riveOptions} {...riveProps} />;
    }

    case "lottie": {
      return (
        <SanityLottie lottie={lottie} loop={loop} autoPlay={autoPlay} {...lottieOptions} {...commonProps} {...lottieProps} />
      );
    }

    default: {
      console.warn(`Unsupported media type: ${type}`);
      return null;
    }
  }
}
