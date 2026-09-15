# Schema and Content Model

## Schema Source of Truth

- Schema registration: `sanity/schemas/index.ts`
- Registered documents:
  - `site`
  - `redirect`
  - `page`
  - `contactFormSubmission`
  - `article`
  - `articleCategory`
- Registered global field/object types:
  - `aspectRatio`
  - `videoOptions`
  - `riveOptions`
  - `lottieOptions`
  - `appColor`
- Page section schemas come from `sanity/schemas/page-sections/index.ts`
- After schema changes, run `npm run sanity:typegen` (see [Contributor Workflow](./contributor-workflow.md))

## Core Document Contracts

### `page`

Defined in `sanity/schemas/documents/page.tsx`:

- `title` (required)
- `uri` from `createUriField` (required)
- `passwordProtected` (boolean) — when site-wide Basic Auth is off, gates this URL (credentials in env; see [Basic Authentication](../features/basic-auth.md))
- `pageBuilder` from `createPageBuilderField` (required)
- `seoMetadata` from `createSeoField` (`sanity/schemas/fields/create-seo-field.tsx`): on the homepage only **No Index** shows; the marketing fields (title, description, share image) are hidden because the homepage inherits SEO defaults from the Site singleton
- `agentMarkdown` from `createAgentMarkdownField` (`sanity/schemas/fields/create-agent-markdown-field.tsx`, Agents group): `enabled` (serve toggle) + `content`, the per-page Markdown served to AI agents. Generate it from the page's content with one click, then publish. See [Agent Markdown](../features/agent-markdown.md)

Groups:

- `page`
- `content`
- `seo`
- `agents`

### `site` (singleton)

Defined in `sanity/schemas/documents/site.tsx`:

- `name` (required)
- `basicAuth` (object, Security group) — toggles only (`siteWideEnabled`); HTTP Basic Auth credentials live in deployment env, not the CMS — see [Basic Authentication](../features/basic-auth.md)
- `redirects` array of `redirect` items, with duplicate `from` validation
- `header.links` (required array of `appLink`)
- `contacts` (array of contact objects with `name` + `appLink`)
- `footer.links` (required)
- `footer.legalLinks`
- `seoMetadata` (site-wide SEO defaults from `createSeoField`): serving Markdown to agents is decided per page (the `agentMarkdown` object on `page` / `article`), so the singleton has no such toggle; its own AI surface is `llms` below
- `favicon` (object, SEO group) — `iconLight` / `iconDark` tab icons; URLs built in `features/site/seo/utils.ts` (`metadataIconsFromFavicon`)
- `llms` (object, Agents group): `enabled` (serve toggle), `guidance` (AI steer), and `content` (Markdown served at `/llms.txt`). The Agents group holds one object per AI surface (more can be added beside `llms`). The field has a Generate button powered by [Agent Actions](./agent-actions.md). See [llms.txt and AI agents](../features/llms-txt.md)

### `redirect`

Used inside `site.redirects` and consumed by Next.js redirects in `next.config.ts`.

### Other documents

- `article` — includes `passwordProtected` (same env-based Basic Auth as `page`; see [Basic Authentication](../features/basic-auth.md))
- `articleCategory`
- `contactFormSubmission` (API-only content)

## Field Factories and Reusable Types

Field factories are under `sanity/schemas/fields/`:

