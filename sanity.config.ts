// Note: this file is also executed in a browser context in the Next.js Studio app route
// (`app/sanity-studio/...`, URL from `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` + `next.config.ts` rewrites).

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { defineDocuments, presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { media, mediaAssetSource } from "sanity-plugin-media";
import { muxInput } from "sanity-plugin-mux-input";
import { env } from "~/env";
import { IS_DEV } from "~/features/utils/constants";
import { createDocumentActions } from "~/sanity/actions";
import { SINGLETON_IDS } from "~/sanity/constants";
import { schemaTypes } from "~/sanity/schemas";
import { buildStructure } from "~/sanity/structure";
import { createDocumentTemplates } from "~/sanity/templates";

export default defineConfig({
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  basePath: env.NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH,
  schema: {
    types: schemaTypes,
    templates: createDocumentTemplates,
  },
  document: {
    actions: createDocumentActions,
  },
  form: {
    // Restrict image uploads to use the media browser.
    image: {
      assetSources: () => [mediaAssetSource],
    },
    // Don't use the media browser for anything that is not an image source.
    file: {
      assetSources: (prev) => prev.filter((_) => _ !== mediaAssetSource),
    },
  },
  plugins: [
    structureTool({
      structure: buildStructure,
      title: "Content",
    }),
    media({
      maximumUploadSize: 10000000, // 10MB
      creditLine: { enabled: false },
      directUploads: false,
    }),
    muxInput({
      tool: { title: "Mux" },
      encoding_tier: "baseline",
      disableUploadConfig: true,
      max_resolution_tier: "2160p",
      allowedRolesForConfiguration: ["administrator"],
    }),
    presentationTool({
      resolve: {
        // Main documents are documents that map to a route on the website.
        // This enables Sanity to update the content side panel when navigating in preview mode.
        mainDocuments: defineDocuments([
          { route: `/`, filter: `_id == "${SINGLETON_IDS.homepage}"` },
          { route: `/:uri`, filter: (ctx) => `defined(uri.current) && uri.current == "${ctx.path}"` },
        ]),
      },
      previewUrl: {
        origin: env.NEXT_PUBLIC_URL,
        initial: "/",
        previewMode: {
          enable: "/api/draft-mode/enable",
          disable: "/api/draft-mode/disable",
        },
      },
    }),
    ...(IS_DEV
      ? [
          visionTool({
            defaultApiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
          }),
        ]
      : []),
  ],
});
