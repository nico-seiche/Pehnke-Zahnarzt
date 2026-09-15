# Basic Authentication

HTTP Basic Auth uses **one username and password from the deployment environment** (`BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD` in `~/env`). Sanity only stores **toggles**:

1. **Site → Security** — **Protect entire site** gates every public page (except Studio, APIs, and static assets).
2. **Per page or article** — When the site is **not** fully protected, **Password protect** on that document gates its URL only. The same env credentials apply to site-wide and per-URL protection.

## How it works

1. Set `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` in your deployment environment (and locally in `.env` when testing).
2. **Site-wide:** **Site** → **Security** → **HTTP Basic Auth** → enable **Protect entire site**.
3. **Per URL:** Leave **Protect entire site** off. On a **Page** or **Article**, turn on **Password protect**.
4. At runtime, `proxy.ts` reads the **published** toggles via `getSanityBasicAuthState()` (see **Proxy runs often; Sanity calls do not** below). Toggling a switch in the Studio only writes a **draft**; the change takes effect on **Publish**, and reaches the live site within about five minutes.

If Basic Auth is enabled in the CMS but env credentials are missing, the proxy responds with **503** and a short message so you can fix deployment config.

Draft Mode (preview) bypasses Basic Auth so editors can use **Draft Mode** / Visual Editing without entering credentials on every request.

The proxy also handles **agent Markdown content negotiation** (see [Agent Markdown](./agent-markdown.md)). That branch runs before the Basic Auth gate but defers to it: a request that prefers `text/markdown` is only rewritten to the Markdown route when the site is **not** site-wide protected and the path is **not** password protected, so protected content is never served as Markdown. It uses its own cached eligibility read (`features/agents/markdown-proxy-state.ts`), separate from the auth state below, and fires only for agent requests.

## Proxy runs often; Sanity calls do not

In Next.js, **`proxy.ts` runs once per incoming request** that matches the [`matcher`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher) (minus paths we skip in code: Studio, `/api/*`, `/_next/*`, favicon, RSC prefetches, etc.). That is expected: each run is cheap (pathname checks and auth logic).

