import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import { env } from "~/env";
import { PageSections } from "~/features/page-builder/page-sections";
import { sanityFetch } from "~/features/sanity/client";
import { SeoMetadataFragment } from "~/features/site/seo/fragment";
import { seo } from "~/features/site/seo/utils";
import { SiteShell } from "~/features/site/site-shell";
import { SANITY_PAGE_DOCUMENT_TYPE } from "~/sanity/constants";
import type { PageQResult, PageUrisQResult } from "~/sanity/types";

const PageQ = defineQuery(`
  *[_type == "${SANITY_PAGE_DOCUMENT_TYPE}" && defined(uri.current) && uri.current == $uri][0]{
    _id,
    _type,
    title,
    "uri": coalesce(uri.current, "/"),
    "showHeader": coalesce(showHeader, true),
    "showFooter": coalesce(showFooter, true),
    seoMetadata{${SeoMetadataFragment}},
  }
`);

async function fetchPage(uri: string) {
  return sanityFetch<PageQResult>({
    query: PageQ,
    params: {
      uri,
    },
    options: {
      next: {
        tags: [uri],
      },
    },
  });
}

const PageUrisQ = defineQuery(`*[_type == "${SANITY_PAGE_DOCUMENT_TYPE}" && defined(uri.current)]{
  "uri": coalesce(uri.current, "/")
}`);

export async function generateStaticParams() {
  const uris = await sanityFetch<PageUrisQResult>({
    query: PageUrisQ,
    live: false,
  });

  return uris.map(({ uri }) => {
    // Handle homepage "/" as empty array, other routes as split segments
    const splash = uri === "/" ? [] : uri.split("/").filter(Boolean);
    return { uri: splash?.length > 0 ? splash : undefined };
  });
}

export async function generateMetadata(props: { params: Promise<{ uri?: string[] }> }): Promise<Metadata> {
  const params = await props.params;
  const uri = params.uri ? `/${params.uri.join("/")}` : "/";
  const page = await fetchPage(uri);

  if (!page) {
    return await seo({ title: "Not Found" });
  }

  if (uri === "/") {
    return await seo({
      robots: page?.seoMetadata?.robots,
      canonical: `${env.NEXT_PUBLIC_URL}/`,
    });
  }

  const { title, description, image, robots } = page?.seoMetadata ?? {};

  return await seo({
    robots,
    title: title ?? page?.title,
    description,
    image,
    canonical: `${env.NEXT_PUBLIC_URL}${uri}`,
  });
}

export default async function Page(props: { params: Promise<{ uri?: string[] }> }) {
  const params = await props.params;
  const uri = params.uri ? `/${params.uri.join("/")}` : "/";
  const page = await fetchPage(uri);

  if (!page) {
    notFound();
  }

  return (
    <SiteShell showHeader={page.showHeader} showFooter={page.showFooter}>
      <PageSections docId={page._id} />
    </SiteShell>
  );
}
