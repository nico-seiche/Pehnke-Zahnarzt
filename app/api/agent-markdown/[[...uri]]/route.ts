import { NextResponse } from "next/server";
import { stegaClean } from "next-sanity";
import { AgentMarkdownServeQuery } from "~/features/agents/query";
import { sanityFetch } from "~/features/sanity/client";
import type { AgentMarkdownServeQueryResult } from "~/sanity/types";

// Serves the stored `agentMarkdown.content` for a routed document; `proxy.ts` rewrites eligible
// `Accept: text/markdown` requests here. Tagged by URI so `/api/revalidate` busts it on publish.
export async function GET(_req: Request, { params }: { params: Promise<{ uri?: string[] }> }) {
  const { uri: segments } = await params;
  const uri = segments && segments.length > 0 ? `/${segments.join("/")}` : "/";

  const data = await sanityFetch<AgentMarkdownServeQueryResult>({
    query: AgentMarkdownServeQuery,
    params: { uri },
    live: false,
    options: { next: { tags: [uri] } },
  });

  const isEnabled = data?.enabled !== false;
  const content = typeof data?.content === "string" ? stegaClean(data.content).trim() : "";

  if (!isEnabled || !content) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(`${content}\n`, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
      vary: "Accept",
    },
  });
}
