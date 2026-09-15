---
name: view-transitions
description: Use when changing App Router view transitions, `app-view-transitions.tsx`, the `view-transition.css` cross-fade, `Link` navigation timing, or the `data-vt-loading` cursor. Do NOT use when the primary task is CMS schema, plop scaffolding, or unrelated UI.
---

# View transitions

## Core Rules

- Import **`ViewTransitions`**, **`Link`**, and **`useTransitionRouter`** from `~/features/view-transition/app-view-transitions`.
- Root layout: **`<ViewTransitions>`** wraps the document. There is no separate provider and no transition-completion gating. The visual is a CSS cross-fade in `view-transition.css`.
- **Cross-fade** (`view-transition.css`): the old page fades out over `--vt-duration-out`, then the new page fades in (delayed by that duration) over `--vt-duration-in`. Opacity only, with a `prefers-reduced-motion` opt-out. Tune the feel via those `:root` vars, not by adding transforms, unless asked.
- **`useViewTransitionLoadingCursor`** (inside `ViewTransitions`) patches `document.startViewTransition` once to toggle **`data-vt-loading`** on `<html>` while a transition runs (links, programmatic, back/forward). DOM-only, no React state.
- **`router.push` / `replace`** run inside **`startTransition`** in `app-view-transitions.tsx` so React can schedule the route update with other concurrent work.
- **`triggerTransition`**: without **`document.startViewTransition`**, the wrapped navigation still runs inside **`React.startTransition`**. With the API, **`onTransitionReady`** uses **`transition.ready`** with **`.catch(() => {})`** so a rejected ready promise is not an unhandled rejection.
- **`Link` separation:** all transition logic lives in `Link` (VTLink) in `app-view-transitions.tsx`; the app-facing `components/link.tsx` is a thin wrapper that adds only the non-transition Lenis scroll-to-top for a same-page link (`isSamePagePath`).

## Trigger Conditions

Apply when the work touches **view transitions**, **`app-view-transitions.tsx`**, **`view-transition.css`**, **`Link`**, or the **`data-vt-loading`** cursor.

## Execution Checklist

1. Confirm the task touches view transitions, `app-view-transitions.tsx`, `view-transition.css`, or `Link`.
2. Read `features/view-transition/app-view-transitions.tsx` module comment (architecture overview).
3. If changing the cross-fade or Safari timing, read `features/view-transition/view-transition.css` and `components/link.tsx`.
4. Keep spacing/style consistent with `features/view-transition/app-view-transitions.tsx` (blank lines around conditionals).
5. Run **`npm run check.types`** (and Biome) before considering the task done.

## Scope Guidance

### Key files

| Path | Role |
|------|------|
| `features/view-transition/app-view-transitions.tsx` | `ViewTransitions`, `Link`, `useTransitionRouter`, `useViewTransitionLoadingCursor`, `triggerTransition`; link helpers (`isLocalNavigationHref`, `isSamePageHash`, `shouldSkipLinkViewTransition`, `hrefToString`). Architecture in the file header comment. |
| `features/view-transition/view-transition.css` | Root cross-fade (`::view-transition-old/new(root)`); `--vt-duration-out` / `--vt-duration-in` / `--vt-easing` on `:root`; `html[data-vt-loading]` wait cursor; `prefers-reduced-motion` opt-out. |
| `components/link.tsx` | App-facing `Link` wrapping VTLink; owns only the same-page Lenis scroll-to-top (`isSamePagePath`). |

- **frontend**: Pairs when the change is mostly conditional UI or animation without transition API concerns.
- **docs-maintenance**: When updating `docs/features/view-transitions.md` or onboarding text.

## Non-Goals

- Adding a third-party view-transition npm package without an explicit decision (would change `startTransition` and resolver behavior).
- Changing `view-transition.css` (`--vt-duration-out` / `--vt-duration-in` / cross-fade) without checking motion timing and reduced-motion behavior.
- General UI, Lenis, or Motion work with no view-transition or route-transition angle (use **frontend**).

## Done Criteria

- Imports resolve to `~/features/view-transition/app-view-transitions` where applicable.
- `npm run check.types` passes.

## Reference Files

- `docs/features/view-transitions.md` — contributor overview and file map.
- See Scope Guidance → Key files for the canonical in-repo paths to read when editing behavior.
