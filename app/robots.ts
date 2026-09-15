import type { MetadataRoute } from "next";
import { env } from "~/env";
import { SANITY_STUDIO_APP_BASE_PATH } from "~/sanity/constants";

/**
 * In robots.txt, each `Disallow` value is a path **prefix** (it blocks that URL and everything under
 * it, e.g. `/studio/structure`).
 */
function pathPrefixForRobotsDisallow(path: string): string {
  return `${path.replace(/\/$/, "")}/`;
}

/** Public Studio URL from env + internal App Router mount (both can appear; proxy redirects the latter). */
function studioPathPrefixesForRobots(): string[] {
  const fromEnv = pathPrefixForRobotsDisallow(env.NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH);
  const fromAppRouter = pathPrefixForRobotsDisallow(SANITY_STUDIO_APP_BASE_PATH);
  return fromEnv === fromAppRouter ? [fromEnv] : [fromEnv, fromAppRouter];
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/", "/_next/", ...studioPathPrefixesForRobots()],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_URL}/sitemap.xml`,
  };
}
