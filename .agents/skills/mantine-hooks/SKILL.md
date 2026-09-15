---
name: mantine-hooks
description: Prefer @mantine/hooks for browser listeners, outside-click, open/close state, timers, and other reusable client-side behavior before hand-rolling useEffect + addEventListener. Use when adding ESC handlers, click-outside-to-close, disclosure/modals, window/document events, or similar patterns.
---

# Mantine hooks

## Core Rules

- Prefer **`@mantine/hooks`** for browser listeners, outside-click, disclosure/modals, timers, and other reusable client behavior before hand-rolling `useEffect` + `addEventListener`.
- Import from **`@mantine/hooks`** only; do not duplicate a second hooks kit for the same concerns.
- Compose hooks as needed (for example `useDisclosure` + `useClickOutside` + `useWindowEvent` for floating panels).
- Keep domain logic in your component or small helpers; Mantine hooks own subscription/cleanup.

## Trigger Conditions

Apply when implementing **custom client behavior** that would otherwise use `useEffect` with `window`/`document` listeners, manual cleanup, ref-based outside detection, or similar patterns. This project already depends on **`@mantine/hooks`** (see root `AGENTS.md`).

## Execution Checklist

1. Check [Mantine hooks](https://mantine.dev/hooks/getting-started/) for an existing hook that matches the behavior.
2. Prefer that hook over raw listener stacks when the contract matches.
3. Keep Server Components server-only (no hooks in RSC).
4. Run `npm run check.types` after edits.

## Scope Guidance

- Pair with **frontend** when the change is broader runtime UI (Lenis, Motion, layout).
- Pair with **code-style** when refactoring conditional JSX or `run()` patterns; mantine-hooks does not own `run()`.

## Non-Goals

- Server Components or server-only modules (no hooks).
- Behavior that truly needs a one-off imperative API with no Mantine equivalent (rare; document why).

## Done Criteria

- Subscriptions use Mantine hooks where a suitable hook exists.
- No unnecessary duplicate global listeners when a shared Mantine pattern applies.

## Reference Files

- [useWindowEvent](https://mantine.dev/hooks/use-window-event/) — keyboard / window events (e.g. Escape to dismiss).
- [useClickOutside](https://mantine.dev/hooks/use-click-outside/) — dismiss overlays/dialogs.
- [useDisclosure](https://mantine.dev/hooks/use-disclosure/) — open/close or modal-like state.
- [Hooks index](https://mantine.dev/hooks/getting-started/) — debouncing, intervals, timeouts, viewport size, merged refs, etc.
