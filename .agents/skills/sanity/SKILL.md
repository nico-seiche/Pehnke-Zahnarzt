---
name: sanity
description: Use when changing CMS schema/model contracts, GROQ projection contracts, Studio/structure configuration, typegen, or content-shape/query alignment. Do NOT use when the primary task is pure runtime UI behavior or generator-first scaffolding.
---

# Sanity

## Core Rules

- Import `sanityFetch` and `sanityClient` from `~/features/sanity/client`; never create new client instances.
- Types are auto-generated in `~/sanity/types.ts` (DO NOT edit manually). Run `npm run sanity:typegen` after schema or query changes.
- Use `defineQuery()` from `next-sanity` for typed GROQ; interpolate fragments with `${FragmentName}` (single braces), not `${{ FragmentName }}`.
- Keep schema in `sanity/schemas/` (documents, fields, page-sections); register in `sanity/schemas/index.ts`. Use field factories: `createLinkField`, `createMediaField`, `createPageBuilderField`, `createRichTextField`.
- Tag queries for revalidation: `options: { next: { tags: ['page', 'site'] } }`. Use wrapper helpers only when the same fetch is reused in the same file.
- For form notifications, keep Sanity persistence as the required success path and treat Resend email delivery as best-effort (log failures without failing the form submission).
- **Stega and identity values:** in draft/preview, live `sanityFetch` returns stega-encoded strings (invisible characters that power click-to-edit). That payload is intended in visible text and must be kept, but any Sanity string used for **DOM manipulation or strict comparison/matching** must be wrapped with `stegaClean` from `next-sanity` first, or it silently breaks in preview only (production serves the published perspective with stega off). Covers element `id`/anchor targets, `getElementById`/`querySelector` lookups, `href`/URLs and path comparisons, `className`/`style` tokens, keys used to match records, and values serialized into JSON-LD. `stegaClean` is a no-op outside preview, so it is always safe to call. See `references/client-and-fetching.md`.
- **Portability:** the root `sanity/` folder ships as a standalone module (`docs/sanity/standalone-folder.md`). Import other `sanity/` modules with **relative** paths (`./`, `../`), never `~/sanity/*` (a Biome override on `sanity/**` enforces this with a lint error). Read runtime config from `sanity/config.ts` (never `~/env`), and inject host specifics (icon component via `createIconField`'s `iconComponent`/`iconNames`, app routes via `sanityConfig.endpoints`) rather than importing them.

### Factory field contract

- Factory fields should expose explicitly supported standard props (currently `validation` and `hidden`, including spreads like `...requiredIf(...)` / `...visibleIf(...)`) and avoid loose catch-all option types.
- For typed object factories (`createMediaField`, `createLinkField`), keep internal type guards and compose them with caller-provided `validation` (do not override caller validation).
- For factories that filter a list of options (`createMediaField` types, `createPageBuilderField` sections, `createRichTextField` blocks, `createIconField` names), use the shared `selectByName` helper from `sanity/utils.ts` for the `whitelist`/`blacklist` contract rather than re-implementing the guard and filter.
- Reuse shared validation helpers in `~/sanity/utils` (`composeValidation`, `requireTypeWhenObjectHasValue`, `isEmptyObjectValue`) instead of duplicating inline validator logic.
- Internal typed-object validation should ignore empty/stale objects (all keys null/undefined), but require `type` when object has meaningful content.
- `ClearableObjectInput` auto-unsets the whole object when the `type` radio is cleared; do not add separate manual clear buttons.
- Avoid `components.field` passthrough wrappers (`({ children }) => <>{children}</>`), because they hide inline validation markers in Studio.
- Do not add no-op wrappers (`field: (props) => props.renderDefault(props)`); omit `components.field` unless you need real custom rendering.

## Trigger Conditions

Apply this skill when the work changes **CMS contracts** or **Sanity integration**: schema, GROQ, fragments, Studio structure, typegen, content components, SEO/routing helpers, or fetch/revalidation behavior tied to Sanity.

## Execution Checklist

1. Confirm the primary artifact is schema, GROQ contract, Studio config, or query/type alignment.
2. Read only the relevant files listed under Reference Files for this task.
3. Keep projections minimal and aligned to consumed UI data.
4. Update schema/query together when contract shape changes.
5. Run `npm run sanity:typegen` after schema/query changes; then run `npm run check.types`.
6. If docs and code disagree, follow the current repository code.

## Scope Guidance

- If the request includes create/generate/scaffold for routes/sections/blocks, start with `.agents/skills/scaffolding-plop/SKILL.md`.
- If the primary artifact is schema, GROQ contract, or Studio config, this skill takes precedence over frontend.
- After scaffolding, hand off to sanity for query/schema tweaks or to frontend for UI.
- For **search and answer surfaces** (metadata strategy, JSON-LD, sitemaps, EEAT content shape), pair with **seo-aeo-best-practices** (`.agents/skills/seo-aeo-best-practices/SKILL.md`) when the task is not only CMS fields but how they map to SEO/AEO.
- When a page-builder section's `sectionContent` fields change, hand off to **agent-markdown** (`.agents/skills/agent-markdown/SKILL.md`) so the Markdown served to agents stays in sync: standard factory fields serialize automatically, a bespoke field needs a serializer/query branch.

## Non-Goals

- Leading pure UI styling or client interaction in `app/**` or `features/**` without schema/query impact.
- Starting generation tasks that should begin with plop (use scaffolding-plop).

## Done Criteria

- No manual edits to `sanity/types.ts`
- Query fragments/import paths resolve to real files
- Schema registration/structure updates are complete when required
- Type generation and type-check pass for touched contracts

## Reference Files

- Read `references/client-and-fetching.md` for client config, draft mode, live mode, revalidation.
- Read `references/schema-and-studio.md` for documents, fields, sections, structure, plugins.
- Read `references/queries-fragments-types.md` for GROQ, fragments, wrapper policy, typegen.
- Read `references/content-components-seo-routing.md` for SanityLink, SanityMedia, SEO, routing patterns.
- Do not load unrelated reference files.
