# Sanity Setup Overview

This project uses Sanity as the content backend for the website and Studio for content operations.

## High-Level Architecture

- **Dataset privacy:** Sanity’s **Free** plan uses **public** datasets only; **private** datasets (token-required reads) need a **paid** plan (e.g. Growth). See [Sanity pricing](https://www.sanity.io/pricing). HTTP Basic Auth (env credentials + CMS toggles) is documented in [Basic Authentication](../features/basic-auth.md).
- Studio is served at the public path from `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` (default `/studio` in examples); the App Router page lives under `app/sanity-studio/…` and **rewrites** connect them — see [Studio Config and Structure — Public URL, rewrites, and reserved paths](./studio-and-structure.md#public-url-rewrites-and-reserved-paths)
- Studio config lives in `sanity.config.ts`
- Schemas are defined under `sanity/schemas/` and registered in `sanity/schemas/index.ts`
- Website data is fetched through `sanityFetch` in `features/sanity/client.ts`
- Draft preview and visual editing are enabled through draft mode routes and layout wiring
- Revalidation uses a signed webhook at `app/api/revalidate/route.ts`
- AI content generation uses Sanity Agent Actions from a Studio button. See [Agent Actions (Sanity AI generation)](./agent-actions.md)

## Core Runtime Flow

1. Content editors update data in Studio
2. Frontend fetches data with `sanityFetch` (published by default, live in draft mode)
3. Webhook invalidates Next.js cache tags when documents change
4. Next request fetches fresh content from Sanity

## npm scripts

Sanity-related entry points use the `sanity:*` namespace in root `package.json`. Use these names everywhere (not the old `sanity-*` hyphenated script names).

| Script | Purpose |
| --- | --- |
| `npm run sanity:typegen` | Extract schema + generate `sanity/types.ts` |
| `npm run sanity:cli` | Run Sanity CLI with `.env` (e.g. `npm run sanity:cli -- login`) |
| `npm run sanity:dataset-export` | Backup a dataset to `./backups/` — [dataset migration](./dataset-migration.md) |
| `npm run sanity:dataset-import` | Restore a `.tar.gz` into a dataset, interactive (see [dataset migration](./dataset-migration.md)) |
| `npm run sanity:dataset-migrate` | Copy dataset → dataset — [dataset migration](./dataset-migration.md) |
| `npm run sanity:project-setup` | Bootstrap project, tokens, CORS, webhook, `.env` — [project setup](./project-setup.md) |

## Documentation Map

- [Studio Config and Structure](./studio-and-structure.md)
- [Schema and Content Model](./schema-and-content-model.md)
- [Fetching, GROQ, and Types](./fetching-groq-and-types.md)
- [Draft Mode and Visual Editing](./draft-mode-and-visual-editing.md)
- [Revalidation and Caching](./revalidation-and-caching.md)
- [Agent Actions (Sanity AI generation)](./agent-actions.md)
- [Dataset export, import, and migration](./dataset-migration.md)
- [Seed dataset (starter content)](./seed-dataset.md)
- [Sanity project setup](./project-setup.md)
- [Standalone Sanity folder](./standalone-folder.md)
- [Contributor Workflow](./contributor-workflow.md)
