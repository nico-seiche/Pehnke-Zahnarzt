import { defineQuery } from "next-sanity";
import { FaviconFragment, SeoMetadataFragment } from "~/features/site/seo/fragment";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";

export const SiteQuery = defineQuery(`*[_type == "${SANITY_SINGLETON_SITE_ID}"][0]{
  name,
  seoMetadata{${SeoMetadataFragment}},
  favicon{${FaviconFragment}}
}`);
