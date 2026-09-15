# Draft Mode and Visual Editing

## Endpoints

- Enable draft mode: `app/api/draft-mode/enable/route.ts`
- Disable draft mode: `app/api/draft-mode/disable/route.ts`

Enable uses `defineEnableDraftMode` with the shared `sanityClient`.

Disable route:

- turns draft mode off
- redirects to `redirectTo` (defaults to `/`)

## Runtime Wiring

In `app/(web)/layout.tsx`:

- `draftMode()` is checked per request
- when enabled, the app renders:
  - `SanityLive`
  - `VisualEditing`
  - `DisableDraftMode` button

`DisableDraftMode` is hidden when rendered inside an iframe (so it does not interfere with Studio preview panes).

## How Preview URLs Are Connected

`sanity.config.ts` -> `presentationTool.previewUrl.previewMode` points to:

- `/api/draft-mode/enable`
- `/api/draft-mode/disable`

Custom document actions in `sanity/actions.tsx` provide:

- Open draft page (opens enabled draft URL)
- Open live page (opens disable route with `redirectTo`)
- Open in presentation

## Live Fetch vs Published Fetch

`sanityFetch` in `features/sanity/client.ts` controls this:

- Draft mode on -> live fetch path (`sanityLiveFetch`)
- Draft mode off -> published perspective fetch with Next.js cache tags

This allows editors to preview draft content while keeping public traffic on cached published content.
