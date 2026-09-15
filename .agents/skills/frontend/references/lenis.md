# Lenis (primary scroll container)

## Architecture

- **`html` / `body` do not scroll.** In `~/features/style/global.css`, `html` and `body` use `h-dvh` and `overflow-hidden` (plus `overscroll-none`). This avoids iOS Safari quirks with the bottom chrome / floating bar resizing the layout when the **document** scrolls.
- **Lenis is the main scroll surface.** `~/features/lenis.tsx` wraps `ReactLenis` with `h-dvh overflow-auto overscroll-none`. All vertical page scrolling happens on that element, not on `window`.
- **Implications elsewhere**: Do not assume `window.scrollY`, `document.documentElement.scrollTop`, or body scroll for layout or “scroll position” unless you intentionally mean the Lenis element. Prefer **`useLenis()`** from `lenis/react` and Lenis APIs for programmatic control and scroll-linked behavior. Full-viewport sections that need to fill the “viewport” should align with **`dvh`** / the Lenis container height, not a scrolling body.

## Setup

- **Single instance**: `Lenis` from `~/features/lenis.tsx` wraps header, main, and footer in `app/(web)/layout.tsx` (and `app/global-not-found.tsx`). One global instance only; do not add more `ReactLenis` roots.
- **Next.js navigation**: Lenis keeps its own scroll offset; Next’s `scroll: true` on navigation does not reset it. `LenisScrollResetOnRoute` calls `lenis.scrollTo(0, { immediate: true, force: true })` on pathname changes (see `~/features/lenis.tsx` and [lenis#375](https://github.com/darkroomengineering/lenis/issues/375)).
- **Options**: `autoToggle: true`, anchor easing/duration configured on the default export. Imports `lenis/dist/lenis.css`.

## Usage

- **`useLenis()`** from `lenis/react`: Client Components only; returns `null` during SSR.
- **Methods**: `scrollTo(target, options)`, `start()`, `stop()`, `on` / `off`. Options include `offset`, `duration`, `easing`, `immediate`, `lock`, `force`, `onComplete`.
- **Do not**: Create extra Lenis instances; rely on `scroll-behavior: smooth` on the document; mix with other scroll libraries. Use **`lenis.stop()`** (or equivalent) when modals need to lock background scroll.

## Resources

- [lenis.darkroom.engineering](https://lenis.darkroom.engineering), GitHub `darkroomengineering/lenis`, `lenis/react`.
