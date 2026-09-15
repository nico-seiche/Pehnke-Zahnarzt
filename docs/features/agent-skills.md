# Agent Skills

This repository includes AI guidance to keep changes scoped and consistent.

## Main Entry Points

- **`AGENTS.md`** (repo root): workflow, project map, global conventions, and a **short index** of skills. Read this first.
- **`.agents/skills/<name>/SKILL.md`**: **full** instructions for that domain (rules, handoffs, checklists, Reference Files). Not redundant with `AGENTS.md`—the skill is the source of detail; `AGENTS.md` points you there.
- **`.mcp.json`** (repo root): project-scoped MCP servers agents can use at runtime (Next.js introspection, Chrome-driven testing). See [MCP Servers](./mcp-servers.md).

For substantive work, follow **Skill Preflight** in `AGENTS.md`, then open the matching skill file(s) under `.agents/skills/` before editing.

Current skills:

- `modern-web-guidance`: search tool (Google Chrome team) for framework-agnostic platform patterns: accessibility, performance/Core Web Vitals, forms, CSS, view transitions, passkeys, security/privacy. Use `search`/`retrieve`, then defer to the repo skills below for the project's chosen abstractions
- `sanity` — CMS schema, GROQ, Studio, typegen, content components
- `frontend` — runtime UI, components, Lenis, Motion
- `design-engineering` — UI craft, motion, easing, micro-interactions, transforms, gestures, animation a11y
- `mantine-hooks` — prefer `@mantine/hooks` for listeners and client patterns before ad-hoc `useEffect` + `addEventListener`
- `scaffolding-plop` — Plop generators for routes, sections, rich text blocks
- `umami-analytics` — Umami tracking helpers and SSR-safe instrumentation
- `code-style` — TypeScript/React readability conventions and **`run()`** for conditional JSX (see skill)
- `docs-maintenance` — keep documentation aligned with code and workflows
- `view-transitions` — App Router view transitions, the CSS cross-fade, and navigation timing
- `react-performance` — React/Next performance patterns (async, RSC, bundle, rerenders, rendering, client listeners/storage, optional JS hot-path notes); see `references/` under that skill
- `seo-aeo-best-practices` — SEO and AEO: metadata, sitemaps, robots, hreflang, JSON-LD, EEAT, answer-engine readiness
- `section-colocation` — where a page builder section's files live once it needs companions: scoped components/helpers in a `{name}-section/` folder, shared pieces in `~/components`
- `agent-markdown`: keep the Markdown served to AI agents in sync when sections change; standard factory fields serialize automatically, a bespoke content field needs a serializer/query branch
- `alpha-hetzner-staging-deploy` — self-hosted Node deploy to an Alphanauten Hetzner staging server (Hetzner "Node.js configuration" panel): standalone build + `static`/`public` copy, build-time vs runtime env split, rsync, Sanity CORS/Studio-domain/webhook wiring, Basic-Auth gate, Windows/WSL build quirk (see `docs/deployment.md`)

## Standard `SKILL.md` shape

Each skill under `.agents/skills/<name>/SKILL.md` follows the same section order:

1. YAML frontmatter (`name`, `description`)
2. `# Title`
3. `## Core Rules`
4. `## Trigger Conditions`
5. `## Execution Checklist`
6. `## Scope Guidance` (handoffs, boundaries, optional tables)
7. `## Non-Goals`
8. `## Done Criteria`
9. `## Reference Files` (paths under `references/`, in-repo files, or external links; or a note if none)

Some skills add `## Detailed conventions` (for example `code-style`) after Reference Files when the body is long.

## Keeping everything in sync

### Order of truth

When something disagrees, follow this order: **current code** wins, then **`.agents/skills/*/SKILL.md`** (and `references/`), then **`AGENTS.md`** summaries, then **`docs/`** prose. Update downstream layers when you change upstream behavior or contracts.

### What goes where (avoid copy-paste drift)

| Layer | Keep it |
|--------|--------|
| **`AGENTS.md`** | Workflow (Skill Preflight, completion checklist), project map, a **few** global one-liners (Biome, `~/`, env, `run()` pointer), and **one line per skill**—not full rules. |
| **`.agents/skills/`** | Everything agents need to **execute** in that domain: commands, boundaries, handoffs, Reference Files. |
| **`docs/`** | Human onboarding, feature explanations, contributor guides. Use **`docs-maintenance`** scope mapping when doc paths change. |

Do **not** paste long conventions into `AGENTS.md`; link to the skill instead. Do **not** duplicate full skill text in `docs/` unless a page is explicitly for humans (then summarize and link to `.agents/skills/…`).

### By kind of change

- **Product or code behavior changes** — Update code first, then **`docs/`** where contributors or operators need to know (per **`docs-maintenance`**). If the change alters **how agents should work** (new command, new boundary), update the relevant **`SKILL.md`** and, if needed, the **one-line** entry in **`AGENTS.md`**.
- **Convention-only change** (style, hooks policy, `run()` usage) — Update **`code-style`** or the relevant **`SKILL.md`** first; adjust **`AGENTS.md`** only if the global **Coding Style & Conventions** bullet is now wrong.
- **New or renamed skill** — Follow **[When adding or renaming a skill](#when-adding-or-renaming-a-skill)** so **`AGENTS.md`**, this file, and the new folder stay aligned.
- **Docs-only fix** (typos, clarity) — Edit **`docs/`** only; no skill change unless you are correcting **agent** instructions.

### Habits that help

- In PRs that touch behavior, add a line in the description: **“Docs: …”** / **“Skills: …”** / **“AGENTS: …”** when applicable.
- When you notice **two places** saying the same thing and they diverge, **delete duplication**: keep detail in **`SKILL.md`**, keep **`AGENTS.md`** thin.

## When adding or renaming a skill

Update **both** of these in the same change so the index stays aligned:

- `.agents/skills/<name>/SKILL.md` (and `references/` when needed)
- `AGENTS.md` — **Skills** section (short one-line summary per skill)

Also update **this file** (`docs/features/agent-skills.md`) — **Current skills** list and, if you document new conventions, **Standard `SKILL.md` shape**.

## Notes

- Use the skill matching the task domain
- For conflicts between docs and implementation, repository code is the source of truth
