---
name: alpha-hetzner-staging-deploy
description: Use when building, uploading, or troubleshooting a deploy of this Next.js + Sanity app to an Alphanauten Hetzner staging server via Hetzner's managed "Node.js configuration" panel (no Vercel, no systemd/pm2). Covers the standalone build assembly, the build-time vs runtime env split, rsync upload, the Node.js-panel entrypoint-overwrite quirk, Sanity CORS + Studio-domain + webhook wiring, the Basic-Auth staging gate, and the Windows/WSL build quirk. Do NOT use for local dev-server work or content/schema changes.
---

# Alpha Hetzner staging deploy

Deploy target is Hetzner **managed hosting via its "Node.js configuration" panel** (not a raw VPS,
not Vercel — so **no systemd/pm2/Docker**). The app is built to a **standalone bundle**, uploaded
with rsync, and run by the panel with entrypoint `server.js`. The Sanity Studio is embedded in the
same app (served at `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH`, default `/studio`) and ships with the
build — there is no separate Studio deploy. The full prose walkthrough is
[docs/deployment.md](../../../docs/deployment.md); this skill is the quirk checklist that keeps a
deploy from silently breaking.

## Core Rules

- **Build with Node matching `.nvmrc`, on any OS.** macOS/Linux devs run the commands directly.
  **Windows devs only:** the repo usually lives in WSL, so run the build **inside WSL** (`wsl` →
  `cd ~/…`), never from a Windows shell pointed at the `\\wsl.localhost\…` UNC path — cmd.exe/
  PowerShell cannot use a UNC path as CWD (it jumps to `C:\Windows` and `next`/`dotenvx` come back
  "not found"). In WSL, ensure the pinned Node is on PATH (e.g. via `nvm use`).
- **Build in standalone mode.** `next.config.ts` must set `output: "standalone"` so `next build`
  emits `.next/standalone/` with entrypoint `server.js`. **It does NOT include `.next/static` or
  `public/`** — after `npm run build` you MUST copy both next to the traced server, or the deployed
  site loads with no CSS/JS and 404s on assets:
  ```bash
  cp -r .next/static .next/standalone/.next/static
  cp -r public       .next/standalone/public
  ```
- **Run via Hetzner's Node.js configuration, not a process manager.** Point the panel at the
  uploaded directory with entrypoint `server.js`; the standalone server reads `PORT`/`HOSTNAME` from
  the env. **Quirk:** configuring/activating the Node.js app in the panel **overwrites the other
  entrypoints** of that hosting (e.g. an existing static/PHP document root) — only enable it on
  hosting dedicated to this app.
- **`NEXT_PUBLIC_*` are inlined at BUILD time; server secrets are read at RUNTIME.** This is the
  single biggest source of confusion. `NEXT_PUBLIC_*` (URL, Sanity project/dataset/apiVersion,
  studio base path) are baked into the bundle by `next build` — setting them later in a runtime env
  panel has **no effect**. Server-only vars (`SANITY_API_VIEW_TOKEN`, `SANITY_API_EDIT_TOKEN`,
  `SANITY_REVALIDATE_SECRET`, optional `RESEND_*`, `BASIC_AUTH_*`) are read live by `server.js`.
  - `next.config.ts` `redirects()` also runs at build and calls the Sanity API, so
    `SANITY_API_VIEW_TOKEN` + the `NEXT_PUBLIC_SANITY_*` vars must be present **at build time** too.
  - A host env panel ("Umgebungsvariablen"): if the platform **builds** from source, put all vars
    there. If it only **runs** an uploaded bundle, only the runtime secrets matter (public vars are
    already baked). Entering all of them is harmless either way.
- **Dev and prod share `.next`.** Building clobbers a running `npm run dev` and vice versa. Stop the
  dev server before `npm run build`, and expect the `.next/standalone` artifact to disappear the
  next time dev runs. The standalone bundle is a fresh build output, not a durable state — build it
  immediately before uploading.
