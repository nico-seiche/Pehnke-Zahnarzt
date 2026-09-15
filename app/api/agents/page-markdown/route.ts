import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { env } from "~/env";
import { type AgentMarkdownPage, pageToMarkdown } from "~/features/agents/markdown";
import { AgentMarkdownContentQuery } from "~/features/agents/query";
import { isApiAuthorized, unauthorizedResponse } from "~/features/api/auth";
import type { AgentMarkdownContentQueryResult } from "~/sanity/types";

export const runtime = "nodejs";

const sanityEditClient = createClient({
  token: env.SANITY_API_EDIT_TOKEN,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
  useCdn: false,
});

export async function POST(req: NextRequest) {
  if (!isApiAuthorized(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json().catch(() => ({}) as Record<string, unknown>);
    const uri = typeof body?.uri === "string" ? body.uri.trim() : "";

    if (!uri) {
      return NextResponse.json({ error: "Missing page URL. Save this page's URL, then try again." }, { status: 400 });
    }

    // No eligibility gate: generation is allowed even when serving is off or the page is noindex.
    const page = await sanityEditClient
      .withConfig({ perspective: "drafts" })
      .fetch<AgentMarkdownContentQueryResult>(AgentMarkdownContentQuery, { uri });

    if (!page) {
      return NextResponse.json({ error: "No page found at this URL." }, { status: 404 });
    }

    const baseUrl = env.NEXT_PUBLIC_URL.replace(/\/$/, "");
    const text = pageToMarkdown(page as AgentMarkdownPage, baseUrl).trim();

    if (!text) {
      return NextResponse.json({ error: "This page has no content to serialize yet." }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
