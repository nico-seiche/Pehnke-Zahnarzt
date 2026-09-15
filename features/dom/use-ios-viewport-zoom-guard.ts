"use client";

import * as React from "react";

const VIEWPORT_SELECTOR = 'meta[name="viewport"]';

/**
 * iOS Safari zooms the viewport when a focused `<input>` or `<textarea>` uses a **computed** font
 * size below **16px**. Raising the control to 16px is the default fix but can break a deliberate
 * typographic scale (e.g. monospace UI).
 *
 * **Mitigation:** While the control is focused, temporarily set the document viewport meta to
 * include `maximum-scale=1`, which stops that auto-zoom. Restore the previous `content` on blur
 * and on unmount.
 *
 * **Important (iOS):** Safari often applies the zoom *before* `focus` handlers run. Wire
 * **`onTouchStart`** (same behavior as `onFocus`) on the control so the viewport updates in the
 * touch sequence *before* focus—otherwise the guard may have no effect on tap.
 *
 * **Why not set this site-wide?** A global `maximum-scale=1` (or `user-scalable=no`) is discouraged:
 * it blocks pinch-zoom for everyone and hurts accessibility. Use this hook only for the focus
 * lifetime of specific fields.
 */
const IOS_FOCUS_VIEWPORT = "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1";

export function useIosViewportZoomGuard() {
  /** `undefined` = not captured yet for this focus cycle; `null` = attribute was absent. */
  const previousContentRef = React.useRef<string | null | undefined>(undefined);
  const createdMetaRef = React.useRef(false);
  const blurTimeoutRef = React.useRef<number | null>(null);

  const restoreViewport = React.useCallback(() => {
    const meta = document.head.querySelector<HTMLMetaElement>(VIEWPORT_SELECTOR);

    if (createdMetaRef.current) {
      meta?.remove();
      createdMetaRef.current = false;
      previousContentRef.current = undefined;

      return;
    }

    if (!meta || previousContentRef.current === undefined) {
      return;
    }

    const previous = previousContentRef.current;
    previousContentRef.current = undefined;

    if (previous === null) {
      meta.removeAttribute("content");
    } else {
      meta.setAttribute("content", previous);
      meta.content = previous;
    }
  }, []);

  const applyViewport = React.useCallback(() => {
    let meta = document.head.querySelector<HTMLMetaElement>(VIEWPORT_SELECTOR);

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "viewport");
      meta.setAttribute("content", IOS_FOCUS_VIEWPORT);
      meta.content = IOS_FOCUS_VIEWPORT;
      document.head.appendChild(meta);
      createdMetaRef.current = true;

      return;
    }

    if (previousContentRef.current === undefined) {
      previousContentRef.current = meta.getAttribute("content");
    }

    meta.setAttribute("content", IOS_FOCUS_VIEWPORT);
    // Ensure WebKit picks up the change when mutating an existing tag.
    meta.content = IOS_FOCUS_VIEWPORT;
  }, []);

  const ensureApplied = React.useCallback(() => {
    if (blurTimeoutRef.current !== null) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    applyViewport();
  }, [applyViewport]);

  const onFocus = React.useCallback(() => {
    ensureApplied();
  }, [ensureApplied]);

  /** Call on the control for iOS tap; runs before `focus` so Safari applies the viewport in time. */
  const onTouchStart = React.useCallback(() => {
    ensureApplied();
  }, [ensureApplied]);

  const onBlur = React.useCallback(() => {
    blurTimeoutRef.current = window.setTimeout(() => {
      blurTimeoutRef.current = null;
      restoreViewport();
    }, 0);
  }, [restoreViewport]);

  React.useEffect(() => {
    return () => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current);
      }

      restoreViewport();
    };
  }, [restoreViewport]);

  return React.useMemo(
    () => ({
      onFocus,
      onBlur,
      onTouchStart,
    }),
    [onBlur, onFocus, onTouchStart]
  );
}
