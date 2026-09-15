import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onStoreChange);

  return () => {
    mq.removeEventListener("change", onStoreChange);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(QUERY).matches;
}

/**
 * `prefers-reduced-motion` via `useSyncExternalStore` so SSR and the hydration pass use a stable
 * server snapshot (see React docs: `getServerSnapshot`). Motion’s `useReducedMotion` uses
 * `useState(init)` and can diverge from SSR under Strict Mode.
 */
function getServerSnapshot(): boolean {
  return false;
}

/** `true` when the user prefers reduced motion. Safe with SSR and hydration. */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
