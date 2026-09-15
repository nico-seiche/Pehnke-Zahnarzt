# Rich Text Block (Plop)

- **Generator**: "Rich Text Block". Creates a new rich text block (e.g. cta -> ctaBlock).
- **Prompt**: `name` — block name; names are suffixed with "Block" (e.g. callout -> calloutBlock).
- **Creates**: Block schema in `sanity/schemas/fields/create-rich-text/blocks/{{kebabCase name}}.tsx`; updates blocks index (import + export); component in `features/rich-text/blocks/{{kebabCase name}}/index.tsx`; fragment in `features/rich-text/blocks/{{kebabCase name}}/fragment.ts`; updates `features/rich-text/index.tsx` and `features/rich-text/fragment.ts`. Runs `npm run sanity:typegen` and format.
- **Templates**: `templates/rich-text-block/schema.tsx.hbs`, `component.tsx.hbs`, `fragment.ts.hbs`.
- Keep fragment and renderer registry in sync with the generator output.
