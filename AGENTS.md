# Repository Guidelines

## Agent Workflow

1. Scope first: identify the smallest set of files to change and avoid unrelated edits.
2. Before any state-changing action (file edits, writes), output a short **Skill Preflight**:
   - Primary skill
   - Optional secondary skill(s)
   - Why each skill applies to this task
3. For conflicts between docs and code, source of truth is current repository code.
4. Reuse-first: prefer existing section types and patterns before adding new ones.
5. For schema/typegen changes, run `npm run sanity:typegen` after edits; use `npm run plop` for new sections/routes/blocks.

## Project Structure

- `app/`: Next.js App Router (routes, layouts, Server/Client Components). Sanity Studio is mounted at `app/sanity-studio/...`; the **public** URL is `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` (rewrites in `next.config.ts`). See `docs/sanity/studio-and-structure.md#public-url-rewrites-and-reserved-paths`.
- `sanity/`: Sanity schemas (documents, fields, page-sections), structure, studio config.
- `features/`: Feature modules (page-builder, sanity client/link/media, site, rich-text, style, dom utilities).
- `templates/`: Plop templates (page-route, page-builder-section, rich-text-block).
- `proxy.ts`: Next.js Proxy — optional **HTTP Basic Auth** (`BASIC_AUTH_USERNAME` / `BASIC_AUTH_PASSWORD` + CMS toggles; `features/auth/sanity-basic-auth-proxy.ts`). See `docs/features/basic-auth.md`.
- Root: `sanity.config.ts`, `next.config.ts`, `tsconfig.json`, `biome.jsonc`, `env.ts`, `plopfile.mjs`.

Prefer colocation in routes and features; use the `~/` path alias from `tsconfig.json`.

## Coding Style & Conventions