**Important limitation:** `fetch` cache options (`cache`, `next.revalidate`, `next.tags`) have **no effect inside Proxy** ([Next.js proxy guide](https://nextjs.org/docs/app/getting-started/proxy)). The Next.js data cache and the `/api/revalidate` webhook therefore play no role here; the proxy queries the live Sanity API and a short in-memory cache caps the request volume.

The proxy uses these layers to avoid hitting Sanity on most requests:

1. **Authenticated requests skip Sanity entirely.** Once a user passes the 401 challenge, the browser sends the `Authorization` header on every subsequent request. The proxy validates that header against env credentials first; if it matches, the request passes through without ever reading Sanity.
2. **Live Sanity API (no shared cache).** The auth-state query goes to `api.sanity.io`, deliberately not the API CDN. The CDN's publish-driven invalidation misses cached entries whose result set did not yet contain the published document (exactly what happens when a page turns **Password protect** on: it goes from non-matching to matching the query filter), and stale entries were observed serving pre-publish state for 20+ minutes, leaving a newly protected page public. The live API is always fresh; the hot cache below keeps the request volume negligible.
3. **Per-instance hot cache (5 minutes, bounded stale-while-revalidate).** Serves repeat requests from memory within a single function instance, so each instance queries Sanity at most about once per five minutes. Past the TTL, the last-known state is served while a single background refresh lands, so warm traffic never waits on Sanity and a transient Sanity error degrades to last-known state instead of failing open. Stale serving is capped at TTL + 60 seconds of grace; a long-idle instance blocks for a fresh read instead of serving old auth state. TTL + grace is the propagation ceiling: a published toggle change reaches every instance within roughly five minutes.
4. **In-flight deduplication.** If many requests land at once on a cold instance, they await a single shared fetch (with a 5-second timeout so a hung fetch cannot wedge them) instead of each issuing their own query.

The query is pinned to `perspective=published`, so unpublished draft changes can never flip auth on the live site.

## Static Generation (ISR) and Proxy

Proxy runs before a response is returned. It does **not** set `dynamic = "force-dynamic"` on your routes and does **not** opt out of **ISR** or `generateStaticParams`. Pages remain statically generated; `proxy.ts` only adds an authentication gate for matching requests. (In Next.js 16, Proxy uses the **Node.js** runtime by default.)

## Excluded From Basic Auth

- Sanity Studio at the public path from `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` (see [Studio public URL and rewrites](../sanity/studio-and-structure.md#public-url-rewrites-and-reserved-paths))
- API routes under `/api/*` (for example `/api/revalidate` and `/api/draft-mode/*`)
- Next.js internals under `/_next/*` (including `/_next/data`)
- Static assets (paths that look like files with extensions)
- Requests that include the Draft Mode `__prerender_bypass` cookie
- RSC prefetches and Next.js router prefetches (these are follow-ups to a page request that already passed auth)

## Sitemap

URLs with **Password protect** (HTTP Basic Auth) on **page** / **article** entries are **omitted** from the generated sitemap (alongside `noIndex`) via the GROQ filter in `app/sitemap.ts` (`passwordProtected != true`). Site-wide Basic Auth does not by itself remove URLs from the sitemap; use `noIndex` or per-entry flags as needed for SEO.

## Implementation reference

| Concern | Location |
| --- | --- |
| Next.js Proxy | [`proxy.ts`](../../proxy.ts) — `matcher` (with prefetch/RSC skip), Studio/API/static exclusions, Draft Mode bypass (`__prerender_bypass`), early exit on valid `Authorization` header, calls `getSanityBasicAuthState()` |
| Sanity toggles + cache | [`features/auth/sanity-basic-auth-proxy.ts`](../../features/auth/sanity-basic-auth-proxy.ts) — direct GROQ HTTP request to the live Sanity API (`api.sanity.io`, `perspective=published`), uses `SANITY_API_VIEW_TOKEN`, 5-minute stale-while-revalidate hot cache + in-flight dedupe |
| Environment | [`env.ts`](../../env.ts) — `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD` |
| CMS fields | **Site** → `basicAuth.siteWideEnabled`; **Page** / **Article** → `passwordProtected` + `uri` |

### GROQ query used by the proxy

Published documents only (the request pins `perspective=published`, so drafts are not visible):

```groq
{
  "basicAuth": *[_type == "site"][0].basicAuth{
    siteWideEnabled
  },
  "protectedPaths": *[passwordProtected == true && defined(uri.current)].uri.current
}
```

(`_type == "site"` matches `SANITY_SINGLETON_SITE_ID` in code.)

## Related repositories

The **blink** and **WASL** starters and **Aspen Search** mirror this stack: root `proxy.ts`, `features/auth/sanity-basic-auth-proxy.ts`, the same env variables, and the same Site / per-entry CMS toggles. When you change Basic Auth behavior in one repository, align the others so staging and per-URL gates stay consistent.

## Where this is documented in the repo

- Root **[`README.md`](../../README.md)** — listed under **Features**, optional env subsection, and **Docs**
- **[`docs/README.md`](../README.md)** — **Security and access**, Common tasks, Feature docs
- **[`AGENTS.md`](../../AGENTS.md)** — **Project structure** (`proxy.ts`, `features/auth/sanity-basic-auth-proxy.ts`)
- **[`features/auth/sanity-basic-auth-proxy.ts`](../../features/auth/sanity-basic-auth-proxy.ts)** — GROQ fetch (live Sanity API, published perspective), 5-minute SWR hot cache, in-flight dedupe
- **[`docs/sanity/schema-and-content-model.md`](../sanity/schema-and-content-model.md)** — `site.basicAuth`, `passwordProtected` on routable documents
- **[`docs/sanity/project-setup.md`](../sanity/project-setup.md)** — wizard does not set `BASIC_AUTH_*` (add manually if needed)
