"use client";

import * as React from "react";
import { HONEYPOT_FIELD_NAME, MIN_SUBMISSION_TIME, SUBMISSION_TIME_FIELD_NAME } from "~/features/spam-prevention/constants";

export type SpamPreventionOptions = {
  /**
   * Name of the honeypot field to check.
   * @default HONEYPOT_FIELD_NAME
   */
  honeypotField?: string;

  /**
   * Minimum time (in milliseconds) before form can be submitted.
   * Submissions faster than this are considered spam.
   * @default 2000
   */
  honeypotDuration?: number;

  /**
   * Optional form ref to scope interaction detection to the form.
   * If not provided, interactions anywhere on the page will be tracked.
   */
  formRef?: React.RefObject<HTMLFormElement | null>;

  /**
   * Enable debug logging to console.
   * @default false
   */
  debug?: boolean;
};

export type SpamCheckResult =
  | { isSpam: false }
  | {
      isSpam: true;
      reason: "too_fast" | "honeypot_filled" | "no_interaction";
      message: string;
    };

export type SpamPreventionResult = {
  /**
   * Check if the form submission appears to be spam.
   *
   * Returns detailed result with reason and user-friendly message.
   */
  checkSpam: (form: HTMLFormElement) => SpamCheckResult;

  /**
   * Get metadata about the form submission for server-side validation.
   */
  getMetadata: () => {
    hasInteraction: boolean;
    fillTime: number;
    startTime: number;
  };

  /**
   * Enhance form data with spam prevention metadata.
   */
  enhanceFormData: (formData: FormData) => FormData;

  /**
   * Reset spam prevention state (timing and interaction tracking).
   * Call this when the form is reset to start fresh timing.
   */
  reset: () => void;
};

/**
 * React hook for spam prevention in forms.
 *
 * Tracks user interactions and form timing to detect spam submissions.
 *
 * @example
 * ```tsx
 * const { checkSpam, enhanceFormData } = useSpamPrevention();
 * const [spamError, setSpamError] = useState<string | null>(null);
 *
 * const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
 *   event.preventDefault();
 *   setSpamError(null);
 *
 *   const spamCheck = checkSpam(formRef.current!);
 *   if (spamCheck.isSpam) {
 *     setSpamError(spamCheck.message);
 *     return;
 *   }
 *
 *   const formData = new FormData(formRef.current!);
 *   const enhancedData = enhanceFormData(formData);
 *   await submitForm(enhancedData);
 * };
 * ```
 */
export function useSpamPrevention({
  honeypotField = HONEYPOT_FIELD_NAME,
  honeypotDuration = MIN_SUBMISSION_TIME,
  formRef,
  debug = false,
}: SpamPreventionOptions = {}): SpamPreventionResult {
  const startTime = React.useRef<number>(Date.now());
  const [hasInteraction, setHasInteraction] = React.useState(false);

  // Track user interactions
  React.useEffect(() => {
    const handleInteraction = () => {
      if (debug) {
        console.log("[Spam Prevention] User interaction detected");
      }
      setHasInteraction(true);
    };

    const events: Array<keyof DocumentEventMap> = ["keydown", "mousemove", "touchstart", "click"];
    const target = formRef?.current ?? document;

    if (debug) {
      console.log("[Spam Prevention] Initialized", {
        honeypotField,
        honeypotDuration,
        target: formRef?.current ? "form" : "document",
      });
    }

    for (const event of events) {
      target.addEventListener(event, handleInteraction, { once: true });
    }

    return () => {
      for (const event of events) {
        target.removeEventListener(event, handleInteraction);
      }
    };
  }, [formRef, debug, honeypotField, honeypotDuration]);

  const checkSpam = React.useCallback(
    (form: HTMLFormElement): SpamCheckResult => {
      const fillTime = Date.now() - startTime.current;
      const isTooFast = fillTime < honeypotDuration;

      const honeypotInput = form.querySelector<HTMLInputElement>(`[name="${honeypotField}"]`);
      const hasHoneypotValue = !!honeypotInput?.value?.trim();

      const noInteraction = !hasInteraction;

      if (debug) {
        console.log("[Spam Prevention] Spam check:", {
          fillTime: `${fillTime}ms`,
          isTooFast,
          hasHoneypotValue,
          honeypotValue: honeypotInput?.value || "(empty)",
          noInteraction,
        });
      }

      // Check honeypot first (most reliable indicator)
      if (hasHoneypotValue) {
        return {
          isSpam: true,
          reason: "honeypot_filled",
          message: "Invalid submission detected. Please refresh the page and try again.",
        };
      }

      // Check timing (could be false positive for fast typers)
      if (isTooFast) {
        return {
          isSpam: true,
          reason: "too_fast",
          message: "Please take your time filling out the form. Form submissions are processed after a brief delay.",
        };
      }

      // Check interaction (could be false positive for screen readers or programmatic fills)
      if (noInteraction) {
        return {
          isSpam: true,
          reason: "no_interaction",
          message: "Please interact with the form fields before submitting. Click or type in the fields to continue.",
        };
      }

      return { isSpam: false };
    },
    [honeypotField, honeypotDuration, hasInteraction, debug]
  );

  const getMetadata = React.useCallback(() => {
    const fillTime = Date.now() - startTime.current;

    return {
      hasInteraction,
      fillTime,
      startTime: startTime.current,
    };
  }, [hasInteraction]);

  const enhanceFormData = React.useCallback(
    (formData: FormData) => {
      const submissionTime = Date.now() - startTime.current;
      formData.append(SUBMISSION_TIME_FIELD_NAME, String(submissionTime));

      if (debug) {
        console.log("[Spam Prevention] Enhanced form data with submission time:", `${submissionTime}ms`);
      }

      return formData;
    },
    [debug]
  );

  const reset = React.useCallback(() => {
    startTime.current = Date.now();
    setHasInteraction(false);

    // Re-attach interaction listeners after reset
    const handleInteraction = () => {
      if (debug) {
        console.log("[Spam Prevention] User interaction detected");
      }
      setHasInteraction(true);
    };

    const events: Array<keyof DocumentEventMap> = ["keydown", "mousemove", "touchstart", "click"];
    const target = formRef?.current ?? document;

    for (const event of events) {
      target.addEventListener(event, handleInteraction, { once: true });
    }

    if (debug) {
      console.log("[Spam Prevention] Reset - timing and interaction tracking restarted");
    }
  }, [formRef, debug]);

  return {
    checkSpam,
    getMetadata,
    enhanceFormData,
    reset,
  };
}
