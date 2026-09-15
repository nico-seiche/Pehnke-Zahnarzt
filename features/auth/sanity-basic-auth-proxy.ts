/**
 * Sanity query for HTTP Basic Auth toggles (Next.js `proxy.ts`).
 * Credentials come from BASIC_AUTH_USERNAME / BASIC_AUTH_PASSWORD (see `~/env`).
 * Does not import `~/features/sanity/client` (server-only).
 *
 * **Strategy**: live Sanity API (`api.sanity.io`), short per-instance hot cache.
 *
 * `fetch` cache options (`cache`, `next.revalidate`, `next.tags`) have **no effect in
 * Proxy** (see the Next.js proxy guide), so neither the Next.js data cache nor the
 * `/api/revalidate` webhook can cache or bust this read. The layers that do apply:
 *
 * - Live Sanity API (`api.sanity.io`): always fresh. The API CDN (`apicdn.sanity.io`)
 *   is deliberately not used: its publish invalidation misses cached entries whose
 *   result set did not yet contain the published document (a page flipping
 *   `passwordProtected` on goes from non-matching to matching the query filter), so
 *   entries were observed serving 20+ minute stale state after a publish, leaving a
 *   newly protected page public. A security gate cannot ride on that.
 * - Per-instance hot cache (5 min, bounded stale-while-revalidate): serves repeat
 *   requests from memory. Past the TTL, the last-known state is served while a single
 *   background refresh lands, so warm traffic never blocks on Sanity and a transient
 *   Sanity error degrades to last-known state instead of the fail-open catch in
 *   `proxy.ts`. Stale serving is capped at TTL + grace; a long-idle instance must
 *   block for a fresh read rather than serve arbitrarily old auth state.
 * - In-flight dedupe: concurrent requests on a cold instance await one shared fetch,
 *   with a timeout so a hung fetch cannot wedge every request behind it.
 *
 * `perspective=published` is pinned explicitly: toggling a switch in the Studio only
 * writes a draft, and drafts must never flip auth on the live site. Changes take
 * effect on **Publish**, within roughly five minutes (TTL + grace is the ceiling).
 */

import { run } from "~/features/utils/common";
import { normalizePathname } from "~/features/utils/pathname";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";

type BasicAuthPayload = {
  basicAuth: {
    siteWideEnabled?: boolean | null;
  } | null;
  protectedPaths: string[] | null;
};

/**
 * Request-facing shape: paths are pre-normalized into a Set once per fetch, so the
 * per-request check in `proxy.ts` is a single O(1) `has()` regardless of how many
 * protected pages the site has.
 */
export type BasicAuthState = {
  siteWideEnabled: boolean;
  protectedPathSet: ReadonlySet<string>;
};

function toBasicAuthState(payload: BasicAuthPayload): BasicAuthState {
  return {
    siteWideEnabled: payload.basicAuth?.siteWideEnabled === true,
    protectedPathSet: new Set((payload.protectedPaths ?? []).map(normalizePathname)),
  };
}

const SANITY_BASIC_AUTH_STATE_QUERY = `{
  "basicAuth": *[_type == "${SANITY_SINGLETON_SITE_ID}"][0].basicAuth{
    siteWideEnabled
  },
  "protectedPaths": *[passwordProtected == true && defined(uri.current)].uri.current
}`;

/**
 * Per-instance hot cache TTL. There is no cross-instance invalidation path into the
 * proxy (no shared memory, no data cache), so TTL + grace caps how long a toggle
 * change can take to reach every instance after publish.
 */
const HOT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * How long past the TTL the last-known state may still be served while a refresh runs.
 * Bounds worst-case staleness; it only needs to cover one refresh round-trip.
 */
const STALE_GRACE_MS = 60 * 1000;

/** A hung fetch would wedge `inflight`, and with it every request past the TTL. */
const FETCH_TIMEOUT_MS = 5 * 1000;

let hot: { value: BasicAuthState; freshUntil: number; staleUntil: number } | null = null;
let inflight: Promise<BasicAuthState> | null = null;

async function sanityFetchJson<T>(query: string): Promise<T> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
  const token = process.env.SANITY_API_VIEW_TOKEN;

  if (!projectId || !dataset || !apiVersion || !token) {
    throw new Error("Missing Sanity environment for proxy");
  }

  // Live API endpoint on purpose: apicdn publish invalidation is unreliable for this
  // query (see the strategy note above), and the hot cache already caps request volume.
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

export async function getSanityBasicAuthState(): Promise<BasicAuthState> {
  const now = Date.now();

  if (hot && now < hot.freshUntil) {
    return hot.value;
  }

  if (!inflight) {
    const refresh = run(async () => {
      try {
        const payload = await sanityFetchJson<BasicAuthPayload>(SANITY_BASIC_AUTH_STATE_QUERY);
        const value = toBasicAuthState(payload);

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
  // state and let the refresh land in the background. Past it, fall through and block
  // like a cold start; auth state older than TTL + grace must not gate requests.
  if (hot && now < hot.staleUntil) {
    return hot.value;
  }

  return inflight;
}
