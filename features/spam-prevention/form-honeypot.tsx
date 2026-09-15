"use client";

import { HONEYPOT_FIELD_NAME } from "~/features/spam-prevention/constants";

/**
 * Honeypot field component for spam prevention.
 *
 * Uses future-proof techniques:
 * - Legit-sounding name attribute ("website")
 * - Legit-sounding CSS class ("form-helper")
 * - Text input type (not hidden)
 * - CSS-based hiding (not inline styles)
 *
 * Bots will be tricked into filling this field, while real users won't see it.
 */
export function FormHoneypot() {
  return (
    <input
      type="text"
      name={HONEYPOT_FIELD_NAME}
      autoComplete="off"
      tabIndex={-1}
      aria-hidden="true"
      className="pointer-events-none absolute -left-[9999px] -z-1 h-px w-px overflow-hidden opacity-0"
    />
  );
}
