---
name: section-colocation
description: Use when a page builder section outgrows its single file and needs a companion (a client-only component, server action, data, or helper), to decide where that file lives. Do NOT use to create a new section (that is scaffolding-plop) or to place genuinely shared, reusable UI.
---

# Section Colocation

## Core Rules

- A section that fits in one file stays a flat file: `features/page-builder/sections/{name}-section.tsx`. Do not make a folder for a single file.
- When a section needs companion files, promote it to a folder `features/page-builder/sections/{name}-section/` with `index.tsx` as the section entry. The Sanity schema name and the registry import (`~/features/page-builder/sections/{name}-section`) are unchanged: the path resolves to `index.tsx`.
- **Scoped vs shared is the whole decision.** Apply the reuse test:
  - **Scoped** (only this section would ever use it) → colocate in the section folder next to `index.tsx`. This is the home for a section's `"use client"` component, its server action, and any data or helpers that mean nothing outside the section.
  - **Shared** (another section could plausibly reuse it) → put it under `~/components/*` (a UI primitive, hook, or util) and import it via the `~/` alias.
- `index.tsx` **is** the section component (the existing pattern), not a barrel that re-exports it.
- Colocated files import their siblings with relative paths (`./contact-form`, `./actions`); everything outside the folder uses the `~/` alias.
- This skill only moves files. It never renames the section, the `*SectionField` type, the `sectionContent` schema, or the registry entry.

## Trigger Conditions

Apply when, for an existing page builder section, you are:

- adding a `"use client"` component whose logic is specific to one section (a form, a carousel, an accordion, a scroll effect),
- adding a server action, data, constants, or helpers used only by one section, or
- deciding whether a new component belongs to a section or to the shared `~/components` library.

## Execution Checklist

1. Run the reuse test: would any other section use this? Yes → shared. No → scoped.
2. **Scoped, section is still a flat file:** create `sections/{name}-section/`, move the existing `{name}-section.tsx` to `sections/{name}-section/index.tsx`, then add the companion file beside it.
3. **Scoped, folder already exists:** drop the companion file in the folder.
4. Point sibling imports at relative `./...`; leave the registry import path (`~/features/page-builder/sections/{name}-section`) and the schema untouched.
5. **Shared:** create it under `~/components/...` instead and import via `~/` from any section.
6. Validate: `npm run check.types` and `npm run check`.

## Scope Guidance

- **Hand off to `scaffolding-plop`** to create a brand-new section; it generates the flat `{name}-section.tsx`. This skill takes over only once that file needs companions.
- **Hand off to `frontend`** for the client component's behavior and to `sanity` for schema/GROQ work.
- Mirror an existing folder section rather than inventing a layout (for example `contact-form-section/`).

## Non-Goals

- Not for creating a new section, route, or block (use `scaffolding-plop`).
- Not for placing reusable design-system components (those go in `~/components`, not a section folder).
- Not a barrel-file convention: `index.tsx` is the component, not a re-export hub.

## Done Criteria

- A section with companions lives in `sections/{name}-section/` with `index.tsx` as the entry.
- Section-only files are colocated in that folder; reusable files are under `~/components`.
- The registry import path and Sanity schema name are unchanged.
- `npm run check.types` and `npm run check` pass.

## Reference Files

- `features/page-builder/sections/contact-form-section/` — the canonical folder shape: `index.tsx` (the section entry) beside its scoped `"use client"` component and its scoped server action, none of them imported by any other section.
- `features/page-builder/page-sections.tsx` — the registry; note the import path is the folder, resolving to `index.tsx`.
- No `references/` directory for this skill.