- **After deploy, wire Sanity or the site/Studio breaks.**
  - **CORS + Studio domain:** add the deployed origin `https://<domain>` to Sanity Manage → API →
    CORS Origins **with credentials allowed**. This same origin covers the embedded Studio at
    `https://<domain>/studio` — without it the Studio cannot log in or load data on the staging
    domain, and the front end's live/preview fetches fail. Add **every** domain the site answers on
    (staging URL, custom domain, `www`).
  - **Revalidate webhook:** point it at `https://<domain>/api/revalidate` (Manage → API → Webhooks,
    or re-run `npm run sanity:project-setup` with the deployed URL). Without a reachable webhook the
    on-demand cache never invalidates and pages serve stale — the same effect seen on localhost,
    where the webhook cannot reach the machine.
- **Staging gate = Basic Auth.** For a client-review staging site, set `BASIC_AUTH_USERNAME` /
  `BASIC_AUTH_PASSWORD` in the server env and turn protection on in Sanity (Site → Security,
  site-wide, and/or per document "Password protect"). Credentials are **not** stored in the CMS;
  only the toggles are. Takes effect on publish, within ~5 minutes.

## Trigger Conditions

Preparing a staging/production build, assembling the standalone bundle, adjusting the rsync upload,
configuring the Hetzner Node.js panel or its env vars, wiring Sanity CORS/Studio-domain/webhook for
the deployed URL, or debugging a deployed site (missing assets, stale content, Studio login,
Basic-Auth gate).

## Execution Checklist

1. Ensure `output: "standalone"` is set in `next.config.ts`.
2. With the `.nvmrc` Node version (Windows devs: inside WSL): `npm ci && npm run build` (dev server
   stopped first).
3. Assemble: copy `.next/static` and `public/` into `.next/standalone/` (see Core Rules).
4. Confirm `.next/standalone/server.js` exists; optionally smoke-test:
   `cd .next/standalone && HOSTNAME=127.0.0.1 PORT=3100 node server.js` then `curl` a route.
5. Upload with rsync (trailing slash on source, exclude the runtime cache):
   ```bash
   rsync -az --delete --exclude='.next/cache' -e ssh .next/standalone/ deploy@server:/path/to/app/
   ```
6. In Hetzner's Node.js configuration: set the runtime secrets in the env panel, entrypoint
   `server.js`, then restart the app from the panel.
7. First deploy only: add the deployed origin as a CORS origin **with credentials** (covers the
   embedded Studio) + point the revalidate webhook at the live URL; set the Basic-Auth env if this
   is a gated staging site.

## Scope Guidance

- Content/schema/GROQ changes are **sanity**; runtime UI is **frontend**. This skill is only the
  build-and-ship path plus its environment quirks.
- Env variable **contracts** (what each var is) live in `env.ts` and are summarized in
  [docs/deployment.md](../../../docs/deployment.md); keep both in sync via **docs-maintenance** if
  they change.
- The Basic-Auth behavior itself is documented in [docs/features/basic-auth.md](../../../docs/features/basic-auth.md).

## Non-Goals

- Not the local dev workflow (that is just `npm run dev`; see GETTING-STARTED).
- Not Vercel/other-PaaS deployment (this skill targets Hetzner managed Node.js hosting via `output: "standalone"`).
- Not provisioning the hosting itself (Node.js panel setup steps beyond the entrypoint/env/quirk notes here belong to Hetzner's own docs).

## Done Criteria

- `.next/standalone/` contains `server.js`, `.next/static`, and `public/`, and boots locally.
- Runtime secrets set in the Hetzner Node.js env panel; `NEXT_PUBLIC_*` were correct at build time.
- Node.js panel entrypoint is `server.js`, enabled only on hosting dedicated to this app.
- Deployed site serves assets (no unstyled page); embedded Studio logs in on the deployed domain.
- Sanity CORS (incl. the deployed origin, credentials on) + revalidate webhook point at the deployed
  HTTPS URL (content updates invalidate; Studio + preview work).

## Reference Files

- [docs/deployment.md](../../../docs/deployment.md) — full walkthrough: build, asset copy, rsync,
  Hetzner Node.js panel run + entrypoint quirk, env-var tables, Sanity CORS/Studio/webhook wiring,
  caveats.
- `next.config.ts` — set `output: "standalone"`; build-time `redirects()` fetch from Sanity.
- `env.ts` — the authoritative env-var contract (which are client/build vs server/runtime).
- [docs/features/basic-auth.md](../../../docs/features/basic-auth.md) — the staging gate.
