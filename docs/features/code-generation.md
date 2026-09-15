# Code Generation (Plop)

This starter uses [Plop](https://plopjs.com/) to scaffold page builder sections, prefix page routes, and rich text blocks with consistent structure.

## Usage

Run:

```bash
npm run plop
```

Then choose one of the available generators and provide the requested inputs.

## What Gets Generated

### Page Builder Section

- Schema file in `sanity/schemas/page-sections/`
- Component file in `features/page-builder/sections/`
- Automatic registration in `page-sections.tsx` and schema index
- Runs `npm run sanity:typegen` and Biome format via `plopfile.mjs`

### Prefix Page Route

- Schema file in `sanity/schemas/documents/`
- Schema registration in `sanity/schemas/index.ts`
- Studio structure entry in `sanity/structure.tsx`
- Route file in `app/(web)/{prefix}/[slug]/page.tsx`
- Runs `npm run sanity:typegen` and Biome format via `plopfile.mjs`

This generator scaffolds routes like `/{prefix}/{slug}` (for example `/articles/my-post`) and wires a matching Sanity document type.

### Rich Text Block

- Schema file in `sanity/schemas/fields/create-rich-text/blocks/`
- Component file in `features/rich-text/blocks/`
- GROQ fragment file
- Automatic registration in schema and component indexes
- Runs `npm run sanity:typegen` and Biome format via `plopfile.mjs`

## Why Use It

- Consistent patterns across the codebase
- Less boilerplate work
- Fewer manual registration mistakes
