# Component Architecture

- **Server first**: Fetch in Server Components with async/await; pass data as props. Add `'use client'` only for events, hooks, browser APIs.
- **Styling**: `cva`, `cx`, `compose` from `~/features/style/utils`. Prefer `cx([...])`. Text tokens: `title`, `subtitle`, `body`, `caption`.
- **Path alias**: `~/` for all absolute imports. No deep relative paths when alias is possible.
- **Exports**: Named exports except where Next.js requires default (layout, page, not-found, route handlers).
- **Hooks**: Prefer [`@mantine/hooks`](https://mantine.dev/hooks/getting-started/) for reusable DOM/React hooks; `~/features/dom/` supplies `useBreakpoint` / `useIsTouchDevice` (`use-breakpoint.ts`), `KeyboardFocusMode` (`keyboard-focus-mode.tsx`), `constants`, and `parseResponsiveValues` (`utils.ts`). Use `useLenis` from `lenis/react` for smooth scroll.
- **Utils**: `run`, `getObjectKeys` from `~/features/utils/common`; `parseResponsiveValues` from `~/features/dom/utils`. Keep `screens` in `~/features/dom/constants.ts` in sync with Tailwind.
- **SVG**: Component `import Icon from "./icon.svg"`; URL `import iconUrl from "./icon.svg?url"`.
- **Example**: Use `VariantProps<typeof styles>` with `cva` for component props; multi-line early returns and if blocks with braces.
