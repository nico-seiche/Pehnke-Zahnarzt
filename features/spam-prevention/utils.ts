import {
  HONEYPOT_FIELD_NAME,
  MAX_SUBMISSION_TIME,
  MIN_SUBMISSION_TIME,
  SUBMISSION_TIME_FIELD_NAME,
} from "~/features/spam-prevention/constants";

export type DetectSpamOptions = {
  /**
   * Name of the honeypot field to check.
   * @default HONEYPOT_FIELD_NAME
   */
  honeypotField?: string;

  /**
   * Minimum time (in milliseconds) before a form submission is considered legitimate.
   * @default MIN_SUBMISSION_TIME
   */
  minSubmissionTime?: number;

  /**
   * Maximum time (in milliseconds) for a form submission to be considered valid.
   * @default MAX_SUBMISSION_TIME
   */
  maxSubmissionTime?: number;
};

/**
 * Server-side spam detection.
 *
 * Checks honeypot field and submission timing to detect spam submissions.
 *
 * @param formData - Form data from the submission
 * @param options - Configuration options
 * @returns Error message if spam is detected, null otherwise
 *
 * @example
 * ```ts
 * const spamError = detectSpam(formData);
 * if (spamError) {
 *   return { success: false, error: spamError };
 * }
 * ```
 */
export function detectSpam(formData: FormData, options: DetectSpamOptions = {}): string | null {
  const {
    honeypotField = HONEYPOT_FIELD_NAME,
    minSubmissionTime = MIN_SUBMISSION_TIME,
    maxSubmissionTime = MAX_SUBMISSION_TIME,
  } = options;

  // Check honeypot field - if filled, it's spam
  const honeypotValue = formData.get(honeypotField);

  if (honeypotValue && String(honeypotValue).trim() !== "") {
    console.warn("Spam detected: Honeypot field filled", { honeypotValue });
    return "Ungültige Übermittlung.";
  }

  // Check submission timing if available
  const submissionTime = formData.get(SUBMISSION_TIME_FIELD_NAME);

  if (submissionTime) {
    const timeTaken = Number(submissionTime);

    if (!Number.isNaN(timeTaken)) {
      if (timeTaken < minSubmissionTime) {
        console.warn("Spam detected: Form submitted too quickly", { timeTaken });
        return "Bitte nehmen Sie sich etwas mehr Zeit beim Ausfüllen des Formulars.";
      }

      if (timeTaken > maxSubmissionTime) {
        console.warn("Spam detected: Form submission expired", { timeTaken });
        return "Die Formularsitzung ist abgelaufen. Bitte laden Sie die Seite neu und versuchen Sie es erneut.";
      }
    }
  }

  return null;
}
