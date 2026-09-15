/**
 * App Router + View Transitions API integration.
 *
 * **`document.startViewTransition`** expects its update callback to return a Promise that resolves
 * when the DOM update for the navigation is “done”. We return a Promise that completes in two ways:
 *
 * 1. **`push` / `replace` (normal links and programmatic navigation)** — `triggerTransition` wraps
 *    `router.push` / `replace` in React **`startTransition`**
 *    so the navigation update is scheduled as a transition. Then `setFinishViewTransition` receives a
 *    function that closes over `resolve`; **`ViewTransitions`** stores it and a `useEffect` invokes it,
 *    resolving the Promise so the browser can capture the new state and finish the transition.
 *
 * 2. **Back / forward** — `useBrowserNativeTransitions` listens for `popstate` and starts a matching
 *    transition **only when `window.location.pathname` changes** (real route change). Search/hash-only
 *    history (e.g. lightbox query params) skips `startViewTransition` entirely. Otherwise it keeps a
 *    `[promise, resolver]` pair; while the pathname is catching up, `use()` can suspend on the first
 *    promise; when `pathname` or `hash` updates, an effect calls the resolver so that transition can
 *    complete. Nested Suspense during a route change can still be edge-casey.
 *
 * **`useTransitionRouter`** supplies wrapped `push` / `replace` as above, with **`startTransition`**
 * around the router call so React can coordinate the route update with concurrent rendering (images,
 * Suspense).
 *
 * **`Link`** matches `next/link` props; when View Transitions exist it `preventDefault`s and uses
 * that router for **local** URLs only (`isLocalURL`). External links use the browser default (no VT).
 *
 * **`useTransitionRouter`** `push` / `replace` skip view transitions for non-local `href` strings.
 */
"use client";

import type { UrlObject } from "node:url";
import type { AppRouterInstance, NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { formatUrl } from "next/dist/shared/lib/router/utils/format-url";
import { isLocalURL } from "next/dist/shared/lib/router/utils/is-local-url";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

function useHash() {
  return React.useSyncExternalStore(subscribeHash, getHashSnapshot, getServerHashSnapshot);
}

function getHashSnapshot() {
  return window.location.hash;
}

function getServerHashSnapshot() {
  return "";
}

function subscribeHash(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  return () => {
    window.removeEventListener("hashchange", onStoreChange);
  };
}

export function hrefToString(href: string | UrlObject): string {
  if (typeof href === "string") {
    return href;
  }

  return formatUrl(href);
}

/** Same rules as `next/link` for in-app URLs — `false` for external origins (no view transition / client router). */
export function isLocalNavigationHref(href: string | UrlObject, as?: string | UrlObject): boolean {
  return isLocalURL(hrefToString(as || href));
}

/**
 * Skips the document view transition for same-page param updates (`?…`) and URL-driven modals
 * (`modal` search param), e.g. Sanity `params` links (`?modal=contact`, `/about?modal=contact`).
 * Intended for `click` / client-only use (uses `window` when needed).
 */
export function shouldSkipLinkViewTransition(href: string | UrlObject, as?: string | UrlObject): boolean {
  const s = hrefToString(as || href);

  if (s.startsWith("?")) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const url = new URL(s, window.location.href);
    return url.searchParams.has("modal");
  } catch {
    return false;
  }
}

/**
 * True for a link to a section on the page we are already on (a hash anchor with the same pathname),
 * so the click should scroll to that section (Lenis handles it) and must not run a transition.
 * Cross-page hash links return `false` (they navigate, then land on the section). Client-only.
 */
export function isSamePageHash(href: string | UrlObject, as?: string | UrlObject): boolean {
  const s = hrefToString(as || href);

  if (s.startsWith("#")) {
    return s.length > 1;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const url = new URL(s, window.location.href);
    return url.hash !== "" && url.pathname === window.location.pathname;
  } catch {
    return false;
  }
}

