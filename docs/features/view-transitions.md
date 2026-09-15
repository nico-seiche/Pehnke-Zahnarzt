# View transitions (App Router)

This stack uses the **View Transitions API** for route changes. The implementation lives **in-repo** under `features/view-transition/` so navigation timing stays under our control. The transition is a simple cross-fade: the old page fades out, then the new page fades in.

## Files

| File | Role |
|------|------|
| `features/view-transition/app-view-transitions.tsx` | `ViewTransitions` root wrapper, `Link`, `useTransitionRouter`, the `data-vt-loading` cursor hook (`useViewTransitionLoadingCursor`), and the link helpers (`isLocalNavigationHref`, `isSamePageHash`, `shouldSkipLinkViewTransition`, `hrefToString`). Full architecture description is in the file header comment. |
| `features/view-transition/view-transition.css` | Root cross-fade: `::view-transition-old/new(root)` keyframes plus `--vt-duration-out` / `--vt-duration-in` / `--vt-easing` on `:root`, the `html[data-vt-loading]` wait cursor, and a `prefers-reduced-motion` opt-out. |
| `components/link.tsx` | App-facing `Link` that wraps the in-repo `Link`. It owns one non-transition behavior: a link to the page you are already on (`isSamePagePath`, no hash) smooth-scrolls to top via Lenis. Every transition concern (cross-page navigation, same-page hash, modal `params`) is handled inside the wrapped `Link`. |

Layouts import **`ViewTransitions`** from `~/features/view-transition/app-view-transitions` and wrap the document with it. There is no separate provider and no transition-completion gating.

## Implementation notes

- **Cross-fade** (`view-transition.css`): `::view-transition-old(root)` fades out over `--vt-duration-out`; `::view-transition-new(root)` is delayed by that duration and fades in over `--vt-duration-in`, so the old page clears before the new one appears. Opacity only (no transform), and the animations are disabled under `prefers-reduced-motion`.
- **Loading cursor** (`app-view-transitions.tsx`): `useViewTransitionLoadingCursor` patches `document.startViewTransition` once inside `ViewTransitions` to toggle `data-vt-loading` on `<html>` while a transition runs (links, programmatic navigation, and back/forward). It is DOM-only, with no React state.
- **`useTransitionRouter`** (`app-view-transitions.tsx`): when `document.startViewTransition` is missing, the navigation callback still runs inside **`React.startTransition`**. When the API exists, optional **`onTransitionReady`** chains off **`transition.ready`** with a no-op **`.catch`** so a rejected ready promise does not surface as an unhandled rejection.

## Agent skill

See `.agents/skills/view-transitions/SKILL.md` for workflow, file map, and boundaries.
