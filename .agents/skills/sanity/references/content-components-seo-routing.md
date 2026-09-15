# Content Components, SEO, and Routing

## SanityLink

- Import `SanityLink` from `~/features/sanity/link`; use `LinkFragment` from `~/features/sanity/link/fragment` in queries.
- Handles internal/external, email, phone, file downloads, section anchors; sets `target`/`rel` from `openInNewTab`; `canDownload` for files.

## SanityMedia

- Import `SanityMedia` from `~/features/sanity/media`; use `MediaFragment` from `~/features/sanity/media/fragment` in queries.
- Renders image (Next.js Image), Mux video (`SanityMuxVideo`), native `<video>` for a self-hosted file or external URL (`SanityNativeVideo`), Rive, and Lottie.

## SEO

- Fragment: `SeoMetadataFragment` in `~/features/site/seo/fragment.ts`. Site query `SiteQ` in `~/features/site/query.ts` includes seoMetadata.
- Helper: `seo()` from `~/features/site/seo/utils` builds Next.js `Metadata` (title, description, image, robots, canonical). Use in `generateMetadata()` with page data and `env.NEXT_PUBLIC_URL`.
- JSON-LD: Fetch site, build `WebSite`/`WebPage` with `schema-dts`; render `<script type="application/ld+json">`.

## Routing

- Catch-all: `app/(web)/[[...uri]]/page.tsx` for `uri.current`-driven pages. `generateStaticParams()` returns segments; page reconstructs `uri` from `params.uri`.
- Prefix routes: `app/(web)/{prefix}/[slug]/page.tsx` (e.g. articles, spaces). Query by `uri.current == $uri` with `uri` like `/articles/{slug}`. Use Plop "Prefix Page Route" to scaffold.

## Best Practices

1. Always use `sanityFetch`; tag for revalidation; type queries with generated types; project only needed fields.
2. Use field factories and query fragments; handle draft `_id` in preview; use Plop for new sections/routes/blocks.
