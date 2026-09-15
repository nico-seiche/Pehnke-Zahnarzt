# Advanced patterns

Use when simpler patterns (e.g. Mantine hooks, stable callbacks) are insufficient. All guidance is **in this file**.

## `useEffectEvent` and dependency arrays

Do not place **`useEffectEvent`** results in dependency arrays incorrectly—follow current React docs for the API in your version.

## Handlers in refs for stable subscriptions

Store **handlers in refs** when effects subscribe once but must call the **latest** handler (stable subscription, fresh logic). See **mantine-hooks** before hand-rolling.

## One-time app initialization

Initialize **app-wide** client state once per load (not per mount) when the effect would be wasteful or duplicated—use patterns appropriate to SSR (no double-init bugs).

## Latest callback ref (`useLatest`-style)

**useLatest**-style pattern for stable ref to latest callback—useful for intervals/subscriptions; prefer established hooks when available.

**Note:** **`useEffectEvent`** availability depends on React version—verify before adopting.
