# Schema and Studio

- **Documents**: `sanity/schemas/documents/`. Use `defineType`; group fields (e.g. `page`, `content`, `seo`).
- **Fields**: `sanity/schemas/fields/`. Factories: `createLinkField`, `createMediaField`, `createPageBuilderField`, `createRichTextField`. Standalone types: `seoMetadata`, `aspectRatio`, `videoOptions`, `appColor`.
- **Page sections**: `sanity/schemas/page-sections/`; export from `page-sections/index.ts`; add preview config.
- **Schema registration**: All types in `sanity/schemas/index.ts` via `schemaTypes`. Use PLOP anchors: `// PLOP: Add Import`, `// PLOP: Add Export`.
- **Structure**: `sanity/structure.tsx` with `buildStructure`. Singletons via `createSingletonListItem`; IDs from `sanity/constants` (e.g. `SINGLETON_IDS`).
- **Studio**: Public URL from `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` (default `/studio` in examples; `basePath` in `sanity.config.ts` must match). App route: `app/sanity-studio/[[...index]]/…` with rewrites in `next.config.ts` and a canonical redirect in `proxy.ts` — [docs/sanity/studio-and-structure.md](../../../../docs/sanity/studio-and-structure.md#public-url-rewrites-and-reserved-paths). Plugins: structureTool, media (10MB limit), muxInput, presentationTool, visionTool.
- **Utils**: `requiredIf`, `visibleIf` from `~/sanity/utils`; `sanitizeDocId` for stripping `drafts.` prefix.
- **Custom inputs**: `sanity/inputs/async-autocomplete.tsx` for section anchors.
- **Naming**: App-prefixed fields: `appLink`, `appMedia`, `appColor`, `appRichText`.