function useBrowserNativeTransitions() {
  const pathname = usePathname();
  const currentPathname = React.useRef(pathname);
  type TransitionFinish = () => void;
  const [currentViewTransition, setCurrentViewTransition] = React.useState<[Promise<void>, TransitionFinish] | null>(null);

  React.useEffect(() => {
    if (!("startViewTransition" in document)) {
      return () => {};
    }

    const onPopState = () => {
      if (window.location.pathname === currentPathname.current) {
        return;
      }

      let pendingViewTransitionResolve!: TransitionFinish;

      const pendingViewTransition = new Promise<void>((resolve) => {
        pendingViewTransitionResolve = resolve;
      });

      const pendingStartViewTransition = new Promise<void>((resolve) => {
        document.startViewTransition(() => {
          resolve();
          return pendingViewTransition;
        });
      });

      setCurrentViewTransition([pendingStartViewTransition, pendingViewTransitionResolve]);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  if (currentViewTransition && currentPathname.current !== pathname) {
    React.use(currentViewTransition[0]);
  }

  const transitionRef = React.useRef(currentViewTransition);

  React.useEffect(() => {
    transitionRef.current = currentViewTransition;
  }, [currentViewTransition]);

  const hash = useHash();

  React.useEffect(() => {
    void hash;
    currentPathname.current = pathname;

    if (transitionRef.current) {
      transitionRef.current[1]();
      transitionRef.current = null;
    }
  }, [hash, pathname]);
}

type SetFinishViewTransition = React.Dispatch<React.SetStateAction<(() => void) | null>>;

const ViewTransitionsContext = React.createContext<SetFinishViewTransition | null>(null);

/**
 * While a route view transition runs, set `data-vt-loading` on <html> so `view-transition.css`
 * shows a wait cursor. Patches `document.startViewTransition` once so links, programmatic
 * navigation, and back/forward are all covered. DOM-only — no React state, no re-renders.
 */
function useViewTransitionLoadingCursor() {
  React.useEffect(() => {
    if (!("startViewTransition" in document)) {
      return;
    }

    const original = document.startViewTransition.bind(document);

    document.startViewTransition = (...args: Parameters<typeof document.startViewTransition>) => {
      const root = document.documentElement;
      root.setAttribute("data-vt-loading", "");

      const transition = original(...args);

      void transition.finished.finally(() => {
        root.removeAttribute("data-vt-loading");
      });

      return transition;
    };

    return () => {
      document.startViewTransition = original;
    };
  }, []);
}

export function ViewTransitions({ children }: Readonly<{ children: React.ReactNode }>) {
  const [finishViewTransition, setFinishViewTransition] = React.useState<(() => void) | null>(null);

  // After DOM commit, before paint — `useEffect` would resolve the VT update promise one frame late.
  React.useLayoutEffect(() => {
    if (finishViewTransition) {
      finishViewTransition();
      setFinishViewTransition(null);
    }
  }, [finishViewTransition]);

  useBrowserNativeTransitions();
  useViewTransitionLoadingCursor();

  return <ViewTransitionsContext.Provider value={setFinishViewTransition}>{children}</ViewTransitionsContext.Provider>;
}

function useSetFinishViewTransition() {
  const context = React.use(ViewTransitionsContext);

  if (!context) {
    throw new Error("useSetFinishViewTransition must be used within a ViewTransitions component");
  }

  return context;
}

type TransitionOptions = {
  onTransitionReady?: () => void;
};

type NavigateOptionsWithTransition = NavigateOptions & TransitionOptions;

type TransitionRouter = AppRouterInstance & {
  push: (href: string, options?: NavigateOptionsWithTransition) => void;
  replace: (href: string, options?: NavigateOptionsWithTransition) => void;
};

export function useTransitionRouter(): TransitionRouter {
  const router = useRouter();
  const finishViewTransition = useSetFinishViewTransition();

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional `[]` — stable setState from context
  const triggerTransition = React.useCallback((cb: () => void, { onTransitionReady }: TransitionOptions = {}) => {
    if (!("startViewTransition" in document)) {
      React.startTransition(() => {
        cb();
      });
      return;
    }

    const transition = document.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          React.startTransition(() => {
            cb();
            finishViewTransition(() => resolve);
          });
        })
    );

    if (onTransitionReady) {
      void transition.ready.then(onTransitionReady).catch(() => {});
    }
  }, []);

  const navigate = React.useCallback(
    (method: "push" | "replace", href: string, options?: NavigateOptionsWithTransition) => {
      const { onTransitionReady, ...opts } = options ?? {};

      if (!isLocalURL(href)) {
        router[method](href, opts);
        return;
      }

      triggerTransition(
        () => {
          router[method](href, opts);
        },
        { onTransitionReady }
      );
    },
    [router, triggerTransition]
  );

  const push = React.useCallback(
    (href: string, options?: NavigateOptionsWithTransition) => navigate("push", href, options),
    [navigate]
  );

  const replace = React.useCallback(
    (href: string, options?: NavigateOptionsWithTransition) => navigate("replace", href, options),
    [navigate]
  );

  return React.useMemo(
    () =>
      ({
        ...router,
        push,
        replace,
      }) as TransitionRouter,
    [router, push, replace]
  );
}

// https://github.com/vercel/next.js/blob/66f8ffaa7a834f6591a12517618dce1fd69784f6/packages/next/src/client/link.tsx#L180-L191
function isModifiedEvent(event: React.MouseEvent) {
  const eventTarget = event.currentTarget;
  const target = eventTarget.getAttribute("target");

  return (
    Boolean(target && target !== "_self") ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.nativeEvent && event.nativeEvent.which === 2)
  );
}

// https://github.com/vercel/next.js/blob/66f8ffaa7a834f6591a12517618dce1fd69784f6/packages/next/src/client/link.tsx#L204-L217
/** Mirrors Next.js `Link` — true when the browser should handle navigation (new tab, modified click, etc.). */
export function shouldPreserveDefault(e: React.MouseEvent) {
  const { nodeName } = e.currentTarget;
  const isAnchorNodeName = nodeName.toUpperCase() === "A";

  if (isAnchorNodeName && isModifiedEvent(e)) {
    return true;
  }

  return false;
}

export function Link(props: React.ComponentProps<typeof NextLink>) {
  const transitionRouter = useTransitionRouter();
  const baseRouter = useRouter();
  const { href, as, replace, scroll } = props;

  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      props.onClick?.(e);

      if (e.defaultPrevented) {
        return;
      }

      if (!isLocalNavigationHref(href, as)) {
        return;
      }

      // Same-page hash/anchor: let Lenis scroll to the section, no view transition.
      if (isSamePageHash(href, as)) {
        return;
      }

      // Same-page param updates / modals navigate without a transition; otherwise use the
      // view-transition router when supported. No VT support → let the browser navigate.
      let navigationRouter: AppRouterInstance | null = null;

      if (shouldSkipLinkViewTransition(href, as)) {
        navigationRouter = baseRouter;
      } else if ("startViewTransition" in document) {
        navigationRouter = transitionRouter;
      }

      if (!navigationRouter || shouldPreserveDefault(e)) {
        return;
      }

      e.preventDefault();
      const navigate = replace ? navigationRouter.replace : navigationRouter.push;

      navigate(hrefToString(as || href), {
        scroll: scroll != null ? scroll : true,
      });
    },
    [props.onClick, href, as, replace, scroll, baseRouter, transitionRouter]
  );

  return <NextLink {...props} onClick={onClick} />;
}
