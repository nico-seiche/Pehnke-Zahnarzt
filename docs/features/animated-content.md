# Animated content

This page documents **in-page motion**: **`AnimatedText`** (line-split reveals), Portable Text wrappers in **`features/rich-text`**, and how **draft mode** affects animation.

## `AnimatedText` (`components/animated-text.tsx`)

- Uses [`@activetheory/split-text`](https://github.com/activetheory/split-text) directly. For the line-split path, it waits for `document.fonts.ready`; if the browser Fonts API is unavailable, it falls back to immediate readiness. After `revert()`, we re-apply the host element’s inline **`width` / `max-width` / `min-width`** from before the split (the library touches sizing while measuring; `revert()` only resets `innerHTML`). The intro animation’s completion handler is cancelled when the effect cleans up (Strict Mode / dependency changes) so it doesn’t call `revert` or `setState` after teardown and fight React’s tree.
- Splits text by lines (`type: "lines"`) with balancing disabled (`noBalance: true`).
- **No pre-split DOM mutation:** SplitText runs on the tree React committed (no `\r`→`\n` pass on text nodes).
- **`as` (default `"span"`):** Use **`as="div"`** when wrapping **block-level** trees (e.g. full portable text) so markup stays valid and SplitText can span all line boxes under one root.
- **Breaks are parent-controlled:** the wrapper element's CSS (font, width, `white-space`) determines where lines wrap — `AnimatedText` does not alter the text or its flow.
- **Reduced motion:** When `prefers-reduced-motion` is enabled, `AnimatedText` reveals content without line-split motion.
- **Entrance:** Viewport-triggered one-shot intro via Motion's `onViewportEnter` / `onViewportLeave`, wired through **`useViewportEnteredForGate`** (`features/motion/use-viewport-entered.ts`) with **`whileInView`**. The **`viewport`** prop matches Motion's **`viewport`** API. Defaults to **`MOTION_VIEWPORT`** from **`features/motion/viewport.ts`** when omitted. Pass **`false`** to skip viewport gating.
- **`animationDelay`:** delay before the intro timeline (seconds).
- **Accessibility in split mode:** when lines are split, wrapper gets a readable `aria-label` (`ariaLabel` prop or auto-generated from `children`, with whitespace/newlines collapsed) and each split line gets `aria-hidden="true"` to avoid duplicate announcements.

## `SanityRichText` / `AnimatedSanityRichText` (`features/rich-text/index.tsx`)

Both use the **same** shared Portable Text map (`sanityRichTextPortableTextComponents`): **`hardBreak`**, **`mediaBlock`**, **`inlineMediaField`**, marks, list styles, block headings, etc.

- **`SanityRichText`:** static wrapper (`div`/`span` via **`as`**) — always visible, no **`AnimatedText`**.
- **`AnimatedSanityRichText`:** same body, wrapped in **`AnimatedText`** with **`flex flex-col gap-[1em]`**; line-split and motion follow **`AnimatedText`** (draft / reduced motion). Pass **`AnimatedText`** props (e.g. **`animationDelay`**, **`revert`**, **`viewport`**).
- **No block-edge trimming:** Portable Text turns `\n` in span text into `<br />`. We do **not** strip leading/trailing newlines on the first/last span of a block — that would remove Studio-authored breaks at paragraph edges. If flex `gap` between blocks feels too loose next to intentional `<br />` stacks, adjust spacing in the block component or `gap` on the wrapper rather than mutating the PT value.

## Draft mode (preview)

When **`useDraftMode()`** is true (Next.js draft preview):

- **No SplitText** (`AnimatedText`): `shouldSplitLines` is false, so the DOM is never line-split.
- **No intro motion** (`AnimatedText`): the animation effect bails out; content is not driven through the opacity/y timeline.
- **No viewport trigger** on the motion wrapper (`onViewportEnter` / `viewport` are omitted for `AnimatedText`), so the one-shot reveal pipeline does not run.

Content remains **visible** for editing (`visibility` is not gated the same way as published). See also [Draft Mode and Visual Editing](../sanity/draft-mode-and-visual-editing.md).

## Revert behavior (`AnimatedText`)

- `revert` controls SplitText DOM restoration after the intro completes:
  - `revert={false}` (default): split DOM stays active after intro while mounted.
  - `revert={true}`: split DOM is restored after intro, returning the element to its original `innerHTML`.
- On cleanup (unmount / dep change), SplitText `revert()` runs and host inline sizing (`width` / `max-width` / `min-width`) is restored from the pre-split snapshot.
