import type { NextConfig } from "next";
import { env } from "./env";
import { SANITY_SINGLETON_SITE_ID, SANITY_STUDIO_APP_SEGMENT } from "./sanity/constants";

const SANITY_REDIRECTS_QUERY = `*[_type == "${SANITY_SINGLETON_SITE_ID}"][0].redirects[defined(coalesce(from, @->from)) && defined(coalesce(to, @->to))]{
  "from": coalesce(from, @->from),
  "to": coalesce(to, @->to),
  "statusCode": coalesce(statusCode, @->statusCode, 301)
}`;

async function fetchSanityRedirects() {
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET;
  const apiVersion = env.NEXT_PUBLIC_SANITY_API_VERSION;
  const token = env.SANITY_API_VIEW_TOKEN;

  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set("query", SANITY_REDIRECTS_QUERY);

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Sanity redirects fetch failed: ${res.status}`);
  }

  const body = await res.json();
  return body.result;
}

function publicStudioBaseForRewrites(): string {
  const t = env.NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH.replace(/\/$/, "");
  return t || "/studio";
}

const nextConfig: NextConfig = {
  // https://reactjs.org/docs/strict-mode.html
  reactStrictMode: true,

  // Add support for custom build dirs.
  // This env variable is supposed to be set by the build process.
  // Do not set it manually in the .env file.
  distDir: process.env.DIST_DIR || ".next",

  experimental: {
    globalNotFound: true,
  },

  reactCompiler: true,

  /**
   * Map the public Studio path (`env`) to `app/${SANITY_STUDIO_APP_SEGMENT}/...` so the public path stays env-driven.
   */
  async rewrites() {
    const publicBase = publicStudioBaseForRewrites();
    return {
      beforeFiles: [{ source: `${publicBase}/:path*`, destination: `/${SANITY_STUDIO_APP_SEGMENT}/:path*` }],
    };
  },

  // Redirects are only fetched at build time.
  async redirects() {
    try {
      const redirects = await fetchSanityRedirects();

      if (!redirects) {
        return [];
      }

      return redirects.map((redirect: { from: string; to: string; statusCode?: number }) => ({
        source: redirect.from,
        destination: redirect.to,
        permanent: redirect.statusCode === 301,
      }));
    } catch (error) {
      console.error("Failed to fetch redirects from Sanity:", error);
      return [];
    }
  },

  // Add support for SVG files.
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: "preset-default",
                    params: {
                      overrides: {
                        cleanupIds: false,
                        removeViewBox: false,
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
