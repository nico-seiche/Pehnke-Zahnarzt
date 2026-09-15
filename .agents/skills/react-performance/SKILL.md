---
name: react-performance
description: Use when optimizing or reviewing React/Next.js performance—async waterfalls, RSC/server data loading, bundle size, re-renders, and rendering—using the patterns in this skill and its references. Do NOT use as the primary skill for CMS schema, Plop scaffolding, or code-style/readability conventions alone.
---

# React performance

## Core Rules

- **Waterfalls are the highest leverage fix** — parallelize independent async work (`Promise.all`, composition/splitting async server components); defer `await` to the branch that needs it; put cheap sync checks before remote awaits.
- **Server Components** — parallelize fetches via sibling components or explicit `Promise.all`; minimize props across the RSC/client boundary; use `React.cache()` for per-request dedup; use `after()` for non-blocking follow-up work when appropriate.
- **Bundle** — prefer direct imports over heavy barrels; `next/dynamic` for heavy client pieces; defer non-critical third-party scripts (e.g. analytics) after hydration; conditional imports for optional features; preload on intent when it helps UX.
- **Re-renders** — avoid inline component definitions; derive state in render where possible; narrow effect deps; `startTransition` / `useDeferredValue` where appropriate; memoize only when work is actually expensive.
- **Rendering** — hoist static JSX; be explicit when `0`/`NaN` could render; hydration and script `defer`/`async` per rule; SVG/content-visibility/hoisting patterns from references.
- **Client DOM and storage** — dedupe global listeners; passive scroll/touch listeners when appropriate; versioned minimal `localStorage` (see `references/client-ui.md`). Prefer **mantine-hooks** where it matches.
- **JS micro-optimizations** — only after profiling (see `references/js-hot-paths.md`).

## Trigger Conditions

Apply when profiling, reviewing, or refactoring for **latency**, **bundle size**, **server/client data flow**, **unnecessary re-renders**, or **long lists / heavy client subtrees**—not for every feature change.

## Execution Checklist

1. Confirm the bottleneck (network waterfall, bundle, RSC serialization, client re-render, layout thrash, etc.).
2. Read the relevant file(s) under Reference Files—start with the category that matches the bottleneck.
3. Prefer patterns that match this stack: App Router, `sanityFetch` / RSC, Lenis/Motion; use **mantine-hooks** and **frontend** for client listeners and UI primitives.
4. After behavior changes, run `npm run check.types` and `npm run check` when edits are broad.

## Scope Guidance

- **frontend** — owns Lenis/Motion and client boundaries; pair when the change is mostly product UI with a performance angle.
- **code-style** — owns **`run()`** and formatting; this skill does not replace braced `if` / readability rules.
- **mantine-hooks** — prefer Mantine for listeners/disclosure before hand-rolling `useEffect` + DOM APIs.
- **sanity** — owns schema/GROQ/typegen; only overlap when minimizing serialized props or parallelizing fetches in server components.

## Non-Goals

- Duplicating **code-style** (`run()`, `type` vs `interface`, etc.).
- Treating **Activity-style show/hide** or **`useEffectEvent`** as mandatory—verify React/Next version and team preference first.
- Adopting **SWR** (or similar) for client fetch deduplication—this repo’s primary data path is **Sanity + server/RSC** unless the team explicitly adds a client library.
- Adding **better-all** (or similar) solely for dependency graphs—use manual `Promise` composition first; add a dependency only with review.

## Done Criteria

- Changes target a measured or clearly identified issue (waterfall, bundle chunk, redundant fetch, avoidable remount, etc.).
- No new heavy dependencies unless justified and reviewed.
- Types and Biome checks pass for touched files.

## Reference Files

Each file below is **self-contained**—headings are topic titles, not links to other paths. Together they cover async waterfalls, bundle, server/RSC, rerenders, rendering, advanced patterns, client DOM/storage (excluding SWR-style client fetch libraries), and optional JS micro-optimizations.

- `references/async-waterfalls.md` — cheap checks, defer `await`, `Promise.all`, dependency graphs, route handlers, Suspense / streaming.
- `references/bundle.md` — barrels, `next/dynamic`, defer third-party, conditional load, preload.
- `references/server-rsc.md` — Server Actions auth, `React.cache`, LRU, props, hoist I/O, module state, serialization, parallel fetches, `after()`.
- `references/rerender.md` — memo, effects, transitions, deferred value, inline components, etc.
- `references/rendering.md` — SVG, hydration, conditionals, Activity (optional), scripts, resource hints, `content-visibility`.
- `references/advanced.md` — `useEffectEvent` deps, handler refs, init-once, latest ref.
- `references/client-ui.md` — dedupe global listeners, passive listeners, `localStorage` (no SWR).
- `references/js-hot-paths.md` — micro-optimizations; use only when profiling warrants it.
