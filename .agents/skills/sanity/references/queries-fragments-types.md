# GROQ Queries, Fragments, and Types

- **Query location**: Same file as usage or dedicated query file. Use `defineQuery()` from `next-sanity` for type inference.
- **Best practices**: Project only needed fields; use `->` for references; `array::compact()`, `coalesce()` where useful.
- **Fragments**: In `~/features/*/fragment.ts` (e.g. `~/features/site/seo/fragment.ts`). Compose with string interpolation: `seoMetadata{${SeoMetadataFragment}}` (single `${}`, not `${{}}`). Export fragment string and TypeScript type.
- **Wrapper policy**: Prefer inlining `sanityFetch` at call site. Add a wrapper only when the same invocation (query + params + tags) is reused in the same file; keep it minimal and preserve `options.next.tags`.
- **Types**: Generated in `~/sanity/types.ts`. Import query result types as `XxxQResult`. Run `npm run sanity:typegen` after schema or query changes. Do not edit `sanity/types.ts` manually.
