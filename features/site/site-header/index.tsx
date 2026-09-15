import { sanityFetch } from "~/features/sanity/client";
import { SiteHeaderQ } from "~/features/site/site-header/query";
import { SiteHeaderBar } from "~/features/site/site-header/site-header-bar";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";
import type { SiteHeaderQResult } from "~/sanity/types";

export async function SiteHeader() {
  const siteHeader = await sanityFetch<SiteHeaderQResult>({
    query: SiteHeaderQ,
    options: { next: { tags: [SANITY_SINGLETON_SITE_ID] } },
  });

  if (!siteHeader?.header?.links) {
    return null;
  }

  return (
    <SiteHeaderBar
      name={siteHeader.name ?? "Zahnarztpraxis"}
      phone={siteHeader.phone}
      links={siteHeader.header.links}
      cta={siteHeader.header.cta}
    />
  );
}
