import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/draft-mode/disable?redirectTo=/path
 * Disables draft mode and redirects to redirectTo (or /).
 * Used by Studio "Open live page" action.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const base = new URL(request.url).origin;
  const target = redirectTo.startsWith("/") ? new URL(redirectTo, base) : new URL("/", base);

  const store = await draftMode();
  await store.disable();

  return NextResponse.redirect(target);
}
