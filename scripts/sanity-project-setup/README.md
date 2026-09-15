# Sanity project setup (`npm run sanity:project-setup`)

**Interactive** CLI (like `sanity-dataset-*`): prompts for org, project name or existing ID, dataset, tokens, CORS, webhook URL, and `.env` path — with [ora](https://github.com/sindresorhus/ora) spinners and clear steps.

It automates:

1. **Create a project** (`sanity projects create`) or **use an existing** project ID.
2. **API tokens** — `Frontend - View` (viewer), `Frontend - Edit` (editor), and when the webhook step is enabled a temporary **`Setup - Webhook` developer** token used only to call the webhooks API; it is **revoked automatically on every outcome** (success, duplicate, 401, or error), and is never written to `.env`. If revocation itself fails, the script tells you to delete it manually in Manage.
3. **CORS** — `sanity cors add --credentials` for one or more origins (default includes `http://localhost:3000`).
4. **Revalidate webhook** — [Webhooks HTTP API](https://www.sanity.io/docs/http-reference/webhooks) `POST` (document hook, projection `{_id, _type, "uri": uri.current}`).  
   **Editor** tokens get **401** on create; **developer**-role project tokens are required. The webhook step depends on the token step, so if you ask for a webhook without tokens the wizard prompts you upfront to either enable tokens or skip the webhook (instead of failing at the end). You can also add the webhook manually in Manage. No `GET` list step (project tokens often lack `webhooks/read`).

Writes: `NEXT_PUBLIC_SANITY_*`, `SANITY_API_VIEW_TOKEN`, `SANITY_API_EDIT_TOKEN`, `SANITY_REVALIDATE_SECRET`, and `NEXT_PUBLIC_URL` when you configure the webhook.

Optional **HTTP Basic Auth** (`BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD`) is **not** written by this script; add them in `.env` or your host if you use the feature. See [`docs/features/basic-auth.md`](../../docs/features/basic-auth.md).

If the target `.env` file does not exist but **`.env.example`** does, the script **copies** `.env.example` to that path first, then merges/upgrades the keys above (so you keep placeholders like `RESEND_*`, etc.).

## Prerequisites

- `npm run sanity:cli -- login`
- Organization id/slug from [manage](https://www.sanity.io/manage) if you create a **new** project
- First run may not have a `.env` yet — the npm script ignores `MISSING_ENV_FILE` so dotenvx does not fail; the wizard can create `.env` from `.env.example`.

## Run

```bash
npm run sanity:project-setup
```

Answer the prompts. At the end you confirm a **summary** before anything runs.

**Quick defaults (Enter):** dataset `production` · public · create tokens · add CORS `http://localhost:3000` · create webhook. The webhook needs a **public URL**: `localhost` and private hosts are rejected at registration with `Hostname not allowed`. Before you deploy, the prompt defaults to the **`https://example.com` placeholder** so registration still succeeds; repoint it at your deployed HTTPS URL in Manage (or re-run this setup) once live. A tunnel (ngrok, etc.) also works for a real public URL.

### Dry run

```bash
npm run sanity:project-setup -- --dry-run
```

Walks through the same questions, prints the summary, then exits without calling Sanity or writing `.env`.

## After setup

```bash
npm run sanity:typegen
# optional: load the bundled starter content
npm run sanity:dataset-import -- --file seed/seed-dataset.tar.gz
```

Seed details: `docs/sanity/seed-dataset.md`.

## Security

- Never commit `.env` or tokens.
- Revoke leaked tokens in Manage → API → Tokens.

See also: `docs/sanity/project-setup.md`, and for how the public Studio path relates to `app/sanity-studio/…` and rewrites, `docs/sanity/studio-and-structure.md#public-url-rewrites-and-reserved-paths`.
