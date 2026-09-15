# Page Builder Section (Plop)

- **Generator**: "Page Builder Section". Creates a new page builder section (e.g. hero -> heroSection).
- **Prompt**: `name` — section name; names are suffixed with "Section" (e.g. cta -> ctaSection).
- **Creates**: Schema in `sanity/schemas/page-sections/{{kebabCase name}}.tsx`; updates `sanity/schemas/page-sections/index.ts` (import + export); component in `features/page-builder/sections/{{kebabCase name}}.tsx`; updates `features/page-builder/page-sections.tsx` (dynamic import + registry). Runs `npm run sanity:typegen` and format.
- **Templates**: `templates/page-builder-section/schema.tsx.hbs`, `component.tsx.hbs`. Component fetches section by `docId` and `sectionKey` with a query on `pageBuilder.sectionsArray`.
- Reuse an existing section type when it fits; do not scaffold a new one without need.
- Agent Markdown: a section built from the standard factory fields (`appRichText`, `appMedia`, `appLink`, `headline`, `caption`) is served to agents automatically. If you add a **bespoke** content field that agents should read, also project it in `AgentMarkdownContentQuery` and render it in `features/agents/markdown.ts` (see the **agent-markdown** skill).
