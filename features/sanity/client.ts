import "server-only";

/**
 * ARCHITECTURAL NOTE:
 *
 * 1. `useCdn`:
 *    - **Development**: `true`. We use the CDN to avoid burning expensive API calls during local development.
 *    - **Production**: `false`. We bypass the CDN to ensure immediate consistency.
 *      We rely entirely on the Next.js Data Cache for performance.
 *
 * 2. `sanityFetch` wrapper:
 *    - Integrates with Next.js Data Cache using `cache: 'force-cache'` by default.
 *    - Supports "Live Content" (Draft Mode) automatically.
 *
 * 3. Invalidation Strategy:
 *    - We use On-Demand Revalidation via Webhooks (api/revalidate).
 *    - When content changes, the webhook triggers, and Next.js purges the specific cache tags.
 *    - Since `useCdn` is false in production, the subsequent fetch hits the live API, guaranteeing fresh data immediately.
 */

import { draftMode } from "next/headers";
import { createClient } from "next-sanity";
import { defineLive } from "next-sanity/live";
import { env } from "~/env";

export const sanityClient = createClient({
  token: env.SANITY_API_VIEW_TOKEN,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
  useCdn: process.env.NODE_ENV === "development",
  stega: {
    enabled: false,
    studioUrl: env.NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH,
  },
});

const { sanityFetch: sanityLiveFetch, SanityLive } = defineLive({
  client: sanityClient,
  serverToken: env.SANITY_API_VIEW_TOKEN,
  browserToken: env.SANITY_API_VIEW_TOKEN,
});

export { SanityLive };

/**
 * Fetch data from the Sanity API.
 * @param query The GROQ query to fetch.
 * @param params The query parameters.
 * @param live Whether to use the live fetch. Defaults to true in Draft Mode.
 * @param options Request options (cache, tags, etc). Defaults to `cache: "force-cache"`,
 */
export async function sanityFetch<Res = Record<string, unknown>>(props: {
  query: string;
  params?: Record<string, unknown>;
  live?: boolean;
  options?: RequestInit;
}) {
  const { query, params = {}, live = (await draftMode()).isEnabled, options = {} } = props;

  if (live) {
    const { data } = await sanityLiveFetch({ query, params, stega: true });
    return data as Res;
  }

  return sanityClient.fetch<Res>(query, params, {
    perspective: "published",
    cache: options.cache ?? "force-cache",
    next: {
      ...(options.next ?? {}),
      tags: options.next?.tags ?? [],
    },
  });
}
