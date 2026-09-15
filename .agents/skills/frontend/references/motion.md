# Motion

- **Import**: `'use client'`; `import { motion } from 'motion/react'`.
- **Reduced motion**: When branching on **`prefers-reduced-motion`** in TSX, **`usePrefersReducedMotion`** from **`~/features/motion/use-prefers-reduced-motion`** (`useSyncExternalStore` + stable server snapshot). **Do not** use **`useReducedMotion()`** from **`motion/react`** for that — it can mismatch SSR/hydration under Strict Mode. Other Motion hooks (**`useScroll`**, **`useInView`**, **`useAnimate`**, …) stay as-is.
- **Usage**: Animate `transform` and `opacity` for performance.
- **Works with Lenis**: Motion's `useScroll` works with Lenis; no extra config.
- **Resources**: [motion.dev/docs](https://motion.dev/docs), React quick start.
