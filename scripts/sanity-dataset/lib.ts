/**
 * Dataset Migration Library
 *
 * Contains the core logic for dataset migration that can be tested independently.
 * This module has no side effects (no process.exit, no console.log, no file system operations).
 */

import { z } from "zod";

const sanityEnvSchema = z.object({
  SANITY_PROJECT_ID: z.string().min(1),
  SANITY_DATASET: z.string().min(1),
});

export type MigrationOptions = {
  from: string;
  to: string;
  skipCleanup?: boolean;
  replace?: boolean;
  clean?: boolean;
};

export type ValidationResult = {
  success: boolean;
  error?: string;
};

export type SanityEnv = {
  SANITY_PROJECT_ID: string;
  SANITY_DATASET: string;
};

/**
 * Validates Sanity env for CLI scripts. Accepts either:
 * - `SANITY_PROJECT_ID` / `SANITY_DATASET`, or
 * - `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` (this repo’s app env)
 */
export function getSanityEnv(env: Record<string, string | undefined>): SanityEnv {
  const merged = {
    SANITY_PROJECT_ID: env.SANITY_PROJECT_ID ?? env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    SANITY_DATASET: env.SANITY_DATASET ?? env.NEXT_PUBLIC_SANITY_DATASET,
  };
  return sanityEnvSchema.parse(merged);
}

/**
 * Validates migration options and returns a result object.
 * Pure function - no side effects.
 */
export function validateMigrationOptions(options: MigrationOptions): ValidationResult {
  if (options.replace && options.clean) {
    return {
      success: false,
      error:
        "--replace and --clean cannot be used together. --clean already ensures a fresh dataset (making --replace redundant).",
    };
  }

  if (options.from === options.to) {
    return {
      success: false,
      error: "Source and target datasets cannot be the same.",
    };
  }

  return { success: true };
}

/**
 * Determines the migration mode based on options.
 */
export function getMigrationMode(options: Pick<MigrationOptions, "clean" | "replace">): "clean" | "replace" | "standard" {
  if (options.clean) {
    return "clean";
  }

  if (options.replace) {
    return "replace";
  }
  return "standard";
}

/**
 * Builds the import command arguments based on options.
 */
export function buildImportArgs(exportPath: string, targetDataset: string, options: Pick<MigrationOptions, "replace">): string[] {
  // Use the `--dataset` flag rather than the deprecated positional target argument.
  const args = ["dataset", "import", exportPath, "--dataset", targetDataset];

  if (options.replace) {
    args.push("--replace");
  }

  return args;
}

export type ArchiveEntry = { name: string; mtimeMs: number };

/**
 * Orders importable archive choices for the interactive picker: the bundled
 * seed first (when present), then `./backups` entries newest first. Pure: the
 * caller collects the filesystem metadata and passes it in.
 */
export function orderImportChoices(seedExists: boolean, backups: ArchiveEntry[]): { title: string; value: string }[] {
  const choices: { title: string; value: string }[] = [];

  if (seedExists) {
    choices.push({ title: "seed/seed-dataset.tar.gz (bundled starter content)", value: "seed/seed-dataset.tar.gz" });
  }

  for (const entry of [...backups].sort((a, b) => b.mtimeMs - a.mtimeMs)) {
    choices.push({ title: `backups/${entry.name}`, value: `backups/${entry.name}` });
  }

  return choices;
}

/**
 * Builds the delete dataset command arguments.
 */
export function buildDeleteArgs(dataset: string): string[] {
  return ["dataset", "delete", dataset, "--force"];
}

/**
 * Builds the create dataset command arguments.
 */
export function buildCreateArgs(dataset: string, visibility: "public" | "private" = "private"): string[] {
  return ["dataset", "create", dataset, "--visibility", visibility];
}

/**
 * Builds the export dataset command arguments.
 */
export function buildExportArgs(sourceDataset: string, exportPath: string): string[] {
  return ["dataset", "export", sourceDataset, exportPath];
}

/**
 * Formats a date as `YYYY-MM-DD-HHMMSS` (UTC, no colons) for export filenames.
 * The time component prevents two runs on the same day from sharing one filename and silently
 * overwriting a prior backup.
 */
export function formatExportTimestamp(date: Date): string {
  const [datePart = "", timePart = ""] = date.toISOString().split("T");
  const hms = timePart.slice(0, 8).replace(/:/g, "");

  if (!datePart) {
    return "";
  }

  return hms ? `${datePart}-${hms}` : datePart;
}

/**
 * Gets the confirmation message for import based on migration mode.
 */
export function getImportConfirmationMessage(to: string, from: string, isCleanMode: boolean): string {
  if (isCleanMode) {
    return `⚠️  DESTRUCTIVE WARNING: Do you want to DELETE and RECREATE the "${to}" dataset as PRIVATE,\n   then import data from "${from}"? This will PERMANENTLY DELETE all existing data in "${to}".`;
  }
  return `⚠️  WARNING: Do you want to import this data into the "${to}" dataset?\n   This will overwrite existing data in "${to}".`;
}
