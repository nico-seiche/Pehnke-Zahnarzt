# Fetching, GROQ, and Types

## Sanity Client Policy

Use the shared client from `features/sanity/client.ts`:

- `sanityClient`: base `createClient` instance
- `sanityFetch`: preferred server-side fetching helper
- `SanityLive`: live preview component

Do not create additional clients in app code when `sanityFetch` is enough.

## `sanityFetch` Behavior

`sanityFetch` accepts:

- `query`
- `params`
- `live`
- `options` (cache and Next.js tags)

Default behavior:

- `live` defaults to current draft mode state
- live fetch path uses Sanity Live (`stega: true`)
- non-live path uses:
  - `perspective: "published"`
  - `cache: "force-cache"` unless overridden
  - `next.tags` for cache invalidation control

## GROQ Query Conventions

- Use `defineQuery` from `next-sanity` for typed queries
- Keep projections minimal and aligned to UI usage
- Reuse fragments when fields are shared

Examples in repository:

- `features/site/query.ts`
- `app/(web)/[[...uri]]/page.tsx`
- `features/page-builder/page-sections.tsx`

## Fragments

Fragment files include:

- `features/site/seo/fragment.ts`
- `features/sanity/link/fragment.ts`
- `features/sanity/media/fragment.ts`

Interpolate fragment strings inside query strings using standard template interpolation (`${FragmentName}`).

## Generated Types

- Generated file: `sanity/types.ts`
- CLI config: `sanity.cli.ts`
- Script: `npm run sanity:typegen`

Important:

- Never edit `sanity/types.ts` manually
- Run `npm run sanity:typegen` after schema or GROQ contract changes
- Import generated result types (for example `PageQResult`, `SiteQueryResult`)

## Query Tagging and Invalidation

When data should refresh on webhook events, include matching tags:

- site-wide queries: tag `site`
- page queries: tag URI (for example `/about`)
- page-builder slices: tag `doc:{docId}`

Webhook tags are generated in `app/api/revalidate/route.ts`, so query tags should follow the same tag vocabulary.
