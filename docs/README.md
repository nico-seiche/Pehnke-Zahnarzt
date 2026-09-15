# Documentation

This folder contains focused documentation for individual features and workflows.

## Start Here

Use this path if you are new to the repository:

1. New to this project? Follow [`GETTING-STARTED.md`](../GETTING-STARTED.md) first: a guided path from a fresh clone to your first rendered section.
2. Read the project-level overview in `README.md`
3. Read [Sanity Setup Overview](./sanity/README.md)
4. Read [Contributor Workflow](./sanity/contributor-workflow.md)
5. Use the task index below to jump to your specific job

## Deployment

- Self-host on Alphanauten Hetzner managed hosting (Node.js configuration): standalone build, asset copy, env vars, Sanity wiring -> [Deployment](./deployment.md)

## Security and access

- **HTTP Basic Auth** — Optional site-wide or per-URL gate: **`BASIC_AUTH_USERNAME`** / **`BASIC_AUTH_PASSWORD`** in deployment env; **Site** and per-entry toggles in Sanity. Implemented in root **`proxy.ts`** (`getSanityBasicAuthState()`). Details: [Basic Authentication](./features/basic-auth.md).

## Common Tasks

- Understand overall CMS architecture -> [Sanity Setup Overview](./sanity/README.md)
- Configure Studio behavior, public URL, rewrites, and reserved paths -> [Studio Config and Structure](./sanity/studio-and-structure.md) (start at [Public URL, rewrites, and reserved paths](./sanity/studio-and-structure.md#public-url-rewrites-and-reserved-paths))
- Change document/field models -> [Schema and Content Model](./sanity/schema-and-content-model.md)
- Update queries or generated type contracts -> [Fetching, GROQ, and Types](./sanity/fetching-groq-and-types.md)
- Troubleshoot preview and draft content -> [Draft Mode and Visual Editing](./sanity/draft-mode-and-visual-editing.md)
- Debug stale content and webhook invalidation -> [Revalidation and Caching](./sanity/revalidation-and-caching.md)
- Back up, restore, or copy Sanity datasets -> [Dataset export, import, and migration](./sanity/dataset-migration.md)
- Seed a new dataset with the bundled starter content -> [Seed dataset](./sanity/seed-dataset.md)
- Bootstrap a new Sanity project (tokens, CORS, webhook, `.env`) -> [Sanity project setup](./sanity/project-setup.md)
- Scaffold new route/section/block -> [Code Generation (Plop)](./features/code-generation.md)
- Set up HTTP Basic Auth (staging / optional site or per-URL protection) -> [Basic Authentication](./features/basic-auth.md)
- Manage redirect behavior -> [Redirects](./features/redirects.md)
- Add form anti-spam protection -> [Spam Prevention](./features/spam-prevention.md)
- Configure contact form email notifications -> [Contact Form Notifications](./features/contact-form-notifications.md)
- Add analytics tracking events -> [Umami Tracking](./features/umami-tracking.md)
- Generate and serve an llms.txt for AI assistants -> [llms.txt and AI agents](./features/llms-txt.md)
- Serve a Markdown version of pages to AI agents (content negotiation) -> [Agent Markdown](./features/agent-markdown.md)
- Add an AI-generated field (Sanity Agent Actions pattern) -> [Agent Actions](./sanity/agent-actions.md)
- Let AI agents inspect the Next.js runtime or drive Chrome (performance, animations, rendering) -> [MCP Servers](./features/mcp-servers.md)
- Maintain animated content / motion entrances -> [Animated content](./features/animated-content.md)
- Change route view transitions or navigation timing -> [View transitions](./features/view-transitions.md)

## Sanity Docs

- [Sanity Setup Overview](./sanity/README.md)
- [Studio Config and Structure](./sanity/studio-and-structure.md)
- [Schema and Content Model](./sanity/schema-and-content-model.md)
- [Fetching, GROQ, and Types](./sanity/fetching-groq-and-types.md)
- [Draft Mode and Visual Editing](./sanity/draft-mode-and-visual-editing.md)
- [Revalidation and Caching](./sanity/revalidation-and-caching.md)
- [Agent Actions (Sanity AI generation)](./sanity/agent-actions.md)
- [Dataset export, import, and migration](./sanity/dataset-migration.md)
- [Seed dataset (starter content)](./sanity/seed-dataset.md)
- [Sanity project setup](./sanity/project-setup.md)
- [Contributor Workflow](./sanity/contributor-workflow.md)

## Feature Docs

- [Basic Authentication](./features/basic-auth.md) — env credentials + CMS toggles (`proxy.ts`, `features/auth/sanity-basic-auth-proxy.ts`; parity with **blink** starter)
- [Redirects](./features/redirects.md)
- [Code Generation (Plop)](./features/code-generation.md)
- [Spam Prevention](./features/spam-prevention.md)
- [Contact Form Notifications](./features/contact-form-notifications.md)
- [Umami Tracking](./features/umami-tracking.md)
- [Animated content](./features/animated-content.md)
- [View transitions](./features/view-transitions.md)
- [llms.txt and AI agents](./features/llms-txt.md): AI-generated `/llms.txt`, editable in the Site Agents tab (Sanity Agent Actions)
- [Agent Markdown](./features/agent-markdown.md): per-page Markdown for agents via `Accept`-header content negotiation (`proxy.ts`); generated and stored per page, toggled in the Agents tab
- [Git Hooks](./features/git-hooks.md)
- [Agent Skills](./features/agent-skills.md)
- [MCP Servers](./features/mcp-servers.md): project-scoped `.mcp.json` servers (next-devtools, chrome-devtools) for Next.js runtime introspection and browser-driven testing
