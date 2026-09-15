#!/usr/bin/env node

/**
 * Sanity Dataset Migration Script
 *
 * This script exports data from one Sanity dataset and imports it into another.
 * It uses the Sanity CLI commands under the hood and requires user confirmation
 * before performing any operations.
 *
 * Usage:
 *   npm run sanity:dataset-migrate -- --from development --to production
 *   npm run sanity:dataset-migrate -- --from production --to staging
 *   npm run sanity:dataset-migrate -- --from development --to production --replace
 *   npm run sanity:dataset-migrate -- --from development --to production --clean
 *
 * The script will:
 * 1. Export the source dataset to a local file
 * 2. Ask for confirmation before importing
 * 3. (With --clean) Back up the target, then delete and recreate it as private
 * 4. Import the data into the target dataset
 * 5. Clean up the temporary export file (unless --skip-cleanup)
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import prompts from "prompts";
import {
  buildCreateArgs,
  buildDeleteArgs,
  buildExportArgs,
  buildImportArgs,
  formatExportTimestamp,
  getImportConfirmationMessage,
  getMigrationMode,
  getSanityEnv,
  type MigrationOptions,
  validateMigrationOptions,
} from "./lib";

/**
 * Runs a Sanity CLI command and returns the result.
 * Uses spawnSync to prevent shell injection.
 */
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

const program = new Command();

program
  .name("dataset-migrate")
  .description("Export data from one Sanity dataset and import it into another")
  .requiredOption("--from <dataset>", "Source dataset to export from")
  .requiredOption("--to <dataset>", "Target dataset to import into")
  .option("--skip-cleanup", "Keep the exported file after import completes", false)
  .option("--replace", "Replace existing documents with the same IDs (cannot be used with --clean)", false)
  .option("--clean", "Delete and recreate target dataset as private before import for a clean slate", false)
  .version("1.1.0");

program.parse();

const options = program.opts<MigrationOptions>();

async function main() {
  console.log("\n🔄 Sanity Dataset Migration Tool\n");

  const validationResult = validateMigrationOptions(options);

  if (!validationResult.success) {
    console.error(`❌ Error: ${validationResult.error}`);
    process.exit(1);
  }

  const mode = getMigrationMode(options);

  if (mode === "clean") {
    console.log("   Mode: CLEAN (will delete and recreate target dataset as private)\n");
  } else if (mode === "replace") {
    console.log("   Mode: REPLACE (will overwrite existing documents with same IDs)\n");
  } else {
    console.log("   Mode: STANDARD (will fail if documents with same IDs exist)\n");
  }

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

  console.log(`📊 Source dataset: ${options.from}`);
  console.log(`📊 Target dataset: ${options.to}`);
  console.log(`🏗️  Project ID: ${SANITY_PROJECT_ID}`);

  const confirmExport = await prompts({
    type: "confirm",
    name: "value",
    message: `Do you want to export the "${options.from}" dataset?`,
    initial: false,
  });

  if (!confirmExport.value) {
    console.log("\n❌ Operation cancelled by user.");
    process.exit(0);
  }

  const backupsDir = join(process.cwd(), "backups");

  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = formatExportTimestamp(new Date());
  const exportPath = join(backupsDir, `${options.from}-${timestamp}.tar.gz`);

  console.log(`\n📦 Exporting "${options.from}" dataset...`);
  console.log(`   Export path: ${exportPath}`);

  try {
    runSanityCommand(buildExportArgs(options.from, exportPath), "Export");
    console.log("\n✅ Export completed successfully!");
  } catch (error) {
    console.error("\n❌ Error: Export failed.");
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (!existsSync(exportPath)) {
    console.error("\n❌ Error: Export file not found.");
    process.exit(1);
  }

  const confirmMessage = getImportConfirmationMessage(options.to, options.from, options.clean ?? false);

  const confirmImport = await prompts({
    type: "confirm",
    name: "value",
    message: confirmMessage,
    initial: false,
  });

  if (!confirmImport.value) {
    console.log("\n❌ Import cancelled by user.");
    console.log(`   Export file saved at: ${exportPath}`);
    process.exit(0);
  }

  if (options.clean) {
    // Safety net: --clean destroys the target's existing data (the source export does not protect it),
    // so snapshot the target first. If it cannot be backed up, make the user confirm before deleting.
    const targetBackupPath = join(backupsDir, `${options.to}-pre-clean-${timestamp}.tar.gz`);
    console.log(`\n💾 Backing up "${options.to}" before clean...`);
    console.log(`   Backup path: ${targetBackupPath}`);

    try {
      runSanityCommand(buildExportArgs(options.to, targetBackupPath), "Target backup");
      console.log(`✅ Target backup saved: ${targetBackupPath}`);
    } catch (error) {
      console.warn(`\n⚠️  Could not back up "${options.to}" (it may not exist yet, or the export failed).`);
      console.warn(`   ${error instanceof Error ? error.message : String(error)}`);

      const proceed = await prompts({
        type: "confirm",
        name: "value",
        message: `Proceed to DELETE "${options.to}" WITHOUT a fresh backup of it?`,
        initial: false,
      });

      if (!proceed.value) {
        console.log("\n❌ Migration cancelled (no target backup).");
        console.log(`   Source export saved at: ${exportPath}`);
        process.exit(0);
      }
    }

    console.log(`\n🗑️  Deleting "${options.to}" dataset...`);
    try {
      runSanityCommand(buildDeleteArgs(options.to), "Dataset delete");
      console.log(`✅ Dataset "${options.to}" deleted.`);
    } catch (error) {
      console.error("\n❌ Error: Failed to delete target dataset.");
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      console.error(`   Export file preserved at: ${exportPath}`);
      process.exit(1);
    }

    console.log(`\n🏗️  Creating "${options.to}" dataset as PRIVATE...`);
    try {
      runSanityCommand(buildCreateArgs(options.to), "Dataset create");
      console.log(`✅ Dataset "${options.to}" created as private.`);
    } catch (error) {
      console.error("\n❌ Error: Failed to create target dataset.");
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
      console.error(`   Export file preserved at: ${exportPath}`);
      process.exit(1);
    }
  }

  console.log(`\n📥 Importing data into "${options.to}" dataset...`);

  try {
    const importArgs = buildImportArgs(exportPath, options.to, { replace: options.replace });

    runSanityCommand(importArgs, "Import");
    console.log("\n✅ Import completed successfully!");
  } catch (error) {
    console.error("\n❌ Error: Import failed.");
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    console.error(`   Export file preserved at: ${exportPath}`);
    process.exit(1);
  }

  if (!options.skipCleanup) {
    try {
      rmSync(exportPath);
      console.log("\n🧹 Cleaned up temporary export file.");
    } catch (_error) {
      console.warn(`\n⚠️  Warning: Failed to clean up export file: ${exportPath}`);
    }
  } else {
    console.log(`\n📁 Export file preserved at: ${exportPath}`);
  }

  console.log("\n🎉 Migration completed successfully!");
  console.log(`   ${options.from} → ${options.to}\n`);
}

main().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
