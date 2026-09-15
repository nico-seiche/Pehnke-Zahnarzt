import { NextResponse } from "next/server";
import { stegaClean } from "next-sanity";
import { LlmsTxtServeQuery } from "~/features/agents/query";
import { sanityFetch } from "~/features/sanity/client";
import { SANITY_SINGLETON_SITE_ID } from "~/sanity/constants";
import type { LlmsTxtServeQueryResult } from "~/sanity/types";

/**
 * Serves the published `llms.content` field at `/llms.txt` (see llmstxt.org).
 *
 * `live: false` forces the published perspective so editor draft cookies never leak unpublished
 * content here. Tagging the fetch with the `site` type lets the revalidate webhook bust it on publish
 * (see `app/api/revalidate/route.ts`). Returns 404 when the file is disabled or empty.
 */
export async function GET() {
  const data = await sanityFetch<LlmsTxtServeQueryResult>({
    query: LlmsTxtServeQuery,
    live: false,
    options: { next: { revalidate: 3600, tags: [SANITY_SINGLETON_SITE_ID] } },
  });

  const isEnabled = data?.enabled !== false;
  const content = typeof data?.content === "string" ? stegaClean(data.content).trim() : "";

  if (!isEnabled || !content) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(`${content}\n`, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
