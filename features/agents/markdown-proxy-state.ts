// Agent-Markdown eligibility for `proxy.ts`. Mirrors `~/features/auth/sanity-basic-auth-proxy`
// (live Sanity API + 5 min hot cache with bounded stale-while-revalidate + in-flight dedupe;
// fetch cache options have no effect in Proxy, and apicdn publish invalidation proved
// unreliable for docs that newly start matching the filter; see the strategy note in that
// file). Only called for agent requests.

import { run } from "~/features/utils/common";
import { normalizePathname } from "~/features/utils/pathname";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";

// Under `/api` so it sits outside the public `(web)` catch-all and gets its own CDN cache entry.
export const AGENT_MARKDOWN_INTERNAL_BASE_PATH = "/api/agent-markdown";

type AgentMarkdownRoute = { uri?: string | null; excluded?: boolean | null };

type AgentMarkdownPayload = {
  siteWideBasicAuth?: boolean | null;
  routes: AgentMarkdownRoute[] | null;
};

/** Request-facing shape: paths pre-normalized into a Set once per fetch (O(1) per request). */
export type AgentMarkdownState = {
  siteWideBasicAuth: boolean;
  excludedPathSet: ReadonlySet<string>;
};

function toAgentMarkdownState(payload: AgentMarkdownPayload): AgentMarkdownState {
  const excludedPaths = (payload.routes ?? [])
    .filter((route): route is { uri: string; excluded: true } => route.excluded === true && typeof route.uri === "string")
    .map((route) => normalizePathname(route.uri));

  return {
    siteWideBasicAuth: payload.siteWideBasicAuth === true,
    excludedPathSet: new Set(excludedPaths),
  };
}

// A path is excluded from Markdown (agents get HTML) when it is noindex, password-protected, has the
// per-page toggle off, or has no stored Markdown yet (the content check keeps this a pure consume model:
// an ungenerated page is not advertised, so the serve route never 404s an agent).
//
// Project the exclusion flag over the STABLE result set `*[defined(uri.current)]` (every routed doc) and
// reduce to the excluded Set above; do NOT filter `*[...predicate...]`. A filtered set changes membership
// when a page is first generated, and even the live API misses that transition (stays stale for minutes),
// which would keep freshly-generated pages HTML-only. See the proxy-fetch-cache strategy note.
const SANITY_AGENT_MARKDOWN_STATE_QUERY = `{
  "siteWideBasicAuth": *[_type == "${SANITY_SINGLETON_SITE_ID}"][0].basicAuth.siteWideEnabled,
  "routes": *[defined(uri.current)]{
    "uri": uri.current,
    "excluded": seoMetadata.noIndex == true
      || passwordProtected == true
      || agentMarkdown.enabled == false
      || !defined(agentMarkdown.content)
      || agentMarkdown.content == ""
  }
}`;

const HOT_CACHE_TTL_MS = 5 * 60 * 1000;
const STALE_GRACE_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 5 * 1000;

let hot: { value: AgentMarkdownState; freshUntil: number; staleUntil: number } | null = null;
let inflight: Promise<AgentMarkdownState> | null = null;

async function sanityFetchJson<T>(query: string): Promise<T> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
  const token = process.env.SANITY_API_VIEW_TOKEN;

  if (!projectId || !dataset || !apiVersion || !token) {
    throw new Error("Missing Sanity environment for proxy");
  }

  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set("query", query);
  url.searchParams.set("perspective", "published");
  url.searchParams.set("returnQuery", "false");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Sanity proxy fetch failed: ${res.status}`);
  }

  const body = (await res.json()) as { result: T };
  return body.result;
}

export async function getAgentMarkdownState(): Promise<AgentMarkdownState> {
  const now = Date.now();

  if (hot && now < hot.freshUntil) {
    return hot.value;
  }

  if (!inflight) {
    const refresh = run(async () => {
      try {
        const payload = await sanityFetchJson<AgentMarkdownPayload>(SANITY_AGENT_MARKDOWN_STATE_QUERY);
        const value = toAgentMarkdownState(payload);

        hot = { value, freshUntil: Date.now() + HOT_CACHE_TTL_MS, staleUntil: Date.now() + HOT_CACHE_TTL_MS + STALE_GRACE_MS };

        return value;
      } finally {
        inflight = null;
      }
    });

    // Stale-serving callers below never await this promise; without a handler here a
    // failed background refresh becomes an unhandled rejection.
    refresh.catch(() => {});
    inflight = refresh;
  }

  // Bounded stale-while-revalidate: within the grace window, serve the last-known
  // state and let the refresh land in the background. Past it, block like a cold start.
  if (hot && now < hot.staleUntil) {
    return hot.value;
  }

  return inflight;
}
