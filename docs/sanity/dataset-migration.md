# Dataset export, import, and migration

Use these workflows to back up a dataset, restore an archive into one, or copy content between Sanity datasets (for example production → staging).

## Commands

| Script | Purpose |
|--------|---------|
| `npm run sanity:dataset-export` | One-off backup of a dataset to `./backups/` |
| `npm run sanity:dataset-import` | Interactive restore of a `.tar.gz` into a dataset (pick from `./backups`/seed, or `--file`) |
| `npm run sanity:dataset-migrate` | Export from `--from`, then import into `--to` (with optional `--clean` or `--replace`) |

Full flag reference: `scripts/sanity-dataset/README.md`.

For the bundled starter dataset that ships with the template (to seed a fresh project), see [Seed dataset](./seed-dataset.md).

## Environment

Scripts resolve the project and default dataset from `.env`:

- Prefer `SANITY_PROJECT_ID` and `SANITY_DATASET` if set.
- Otherwise they use `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` (the same variables as `env.ts` for the app).

You must be logged into the Sanity CLI in the shell where you run the scripts (`npm run sanity:cli -- login`). Dataset operations use your CLI session, not the Next.js API tokens.

## Safety notes

- **Migration** prompts before export and again before import. `--clean` deletes the entire target dataset before recreating it; only use when you intend to wipe that dataset.
- **`--clean` snapshots the target first.** Before deleting `--to`, the script exports it to `./backups/<to>-pre-clean-<timestamp>.tar.gz`. If that backup cannot be created (the dataset does not exist yet, or the export fails), it asks you to confirm before deleting. This snapshot is kept even when the temporary source export is cleaned up.
- Export archives are written under `./backups/` and are git-ignored as `*.tar.gz`. Filenames include a `YYYY-MM-DD-HHMMSS` timestamp, so two runs on the same day never overwrite each other.
- After a `--clean` migration, the target dataset is **private**; adjust visibility in [Sanity manage](https://www.sanity.io/manage) if the site expects a public dataset API.
- **Exports contain secrets.** A full dataset export includes every document, including secret-bearing ones such as the Mux config (`mux.apiKey`, which stores a private signing key and token). Treat `./backups/*.tar.gz` as sensitive: do not commit or share them. The committed [seed dataset](./seed-dataset.md) avoids this by exporting only content types via `--types`.
