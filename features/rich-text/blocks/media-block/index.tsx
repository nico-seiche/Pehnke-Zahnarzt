import { InnerParallax } from "~/components/inner-parallax";
import { SanityMedia } from "~/features/sanity/media";
import { cx } from "~/features/style/utils";
import type { MediaBlockFragmentResult } from "./fragment";

export function MediaBlock({ value, className }: { value?: MediaBlockFragmentResult; className?: string }) {
  if (!value) {
    return null;
  }

  const { media, caption, useParallax } = value;

  return (
    <figure className={cx("flex flex-col gap-16", className)} data-rich-text-block="mediaBlock">
      {useParallax ? (
        <InnerParallax overflow="60 lg:120" style={{ aspectRatio: media?.aspectRatio ?? undefined }}>
          <SanityMedia media={media} className="size-full object-cover" />
        </InnerParallax>
      ) : (
        <SanityMedia media={media} />
      )}
      {caption && <figcaption className="font-sans text-caption text-text-muted">{caption}</figcaption>}
    </figure>
  );
}
