# llms.txt and AI agents

The site serves an [`/llms.txt`](https://llmstxt.org) file: a concise, curated Markdown map of the site that helps large language models use it at inference time (when a context window cannot hold the whole site). The file lives in Sanity, so editors own it, and it can be drafted in one click with Sanity AI (Agent Actions) from the site's own content.

- **Edit it:** Studio, **Site** document, **Agents** tab.
- **Generate it:** the **Generate** button in the **llms.txt** object (Sanity AI).
- **Serve it:** published content is served at `/llms.txt` as `text/plain`.

For the reusable pattern behind the Generate button (how to add more AI-generated fields), see [Agent Actions (Sanity AI generation)](../sanity/agent-actions.md).

## How it works

```
Studio (Site -> Agents)                 App Router
┌───────────────────────────┐           ┌──────────────────────────────┐
│ llms.txt field            │  POST     │ /api/agents/llms-txt          │
│  └ "Generate" button ─────┼──────────▶│  1. read indexable pages      │
│                           │           │     (edit token, drafts)      │
│  (review the draft,       │◀──────────┤  2. client.agent.action       │
│   then Publish)           │  { text } │       .prompt() -> markdown   │
└───────────┬───────────────┘           └──────────────────────────────┘
            │ publish
            ▼
   published llms.content    ──────────▶  GET /llms.txt (text/plain)
```

1. An editor opens **Site -> Agents** and clicks **Generate**.
2. `LlmsTxtInput` POSTs to `/api/agents/llms-txt`.
3. The route reads the site's indexable pages and articles, then asks **Sanity Agent Actions** (`client.agent.action.prompt`) to draft a spec-compliant llms.txt.
4. The draft is written into the field. Nothing is served yet: the editor reviews and edits the Markdown like any other field.
5. On **Publish**, `/llms.txt` serves the published value.

The split is deliberate. Generation reads current content (drafts overlaid) so it reflects work in progress, while serving only ever returns the published field, so a draft is never exposed at `/llms.txt`.

## Editing in the Studio

**Site -> Agents** is a tab that holds one object per AI surface, so it stays scalable (more such as `agents.txt` or MCP can be added beside it later). Today it has one object, `llms` (for llms.txt), with three fields:

| Field | Type | Purpose |
| --- | --- | --- |
| **Serve /llms.txt** (`enabled`) | boolean | Gates serving. On by default. Turn it off to return 404 at `/llms.txt` without deleting the content. |
| **Generation guidance** (`guidance`) | text | Optional steer for the AI: tone, audience, what to emphasize or leave out. Persisted, so it is reused on every Generate even if the button does not pass one. |
| **Content** (`content`) | text | The Markdown served at `/llms.txt`. Holds the **Generate** button (custom input `LlmsTxtInput`). |

You can also write or paste the file by hand. The button is a convenience, not a requirement.

Clicking **Generate** when the field already has content opens a Sanity confirmation dialog before replacing it (no native browser prompt). Success and failure surface as Sanity toasts.

## Generating with Sanity AI

The **Generate** button calls `/api/agents/llms-txt`, which:

1. **Reads the inventory.** `LlmsTxtInventoryQuery` (`features/agents/query.ts`) returns the site name, the site SEO description (used as the summary), the stored generation guidance, and every indexable page and article. "Indexable" uses the same rules as the sitemap: has a URI, `seoMetadata.noIndex != true`, and `passwordProtected != true`. The fetch runs with an edit token under the `drafts` perspective, so unpublished edits are reflected.
2. **Builds grounded inputs.** Each entry becomes `{ type, title, url, description, publishedAt, categories }` with an absolute URL built from `NEXT_PUBLIC_URL`. URLs are constructed in code, never by the model, so they cannot be hallucinated. Pages that need no title (the homepage and other index/singleton pages) get a route-derived label (`/` becomes `Index`, `/works` becomes `Works`) instead of "Untitled", and entries are de-duplicated by URL, so an alternate route that resolves to an already-listed page is dropped rather than listed twice.
3. **Prompts the model.** `client.agent.action.prompt()` runs with an instruction that encodes the llmstxt.org structure and rules, plus the inventory as a constant parameter. The action returns the Markdown string; the route strips any stray code fence and returns `{ text }`.
4. The input writes the result with `onChange(set(text))`.

### Conventions the output follows

The instruction mirrors the [llmstxt.org specification](https://llmstxt.org) (Jeremy Howard, September 2024):

- A single `# H1` with the site name. This is the only required section.
- A `>` blockquote summary carrying the key context for the rest of the file.
- A short non-heading detail block (a paragraph and/or an "Important notes:" list) that includes one sentence telling agents every listed page is also available as token-light Markdown via content negotiation (`Accept: text/markdown` on the same URL). See [Agent Markdown](./agent-markdown.md).
- One or more `## H2` sections, each a list of `- [name](url): note` links. Default sections are **Pages** and **Articles**.
- An optional final `## Optional` section for links that can be skipped when a shorter context is needed.
- Only the URLs from the inventory, each used once, copied verbatim.
- An index, not a copy: each link gets at most one descriptive sentence and page bodies are never reproduced (that is what the per-page Markdown is for). Concise language, no jargon, no marketing fluff.

Because it is a draft in a normal field, you stay in control: edit anything, reorder sections, move links under `## Optional`, then publish.

### Prerequisites

- **Sanity AI / Agent Actions** must be available on the project (a paid capability that consumes AI credits). If it is not enabled, Generate returns the error Sanity reports; you can still author the field by hand.
- **`SANITY_API_EDIT_TOKEN`** must be set (it already powers the SEO screenshot route). The route uses it server-side; no new environment variable is introduced.
- At least one indexable page must exist, otherwise the route returns `422` with a clear message.

## Serving `/llms.txt`

`app/llms.txt/route.ts` is a route handler (the file name carries the `.txt` extension, like `robots.ts` and `sitemap.ts`):

- Reads the published `llms.enabled` and `llms.content` via `LlmsTxtServeQuery` with `live: false`, so editor draft cookies cannot leak unpublished content here.
- Returns **404** when serving is disabled (`enabled === false`) or the content is empty.
- Otherwise returns the Markdown as `text/plain; charset=utf-8`.
- The fetch is tagged with the `site` type, so the `/api/revalidate` webhook busts it on publish (see [Revalidation and Caching](../sanity/revalidation-and-caching.md)). Content updates within seconds of publishing, no redeploy required.
- The output is passed through `stegaClean` defensively (a no-op on the published perspective).

### Basic Auth and routing

`/llms.txt` contains a dot, so the `proxy.ts` matcher (which excludes dotted paths) never runs Basic Auth on it. It behaves exactly like `robots.txt` and `sitemap.xml`: reachable even when the site is fully gated. If you want it private, turn **Serve /llms.txt** off.

The static `/llms.txt` route takes precedence over the `app/(web)/[[...uri]]` catch-all, the same way the metadata routes do.

## Manual verification

After deploying (or in local dev with Sanity AI enabled):

1. **Studio:** open **Site -> Agents**, click **Generate**, confirm a draft appears that starts with `# <site name>` and lists your pages with absolute URLs.
2. **Publish** the Site document.
3. **Serve:** `curl -i https://<your-domain>/llms.txt` returns `200` with `content-type: text/plain` and the published Markdown.
4. **Disable:** turn **Serve /llms.txt** off, publish, and confirm `curl -i .../llms.txt` returns `404`.
5. **Revalidation:** edit the field, publish, and confirm the served file updates without a redeploy.

## How llms.txt and per-page Markdown combine

Two layers, the pattern the [Sanity field guide](https://www.sanity.io/blog/how-to-serve-content-to-agents-a-field-guide) recommends:

- **Discovery, llms.txt.** A concise index that links the regular page URLs, so an agent can see what exists and pick what it needs without loading the site. It is a map, not a copy: page bodies never go here. That is what an `llms-full.txt` would be (deliberately not implemented), and the guide warns it bloats the context window for no benefit.
- **Retrieval, per-page Markdown.** When the agent follows one of those links with `Accept: text/markdown`, the same URL returns a token-light Markdown body instead of HTML (see [Agent Markdown](./agent-markdown.md)). On by default, toggleable per page.

The two need no special wiring: llms.txt links the normal HTML URLs (valid per the core spec) and content negotiation serves Markdown on those same URLs. Because the negotiation is transparent, advertising it is optional; the generation instruction still has the model add one short sentence to the llms.txt details section noting the capability, so agents and tools that read the file but do not negotiate automatically still learn it is there.

## Future enhancements (not implemented)

These are deliberately out of scope, noted so the choice is explicit:

- **`llms-full.txt`.** A single file expanding every linked page's full content for tools that want the whole corpus in one fetch.
- **`agents.txt`.** A separate capability-declaration file ([agents-txt.com](https://agents-txt.com)) for payment, auth, and MCP endpoints. It is configuration rather than AI-generated content; the **Agents** tab is the natural home if it is added later.

## Implementation reference

| Concern | Location |
| --- | --- |
| CMS fields (Agents tab) | [`sanity/schemas/documents/site.tsx`](../../sanity/schemas/documents/site.tsx): `agents` group + `llms` object (`enabled`, `guidance`, `content`) |
| Generate button (Studio input) | [`sanity/inputs/llms-txt-input.tsx`](../../sanity/inputs/llms-txt-input.tsx): calls the route, writes via `onChange(set(...))` |
| Endpoint path (config seam) | [`sanity/config.ts`](../../sanity/config.ts): `endpoints.generateLlmsTxt` |
| GROQ queries | [`features/agents/query.ts`](../../features/agents/query.ts): `LlmsTxtServeQuery`, `LlmsTxtInventoryQuery` |
| Generate route (Agent Action) | [`app/api/agents/llms-txt/route.ts`](../../app/api/agents/llms-txt/route.ts): `client.agent.action.prompt()`, auth via `isApiAuthorized` |
| Serve route | [`app/llms.txt/route.ts`](../../app/llms.txt/route.ts): published `text/plain`, `enabled` gate, `site` tag |
| Webhook invalidation | [`app/api/revalidate/route.ts`](../../app/api/revalidate/route.ts): `revalidateTag('site')` |
| Token | [`env.ts`](../../env.ts): `SANITY_API_EDIT_TOKEN` (reused; no new var) |

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| Generate says "No indexable pages found" (`422`) | Every page is noindex, password-protected, or has no URI. Publish at least one indexable page. |
| Generate fails with a Sanity/AI error | Agent Actions are not enabled for the project, or credits are exhausted. Enable Sanity AI, or author the field by hand. |
| `/llms.txt` returns 404 unexpectedly | **Serve /llms.txt** is off, the field is empty, or the Site document was never published. Add content and publish. |
| Served file is stale | Confirm the `/api/revalidate` webhook is configured (see [Revalidation and Caching](../sanity/revalidation-and-caching.md)); it busts the `site` tag on publish. |
| Button does nothing for anonymous requests | The route is guarded by `isApiAuthorized` (Studio same-origin). This is expected; it prevents arbitrary callers from spending AI credits. |
