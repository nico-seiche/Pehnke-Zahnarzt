---
name: code-style
description: Readable TypeScript/React conventions—`type` over `interface`, React 19 `ref` as a prop (no forwardRef), braced control-flow with intentional spacing, Tailwind/className extraction only when duplicated more than twice, `isolate` for parents of z-indexed layers, component file layout (no re-export-only `index.ts`, prefer flat files when a folder would hold a single component), and **`run()`** from `~/features/utils/common` for heavy conditional JSX and scoped Server Component logic. Use when editing JavaScript/TypeScript/React or when the user asks for consistent style, readability, naming, or `run`-based conditional rendering.
---

# Code style

## Core Rules

- Prefer `type` over `interface` for object shapes and props.
- Use React 19 `ref` as a prop (no `forwardRef`).
- Braced `if`/`else` with intentional spacing; prefer early returns.
- Extract Tailwind/className strings only when duplicated more than twice; use `isolate` for parents of z-indexed layers.
- Prefer flat component files or justified folders; no re-export-only `index.ts`.
- Use **`run()`** from `~/features/utils/common` for heavy conditional JSX and scoped Server Component logic (see Detailed conventions).

## Trigger Conditions

Apply when editing **TypeScript/JavaScript/React** in this repo or when the user asks for consistent style, readability, naming, or `run()`-based conditional rendering.

## Execution Checklist

1. Match existing patterns in the touched files.
2. Run `npm run check.types` after substantive edits.
3. Run `npm run check` (Biome) when formatting or control-flow style changes.

## Scope Guidance

- **frontend**: Pairs when the change is conditional UI in Client Components.
- **sanity** / **scaffolding-plop**: Not the primary owner of `run()`; use only if conditional rendering in those areas needs the same pattern.

## Non-Goals

- Replacing project-specific conventions in other skills (frontend, sanity, mantine-hooks, view-transitions).
- Drive-by reformatting unrelated files.

## Done Criteria

- No unnecessary `useMemo`/`useCallback` bodies wrapped in `run()` without justification.
- `run` imports from `~/features/utils/common` only (single source of truth).
- Braced branches and spacing follow the if-statement rules in Detailed conventions where control flow is touched.

## Reference Files

- None — this skill is self-contained under Detailed conventions.

## Detailed conventions

Conventions for a consistent, readable codebase. Sections below include control-flow formatting, TypeScript aliases, React refs, and the **`run()`** helper for conditional JSX.

### React: `ref` as a prop (React 19)

- **Do not use `React.forwardRef`.** In React 19, pass `ref` on the props object and destructure it like any other prop.
- Add `ref?: React.Ref<HTMLElement>` (or the concrete element type) to the component’s props `type`.
- Forward it to the DOM element or child that should receive the ref.

```tsx
import * as React from "react";

type DialogProps = {
  ref?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
};

export function Dialog({ ref, children }: DialogProps) {
  return <div ref={ref}>{children}</div>;
}
```

### TypeScript: `type` vs `interface`

- **Never use `interface`.** Use `type` for object shapes, props, and component contracts (including optional fields and intersections).
- Prefer `export type Name = { ... }` for exported prop types.

```ts
// Avoid
interface ButtonProps {
  label: string;
}

// Use
type ButtonProps = {
  label: string;
};
```

### If statement readability

#### Core rules

- Never use one-line `if` statements.
- Always use braces for every `if`, `else if`, and `else` branch, even for single statements.
- Keep conditional expressions readable; extract complex conditions into well-named booleans when needed.
- Prefer early returns to reduce nesting depth.

#### Spacing rules

- **General rule:** Treat every **braced** `if` / `else` block as its own visual unit. Use **blank lines** before and after that unit when the surrounding code is a **different** step (assignment, another `if`, a `return` that isn’t the only line of the block, etc.).
- **Back-to-back `if` blocks** that are **not** `else if` / `else` (independent conditions): put **one blank line between** each closing `}` and the next `if` — whether the branches use early `return`, mutate state, or call functions.
- **Same chain:** Do **not** insert blank lines between `if` → `else if` → `else`; those branches stay contiguous.
- **After a braced block:** Add a blank line before the next statement when it starts a new concern (including the “main” body after one or more leading `if` blocks).
- **Comment → `if`:** Do **not** add a blank line between a **full-line** comment (`//`, `/* … */`, JSDoc ` * …`) and the following `if`; the `if` stays directly under the comment.

#### Rewrite patterns

##### One-liner to block

```ts
// Avoid
if (!user) return null;

// Use
if (!user) {
  return null;
}
```

##### Separate concerns with vertical space

```ts
const isPublished = post.status === "published";

if (!isPublished) {
  return null;
}

const authorName = post.author?.name ?? "Unknown";
```

##### Keep branches visually connected

```ts
if (status === "success") {
  return "ok";
} else if (status === "error") {
  return "failed";
} else {
  return "pending";
}
```

##### Multiple independent braced `if` blocks

Same spacing whether the branches return early or run other logic:

