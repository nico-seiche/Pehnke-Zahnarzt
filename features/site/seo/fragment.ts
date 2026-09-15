import { ImageFragment, type ImageFragmentResult } from "~/features/sanity/media/fragment";

export const SeoMetadataFragment = `
  title,
  description,
  image{${ImageFragment}},
  "robots": select(noIndex => "noindex,nofollow", true => undefined),
`;

export type SeoMetadataFragmentResult = {
  title: string;
  description: string;
  image: ImageFragmentResult;
  robots?: string;
};

export const FaviconFragment = `
  iconLight{${ImageFragment}},
  iconDark{${ImageFragment}}
`;

export type FaviconFragmentResult = {
  iconLight?: ImageFragmentResult | null;
  iconDark?: ImageFragmentResult | null;
};
