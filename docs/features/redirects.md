# Redirects

This starter includes a redirect system managed in Sanity and configured in Next.js.

## How It Works

- Redirects are stored in the `Site` document in Sanity
- They are fetched at build time by `next.config.ts`
- Supported patterns follow Next.js redirect syntax

Supported behavior:

- Pattern matching (for example `/old/:slug*` to `/new/:slug*`)
- Dynamic parameters (for example `/old/:slug` to `/new/:slug`)
- `301` (permanent) and `302` (temporary) status codes
- Query string preservation by default

## Managing Redirects

1. Open Sanity Studio at the public path from `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` (default `/studio` in examples; see [Studio public URL and rewrites](../sanity/studio-and-structure.md#public-url-rewrites-and-reserved-paths))
2. Go to `Site` -> `Redirects`
3. Add a redirect:
   - `From`: source path (`/old-page` or `/blog/:slug`)
   - `To`: destination path (`/new-page` or `/articles/:slug`)
   - `Status Code`: `301` or `302`

## Examples

Simple:

- From: `/about`
- To: `/about-us`
- Status: `301`

Dynamic:

- From: `/blog/:slug`
- To: `/articles/:slug`
- Status: `301`

Catch-all:

- From: `/old-section/:path*`
- To: `/new-section`
- Status: `301`

## Notes

- Redirects are resolved at build time
- Rebuild the app after redirect changes
- Duplicate `from` values are blocked by schema validation
