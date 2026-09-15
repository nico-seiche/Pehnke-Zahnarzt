# Contributor Workflow

This is the recommended workflow for Sanity-related changes in this repository.

## 1) Decide the Change Scope

- Schema/content model change -> update files under `sanity/schemas/`
- Studio behavior change -> update `sanity.config.ts`, `sanity/structure.tsx`, `sanity/actions.tsx`, or `sanity/templates.tsx`
- Data contract/query change -> update GROQ where consumed and any shared fragments

## 2) Follow Existing Patterns

- Reuse field factories (`createLinkField`, `createMediaField`, `createRichTextField`, `createPageBuilderField`)
- Keep schema registration centralized in `sanity/schemas/index.ts`
- Keep singleton and API-only behavior aligned with `sanity/constants.ts`
- Prefer `sanityFetch` from `features/sanity/client.ts` over ad-hoc clients

## 3) Keep Query and UI Contracts Aligned

- Add only the fields needed by the consuming UI
- Keep fragment usage consistent (`features/sanity/link/fragment.ts`, `features/sanity/media/fragment.ts`, `features/site/seo/fragment.ts`)
- Ensure query tags are present when cache invalidation is required

## 4) Regenerate and Validate Types

After schema or GROQ changes:

```bash
npm run sanity:typegen
npm run check.types
```

And run project checks:

```bash
npm run check
```

## 5) Verify Runtime Paths

At minimum verify:

- The public Studio path from `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` loads and edits content correctly (default in examples is `/studio`; see [Studio public URL and rewrites](./studio-and-structure.md#public-url-rewrites-and-reserved-paths))
- target frontend route renders expected content
- draft mode preview works for changed documents
- webhook revalidation invalidates expected routes/tags
- if you use **HTTP Basic Auth**, confirm `BASIC_AUTH_*` env vars and `proxy.ts` behavior match [Basic Authentication](../features/basic-auth.md) (site-wide vs per-URL toggles)

## Notes

- Do not edit `sanity/types.ts` manually
- For new sections/blocks/routes, prefer `npm run plop` first, then refine
