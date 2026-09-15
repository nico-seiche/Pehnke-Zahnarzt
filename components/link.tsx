"use client";

import type { UrlObject } from "node:url";
import { useLenis } from "lenis/react";
import { stegaClean } from "next-sanity";
import type * as ReactTypes from "react";
import {
  hrefToString,
  isLocalNavigationHref,
  shouldPreserveDefault,
  Link as VTLink,
} from "~/features/view-transition/app-view-transitions";

/**
 * True when a link points at the page we are already on (same path and query, no hash anchor), so the
 * click should smooth-scroll to the top instead of navigating. Hash anchors return `false` (they scroll
 * to a section). This is a scroll behavior, not a view transition. Client-only (reads `window`).
 */
function isSamePagePath(href: string | UrlObject, as?: string | UrlObject): boolean {
  const s = hrefToString(as || href);

  if (s.startsWith("#")) {
    return false;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    const url = new URL(s, window.location.href);
    return url.pathname === window.location.pathname && url.hash === "" && url.search === window.location.search;
  } catch {
    return false;
  }
}

export function Link({ onClick, href: rawHref, as: rawAs, ...rest }: ReactTypes.ComponentProps<typeof VTLink>) {
  const lenis = useLenis();

  // In Sanity preview (Draft Mode) stega encodes invisible characters into string hrefs. They break
  // hash-to-id matching (the section id carries its own payload) and same-page URL comparison, so
  // strip them before routing or rendering. No-op outside preview.
  const href = typeof rawHref === "string" ? stegaClean(rawHref) : rawHref;
  const as = typeof rawAs === "string" ? stegaClean(rawAs) : rawAs;

  const handleClick = (e: ReactTypes.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);

    if (e.defaultPrevented) {
      return;
    }

    if (!isLocalNavigationHref(href, as) || shouldPreserveDefault(e)) {
      return;
    }

    // A link to the page we are already on: smooth-scroll to the top instead of navigating.
    // All transition behavior (cross-page nav, same-page hash, modal params) lives inside `VTLink`.
    if (isSamePagePath(href, as)) {
      e.preventDefault();

      if (lenis) {
        lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return <VTLink {...rest} href={href} as={as} onClick={handleClick} />;
}
