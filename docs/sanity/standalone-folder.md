# Standalone Sanity folder

The `sanity/` folder is self-contained: every import inside it is either relative or an external package, so it can be copied into another project and wired up with little change. It carries the schema, Studio structure, document actions, templates, custom inputs, and field factories, and it does not assume Next.js. This page is the guide for reusing it elsewhere.

## What the host provides

The folder leaves four things to the project that hosts it:

- **Runtime config** (`config.ts`): site URL, Sanity API version, public Studio base path, and the host route paths the Studio calls.
- **API endpoints**: route handlers for draft mode and the SEO screenshot, if you keep those features.
- **An icon component**: injected into `createIconField`, because the icon set belongs to the host app.
- **The Studio config** (`sanity.config.ts`): you assemble the folder's exports into `defineConfig`.

## Dependencies

The folder imports these packages directly:

- `sanity`, `@sanity/ui`, `@sanity/icons`, `@sanity/preview-url-secret`
- `react`
- `change-case`

Some fields render through Studio plugins that you register in your own config: the media library (`sanity-plugin-media`), Mux video (`sanity-plugin-mux-input`), and optionally Vision (`@sanity/vision`). Install those only for the features you keep.

## Integration steps

1. **Copy** the `sanity/` folder into your project. It can live anywhere; no path alias is required.
2. **Install** the dependencies above.
3. **Configure `config.ts`.** This is the single place the folder reads runtime values. By default it reads `process.env.NEXT_PUBLIC_*`; change the right side of each field for your host (for example `import.meta.env.SANITY_STUDIO_*` under the Sanity CLI or Vite). The same file holds `endpoints` (draft mode and screenshot routes) that you point at your own routes.
4. **Assemble the Studio config.** In your `sanity.config.ts`, wire the folder's exports into `defineConfig`:
   - set `schema.types` to `schemaTypes` from `sanity/schemas`
   - set `schema.templates` to `createDocumentTemplates` from `sanity/templates`
   - set `document.actions` to `createDocumentActions` from `sanity/actions`
   - pass `buildStructure` from `sanity/structure` to `structureTool({ structure })`

   The root `sanity.config.ts` in this repo is a complete working example.
5. **Implement the endpoints** referenced in `config.ts` if you keep preview/draft mode (`draftModeEnable`, `draftModeDisable`) or the SEO screenshot input (`seoScreenshot`).
6. **Inject your icons** wherever you call `createIconField`: pass your icon component as `iconComponent` and the available names as `iconNames`.
7. **Generate types.** The folder includes the generated `sanity/types.ts` (used by `create-rich-text`). Regenerate it with `sanity typegen` after you change the schema.

## Conventions

Imports between `sanity/` modules are relative (`./`, `../`), never an alias, so the folder needs no path-alias setup and can sit anywhere in your tree. The only files you normally edit when adopting it are `config.ts` and the `createIconField` call sites.

---

**Maintainers (in this repo):** keeping the folder portable means it must not import via the `~/` alias. A Biome override scoped to `sanity/**` enforces this (any `~/` import is a lint error); the same rule is stated in the `sanity` skill and `AGENTS.md`. To check by hand, run `rg -n 'from "~/' sanity/` from the repo root and expect zero matches.
