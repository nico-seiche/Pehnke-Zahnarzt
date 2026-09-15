# Seed dataset (starter content)

The repo ships a small **seed dataset** at [`seed/seed-dataset.tar.gz`](../../seed/) so a freshly cloned project starts with real example content instead of an empty Studio.

## What's in it

A standard Sanity dataset export with:

- example **pages**
- the **`site`** singleton (header, footer, SEO defaults)
- the **image and file assets** they reference (about 5 MB total)

Import it with the interactive `npm run sanity:dataset-import`; refresh it with the `sanity:cli` export command shown below.

## Seed a new project

With an authenticated CLI (`npm run sanity:cli -- login`):

```bash
npm run sanity:dataset-import -- --file seed/seed-dataset.tar.gz
```

Or run `npm run sanity:dataset-import` with no flags and pick the seed from the list. It imports into your `.env` dataset by default; pass `--dataset <name>` to override or `--replace` to overwrite existing documents. Typical first-run order:

```bash
npm run sanity:project-setup   # create project, tokens, CORS, webhook, .env
npm run sanity:typegen         # generate sanity/types.ts
npm run sanity:dataset-import -- --file seed/seed-dataset.tar.gz
npm run dev
```

## Refresh the seed

When you change the demo content and want the committed seed to match:

```bash
npm run sanity:cli -- dataset export production seed/seed-dataset.tar.gz \
  --types page,site,sanity.imageAsset,sanity.fileAsset --overwrite
```

The committed `seed/seed-dataset.tar.gz` is tracked in git via a `.gitignore` exception, even though `*.tar.gz` is otherwise ignored.

**Security note:** a full dataset export includes **every** document, including secret-bearing ones. In this project that means the Mux config document (`mux.apiKey`), which stores a private signing key and access token. The `--types` allowlist above is what keeps secrets out of the committed seed: it exports only content types (pages, the `site` singleton, and image/file assets). Keep that list, and extend it when you add new content document types. The same caution applies to full backups from [`npm run sanity:dataset-export`](./dataset-migration.md): treat those archives as sensitive and never commit or share them.

See also: [Dataset export and migration](./dataset-migration.md), [Sanity project setup](./project-setup.md).
