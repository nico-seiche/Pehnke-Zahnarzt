"use client";

import * as React from "react";

const KEYBOARD_FOCUS_ATTR = "data-keyboard-focus";

/**
 * Toggles `html[data-keyboard-focus]` so base CSS can show focus rings on
 * `input` / `textarea` only after Tab navigation, not on pointer focus (browsers
 * often match `:focus-visible` for text fields on mouse click).
 */
export function KeyboardFocusMode() {
  React.useEffect(() => {
    const root = document.documentElement;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        root.setAttribute(KEYBOARD_FOCUS_ATTR, "");
      }
    };

    const onPointerDown = () => {
      root.removeAttribute(KEYBOARD_FOCUS_ATTR);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return null;
}
