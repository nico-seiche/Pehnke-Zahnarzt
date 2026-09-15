import * as changeCase from "change-case";
import { defineField, type SlugOptions, type SlugRule, type SlugValue, type ValidationBuilder } from "sanity";
import { sanityConfig } from "../../config";
import { SANITY_STUDIO_APP_BASE_PATH, SINGLETON_IDS } from "../../constants";
import { composeValidation } from "../../utils";

function normalizeSitePath(path: string) {
  const trimmed = path.trim();
  if (trimmed === "" || trimmed === "/") {
    return "/";
  }

  return trimmed.replace(/\/+$/, "") || "/";
}

/** Slug `current` may be `path` or `/path` — align with a leading slash when comparing. */
function comparableUriPath(value: string): string {
  const t = value.trim();
  if (t === "" || t === "/") {
    return "/";
  }

  return normalizeSitePath(t.startsWith("/") ? t : `/${t}`);
}

const reservedStudioPathValidation: ValidationBuilder<SlugRule> = (R) =>
  R.custom((value: SlugValue | undefined) => {
    const current = value?.current?.trim();
    if (!current) {
      return true;
    }

    const uriP = comparableUriPath(current);
    const publicStudioP = comparableUriPath(sanityConfig.studioBasePath);
    const appMountP = comparableUriPath(SANITY_STUDIO_APP_BASE_PATH);

    if (uriP === publicStudioP) {
      return `This URI is reserved for Sanity Studio (${publicStudioP}). Choose a different path.`;
    }

    if (uriP === appMountP) {
      return `This URI is reserved (Next.js mounts Studio at ${SANITY_STUDIO_APP_BASE_PATH} before page routes). Choose a different path.`;
    }

    return true;
  });

function sanitizeDocId(docId: string) {
  return docId.replace("drafts.", "");
}

export function createUriField({
  group,
  options,
  source,
  slugify,
  name = "uri",
  title = "URI",
  description = "The URI of the document.",
  hidden,
  readOnly,
  validation: externalValidation,
}: {
  group?: string;
  options?: Omit<SlugOptions, "slugify" | "source">;
  source: string;
  slugify?: (args: { originalInput: string; slug: string; parentId: string }) => string;
  name?: string;
  title?: string;
  description?: string;
  hidden?: (props: { parent: { [key: string]: unknown } }) => boolean;
  readOnly?: boolean | ((props: { parent: { [key: string]: unknown } }) => boolean);
  validation?: ValidationBuilder<SlugRule, SlugValue>;
}) {
  return defineField({
    type: "slug",
    name,
    title,
    group,
    description,
    hidden,
    readOnly,
    validation: (rule) => composeValidation(reservedStudioPathValidation, externalValidation)(rule),
    options: {
      ...options,
      source,
      slugify: (input, _, { parent }) => {
        // @ts-expect-error The ID should exist.
        const parentId = parent?._id ? sanitizeDocId(parent._id) : null;
        const slug = changeCase.kebabCase(input);

        if (!parentId) {
          return "";
        }

        if (slugify) {
          return slugify({ slug, parentId, originalInput: input });
        }

        if (parentId === SINGLETON_IDS.homepage) {
          return "/";
        }

        return `/${changeCase.kebabCase(input)}`;
      },
    },
  });
}