- `createLinkField` -> `appLink`
- `createMediaField` -> `appMedia` (image, Mux video, video file, video URL, Rive, or Lottie; see [Motion media in appMedia](#motion-media-in-appmedia))
- `createRichTextField` -> `appRichText`
- `createPageBuilderField`
- `createUriField`

Reusable shared objects:

- `seoMetadata`
- `aspectRatio`
- `videoOptions`
- `riveOptions` (loop, autoPlay — used when media type is Rive)
- `lottieOptions` (loop, autoPlay — used when media type is Lottie)
- `appColor`

Helper utilities:

- `visibleIf`, `requiredIf`, `uniqueReferenceArray`, `createExcerptFromPortableText`, and `selectByName` (shared `whitelist`/`blacklist` filtering used by the field factories) in `sanity/utils.ts`

### Motion media in appMedia

`createMediaField` in `sanity/schemas/fields/create-media.tsx` is a single object with a **media type** radio: **image**, **Mux video** (`mux.video`), **video file** (self-hosted upload), **video URL** (a plain external link such as an `.mp4`), **Rive**, or **Lottie**. Pass `whitelist` or `blacklist` (arrays of type values such as `videoMux` or `videoUrl`) to restrict which options editors can pick; the two are mutually exclusive (passing both throws).

For **Video file** and **Video URL** (native HTML5 `<video>`, no Mux):

- **`videoFile`** (Sanity `file`, accepts `video/*`) with required **`videoFileDimensions`** (positive `width`/`height`). The file ships inside the dataset export.
- **`videoUrl`** (a direct link to an `.mp4`/`.webm`, validated as an `http(s)` URL) with required **`videoUrlDimensions`**. Nothing is added to the dataset export; the asset stays where it is hosted.
- Both share **`videoOptions`** (controls, loop, muted, autoPlay) and render through **`SanityNativeVideo`** (`features/sanity/media/native-video.tsx`); the GROQ fragment resolves each into `{ url, dimensions }`.

For **Rive**:

- **`riveFile`** — Sanity `file` field; accepts `.riv`. **Generate** in `sanity/inputs/rive-file-input.tsx` reads dimensions from the Rive default artboard (`sanity/lib/parse-rive-dimensions.ts`). Dimensions are cleared when the asset changes.
- **`riveOptions`** — object type from `sanity/schemas/fields/rive-options.tsx` (`loop`, `autoPlay`), registered in `sanity/schemas/index.ts`.
- **`riveDimensions`** — required when media type is Rive; validation requires positive `width` and `height`.

For **Lottie**:

- **`lottieFile`** — Sanity `file` field; accepts Bodymovin JSON (`.json`) and dotLottie (`.lottie`). **Generate** in `sanity/inputs/lottie-file-input.tsx` only auto-fills **`lottieDimensions`** from **Bodymovin JSON** bytes (`sanity/lib/parse-lottie-dimensions.ts`); for `.lottie`, set dimensions manually or use a `.json` export. Dimensions are cleared when the asset changes.
- **`lottieOptions`** — object type from `sanity/schemas/fields/lottie-options.tsx` (`loop`, `autoPlay`), registered in `sanity/schemas/index.ts`.
- **`lottieDimensions`** — required when media type is Lottie; validation requires positive `width` and `height`.
- **`aspectRatio`** — when `withCustomRatio` is enabled on the field, editors can override the ratio used in the frontend; the GROQ fragment prefers explicit `aspectRatio`, then Lottie dimensions, then defaults.

**Runtime:** `features/sanity/media/index.tsx` (`SanityMedia`) branches on `type` and renders **`SanityRive`** (`features/sanity/media/rive.tsx`, `@rive-app/react-canvas`) and **`SanityLottie`** (`features/sanity/media/lottie.tsx`, `@lottiefiles/dotlottie-react`). Motion loop/autoplay follows CMS options and `SanityMedia` props, gated by in-view using `@mantine/hooks`’ `useInViewport`.

**Queries:** reuse **`MediaFragment`** from `features/sanity/media/fragment.ts` wherever `appMedia` is projected so `type`, Rive/Lottie URLs, dimensions, and options stay in sync with the UI.

## URI Rules

URI behavior is defined in `sanity/schemas/fields/create-uri-field.tsx`:

- Slugs are kebab-cased
- Non-homepage pages become `/{slug}`
- Homepage singleton URI is forced to `/`
- `drafts.` prefix is stripped before singleton checks

## Page Builder Data Shape

`createPageBuilderField` wraps each section item into:

- `sectionSettings`
  - `sectionTitle`
  - `sectionHash` (slug, unique per page)
- `sectionContent`
  - actual section schema payload

Section wrappers are named `{sectionName}Field`, for example `mediaSectionField`.

This wrapper shape is what frontend rendering expects in `features/page-builder/page-sections.tsx`.
