#!/usr/bin/env node

/**
 * Sanity Dataset Export (Backup) Script
 *
 * Exports a Sanity dataset to a local .tar.gz file for backup purposes.
 *
 * Usage:
 *   npm run sanity:dataset-export -- --dataset staging
 *   npm run sanity:dataset-export -- --dataset production
 *   npm run sanity:dataset-export -- --dataset staging --no-assets
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import prompts from "prompts";
import { buildExportArgs, formatExportTimestamp, getSanityEnv } from "./lib";

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
  .name("dataset-export")
  .description("Export a Sanity dataset to a local backup file")
  .requiredOption("--dataset <dataset>", "Dataset to export (e.g. staging, production)")
  .option("--no-assets", "Skip exporting assets (documents only, faster and smaller)")
  .version("1.0.0");

program.parse();

const options = program.opts<{ dataset: string; assets: boolean }>();

async function main() {
  console.log("\n📦 Sanity Dataset Export Tool\n");

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
  const timestamp = formatExportTimestamp(new Date());
  const backupsDir = join(process.cwd(), "backups");
  const exportPath = join(backupsDir, `${options.dataset}-${timestamp}.tar.gz`);

  console.log(`   Dataset:    ${options.dataset}`);
  console.log(`   Project ID: ${SANITY_PROJECT_ID}`);
  console.log(`   Assets:     ${options.assets ? "included" : "skipped"}`);
  console.log(`   Output:     ${exportPath}`);

  const confirm = await prompts({
    type: "confirm",
    name: "value",
    message: `Export the "${options.dataset}" dataset?`,
    initial: false,
  });

  if (!confirm.value) {
    console.log("\n❌ Export cancelled by user.\n");
    process.exit(0);
  }

  if (!existsSync(backupsDir)) {
    mkdirSync(backupsDir, { recursive: true });
  }

  console.log(`\n📦 Exporting "${options.dataset}" dataset...`);

  try {
    const args = buildExportArgs(options.dataset, exportPath);

    if (!options.assets) {
      args.push("--no-assets");
    }
    runSanityCommand(args, "Export");
  } catch (error) {
    console.error("\n❌ Error: Export failed.");
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  if (!existsSync(exportPath)) {
    console.error("\n❌ Error: Export file not found after export.");
    process.exit(1);
  }

  console.log("\n✅ Export completed successfully!");
  console.log(`   Backup saved at: ${exportPath}\n`);
}

main().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});
