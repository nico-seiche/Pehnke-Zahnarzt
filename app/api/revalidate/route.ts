import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { z } from "zod";
import { env } from "~/env";

const WebhookSchema = z.object({
  _id: z.string().min(1),
  _type: z.string().min(1),
  uri: z.string().min(1).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    if (!env.SANITY_REVALIDATE_SECRET) {
      return new Response("Missing environment variable SANITY_REVALIDATE_SECRET", { status: 500 });
    }

    const { isValidSignature, body } = await parseBody<unknown>(req, env.SANITY_REVALIDATE_SECRET, true);

    if (!isValidSignature) {
      return new Response(JSON.stringify({ message: "Invalid signature", body }), {
        status: 401,
      });
    }

    const parsed = WebhookSchema.safeParse(body ?? {});

    if (!parsed.success) {
      return new Response(JSON.stringify({ message: "Bad Request", body }), { status: 400 });
    }

    const { _id, _type, uri } = parsed.data;

    // Remove 'drafts.' prefix if present
    const docId = _id.replace("drafts.", "");

    // Generate tags: revalidate by URI (if exists), document type, and document ID.
    // Note: this does NOT reach the proxy's Basic Auth / agent-Markdown state reads;
    // fetch cache options have no effect in Proxy, so those read the live Sanity API behind a
    // short stale-while-revalidate hot cache (see `features/auth/sanity-basic-auth-proxy.ts`).
    const tags: string[] = [_type, `doc:${docId}`];

    if (uri) {
      tags.push(uri);
    }

    tags.forEach((tag) => {
      revalidateTag(tag, "max");
    });

    return NextResponse.json({ body: parsed.data, tags });
  } catch (err) {
    console.error(err);
    return new Response((err as Error).message, { status: 500 });
  }
}