- Language: TypeScript (strict). Formatting/lint: Biome (`npm run check` / `npm run format`).
- Favor early returns, named exports, and minimal `useEffect`/`useState`.
- For **heavy conditional JSX** (nested ternaries, parallel branches), use **`run`** from `~/features/utils/common` — see the **`run()`** section in **code-style** (`.agents/skills/code-style/SKILL.md`).
- Server Components by default; add `'use client'` only when needed (interactivity, hooks, browser APIs).
- Path alias: use `~/*` for imports. Next.js default exports only where required (`app/layout.tsx`, `app/page.tsx`, route handlers). **Exception:** inside the root `sanity/` folder, import other `sanity/` modules with **relative** paths (`./`, `../`), not `~/sanity/*`, so the folder stays portable as a standalone module (enforced by a Biome override on `sanity/**`; see the **sanity** skill and `docs/sanity/standalone-folder.md`).
- Styling: `cva`, `cx`, `compose` from `~/features/style/utils`; valid text tokens: `title`, `subtitle`, `body`, `caption`.
- Env: read via `env` from `~/env`; use `IS_CLIENT` / `IS_SERVER` from `~/features/utils/constants` for runtime guards.
- Hooks: prefer [`@mantine/hooks`](https://mantine.dev/hooks/getting-started/) for reusable React hooks; before adding manual `useEffect` + DOM/window listeners (outside click, Escape, disclosure state, etc.), follow **mantine-hooks** (`.agents/skills/mantine-hooks/SKILL.md`). `~/features/dom/` adds `useBreakpoint` / `useIsTouchDevice` (`use-breakpoint.ts`) on top of [`useMediaQuery`](https://mantine.dev/hooks/use-media-query/), plus `KeyboardFocusMode` (`keyboard-focus-mode.tsx`, mounted in `app/(web)/layout.tsx`) and layout helpers (`constants`, `parseResponsiveValues`). Use `useLenis` from `lenis/react` for smooth scroll.
- Sanity: `sanityFetch` from `~/features/sanity/client`; types from `~/sanity/types` (generated, do not edit).

## Skills

**`AGENTS.md` and `.agents/skills/` are not redundant.** This file stays **short**: workflow, layout, a few **global** conventions, and a **one-line index** of skills. **Authoritative rules, handoffs, checklists, and optional `references/`** live in **`.agents/skills/<skill-name>/SKILL.md`**. Use this file to orient; use the skill folder for anything non-trivial in that domain.

**Before substantive edits**, read **`.agents/skills/<name>/SKILL.md`** for each skill named in your **Skill Preflight** (primary and secondary). If that skill lists files under **Reference Files**, read those **`references/*.md`** (or the in-repo paths it names) before changing related code. Skipping the skill when the task clearly falls in that domain risks missing boundaries and commands.

Task-specific guidance lives under `.agents/skills/`:

- **modern-web-guidance**: Search tool (Google Chrome team, run via `npx` `search`/`retrieve`) for framework-agnostic platform patterns: accessibility, performance/Core Web Vitals, forms/autofill, CSS, view transitions, scroll animations, passkeys, security/privacy. Check it before hand-rolling any HTML, CSS, or clientside JS, then defer to the repo skills below for the project's chosen abstractions (`@mantine/hooks` over hand-rolled dialogs/focus traps, `motion/react`, the `view-transitions` module, `cva`/`cx`); see `.agents/skills/modern-web-guidance/`.
- **sanity**: Schema, GROQ, Studio, typegen, Sanity config, content components, standalone-folder portability (relative imports, `config.ts` seam).
- **frontend**: Runtime UI, components, Lenis, Motion.
- **design-engineering**: UI craft—motion, easing, micro-interactions, CSS transforms, gestures, perceived performance, animation accessibility; see `.agents/skills/design-engineering/`.
- **mantine-hooks**: Prefer `@mantine/hooks` for listeners, outside-click, disclosure/modals, and related client patterns instead of ad-hoc `useEffect` + `addEventListener`.
- **scaffolding-plop**: Generator-first creation of page routes, page builder sections, rich text blocks.
- **umami-analytics**: Umami tracking helpers, event/session payload constraints, SSR-safe instrumentation.
- **code-style**: TypeScript/React readability—`type` over `interface`, React 19 `ref` as a prop, braced `if/else` and spacing around conditionals; **`run()`** from `~/features/utils/common` for heavy conditional JSX and scoped Server Component logic (JSX-friendly IIFE; see the **`run()`** section in this skill).
- **docs-maintenance**: Keep `docs/`, the root README, and `GETTING-STARTED.md` accurate when code behavior, env vars, setup steps, or workflows change.
- **view-transitions**: App Router view transitions (`app-view-transitions.tsx`), the `view-transition.css` cross-fade, Link/navigation timing, the `data-vt-loading` cursor.
- **react-performance**: React/Next performance patterns (async waterfalls, RSC/bundle, re-renders, rendering, client listeners/storage, optional JS hot-path notes); see `.agents/skills/react-performance/` and `references/`.
- **seo-aeo-best-practices**: Metadata, Open Graph, sitemaps, robots.txt, hreflang, JSON-LD, EEAT, AEO; see `.agents/skills/seo-aeo-best-practices/`.
- **section-colocation**: Where a page builder section's files live once it outgrows one file—scoped client components/helpers colocate in a `{name}-section/` folder with `index.tsx`; reusable pieces go in `~/components`. See `.agents/skills/section-colocation/`.
- **agent-markdown**: Keep the Markdown served to AI agents (content negotiation) in sync when page-builder sections change. Standard factory fields (`appRichText`, `appMedia`, `appLink`, `headline`, `caption`) serialize automatically; a bespoke content field needs a branch in the serializer and query. See `.agents/skills/agent-markdown/`.
- **alpha-hetzner-staging-deploy**: Build, upload, and troubleshoot a self-hosted Node deploy to an Alphanauten Hetzner staging server (Hetzner "Node.js configuration" panel, no systemd/pm2) — standalone build + `static`/`public` copy, build-time vs runtime env split, rsync, Sanity CORS/Studio-domain/webhook wiring, Basic-Auth gate, and the Windows/WSL build quirk. See `.agents/skills/alpha-hetzner-staging-deploy/`.

Use the skill that matches the primary task; hand off to another skill when the task shifts (e.g. after scaffolding, switch to sanity or frontend as needed).

When **adding or renaming** a skill, update **`docs/features/agent-skills.md`** (current skills list) in the same change so contributor-facing docs match this file.

## Completion Checklist

Before final response, verify:

- Changed only in-scope files
- Required commands for that skill have been run
- Imports/paths match real files (no guessed paths)
- Handoff notes included when another skill should continue
- No generated file was edited manually when generator/typegen owns it

## Quality Gates

- `npm run check.types`
- `npm run check` (Biome)
