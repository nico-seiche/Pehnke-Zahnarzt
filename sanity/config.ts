/**
 * Configuration seam for the Sanity folder.
 *
 * This is the single place the Sanity schema, structure, actions, and inputs read runtime
 * configuration. It is intentionally self-contained so the folder can be lifted into another
 * project (Vite, Remix, plain `sanity dev`) by editing only this file.
 *
 * In this repository the values come from Next.js public env vars (`NEXT_PUBLIC_*`), which Next
 * inlines into the bundle at build time. To port the folder to a non-Next host, change the right
 * side of each field to however that host exposes configuration (for example
 * `import.meta.env.SANITY_STUDIO_*` under the Sanity CLI or Vite).
 *
 * Keep this module dependency-free (read `process.env` only) so nothing outside `sanity/` leaks in.
 */

function requireConfig(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`[sanity/config] Missing required configuration "${name}". Set it or edit sanity/config.ts.`);
  }

  return value;
}

export const sanityConfig = {
  /** Absolute site URL. Used to build live and preview links from document actions. */
  appUrl: requireConfig("NEXT_PUBLIC_URL", process.env.NEXT_PUBLIC_URL),

  /** Sanity API version (YYYY-MM-DD). Used by Studio clients and document type lists. */
  apiVersion: requireConfig("NEXT_PUBLIC_SANITY_API_VERSION", process.env.NEXT_PUBLIC_SANITY_API_VERSION),

  /** Public base path the Studio is mounted at (e.g. `/studio`). Used for reserved-path checks and presentation detection. */
  studioBasePath: requireConfig("NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH", process.env.NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH),

  /**
   * Host endpoints the Studio calls. `draftMode*` are joined to `appUrl`; `seoScreenshot`,
   * `generateLlmsTxt`, and `generatePageMarkdown` are fetched same-origin. A non-Next host implements
   * equivalents and updates these paths.
   */
  endpoints: {
    draftModeEnable: "/api/draft-mode/enable",
    draftModeDisable: "/api/draft-mode/disable",
    seoScreenshot: "/api/seo-screenshot",
    generateLlmsTxt: "/api/agents/llms-txt",
    generatePageMarkdown: "/api/agents/page-markdown",
  },
};
