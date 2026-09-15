#!/usr/bin/env node

/**
 * Sanity Dataset Import (Restore) Script
 *
 * Interactive counterpart to `sanity:dataset-export`: import a local `.tar.gz`
 * export into a Sanity dataset. With no flags it prompts for everything (which
 * archive, which dataset, replace mode, then a final confirmation). Pass a flag
 * to skip the matching prompt, or `--yes` for a fully non-interactive run.
 *
 * Usage:
 *   npm run sanity:dataset-import
 *   npm run sanity:dataset-import -- --file seed/seed-dataset.tar.gz
 *   npm run sanity:dataset-import -- --dataset staging --replace
 *   npm run sanity:dataset-import -- --file backups/production-2026-06-15.tar.gz --dataset staging --yes
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import prompts from "prompts";
import { type ArchiveEntry, buildImportArgs, getSanityEnv, orderImportChoices } from "./lib";

function runSanityCommand(args: string[], description: string): void {
  const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmBin, ["run", "sanity:cli", "--", ...args], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${description} process exited with code ${result.status}`);
  }
}

/** Collects importable archives (the seed and `./backups`) with fs metadata for the picker. */
function collectArchiveChoices(cwd: string): { title: string; value: string }[] {
  const seedExists = existsSync(join(cwd, "seed", "seed-dataset.tar.gz"));
  const backupsDir = join(cwd, "backups");
  const backups: ArchiveEntry[] = existsSync(backupsDir)
    ? readdirSync(backupsDir)
        .filter((name) => name.endsWith(".tar.gz"))
        .map((name) => ({ name, mtimeMs: statSync(join(backupsDir, name)).mtimeMs }))
    : [];

  return orderImportChoices(seedExists, backups);
}

const program = new Command();

program
  .name("dataset-import")
  .description("Import a local .tar.gz export into a Sanity dataset (restore or seed)")
  .option("--dataset <dataset>", "Target dataset to import into (defaults to the .env dataset)")
  .option("--file <path>", "Archive to import (defaults to an interactive picker)")
  .option("--replace", "Replace existing documents with the same IDs")
  .option("-y, --yes", "Skip all prompts (requires --file)", false)
  .version("1.0.0");

program.parse();

const options = program.opts<{ dataset?: string; file?: string; replace?: boolean; yes: boolean }>();

async function main() {
  console.log("\n📥 Sanity Dataset Import Tool\n");

  let env: { SANITY_PROJECT_ID: string; SANITY_DATASET: string };
  try {
    env = getSanityEnv(process.env);
  } catch (error) {
    console.error("❌ Error: Failed to load Sanity environment variables.");
    console.error(
      "   Set SANITY_PROJECT_ID and SANITY_DATASET, or NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in `.env`."
    );
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const { SANITY_PROJECT_ID } = env;

  // 1) Archive: --file, otherwise an interactive picker over the seed and ./backups.
  let filePath = options.file ?? "";
  if (!filePath) {
    if (options.yes) {
      console.error("❌ Error: --file is required when using --yes (there is no interactive picker).");
      process.exit(1);
    }

    const choices = collectArchiveChoices(process.cwd());
    if (choices.length === 0) {
      console.error("❌ Error: No archives found.");
      console.error("   Pass --file <path>, or create a backup with `npm run sanity:dataset-export`.");
      process.exit(1);
    }

    const picked = await prompts({
      type: "select",
      name: "value",
      message: "Which archive do you want to import?",
      choices,
    });

    if (!picked.value) {
      console.log("\n❌ Import cancelled by user.\n");
      process.exit(0);
    }

    filePath = picked.value;
  }

  if (!existsSync(filePath)) {
    console.error(`\n❌ Error: Archive not found at ${filePath}`);
    process.exit(1);
  }

  // 2) Target dataset: --dataset, otherwise prompt (default = the .env dataset).
  let dataset = options.dataset ?? "";
  if (!dataset) {
    if (options.yes) {
      dataset = env.SANITY_DATASET;
    } else {
      const answer = await prompts({
        type: "text",
        name: "value",
        message: "Target dataset to import into?",
        initial: env.SANITY_DATASET,
      });

      if (!answer.value) {
        console.log("\n❌ Import cancelled by user.\n");
        process.exit(0);
      }

      dataset = answer.value;
    }
  }

  // 3) Replace mode: --replace, otherwise prompt.
  let replace = options.replace ?? false;
  if (options.replace === undefined && !options.yes) {
    const answer = await prompts({
      type: "confirm",
      name: "value",
      message: "Replace documents that already exist (same IDs)?",
      initial: false,
    });

    replace = answer.value ?? false;
  }

  console.log(`\n   Archive:    ${filePath}`);
  console.log(`   Dataset:    ${dataset}`);
  console.log(`   Project ID: ${SANITY_PROJECT_ID}`);
  console.log(`   Mode:       ${replace ? "REPLACE (overwrite same-ID docs)" : "STANDARD (fails on same-ID docs)"}`);

  // 4) Final confirmation.
  if (!options.yes) {
    const confirm = await prompts({
      type: "confirm",
      name: "value",
      message: `Import "${filePath}" into the "${dataset}" dataset? This modifies "${dataset}".`,
      initial: false,
    });

    if (!confirm.value) {
      console.log("\n❌ Import cancelled by user.\n");
      process.exit(0);
    }
  }

  console.log(`\n📥 Importing into "${dataset}"...`);

  try {
    runSanityCommand(buildImportArgs(filePath, dataset, { replace }), "Import");
  } catch (error) {
    console.error("\n❌ Error: Import failed.");
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  console.log("\n✅ Import completed successfully!");
  console.log(`   ${filePath} → ${dataset}\n`);
}

main().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
