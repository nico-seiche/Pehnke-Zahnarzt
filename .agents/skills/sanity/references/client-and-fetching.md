# Sanity Client and Data Fetching

- **Client**: Import `sanityClient` and `sanityFetch` from `~/features/sanity/client`. Use `sanityFetch({ query, params, live, options })` for all Server Component fetching.
- **Draft mode**: Enabled via `/api/draft-mode/enable`. Client switches to draft perspective automatically.
- **Live mode**: `live` defaults to `true` when draft mode is on. `live: true` uses Sanity Live (stega); `live: false` uses standard fetch with Next.js caching/ISR.
- **Env**: Sanity vars validated in `~/env.ts`. Server: `SANITY_API_VIEW_TOKEN`, `SANITY_API_EDIT_TOKEN`, `SANITY_REVALIDATE_SECRET`. Public: `NEXT_PUBLIC_SANITY_*`.
- **Revalidation**: Webhook `/api/revalidate`; validates signature with `SANITY_REVALIDATE_SECRET`; revalidates by document type and optional slug.

## Stega and identity-sensitive strings

In draft/preview, live mode (`sanityFetch` with `live: true`, the default when draft mode is on) returns **stega-encoded** strings: Sanity embeds invisible Unicode characters (the content source map) into every string so the Presentation tool can offer click-to-edit. The client turns this on in `features/sanity/client.ts` (`sanityLiveFetch({ ..., stega: true })`); the published perspective with `stega.enabled: false` means production strings are plain.

Stega in **visible text is intended and must be preserved** (it powers the click-to-edit overlays). But the invisible characters make the string a different byte sequence than its visible form, so any string used for **DOM manipulation or strict comparison/matching breaks in preview only** unless you strip the payload first with `stegaClean` from `next-sanity`.

Always `stegaClean` a Sanity string before using it as:

- a DOM `id` or anchor target, or any `getElementById` / `querySelector` lookup key
- an `href` / URL, or a path / equality comparison (e.g. same-page detection)
- a `className`, inline `style`, or any attribute that must match an exact token
- a key used to match records to each other
- a value serialized into JSON-LD or other machine-read output

`stegaClean(value)` is a no-op outside preview, so it is always safe to call. The pattern is applied at the Sanity-to-DOM boundary: section ids (`id={stegaClean(section.settings?.hash)}`, and baked into the page-builder-section plop template) and `components/link.tsx` (`href`/`as`). Motivating symptom: clicking a same-page hash did not scroll in preview, because the section `id` and the link `#hash` carried different stega payloads, so visible text matched but the bytes did not.
