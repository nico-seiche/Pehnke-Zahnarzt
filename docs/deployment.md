# Deployment (Hetzner managed hosting, Node.js configuration)

This guide covers deploying to an Alphanauten **Hetzner managed hosting** via its **Node.js
configuration** panel (not a raw VPS — so **no systemd/pm2/Docker**). The app is built to a
standalone bundle whose entrypoint is `server.js`. The Sanity Studio is **embedded** in this app
(served at `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH`, default `/studio`) and ships with the same build —
no separate Studio deploy.

The matching agent skill is [`.agents/skills/alpha-hetzner-staging-deploy`](../.agents/skills/alpha-hetzner-staging-deploy/SKILL.md).

## 1. Enable the standalone build

Set `output: "standalone"` in `next.config.ts` so `next build` emits a self-contained server under
`.next/standalone/`:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  // …existing config
};
```

## 2. Build

```bash
npm ci
npm run build
```

Use the Node version pinned in `.nvmrc`, regardless of OS.

> **Windows developers only:** the repo typically lives in WSL. Run the build **inside WSL** (e.g.
> `wsl` → `cd ~/…`), not from a Windows shell pointed at the `\\wsl.localhost\…` UNC path —
> cmd.exe/PowerShell cannot use a UNC path as the working directory and `next` will not be found.
> macOS/Linux developers just run the commands normally.

## 3. Assemble the standalone bundle

`output: "standalone"` traces only the needed `node_modules` into `.next/standalone/`, but it does
**not** include the static assets or `public/`. Copy both next to the traced server (paths mirror
the repo root):

```bash
cp -r .next/static   .next/standalone/.next/static
cp -r public         .next/standalone/public
```

Ship the whole `.next/standalone/` directory. Its entrypoint is `server.js`.

## 4. Upload with rsync

From the repo root, after build + asset copy:

```bash
rsync -az --delete \
  --exclude='.next/cache' \
  -e ssh \
  .next/standalone/ \
  deploy@your-server:/path/to/app/
```

- Trailing slash on the source copies the folder **contents** into the target (the directory
  Hetzner's Node.js configuration points its entrypoint at).
- `--exclude='.next/cache'` preserves the runtime ISR cache on the server across redeploys, so
  `--delete` does not wipe it.
- Env secrets live **outside** the bundle (set in the Node.js panel, see below), so rsync never
  touches them.
- Add `-n` for a dry run, or `--info=progress2` for a progress bar.

After uploading, restart the app from Hetzner's Node.js configuration (or let it restart on save).

## 5. Run (Hetzner Node.js configuration)

In the hosting panel's **Node.js configuration**, point the app at the uploaded directory with
entrypoint **`server.js`** and set `PORT` to whatever the panel expects (the standalone server reads
`PORT`/`HOSTNAME` from the environment). Use the `.nvmrc` Node version.

> **Quirk:** activating/configuring the Node.js app in the Hetzner panel **overwrites the other
> entrypoints** for that hosting (e.g. an existing static/PHP document root). Only enable it on
> hosting dedicated to this app.

## 6. Environment variables

Set these in Hetzner's Node.js configuration env panel ("Umgebungsvariablen"). Two kinds — the
distinction is the biggest source of confusion:

- **`NEXT_PUBLIC_*` are inlined at _build time_.** They must be set in the shell that runs
  `npm run build`. If you build locally and upload the bundle, setting them in the panel has **no
  effect** — they are already baked in. (If Hetzner builds from source instead, the panel values are
  what the build sees.)
- **Server secrets are read at _runtime_** by `server.js`, so the panel values **do** take effect.

Entering all vars in the panel is harmless either way: unused public ones are ignored, needed
secrets are present. `next.config.ts` `redirects()` also runs at build and calls the Sanity API, so
`SANITY_API_VIEW_TOKEN` + the `NEXT_PUBLIC_SANITY_*` vars must be present **at build time** too.

### Required at build (inlined)

| Var | Example |
|---|---|
| `NEXT_PUBLIC_URL` | `https://staging.example.de` (the live HTTPS origin, no trailing slash) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `your-project-id` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2025-02-19` |
| `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` | `/studio` |

### Required at runtime (server secrets)

| Var | Purpose |
|---|---|
| `SANITY_API_VIEW_TOKEN` | Read token (fetching, redirects, drafts) |
| `SANITY_API_EDIT_TOKEN` | Write token (contact-form submissions) |
| `SANITY_REVALIDATE_SECRET` | Verifies the `/api/revalidate` webhook signature |

### Optional (feature-gated)

| Var | Enables |
|---|---|
| `RESEND_API_KEY`, `RESEND_EMAIL_FROM` | Contact-form email notifications |
| `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD` | HTTP Basic Auth staging gate (toggled in Sanity) |
| `NEXT_PUBLIC_UNAMI_WEBSITE_ID` | Umami analytics (build-time inlined) |

`env.ts` is the authoritative contract for which vars exist and which are client/build vs
server/runtime.

## 7. After deploying — Sanity wiring

1. **CORS + Studio domain:** in Sanity Manage → API → CORS Origins, add the deployed origin
   `https://<your-domain>` with **credentials allowed**. This one origin also covers the embedded
   Studio at `https://<your-domain>/studio` — without it the Studio cannot log in or load data on the
   deployed domain, and the front end's live/preview fetches fail. Add every domain the site is
   reachable at (staging URL, custom domain, `www`).
2. **Revalidate webhook:** point it at `https://<your-domain>/api/revalidate` (Manage → API →
   Webhooks), or re-run `npm run sanity:project-setup` with the deployed URL. Without a reachable
   webhook, content changes will not invalidate the cache and pages serve stale (the same effect
   seen on localhost, where the webhook can't reach the machine).
3. **Redirects** are read from Sanity at build time only — changing them in the CMS needs a rebuild.

## Notes / caveats

- **Single instance assumed.** Next's on-demand cache is per-instance on the local filesystem, and
  the revalidate webhook hits one instance. For multiple instances behind a load balancer, add a
  shared `cacheHandler` (e.g. Redis).
- Images are served from the Sanity CDN (`@sanity/image-url`), so the built-in Next image optimizer
  is not on the hot path; `sharp` works on a full Node server regardless.
