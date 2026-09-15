import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { defineQuery } from "next-sanity";
import { env } from "~/env";
import { PageSections } from "~/features/page-builder/page-sections";
import { sanityFetch } from "~/features/sanity/client";
import { SeoMetadataFragment } from "~/features/site/seo/fragment";
import { seo } from "~/features/site/seo/utils";
import { SiteShell } from "~/features/site/site-shell";
import { SANITY_ARTICLE_DOCUMENT_TYPE } from "~/sanity/constants";
import type { ArticlePageQResult, ArticlePageUrisQResult } from "~/sanity/types";

const ArticlePageQ = defineQuery(`
  *[_type == "${SANITY_ARTICLE_DOCUMENT_TYPE}" && defined(uri.current) && uri.current == $uri][0]{
    _id,
    _type,
    title,
    "uri": coalesce(uri.current, "/articles"),
    "showHeader": coalesce(showHeader, true),
    "showFooter": coalesce(showFooter, true),
    seoMetadata{${SeoMetadataFragment}},
  }
`);

async function fetchArticle(uri: string) {
  return sanityFetch<ArticlePageQResult>({
    query: ArticlePageQ,
    params: { uri },
    options: {
      next: {
        tags: [uri],
      },
    },
  });
}

const ArticlePageUrisQ = defineQuery(`
  *[_type == "${SANITY_ARTICLE_DOCUMENT_TYPE}" && defined(uri.current)]{
    "uri": coalesce(uri.current, "/articles")
  }
`);

export async function generateStaticParams() {
  const uris = await sanityFetch<ArticlePageUrisQResult>({
    query: ArticlePageUrisQ,
    live: false,
  });

  return uris.map(({ uri }) => ({
    slug: uri.replace("/articles/", ""),
  }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug;
  const article = await fetchArticle(`/articles/${slug}`);

  if (!article) {
    return await seo({ title: "Not Found" });
  }

  const { title, description, image, robots } = article?.seoMetadata ?? {};

  return await seo({
    robots,
    title: title ?? article?.title ?? "Not Found",
    description,
    image,
    canonical: `${env.NEXT_PUBLIC_URL}/articles/${slug}`,
  });
}

export default async function ArticlePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const slug = params.slug;
  const article = await fetchArticle(`/articles/${slug}`);

  if (!article) {
    notFound();
  }

  return (
    <SiteShell showHeader={article.showHeader} showFooter={article.showFooter}>
      <PageSections docId={article._id} />
    </SiteShell>
  );
}
