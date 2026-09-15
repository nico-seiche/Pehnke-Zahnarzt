---
name: frontend
description: Use when implementing runtime UI behavior in app/features/components, including scroll (Lenis), animations (Motion), and Server/Client Component patterns. Do NOT use when the primary task is schema/GROQ/Studio or generator-first scaffolding.
---

# Frontend

## Core Rules

- Prefer Server Components; add `'use client'` only for interactivity, hooks, or browser APIs. Use the client boundary as far down as possible.
- For **DOM/window listeners, outside-click, Escape-to-close, open/close state**, prefer **`@mantine/hooks`** per **mantine-hooks** (`.agents/skills/mantine-hooks/SKILL.md`) before hand-rolling `useEffect` + `addEventListener`.
- Use existing global Lenis instance via `useLenis` from `lenis/react`; do not create additional Lenis instances.
- Use Motion in Client Components only: `import { motion } from 'motion/react'`.
- For **`prefers-reduced-motion`** in JS (forking JSX), use **`usePrefersReducedMotion`** from **`~/features/motion/use-prefers-reduced-motion`**, not **`useReducedMotion`** from **`motion/react`**.

## Trigger Conditions

Apply this skill when the work is primarily **runtime UI** in `app/`, `features/`, or shared components: layout, scroll, animation, Server/Client boundaries, or styling that is **not** driven by CMS schema/GROQ, Studio config, or plop-first scaffolding.

## Execution Checklist

1. Identify if the task is runtime UI behavior (this skill) vs schema/scaffold (handoff).
2. Read only the needed files listed under Reference Files.
3. Keep Server/Client boundaries minimal and explicit.
4. Reuse existing primitives (`Lenis`, shared hooks) before adding new abstractions.
5. Validate behavior and run relevant checks (`npm run check.types`, optionally `npm run check` for broader edits).

## Scope Guidance

- If the request includes create/generate/scaffold, start with `.agents/skills/scaffolding-plop/SKILL.md`.
- If the primary artifact is schema/GROQ/Studio, sanity takes precedence.
- Use this skill when runtime UI, scroll, or animations are the main intent.
- For **`run()`** from `~/features/utils/common` (conditional JSX, early returns in render), use **code-style** (`.agents/skills/code-style/SKILL.md`, **`run()`** section).
- For **view transitions**, `app-view-transitions`, the `view-transition.css` cross-fade, or the `data-vt-loading` cursor, use **view-transitions** (`.agents/skills/view-transitions/SKILL.md`).
- For **motion craft** (easing tables, press feedback, CSS transform/`clip-path` patterns, animation review format), use **design-engineering** (`.agents/skills/design-engineering/SKILL.md`).
- For **accessibility** (keyboard, focus, labels, ARIA, forms, contrast), search **modern-web-guidance** for the relevant guide (e.g. `accessibility`, `accessible-error-announcement`). For `prefers-reduced-motion` in JS, use `usePrefersReducedMotion` per this skill's Core Rules, not `motion/react`'s `useReducedMotion`.
- For **SEO/AEO** (`generateMetadata`, OG, canonical, structured data, sitemap/robots policy), use **seo-aeo-best-practices** (`.agents/skills/seo-aeo-best-practices/SKILL.md`) when the work is discoverability and rich results, not only layout.

## Non-Goals

- Defining or changing Sanity schema/Studio (use sanity).
- Creating scaffold baseline with plop (use scaffolding-plop).

## Done Criteria

- No extra Lenis instances introduced
- Client-only APIs/hooks stay in Client Components
- Imports use `~/` alias and existing shared primitives
- Changes remain scoped to runtime UI behavior

## Reference Files

- Read `references/lenis.md` for smooth scrolling, `useLenis`, scrollTo, stop/start.
- Read `references/motion.md` for Motion usage and performance.
- Read `references/component-architecture.md` for Server/Client split, cva/cx, path alias, hooks.
- Do not load unrelated reference files.
