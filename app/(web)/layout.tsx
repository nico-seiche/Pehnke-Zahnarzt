import "~/features/style/tailwind.css";
import { draftMode } from "next/headers";
import type * as React from "react";
import type { WebPage, WebSite, WithContext } from "schema-dts";
import { SharedWebLayout } from "~/app/shared-web-layout";
import { env } from "~/env";
import { sanityFetch } from "~/features/sanity/client";
import { SiteQuery } from "~/features/site/query";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";
import type { SiteQueryResult } from "~/sanity/types";

export default async function Layout(props: { children: React.ReactNode }) {
  const { isEnabled: isDraft } = await draftMode();

  const site = await sanityFetch<SiteQueryResult>({
    query: SiteQuery,
    options: {
      next: {
        tags: [SANITY_SINGLETON_SITE_ID],
      },
    },
  });

  const siteName = site?.name ?? "The Content Architecture";
  const description = site?.seoMetadata?.description;

  const websiteJsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${env.NEXT_PUBLIC_URL}/#website`,
    url: env.NEXT_PUBLIC_URL,
    name: siteName,
    description,
    inLanguage: "en",
  };

  const webpageJsonLd: WithContext<WebPage> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${env.NEXT_PUBLIC_URL}/#webpage`,
    url: env.NEXT_PUBLIC_URL,
    name: siteName,
    description,
    isPartOf: {
      "@id": `${env.NEXT_PUBLIC_URL}/#website`,
    },
    inLanguage: "en",
  };

  return (
    <SharedWebLayout
      isDraft={isDraft}
      bodyStart={
        <>
          <script
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: safe
            dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
          />
          <script
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: safe
            dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd) }}
          />
        </>
      }
    >
      {props.children}
    </SharedWebLayout>
  );
}
