/**
 * Single source of truth for Sanity singleton document IDs and related constants.
 */

/**
 * App Router mounts `NextStudio` at a fixed `app/sanity-studio/…` path. The **public** URL is
 * `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` (rewritten in `next.config.ts`). The public path is not
 * the filesystem name — use the env for reserved-URI checks and `sanity.config` `basePath`.
 */
export const SANITY_STUDIO_APP_SEGMENT = "sanity-studio" as const;
export const SANITY_STUDIO_APP_BASE_PATH = `/${SANITY_STUDIO_APP_SEGMENT}` as const;

/**
 * Template IDs used for defining document structures in the CMS.
 */
export const TEMPLATE_IDS = {
  pageSingleton: "pageSingletonTemplate",
} as const;

/**
 * Singleton document IDs as string literals (typegen only resolves literals, not MemberExpression).
 * Single source of truth: define here, then derive SINGLETON_IDS for structure/actions/templates.
 */
export const SANITY_SINGLETON_SITE_ID = "site";
export const SANITY_SINGLETON_HOMEPAGE_ID = "homepage";

/**
 * Singletons are document types that should have exactly one instance.
 * They represent unique content like global settings or homepage data.
 */
export const SINGLETON_IDS = {
  site: SANITY_SINGLETON_SITE_ID,
  homepage: SANITY_SINGLETON_HOMEPAGE_ID,
  // PLOP: Add Singleton ID
} as const;

/**
 * Maps singleton documents to their corresponding URIs.
 * Used for initialValueTemplate when creating/opening singleton pages.
 */
export const SINGLETON_ROUTES = {
  [SINGLETON_IDS.homepage]: "/",
  // PLOP: Add Singleton Route
} as const;

/**
 * API-only or submission schema types (e.g. form submissions).
 * Only delete (and discardChanges) are allowed in the Studio.
 */
export const API_ONLY_DOCUMENTS = {
  contactFormSubmission: "contactFormSubmission",
} as const;

/**
 * Sanity `_type` for routed documents that are not singletons. Use these names in
 * `defineQuery(\`…\`)` interpolations only — typegen resolves simple bindings, not
 * `SINGLETON_IDS.*` member access.
 *
 * For site, `_type` matches `SANITY_SINGLETON_SITE_ID`; use that in GROQ and as
 * `next.tags` (same string the webhook passes to `revalidateTag`).
 */
export const SANITY_PAGE_DOCUMENT_TYPE = "page" as const;
export const SANITY_ARTICLE_DOCUMENT_TYPE = "article" as const;
