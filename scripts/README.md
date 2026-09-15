# Scripts

Root `package.json` exposes Sanity helpers under the `sanity:*` namespace (see `package.json` and [Sanity docs overview](../docs/sanity/README.md#npm-scripts)).

- **`sanity-dataset/`**: Dataset export, import, and migration CLIs. Entry points: `npm run sanity:dataset-export`, `npm run sanity:dataset-import`, `npm run sanity:dataset-migrate`. Details: `sanity-dataset/README.md`.
- **`sanity-project-setup/`** — Interactive Sanity project bootstrap (tokens, CORS, webhook, `.env`). Entry point: `npm run sanity:project-setup`. Details: `sanity-project-setup/README.md`.

## Tests

The pure helpers in each `lib.ts` (env parsing, arg builders, validation, env-file upserts, CLI output parsing) are covered by colocated `*.test.ts` files using the Node test runner. Run them with:

```bash
npm test
```
