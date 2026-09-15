# Rendering and DOM

DOM, SVG, hydration, and paint. All guidance is **in this file**.

## Animate SVG via a wrapper

Animate a **wrapper `div`** around SVG, not the SVG root directly, when animating CSS transforms—avoid inconsistent behavior across browsers.

## `content-visibility` for long lists

For long lists: **`content-visibility: auto`** (or equivalent) on off-screen sections to reduce layout/paint cost.

## Hoist static JSX

Hoist **static** subtrees (elements that never depend on props/state) outside the component or above the dynamic part.

## Smaller SVG payloads

Reduce SVG coordinate precision in assets to shrink payload.

## Hydration without flicker; suppress mismatches when intentional

Use when you have intentional client-only values or known mismatches—follow React guidance for `suppressHydrationWarning` and for passing client-only data without flash.

## Show/hide APIs (e.g. Activity)

**React `Activity`** (or equivalent) for show/hide—**verify** the React/Next version in use before relying on this API; treat as optional.

## Explicit conditionals for numeric falsy values

Use explicit **`? … : null`** when the condition can be **`0`**, **`NaN`**, or other falsy values that render (avoid `{count && …}` foot-guns).

## `useTransition` for pending UI

Prefer **`useTransition`** for loading/pending UI when it maps to async state updates—avoid ad-hoc `isLoading` only when transition semantics fit.

## Resource hints (`react-dom`)

Use **`prefetchDNS`**, **`preconnect`**, **`preload`**, **`preloadModule`**, **`preinit`**, **`preinitModule`** from `react-dom` to start DNS/TCP/TLS or fetch critical fonts, styles, and modules before they block rendering—especially from Server Components so hints ship with HTML.

**Examples:**

```tsx
import { preconnect, prefetchDNS, preload, preinit } from "react-dom"

prefetchDNS("https://analytics.example.com")
preconnect("https://api.example.com")
preload("/fonts/inter.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" })
preinit("/styles/critical.css", { as: "style" })
```

| API | Typical use |
|-----|----------------|
| `prefetchDNS` | Domains you will connect to later |
| `preconnect` | APIs/CDNs you fetch from soon |
| `preload` | Critical assets for the current view |
| `preloadModule` | JS modules for likely next navigation |
| `preinit` / `preinitModule` | Styles/scripts/modules that must run early |

See [React DOM resource preloading](https://react.dev/reference/react-dom#resource-preloading-apis).

## Script `defer` / `async`

Use **`defer`** or **`async`** appropriately on script tags for third-party scripts.
