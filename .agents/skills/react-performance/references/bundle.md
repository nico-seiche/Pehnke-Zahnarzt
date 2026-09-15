# Bundle size

Client bundle size and loading strategy. All guidance is **in this file**.

## Direct imports vs heavy barrels

Prefer **direct imports** from the module that defines the symbol. Heavy `index.ts` barrels can pull in unused code and hurt tree-shaking. Pragmatic exception: thin local barrels used consistently—avoid **mega** barrels.

## Dynamic import for heavy client UI

Use **`next/dynamic`** to lazy-load large components not needed on the first paint.

**Incorrect (heavy editor in main chunk):**

```tsx
import { MonacoEditor } from "./monaco-editor"

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

**Correct (split chunk, load on demand):**

```tsx
import dynamic from "next/dynamic"

const MonacoEditor = dynamic(
  () => import("./monaco-editor").then((m) => m.MonacoEditor),
  { ssr: false },
)

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

Use `ssr: false` when the module requires browser APIs or would bloat the server bundle.

## Defer non-critical third-party code

Defer **analytics, logging, error reporters** until after first paint/hydration when possible (e.g. dynamic import with `ssr: false`, or script strategy aligned with your analytics skill).

## Conditional loading

Load modules **only when a feature is active** (dynamic import inside a branch, split routes, or feature flags).

## Preload on intent

For high-confidence next navigation (e.g. hover/focus on internal links), prefetch **routes** or **critical chunks** as appropriate—balance with network and memory.
