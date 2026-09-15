"use client";

import { stegaClean } from "next-sanity";
import * as React from "react";

/**
 * Extract plain text content from React children
 * Preserves \n characters and converts <br /> to \n
 */
function extractTextContent(children: React.ReactNode): string {
  if (typeof children === "string") {
    // Preserve \n characters in strings
    return children;
  }

  if (typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children
      .map((child) => {
        // Check if child is a <br /> element
        if (React.isValidElement(child) && child.type === "br") {
          return "\n";
        }

        return extractTextContent(child);
      })
      .join("");
  }

  if (React.isValidElement(children)) {
    // Handle <br /> elements
    if (children.type === "br") {
      return "\n";
    }

    const props = children.props as { children?: React.ReactNode };

    if (props.children) {
      return extractTextContent(props.children);
    }
  }

  return "";
}

/**
 * Hook that extracts text content from React children and returns a stable reference.
 * Prevents re-renders when children prop reference changes but actual content doesn't
 * (common with Sanity's stega encoding in draft mode).
 *
 * @param children - React children to extract text from
 * @returns Stable text content string that only changes when actual content changes
 *
 * @example
 * ```tsx
 * function MyComponent({ children }) {
 *   const textContent = useStableTextContent(children);
 *   // textContent only changes when actual text changes, not when children reference changes
 * }
 * ```
 */
export function useStableTextContent(children: React.ReactNode): string {
  const prevTextRef = React.useRef<string>("");

  // Extract text content and clean stega encoding for draft mode
  // Compare by string value (not reference) to prevent re-renders when children prop
  // reference changes but content doesn't
  const currentText = stegaClean(extractTextContent(children));

  // Only update when the actual text string changes
  if (currentText !== prevTextRef.current) {
    prevTextRef.current = currentText;
  }

  return prevTextRef.current;
}
