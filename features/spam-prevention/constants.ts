/**
 * Honeypot field name for spam prevention.
 *
 * Uses a legit-sounding name ("website") instead of obvious names like "honeypot"
 * to avoid detection by advanced bots.
 */
export const HONEYPOT_FIELD_NAME = "website";

/**
 * Field name for submission timing metadata.
 */
export const SUBMISSION_TIME_FIELD_NAME = "_submissionTime";

/**
 * Minimum time (in milliseconds) before a form submission is considered legitimate.
 * Submissions faster than this are likely automated.
 */
export const MIN_SUBMISSION_TIME = 2000;

/**
 * Maximum time (in milliseconds) for a form submission to be considered valid.
 * This helps prevent bots that wait indefinitely.
 */
export const MAX_SUBMISSION_TIME = 1000 * 60 * 30; // 30 minutes
