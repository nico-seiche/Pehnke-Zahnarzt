# The Content Architecture

A modern Next.js 16 starter with Sanity CMS integration.

## Features

- Next.js 16 with App Router and Server Components
- Sanity CMS with in-app Studio
- TypeScript 6, Tailwind CSS 4, and Biome
- Reusable components, page builder sections, and rich text blocks
- Draft mode with Sanity Live, SEO helpers, and ISR revalidation
- **HTTP Basic Auth (optional)** — `proxy.ts` gates the site or individual URLs using **`BASIC_AUTH_*` environment variables** and **CMS toggles** (Site → Security, per-entry “Password protect”). See [`docs/features/basic-auth.md`](docs/features/basic-auth.md).
- Feature modules for redirects, Umami analytics, and spam prevention
- **llms.txt for AI assistants**: an editable, AI-generated [`/llms.txt`](https://llmstxt.org) drafted from your content with Sanity Agent Actions (Site, Agents tab). See [`docs/features/llms-txt.md`](docs/features/llms-txt.md).
- **Agent Markdown (content negotiation)**: pages and articles serve a token-light Markdown version to agents that send `Accept: text/markdown`, on the same URL. Generated and stored per page from the Agents tab (one click), then served verbatim. See [`docs/features/agent-markdown.md`](docs/features/agent-markdown.md).
- Scaffolding via Plop for repeatable section/block generation
- Starter **seed dataset** (`seed/`) so a new project boots with example content
- [`@mantine/hooks`](https://mantine.dev/hooks/getting-started/) for shared React hooks; `features/dom/use-breakpoint.ts` wraps [`useMediaQuery`](https://mantine.dev/hooks/use-media-query/) for Tailwind-aligned breakpoints and touch detection, alongside `constants` / `parseResponsiveValues`

## Getting Started

**New here? Start with [`GETTING-STARTED.md`](GETTING-STARTED.md).** It is the guided, top to bottom path from a fresh clone to your first rendered section. The sections below are the reference.

### Prerequisites

- Node.js >= 24.15.0
- npm >= 11.6.2

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file and add at least:

```env
SANITY_API_VIEW_TOKEN=your-view-token
SANITY_API_EDIT_TOKEN=your-edit-token
SANITY_REVALIDATE_SECRET=your-revalidate-secret
RESEND_API_KEY=your-resend-api-key
RESEND_EMAIL_FROM=notifications@your-domain.com
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_API_VERSION=2025-02-19
NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH=/studio
```

`NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` is the **public** URL for Studio. The Next.js app mounts Studio under `app/sanity-studio/…`; `next.config.ts` rewrites the public path to that folder. If a **content page** must use the same path (e.g. you need `/studio` for a page), set this variable to a different path (e.g. `/admin`) in every environment. See [`docs/sanity/studio-and-structure.md`](docs/sanity/studio-and-structure.md#public-url-rewrites-and-reserved-paths).

### HTTP Basic Auth (optional)

For staging or client-review gates, set **`BASIC_AUTH_USERNAME`** and **`BASIC_AUTH_PASSWORD`** in the same environment as the app (local `.env` or your host’s secrets). Turn protection on in **Sanity** (site-wide and/or per document with “Password protect”); credentials are **not** stored in the CMS. Full behavior, exclusions, and Draft Mode bypass: [`docs/features/basic-auth.md`](docs/features/basic-auth.md).

### Seed starter content (optional)

With the CLI authenticated (`npm run sanity:cli -- login`), load the bundled example content into your dataset:

```bash
npm run sanity:dataset-import -- --file seed/seed-dataset.tar.gz
```

See [`docs/sanity/seed-dataset.md`](docs/sanity/seed-dataset.md).

### Development

```bash
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Studio: `http://localhost:3000` + your `NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH` (see [`docs/sanity/studio-and-structure.md`](docs/sanity/studio-and-structure.md#public-url-rewrites-and-reserved-paths))

### Build

```bash
npm run build
npm run start
```

## Docs

Feature-level docs now live in `docs/` so the root README stays lightweight.

- Documentation hub: `docs/README.md`
- Sanity setup overview: `docs/sanity/README.md`
- **HTTP Basic Auth** (env + CMS toggles, `proxy.ts`): `docs/features/basic-auth.md`
- Redirects: `docs/features/redirects.md`
- Code generation (Plop): `docs/features/code-generation.md`
- Spam prevention: `docs/features/spam-prevention.md`
- Animated content (`AnimatedText`, motion wrappers, gating): `docs/features/animated-content.md`
- Contact form notifications: `docs/features/contact-form-notifications.md`
- Umami tracking: `docs/features/umami-tracking.md`
- llms.txt and AI agents (Site, Agents tab, Sanity Agent Actions): `docs/features/llms-txt.md`
- Agent Markdown (per-page Markdown via `Accept`-header content negotiation, `proxy.ts`): `docs/features/agent-markdown.md`
- Git hooks: `docs/features/git-hooks.md`
- Agent skills: `docs/features/agent-skills.md`
- Dataset export, import, and migration: `docs/sanity/dataset-migration.md`
- Seed dataset (starter content): `docs/sanity/seed-dataset.md`
- Sanity project setup (CLI bootstrap): `docs/sanity/project-setup.md`

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run check.types`: TypeScript type checking
- `npm run check`: Run all checks
- `npm run format`: Format with Biome
- `npm run sanity:typegen`: Generate Sanity types
- `npm run plop`: Scaffold new sections and rich text blocks
- `npm run sanity:cli`: Run the Sanity CLI with `.env` loaded (via dotenvx)
- `npm run sanity:dataset-export`: Backup a dataset to `./backups/` (see `docs/sanity/dataset-migration.md`)
- `npm run sanity:dataset-import`: Restore a `.tar.gz` into a dataset, interactive (see `docs/sanity/dataset-migration.md`)
- `npm run sanity:dataset-migrate`: Copy one dataset into another with confirmations (see `docs/sanity/dataset-migration.md`)
- `npm run sanity:project-setup`: Interactive wizard for a Sanity project, tokens, CORS, revalidate webhook, and `.env` (see `docs/sanity/project-setup.md`)

## Project Structure

```text
.
|-- app/                 # Next.js App Router
|-- components/          # Shared React components
|-- features/            # Feature modules
|-- public/              # Static assets
|-- sanity/              # Sanity config, schema, structure
|-- seed/                # Starter dataset shipped with the template
|-- scripts/sanity-dataset/  # Dataset export & migration CLIs
|-- scripts/sanity-project-setup/  # Sanity project bootstrap (tokens, CORS, webhook, .env)
|-- docs/                # Project documentation
|-- proxy.ts             # Next.js 16 Proxy (Basic Auth: env credentials + CMS toggles)
|-- next.config.ts      # Next.js config and redirects
`-- env.ts               # Typed environment config
```

## Agent Skills

AI guidance for this repository lives in `AGENTS.md` and `.agents/skills/`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT
