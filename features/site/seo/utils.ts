import type { Metadata } from "next";
import { env } from "~/env";
import { sanityFetch } from "~/features/sanity/client";
import type { ImageFragmentResult } from "~/features/sanity/media/fragment";
import { type BuilderOptions, builder, getImageDimensions } from "~/features/sanity/media/image/utils";
import { SiteQuery } from "~/features/site/query";
import type { FaviconFragmentResult } from "~/features/site/seo/fragment";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";
import type { SiteQueryResult } from "~/sanity/types";

const FAVICON_PX = 64;
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const FAVICON_IMAGE_TYPE = "image/png";

function getFaviconImageSrc(image: ImageFragmentResult): string {
  const imageDimensions = getImageDimensions(image, {
    width: FAVICON_PX,
    height: FAVICON_PX,
  });

  return builder
    .withOptions({
      width: imageDimensions.width,
      height: imageDimensions.height,
      fit: "crop",
      format: "png",
      quality: 85,
    })
    .image(image)
    .url();
}

function getOgImageSrc(image: ImageFragmentResult, options: BuilderOptions = {}) {
  const { aspectRatio, ...builderOptions } = options;

  const imageDimensions = getImageDimensions(image, {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    aspectRatio,
  });

  return builder
    .withOptions({
      auto: "format",
      quality: 85,
      ...builderOptions,
      fit: "crop",
      width: imageDimensions.width,
      height: imageDimensions.height,
    })
    .image(image)
    .url();
}

function metadataIconsFromFavicon(favicon: FaviconFragmentResult | null | undefined): Metadata["icons"] | undefined {
  if (!favicon) {
    return undefined;
  }

  const lightScheme = favicon.iconLight?._id != null ? getFaviconImageSrc(favicon.iconLight) : undefined;
  const darkScheme = favicon.iconDark?._id != null ? getFaviconImageSrc(favicon.iconDark) : undefined;

  if (!lightScheme && !darkScheme) {
    return undefined;
  }

  if (lightScheme && darkScheme) {
    return {
      icon: [
        { url: lightScheme, type: FAVICON_IMAGE_TYPE, media: "(prefers-color-scheme: light)" },
        { url: darkScheme, type: FAVICON_IMAGE_TYPE, media: "(prefers-color-scheme: dark)" },
      ],
    };
  }

  const single = lightScheme ?? darkScheme;
  return single ? { icon: { url: single, type: FAVICON_IMAGE_TYPE } } : undefined;
}

/**
 * Generate SEO metadata for a Next.js page.
 */
export async function seo(
  props: {
    title?: string | null;
    robots?: string | null;
    description?: string | null;
    image?: ImageFragmentResult | null;
    canonical?: string | null;
  } = {}
) {
  const site = await sanityFetch<SiteQueryResult>({
    query: SiteQuery,
    options: {
      next: {
        tags: [SANITY_SINGLETON_SITE_ID],
      },
    },
  });

  const title = props.title ?? site?.seoMetadata?.title;
  const description = props.description ?? site?.seoMetadata?.description;
  const image = props.image ?? site?.seoMetadata?.image;
  const robots = props.robots ?? site?.seoMetadata?.robots;
  const images = image ? getOgImageSrc(image) : undefined;
  const canonical = props.canonical ?? env.NEXT_PUBLIC_URL;

  return {
    title,
    description,
    robots,
    icons: metadataIconsFromFavicon(site?.favicon),
    openGraph: {
      type: "website",
      siteName: site?.name,
      url: canonical,
      title,
      description,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
    alternates: {
      canonical,
    },
  } satisfies Metadata;
}
