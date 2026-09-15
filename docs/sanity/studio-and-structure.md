# Studio Config and Structure

## Public URL, rewrites, and reserved paths

- **Source of truth:** `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` in `env.ts` (and `.env`). Examples and `.env.example` use **`/studio`** as the default. `sanity.config.ts` `basePath` must match this value.
- **App Router mount:** The Studio UI is implemented at a **fixed internal path** — `app/sanity-studio/[[...index]]/page.tsx` (with `app/sanity-studio/layout.tsx`). The folder name is **not** the public path; the optional catch-all exists so Studio can serve nested client routes (structure, tools, presentation, and so on).
- **Rewrites:** `next.config.ts` maps `${NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH}/:path*` → `/sanity-studio/:path*` (`beforeFiles`). Browsers and editors should only use the **public** path.
- **Canonical URL:** `proxy.ts` issues a **308** from `/sanity-studio/...` to the public path + same suffix, so the internal segment is not the preferred URL.
- **Conflict with a site page:** The rewrite owns **every** path under the public base. You **cannot** put Studio at the same path as a page served by `[[...uri]]` (or any other app route). For example, if a real marketing page must live at **`/studio`**, set `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` to a different path (e.g. `/admin`) in every environment and keep `basePath` aligned.
- **URI validation:** The slug/URI field (`create-uri-field`) reserves both the public Studio path and the internal mount path (`/sanity-studio`, see `SANITY_STUDIO_APP_BASE_PATH` in `sanity/constants.ts`).

## Studio Entrypoints

- Studio route: `app/sanity-studio/[[...index]]/page.tsx` and `app/sanity-studio/layout.tsx` (public URL from `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` via rewrites)
- Studio config: `sanity.config.ts`
- CLI config: `sanity.cli.ts`

`NextStudio` uses the same config as the main project, so local Studio behavior mirrors production config.

## Studio Plugins and Configuration

Defined in `sanity.config.ts`:

- `structureTool` with custom structure from `buildStructure`
- `media` plugin with `maximumUploadSize: 10000000` (10MB)
- `muxInput` plugin for video ingestion
- `presentationTool` for preview/presentation workflows
- `visionTool` for GROQ inspection

Additional form behavior:

- Image fields use `mediaAssetSource`
- File fields explicitly exclude `mediaAssetSource`

## Content Structure

Custom structure is built in `sanity/structure.tsx`.

Main groups:

- Homepage singleton (`page` schema with fixed ID from `SINGLETON_IDS.homepage`)
- Pages list (excludes singleton IDs)
- Articles and article categories
- Form submissions grouped from `API_ONLY_DOCUMENTS`
- Site singleton (`SINGLETON_IDS.site`)

## Singletons

Singleton IDs and routes are centralized in `sanity/constants.ts`:

- `SINGLETON_IDS`
- `SINGLETON_ROUTES`
- `TEMPLATE_IDS`

Why this matters:

- Structure list, actions, and templates all derive behavior from the same constants
- Keeping IDs here avoids drift across Studio features

## Document Actions and Templates

- Custom actions: `sanity/actions.tsx`
- Custom templates: `sanity/templates.tsx`

Current behavior:

- Singletons are restricted to `publish`, `discardChanges`, `restore`
- API-only document types are restricted to `delete`, `discardChanges`
- Page documents expose quick actions:
  - Open live page (draft mode disabled)
  - Open draft page (draft mode enabled)
  - Open in Presentation
  - Open in Structure (from Presentation mode)

## Presentation Tool Mapping

`presentationTool` in `sanity.config.ts` maps routes to documents:

- `/` maps to homepage singleton
- `/:uri` maps to documents where `uri.current` equals current path

Preview endpoints:

- Enable draft mode: `/api/draft-mode/enable`
- Disable draft mode: `/api/draft-mode/disable`
