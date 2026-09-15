import type { MetadataRoute } from "next";
import { defineQuery } from "next-sanity";
import { env } from "~/env";
import { sanityFetch } from "~/features/sanity/client";
import { SANITY_SINGLETON_HOMEPAGE_ID } from "~/sanity/constants";
import type { SitemapQResult } from "~/sanity/types";

const SitemapQ = defineQuery(`
  *[defined(uri.current) && seoMetadata.noIndex != true && passwordProtected != true]{
    "uri": uri.current,
    "updatedAt": _updatedAt,
    "freq": select(
      _id == "${SANITY_SINGLETON_HOMEPAGE_ID}" => "daily",
      true => "weekly",
    ),
    "priority": select(
      _id == "${SANITY_SINGLETON_HOMEPAGE_ID}" => 1,
      true => 0.8,
    ),
  }
`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await sanityFetch<SitemapQResult>({
    query: SitemapQ,
    // Refresh at most hourly via the Data Cache instead of hitting Sanity every request.
    options: { next: { revalidate: 3600 } },
  });

  const sitemapEntries: MetadataRoute.Sitemap = entries.map((entry) => {
    return {
      url: `${env.NEXT_PUBLIC_URL}${entry.uri}`,
      lastModified: new Date(entry.updatedAt),
      changeFrequency: entry.freq,
      priority: entry.priority,
    };
  });

  return sitemapEntries;
}
