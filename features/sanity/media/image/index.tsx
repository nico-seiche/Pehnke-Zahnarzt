"use client";

import { composeRefs } from "@radix-ui/react-compose-refs";
import * as React from "react";
import { createResponsiveSizes, Image } from "~/components/image";
import { parseResponsiveValues } from "~/features/dom/utils";
import type { ImageFragmentResult } from "~/features/sanity/media/fragment";
import {
  type BuilderOptions,
  getImageDimensions,
  getImageSrc,
  getImageSrcSet,
  getLqipBackgroundStyle,
} from "~/features/sanity/media/image/utils";
import type { CommonMediaProps } from "~/features/sanity/media/types";
import { parseAspectRatio } from "~/features/sanity/media/utils";
import { cx } from "~/features/style/utils";
import { run } from "~/features/utils/common";

function useImageLoaded() {
  const [loaded, setLoaded] = React.useState(false);
  const ref = React.useRef<HTMLImageElement>(null);

  const onLoad = React.useCallback(() => {
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (ref.current?.complete) {
      onLoad();
    }
  }, [onLoad]);

  return [ref, loaded, onLoad] as const;
}

export function SanityImage({
  image,
  aspectRatio,
  builderOptions,
  style,
  alt,
  sizes,
  onLoad,
  width,
  height,
  noPlaceholder,
  className,
  ref: _outerRef,
  ...props
}: Omit<React.ComponentProps<typeof Image>, "src" | "srcSet"> &
  CommonMediaProps & {
    image?: ImageFragmentResult | null;
    builderOptions?: BuilderOptions;
    noPlaceholder?: boolean;
  }) {
  const [ref, hasLoaded, _onLoad] = useImageLoaded();
  const imgRef = composeRefs(ref, _outerRef);

  const handleLoad = React.useCallback(
    (ev: React.SyntheticEvent<HTMLImageElement>) => {
      _onLoad();
      onLoad?.(ev);
    },
    [_onLoad, onLoad]
  );

  if (!image?._id) {
    return null;
  }

  const sources = run(() => {
    if (!aspectRatio) {
      return undefined;
    }

    const responsiveRatios = Object.entries(parseResponsiveValues(String(aspectRatio)));

    const entries = responsiveRatios.map(([bp, { value, resolvedWidth }]) => {
      if (!resolvedWidth) {
        return null;
      }

      const imageOptions = {
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        aspectRatio: value ? parseAspectRatio(value) : undefined,
        ...builderOptions,
      };

      const dimensions = getImageDimensions(image, imageOptions);
      const srcSet = getImageSrcSet(image, imageOptions);
      const size = sizes ? createResponsiveSizes(sizes) : undefined;

      return {
        bp,
        srcSet,
        sizes: size,
        width: dimensions.width,
        height: dimensions.height,
        media: `(min-width: ${resolvedWidth})`,
      };
    });

    return entries.filter((_): _ is NonNullable<typeof _> => Boolean(_));
  });

  const imageRatio = run(() => {
    if (aspectRatio) {
      const ratio = parseResponsiveValues(String(aspectRatio)).DEFAULT.value;
      return ratio ? parseAspectRatio(ratio) : undefined;
    }

    return undefined;
  });

  const imageOptions = {
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
    aspectRatio: imageRatio,
    ...builderOptions,
  };

  const dimensions = getImageDimensions(image, imageOptions);
  const src = getImageSrc(image, imageOptions);
  const srcSet = getImageSrcSet(image, imageOptions);
  const placeholderStyle = !hasLoaded && !noPlaceholder ? getLqipBackgroundStyle(image) : undefined;
  const altText = alt ?? image.altText ?? image.description ?? image.title ?? "";

  const imageStyles = {
    "--desired-width": width ? `${width}px` : "auto",
    "--desired-height": height ? `${height}px` : "auto",
    ...placeholderStyle,
    ...style,
  } as React.CSSProperties;

  return (
    <picture className="contents">
      {sources?.map(({ bp, ...props }) => (
        <source key={bp} {...props} />
      ))}
      <Image
        {...props}
        ref={imgRef}
        onLoad={handleLoad}
        src={src}
        sizes={sizes}
        srcSet={srcSet}
        alt={altText}
        width={dimensions.width}
        height={dimensions.height}
        style={imageStyles}
        className={cx("h-(--desired-height,auto) w-(--desired-width,auto) max-w-full", className)}
      />
    </picture>
  );
}