```ts
const onPointerUpOrCancel = (e: PointerEvent) => {
  if (e.type === "pointerup" && e.button !== 0) {
    return;
  }

  if (!pointerHeldOnBackground) {
    return;
  }

  pointerHeldOnBackground = false;
  updateLabelFromPointer(e);
};
```

```ts
if (cache.has(key)) {
  return cache.get(key);
}

if (shouldRefresh) {
  await refresh();
}

return compute();
```

#### Application checklist

1. Convert any one-line `if` statements to braced blocks.
2. Ensure every branch in each conditional chain uses braces.
3. Add or remove blank lines so each conditional reads as a clear visual unit.
4. Re-check surrounding code so spacing reflects logical grouping, not personal preference.

### Component files and folders (`components/`)

- **Do not add `index.ts` (or `index.js`) that only re-exports** other modules. If the primary export is a client component, use **`index.tsx`** in that folder (or a single named `*.tsx` file at the root of `components/`).
- **Prefer a single flat file** `components/<name>.tsx` when the feature is **one component** and there are no colocated helpers (e.g. `components/my-widget.tsx`).
- **Use a folder** `components/<name>/` when the feature is **multiple files** that belong together (e.g. `index.tsx` for the client UI + **`actions.ts`** for `"use server"` handlers, or multiple subcomponents). Do **not** create a folder whose only TS module is one component unless a second file (server actions, tests, etc.) justifies it.

### Tailwind / `className` strings

- **Inline** `className` (and similar string literals passed to `cx`, `cva`, etc.) **at the use site** when the same class string appears **once or twice**.
- **Extract** a `const` (or shared fragment) only when the **same** class string is needed **more than twice** (three or more call sites). Then one named constant is justified.
- Rationale: indirection for a single JSX node or a duplicate adds jump-to-definition noise without reducing duplication meaningfully.

### Stacking contexts (`z-index`)

- When an element uses a `z-*` / `-z-*` utility (or non-zero `z-index` in CSS), ensure an **ancestor** establishes a stacking context—typically the **immediate parent** of the z-indexed node—with Tailwind’s **`isolate`** (`isolation: isolate`) unless a parent already provides one (e.g. `isolate` on a section wrapper).
- Do not rely on z-index alone crossing unrelated parts of the tree; `isolate` keeps layering predictable within that subtree.

### The `run()` helper

Use this section when refactoring or writing **conditional React JSX**, parallel render branches (e.g. static vs motion), or scoped async/try blocks in Server Components. **Not** the primary topic for schema, Plop scaffolding, or pure runtime animation APIs alone.

#### What `run` is

Defined in `~/features/utils/common`:

```ts
export function run<T>(fn: () => T): T {
  return fn();
}
```

It runs a function immediately and returns the result, like an IIFE, but readable in JSX and fully typed.

Import: `import { run } from "~/features/utils/common"`.

#### When to use

- **Nested or long ternary chains** in JSX; replace with `run(() => { ... })` and **early returns** per branch.
- **Type narrowing**: sequential `if` returns inside the callback so TypeScript narrows unions (e.g. discriminated `state.kind`, optional `user`).
- **Parallel UI branches** without duplicating structure in JSX (e.g. `still ? map(static) : map(motion)` -> one `run` per column or one block with early-style branches).
- **Server Components**: wrap `async` fetch/parse in `await run(async () => { ... })` with try/catch and `return null` early so the outer component stays short.

Use **`run` in JSX** or for a **small block before `return`** in a component when a plain function body would force hoisting awkwardly or you want the logic colocated with the slot it fills.

#### When not to use

- **Inside an existing callback** (`useMemo`, `useCallback`, event handlers) - that body already supports `if` / early returns; no need for `run` unless it clearly improves a one-off.
- **Top-level component body** - use normal `if` and `const` assignments; reserve `run` for JSX slots or tight scoped blocks.
- **Trivial conditions** - `condition && <X />` or a short ternary is enough.

#### Practices

- Keep each `run` callback **short**; **extract** a helper or subcomponent if it grows.
- Prefer `run` when JSX conditional branch count is 3+ (or you already have 2+ chained ternaries) or nested ternary depth > 1.
- Repo examples: `components/page-hero.tsx` (motion vs static CTA), `components/ingredients-view.tsx` (column children via `run`).

#### JSX pattern

```tsx
{
  run(() => {
    if (state.kind === "loading") {
      return <Spinner />;
    }

    if (state.kind === "error") {
      return state.retryable ? <RetryError /> : <ErrorView />;
    }

    if (state.user?.isAdmin) {
      return <AdminDashboard />;
    }

    if (state.user) {
      return <Dashboard user={state.user} />;
    }

    return <SignIn />;
  });
}
```

#### Server Component pattern

```tsx
const list = await run(async () => {
  try {
    const res = await fetch(`/api/lists/${id}`);

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
  }
});

if (!list) {
  return null;
}
```

#### Checklist for `run` changes

- `run` imports from `~/features/utils/common` only (single source of truth).
- No unnecessary `run` inside `useMemo`/`useCallback` bodies without justification.
- Braced branches and spacing follow the **if statement readability** rules above where you touch control flow.
