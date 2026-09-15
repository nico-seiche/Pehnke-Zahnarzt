# Agent Actions (Sanity AI generation)

This project generates content with AI using **Sanity Agent Actions**, the developer API on `@sanity/client` (`client.agent.action.*`). The first use is the AI-drafted [`/llms.txt`](../features/llms-txt.md). This page documents the reusable pattern so you can add more AI-generated fields without re-deriving the wiring.

## Which Sanity AI surface this is

Sanity ships three AI surfaces; this repo uses the last one in code:

- **Content Agent**: the conversational assistant in the Sanity Dashboard. Project-wide, human-driven, not embeddable.
- **AI Assist** (`@sanity/assist`): a Studio plugin that adds inline AI and custom field actions. Requires the plugin and a paid plan, and field actions that write need a deployed `schemaId`.
- **Agent Actions**: the programmatic API. We call it from a server route. This is what powers the Generate buttons in this codebase.

Within Agent Actions:

| Action | Writes to a document? | Needs `schemaId`? | Used here |
| --- | --- | --- | --- |
| `generate` | yes (structured fields) | yes | no |
| `transform` | yes (rewrites fields) | yes | no |
| `prompt` | no (returns a string or JSON) | no | **yes** |

**Why `prompt`.** It returns Markdown text we fully control, needs no deployed schema, needs no extra plugin or plan tier beyond AI being enabled, and reuses the existing `SANITY_API_EDIT_TOKEN`. We perform the write ourselves with `onChange(set(...))`, which matches the established `SeoImageInput` precedent (custom input button calls a same-origin route, then writes the result). It also keeps the GROQ context and output format in our code instead of in Studio configuration.

## The pattern: button to route to onChange

```
Custom input (Studio)            Server route (App Router)
┌──────────────────────┐  POST   ┌────────────────────────────────┐
│ field + Generate ────┼────────▶│ 1. isApiAuthorized(req)        │
│                      │         │ 2. fetch context via GROQ      │
│ onChange(set(text)) ◀┼─────────┤    (edit token, drafts)        │
└──────────────────────┘ { text }│ 3. agent.action.prompt(...)    │
                                 └────────────────────────────────┘
```

Files for the llms.txt implementation, reuse them as the template:

| Role | File |
| --- | --- |
| Custom input button | [`sanity/inputs/llms-txt-input.tsx`](../../sanity/inputs/llms-txt-input.tsx) |
| Endpoint path (config seam) | [`sanity/config.ts`](../../sanity/config.ts), `endpoints.generateLlmsTxt` |
| GROQ context query | [`features/agents/query.ts`](../../features/agents/query.ts), `LlmsTxtInventoryQuery` |
| Server route (the Agent Action) | [`app/api/agents/llms-txt/route.ts`](../../app/api/agents/llms-txt/route.ts) |

## Requirements

- **Sanity AI / Agent Actions enabled** on the project. This is a paid capability that consumes AI credits. If it is off, the route returns the error Sanity reports and the editor can author the field by hand.
- **`SANITY_API_EDIT_TOKEN`** (already in [`env.ts`](../../env.ts)). The route uses it server-side; the read-only `SANITY_API_VIEW_TOKEN` cannot run Agent Actions.
- **API version `vX`.** Agent Actions are only available on the experimental `vX` channel, so the agent client is created with `apiVersion: "vX"` even though the rest of the app uses a dated version.

## Add a new AI-generated field (recipe)

Using the llms.txt feature as the reference:

1. **Schema field.** Add the field and attach a custom input with `components: { input: MyInput }`. Group it sensibly on its document (the llms.txt field lives in the Site Agents tab, inside the `llms` object). See [Schema and Content Model](./schema-and-content-model.md).
2. **Custom input.** Copy `sanity/inputs/llms-txt-input.tsx`. It renders `props.renderDefault(props)` plus a button, POSTs to the route, and writes the result with `onChange(set(text))`. Read sibling fields with `useFormValue([...])` if the prompt needs them.
3. **Endpoint path.** Add it to `endpoints` in `sanity/config.ts` (the Studio reads endpoints from there for portability; do not hardcode `/api/...` in the input).
4. **Context query.** Write a `defineQuery` in `features/<feature>/query.ts` that returns exactly what the model needs. Keep projections small. Run `npm run sanity:typegen` so the result type exists.
5. **Server route.** Copy `app/api/agents/llms-txt/route.ts`:
   - Guard with `isApiAuthorized(req)` from `~/features/api/auth`.
   - Create an edit client with `createClient({ token: env.SANITY_API_EDIT_TOKEN, ... })`.
   - Fetch context with `.withConfig({ perspective: "drafts" })` if the editor should generate from work in progress.
   - Build any URLs or IDs in code and pass them as `instructionParams` (type `constant`), so the model cannot invent them.
   - Call `client.withConfig({ apiVersion: "vX" }).agent.action.prompt({ instruction, instructionParams, temperature })`.
   - Return `{ text }` (or `{ error }` with a non-200 status).
6. **Verify.** Run `npm run sanity:typegen`, then `npm run check.types` and `npm run check`.

## Instruction tips

- Pass data as `instructionParams` referenced with `$name` in the instruction. Supported types: `constant`, `field`, `document`, and `groq` (see the [Sanity instructions docs](https://www.sanity.io/docs/agent-actions/instructions)). This repo prefers building a `constant` payload in code for full control.
- Keep instructions and context within model limits; trim large bodies before sending.
- Use a low `temperature` (the llms.txt route uses `0.2`) for predictable, format-stable output.
- For `prompt`, set `format: "json"` and include the word "JSON" plus an example shape when you need structured output instead of text.

## Pitfalls

- **Always guard the route.** Without `isApiAuthorized`, anonymous callers can spend AI credits.
- **Never trust model URLs or IDs.** Construct them in code and pass them in.
- **`prompt` is an experimental Sanity API.** Keep each call isolated in one route so a future shape change is contained.
- **Drafts vs published.** Generating under the `drafts` perspective reflects unpublished edits, which can list URLs that are not live yet. The editor reviews before publishing; document this where it matters (the llms.txt serve route reads published only).

## Related

- [llms.txt and AI agents](../features/llms-txt.md): the first feature built on this pattern.
- [Fetching, GROQ, and Types](./fetching-groq-and-types.md): query and typegen conventions.
- [Revalidation and Caching](./revalidation-and-caching.md): how the served output is tag-invalidated.
- Sanity docs: [Agent Actions](https://www.sanity.io/docs/agent-actions), [Prompt quick start](https://www.sanity.io/docs/agent-actions/prompt-quickstart).
