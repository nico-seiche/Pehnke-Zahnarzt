# Agent Markdown (content negotiation)

Public pages and articles can serve a token-light **Markdown** version of themselves to AI agents, on the **same URL**, through HTTP content negotiation. When an agent fetches a page with an `Accept: text/markdown` header, it gets clean Markdown instead of the full HTML document; a browser asking for `text/html` gets the normal page. Markdown is far cheaper for a model to read (the [Sanity field guide](https://www.sanity.io/blog/how-to-serve-content-to-agents-a-field-guide) measures up to a ~97% token reduction versus rendered HTML), and some agents (for example Claude Code) skip their summarization step entirely when a response is already `text/markdown`.

The Markdown is a **stored, editable field**, not something computed on every request. In the Studio you click **Generate** to draft it from the page builder's current content, review or tweak it, and **Publish**; the frontend then serves that published field verbatim. This mirrors [`/llms.txt`](./llms-txt.md): llms.txt is a curated, site-wide index; agent Markdown is the per-page body an agent reads after following a link. Both are "generate once, store, serve the field" surfaces, grouped under an **Agents** tab.

- **It is on by default** for every routed document (Page, Article), but a page serves Markdown only **after** its `agentMarkdown.content` has been generated and published. Until then, agents get HTML.
- **Generate it per page:** Studio, the document's **Agents** tab, **Generate**. It writes the Markdown into the editable **Content** field.
- **Turn it off per page:** Studio, the document's **Agents** tab, **Serve Markdown to agents** off.
- **It is served at the page's own URL** via the `Accept` header; there is no separate `.md` URL to link.
- **It does not refresh on its own.** Edit the page and the stored Markdown drifts until you click **Generate** again and publish. This is intentional (editorial control), the same as llms.txt.

## How it works

```
Studio (author)                                     Frontend (agent request)
┌─────────────────────────┐                         ┌────────────────────────────┐   ┌───────────────────────────┐
│ Agents tab → Generate   │   proxy.ts (every req)  │ prefersMarkdown(Accept)?   │   │ /api/agent-markdown/about │
│  POST /api/agents/      │  ┌───────────────────┐  │  no  → normal HTML + auth   │   │  read stored              │
│    page-markdown        │  │ GET /about        │─▶│  yes → eligible? (cached)   │   │  agentMarkdown.content    │
│  → pageToMarkdown()     │  │ Accept:           │  │        └ rewrite ───────────┼──▶│  → text/markdown + Vary   │
│  → set() into Content   │  │   text/markdown   │◀─┤                             │   └───────────────────────────┘
│  → author publishes     │  └───────────────────┘  └────────────────────────────┘
└─────────────────────────┘
```

**Generate (author, once per meaningful change).** The **Content** field's input (`sanity/inputs/agent-markdown-input.tsx`) POSTs the page URI to `app/api/agents/page-markdown/route.ts`. That route fetches the page/article by URI under the `drafts` perspective, serializes its page builder with `pageToMarkdown` (deterministic, no AI), and returns the text; the input writes it into `agentMarkdown.content` with `onChange(set(...))`. The author reviews and **publishes**. Nothing is served until publish.

**Serve (agent, per request).**
1. A request arrives. `proxy.ts` calls `prefersMarkdown(Accept)`. Browsers never list `text/markdown`, so this returns `false` immediately and the request follows the existing HTML + Basic Auth path with **zero** added work.
2. For an agent that does prefer Markdown, the proxy reads a small, cached **eligibility** state (`getAgentMarkdownState`) and, if the route is eligible (enabled **and** has stored content), `NextResponse.rewrite()`s the request to the internal Markdown route. The URL the agent sees stays `/about`.
3. `app/api/agent-markdown/[[...uri]]/route.ts` reads the published `agentMarkdown.content` by URI (`AgentMarkdownServeQuery`) and responds `text/markdown; charset=utf-8` with `Vary: Accept`. It never recomputes the Markdown.

### What counts as "prefers Markdown"

`prefersMarkdown` (in `proxy.ts`) serves Markdown only when the client explicitly accepts `text/markdown` (or `text/x-markdown`) **and** ranks it at least as high as `text/html` by q-value. So:

| `Accept` header | Result |
| --- | --- |
| `text/html,application/xhtml+xml,...` (a browser) | HTML |
| `text/markdown` (Claude Code style, no HTML) | Markdown |
| `text/markdown, text/html` | Markdown (listed first / equal) |
| `text/markdown;q=0.5, text/html;q=1.0` | HTML (client prefers HTML) |
| `*/*` (curl, generic clients) | HTML (no explicit Markdown) |

### Eligibility

A route is served as Markdown only when **all** hold (otherwise it falls through to normal HTML):

- The site is **not** behind site-wide HTTP Basic Auth (`site.basicAuth.siteWideEnabled`).
- The page is **not** password protected (`passwordProtected != true`).
- The page is **not** `noIndex` (`seoMetadata.noIndex != true`).
- The per-page switch is on (`agentMarkdown.enabled != false`; **undefined is treated as on**).
- The page **has stored Markdown** (`agentMarkdown.content` is present and non-empty).

The content check is what makes this a pure consume model: until an editor generates and publishes the Markdown, the page is not advertised as Markdown-available, so an agent gets HTML rather than an empty `404` from the serve route. Password-protected and site-wide-gated routes therefore never leak content as Markdown, and a disabled, noindex, or ungenerated page keeps serving HTML to agents (the representation they can still accept).

## Editing in the Studio

Every routed document (**Page**, **Article**) has an **Agents** tab with an **Agent Markdown** object (`createAgentMarkdownField`), beside the **SEO** tab:

- **Serve Markdown to agents**: a switch, on by default. Turn it off to keep that one page HTML-only for agents.
- **Content**: the Markdown served to agents. Click **Generate** above the field to draft it from the page's current content, then edit if you like and **Publish**.

The Site singleton has no per-page object: its site-level equivalent is [`/llms.txt`](./llms-txt.md), configured under the singleton's own **Agents** tab.

> Generation is deterministic. The **Generate** button runs the same `pageToMarkdown` serializer the serve route once ran per request, just materialized into an editable field. No AI is involved, so it is fast and free and never drops or paraphrases content. If you edit the page afterwards, click **Generate** again to refresh the stored Markdown, then publish.

Serving changes propagate within about five minutes of **Publish** (the proxy reads the live Sanity API behind a 5-minute hot cache; see [Caching and revalidation](#caching-and-revalidation)).

## What the Markdown contains

`pageToMarkdown` (`features/agents/markdown.ts`) walks the page builder and emits:

- An `# H1` from the SEO title (falling back to the document title, then a path-derived label, so `/case-studies` becomes "Case Studies").
- For articles, an italic metadata line: author, publish date, categories.
- The SEO description as a lead paragraph.
- One fragment per page-builder section.

Sections are serialized **by convention, not by type**: the query and serializer read the standard field-factory names from each section's `sectionContent`, whichever section it is.

| Field | Becomes |
| --- | --- |
| `headline` | an `##` heading |
| `appRichText` (`createRichTextField`) | Markdown body: headings, paragraphs, **bold**/_italic_/`code`, lists, links, plus `mediaBlock` images |
| `appMedia` (`createMediaField`) | `![alt](url)` for images |
| `caption` | an italic line |
| `appLink` (`createLinkField`) | a Markdown link |

Links are absolutized against `NEXT_PUBLIC_URL`, so a site-relative `/contact` becomes a full URL an agent can follow. The serializer is pure and dependency-free.

### Adding or changing a section

Two layers, tuned in two paired files:

- **Defaults (guaranteed).** Only the page-builder factory fields render by default, because only those names are guaranteed in any project: `appRichText` (`createRichTextField`), `appMedia` (`createMediaField`), and `appLink` (`createLinkField`). Their GROQ aliases live in `FactorySectionContentFragment` (`features/agents/query.ts`) and their renderers (`renderRichText` / `renderMedia` / `renderLink`) in `markdown.ts`.
- **Project extension (extend here).** This template's sections also carry plain `headline` and `caption` fields, which are not factory output, so they live in the PROJECT block: `AgentMarkdownSectionContentFragment` adds the aliases, and the PROJECT renderers (`renderHeadline` / `renderCaption`) plus the `sectionRenderers` order add the rendering.

To support any other field (a custom `quote`, an `images[]` array): add an alias in `AgentMarkdownSectionContentFragment`, add a renderer in the PROJECT block, and slot it into `sectionRenderers`. Sections are read as a loose bag of aliases (via `readString` / `readBlocks` / `readObject`), so there is no type to maintain. The GROQ stays a hand-written static string because typegen cannot resolve a query built from config. The **agent-markdown** skill captures this; **scaffolding-plop** and **sanity** hand off to it when sections change. The block / Portable Text rendering below the renderers is spec-standard and not a tuning point. Non-image media (video, Lottie, Rive) is not serialized today; only its caption carries over.

> Because the Markdown is stored, a section change only reaches agents once an editor **regenerates** each affected page and publishes. New serializer coverage is not retroactive to already-generated pages.

## Caching and revalidation

The feature is built to **never add cost to normal traffic** and to avoid wasted Sanity reads:

1. **Browsers pay nothing.** `prefersMarkdown` rejects non-agent `Accept` headers before any parsing or network call.
2. **Eligibility is cached like Basic Auth.** `features/agents/markdown-proxy-state.ts` mirrors `features/auth/sanity-basic-auth-proxy.ts`: a direct live Sanity API read (`api.sanity.io`, `perspective=published`), a 5-minute per-instance hot cache with bounded stale-while-revalidate, and in-flight deduplication. It is only ever called for agent requests. Fetch cache options have **no effect in Proxy**, so the eligibility read does not use the Next.js data cache or the revalidate webhook; the hot cache TTL caps propagation at about five minutes. The API CDN is deliberately not used, because its publish invalidation misses entries whose result set did not yet contain the published document (see [Basic Auth](./basic-auth.md#proxy-runs-often-sanity-calls-do-not)). For the same reason the query projects the exclusion flag over the **stable** result set `*[defined(uri.current)]` (every routed doc) and reduces to an excluded Set in JS, instead of filtering `*[...predicate...]`: a filtered set changes membership the moment a page is first generated (it gains `agentMarkdown.content`), and even the non-CDN API misses that transition, leaving the page HTML-only for a long time. The stable set busts on any publish and reads fresh.
3. **The content fetch is tag-driven, not timed.** Inside the Markdown route handler (where the data cache does apply), the stored-field fetch (`AgentMarkdownServeQuery`) is tagged with the page URI, so the existing `/api/revalidate` webhook (`revalidateTag(uri)`) refreshes it the instant the document is published, the same mechanism the page route uses. The response is sent with `cache-control: public, max-age=0, must-revalidate` and `Vary: Accept`, so no shared cache serves a stale copy. The proxy rewrites to a **distinct** internal path (`/api/agent-markdown/...`), so the Markdown variant never collides with the HTML at the original URL, and `Vary: Accept` keeps any shared-key cache from serving it to a browser.

### Why the proxy and not `next.config.ts`

Header-based rewrites in `next.config.ts` (`has: [{ type: "header", key: "accept", ... }]`) can match `Accept` at request time, but they **cannot consult the per-page toggle, stored-content presence, or protection state** in Sanity. The proxy can, and it short-circuits browser traffic for free, so the per-page control and the "never serve protected content as Markdown" guarantee live there.

## Manual verification

After deploying (or in local dev):

```bash
# Before generating: an agent gets HTML (the page is not yet advertised as Markdown-available).
curl -s -I -H "Accept: text/markdown" https://<your-domain>/about
#   → content-type: text/html

# In the Studio: /about → Agents tab → Generate → Publish. Then:
curl -s -H "Accept: text/markdown" https://<your-domain>/about
#   → 200, content-type: text/markdown; charset=utf-8, starts with "# ..."

# HTML for a browser (same URL):
curl -s -I https://<your-domain>/about
#   → 200, content-type: text/html

# Turn the switch off (Agents tab) on /about and publish, then:
curl -s -I -H "Accept: text/markdown" https://<your-domain>/about
#   → content-type: text/html  (falls back to HTML, never 404)
```

Also confirm a password-protected or `noIndex` page returns HTML (not Markdown) for an `Accept: text/markdown` request.

## Implementation reference

| Concern | Location |
| --- | --- |
| CMS field (Agents tab) | [`sanity/schemas/fields/create-agent-markdown-field.tsx`](../../sanity/schemas/fields/create-agent-markdown-field.tsx): `agentMarkdown` object (`enabled` switch + `content`) via `createAgentMarkdownField` |
| Generate input (button) | [`sanity/inputs/agent-markdown-input.tsx`](../../sanity/inputs/agent-markdown-input.tsx): POSTs the URI, writes the result with `set()` |
| Generate route | [`app/api/agents/page-markdown/route.ts`](../../app/api/agents/page-markdown/route.ts): deterministic `pageToMarkdown` under the `drafts` perspective |
| Content negotiation | [`proxy.ts`](../../proxy.ts): `prefersMarkdown()` + rewrite to the Markdown route |
| Eligibility cache | [`features/agents/markdown-proxy-state.ts`](../../features/agents/markdown-proxy-state.ts): `getAgentMarkdownState()` (enabled + stored content), route base path |
| Content query | [`features/agents/query.ts`](../../features/agents/query.ts): `AgentMarkdownContentQuery` (generation) and `AgentMarkdownServeQuery` (serving) |
| Serializer | [`features/agents/markdown.ts`](../../features/agents/markdown.ts): `pageToMarkdown()` (pure, section-agnostic) |
| Serve route | [`app/api/agent-markdown/[[...uri]]/route.ts`](../../app/api/agent-markdown/%5B%5B...uri%5D%5D/route.ts): serves the stored field, `text/markdown`, `Vary: Accept` |

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Agent gets HTML, not Markdown | The `Accept` header does not prefer `text/markdown` (it must list it and rank it ≥ `text/html`); or the page is `noIndex`, password protected, behind site-wide Basic Auth, has **Serve Markdown to agents** off, or has **no generated Markdown yet** (open the Agents tab, click **Generate**, publish). |
| Markdown is stale after editing the page | Expected: the stored Markdown does not refresh on its own. Open the Agents tab, click **Generate** again, and publish. |
| A section change is not reflected | Regenerate each affected page (Agents tab → Generate → Publish). Serializer coverage is not retroactive to already-generated pages. |
| Toggle change not reflected | Publish the document (the proxy reads the published perspective; saving a draft has no effect). Then allow about five minutes for the proxy's hot cache to roll over. |
| Direct hit to `/api/agent-markdown/...` returns Markdown in a browser | Expected: that is the internal route and the content is public. The user-facing URL stays the page URL via the rewrite. |
| Generated Markdown body is empty | The page has no page-builder sections, or every section is empty. Only the `# H1` (and description) render, and the Generate route returns `422` so nothing is stored. |
