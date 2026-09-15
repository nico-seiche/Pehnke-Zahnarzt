# Automated Sanity project setup

Run `npm run sanity:project-setup` for an **interactive** wizard (prompts + spinners). It can provision a Sanity project (or link an existing ID), create viewer/editor API tokens plus a temporary **developer** token when the webhook step runs, then **remove** that token via `sanity tokens delete` after the webhook is registered (not stored in `.env`), add CORS with credentials, create the **Revalidate** GROQ webhook for `/api/revalidate`, and merge values into `.env`. Use `--dry-run` to rehearse without side effects.

Details: `scripts/sanity-project-setup/README.md`.

If `.env` is missing, the wizard seeds it from **`.env.example`** (when present), then fills Sanity-related keys.

## Why a script

The [Sanity CLI](https://www.sanity.io/docs/apis-and-sdks/cli) covers projects (`sanity projects create`), tokens (`sanity tokens add`), and CORS (`sanity cors add`). The `sanity hooks create` command only opens Manage in the browser; webhook creation here uses the [Webhooks HTTP API](https://www.sanity.io/docs/http-reference/webhooks) so the flow stays on the command line.

## Alignment with this repo

- **Webhook** — Document webhook, triggers on create/update/delete, projection `{_id, _type, "uri": uri.current}` to match `app/api/revalidate/route.ts` and `WebhookSchema`.
- **Env** — Writes the same variables as `env.ts` expects (`NEXT_PUBLIC_SANITY_*`, `SANITY_API_*`, `SANITY_REVALIDATE_SECRET`).
- **Studio public path** — The wizard sets `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` to the same default as `env` examples (typically `/studio`). If you need a different public URL, or a site page on that path, align `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` and `sanity.config` with [Studio public URL and rewrites](./studio-and-structure.md#public-url-rewrites-and-reserved-paths).
- **Optional HTTP Basic Auth** — The wizard does **not** set `BASIC_AUTH_USERNAME` / `BASIC_AUTH_PASSWORD`; add them in `.env` or your host if you use the gate. Toggles live in Sanity; see [Basic Authentication](../features/basic-auth.md).

## Webhook URL must be public

The Revalidate webhook is delivered from Sanity's cloud, so the wizard requires a **publicly reachable URL** (full target: `{base}/api/revalidate`). It rejects `localhost`, loopback, and private hosts before calling the API, because Sanity itself fails registration of those with `400 "Hostname not allowed"`. Enter your **deployed HTTPS URL** (e.g. `https://your-project.vercel.app`); the wizard writes it to `NEXT_PUBLIC_URL`.

No deployment yet? The prompt defaults to the **`https://example.com` placeholder**, a valid public host, so Sanity registers the webhook cleanly. It will not deliver until you repoint it at your real site in **Manage → API → Webhooks** (or by re-running this setup once deployed). For testing the endpoint locally, a tunnel (ngrok, etc.) gives you a public URL.
