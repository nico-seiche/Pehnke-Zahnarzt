#!/usr/bin/env node
/**
 * Interactive Sanity project bootstrap: create or link a project, tokens, CORS, revalidate webhook, `.env`.
 *
 * Prerequisites: `npm run sanity:cli -- login`. See `scripts/sanity-project-setup/README.md`.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import ora from "ora";
import prompts from "prompts";
import {
  createRevalidateWebhook,
  ensureEnvFromExample,
  generateRevalidateSecret,
  isPlaceholderWebhookHost,
  normalizeWebhookSiteBase,
  parseJsonFromCliOutput,
  runSanityCli,
  upsertEnvFile,
  webhookSiteBaseError,
} from "./lib";

// -----------------------------------------------------------------------------
// Defaults — skim this block; at most prompts you can press Enter to accept.
// -----------------------------------------------------------------------------
const DEFAULT_DATASET = "production";
const DEFAULT_STUDIO_PATH = "/studio";
/** Local Next.js dev server. Default CORS origin only. NOT a valid webhook target (Sanity rejects localhost with "Hostname not allowed"). */
const DEFAULT_LOCAL_SITE_ORIGIN = "http://localhost:3000";
const DEFAULT_DATASET_VISIBILITY_INDEX = 0;
const DEFAULT_CREATE_TOKENS = true;
const DEFAULT_ADD_CORS = true;
const DEFAULT_CREATE_WEBHOOK = true;
/** Valid public placeholder used when no deployed URL is known yet: Sanity registers it cleanly, and the user repoints it in Manage after deploying. */
const PLACEHOLDER_WEBHOOK_SITE = "https://example.com";

const isDryRun = process.argv.includes("--dry-run");

function parseProjectId(obj: Record<string, unknown>): string {
  const fromProject = obj.projectId;
  const fromId = obj.id;
  let id = "";

  if (typeof fromProject === "string" && fromProject) {
    id = fromProject;
  } else if (typeof fromId === "string" && fromId) {
    id = fromId;
  }

  if (!id) {
    throw new Error(`Unexpected project JSON (missing projectId): ${JSON.stringify(obj)}`);
  }

  return id;
}

function parseTokenKey(obj: Record<string, unknown>): string {
  if (typeof obj.key !== "string" || !obj.key) {
    throw new Error(`Unexpected token JSON (missing key): ${JSON.stringify(obj)}`);
  }
  return obj.key;
}

function parseTokenId(obj: Record<string, unknown>): string {
  if (typeof obj.id !== "string" || !obj.id) {
    throw new Error(`Unexpected token JSON (missing id): ${JSON.stringify(obj)}`);
  }
  return obj.id;
}

/**
 * Revokes the temporary developer-role token created only for webhook registration.
 * Always safe to call: a no-op when no token id was captured. Run it on every webhook outcome
 * (success, duplicate, 401, error) so a privileged token is never left behind.
 */
function removeWebhookSetupToken(projectId: string, tokenId: string): void {
  if (!tokenId) {
    return;
  }

  const del = ora("Removing temporary “Setup - Webhook” token…").start();
  const rm = runSanityCli(["tokens", "delete", tokenId, "--yes", "-p", projectId]);

  if (rm.ok) {
    del.succeed("Removed temporary developer token");
  } else {
    del.warn("Could not remove the temporary token automatically");
    console.log(`   ${rm.stderr || rm.stdout || ""}\n   ℹ️  Delete “Setup - Webhook” manually in Manage → API → Tokens.\n`);
  }
}

async function main() {
  console.log("\n🛠️  Sanity project setup\n");
  console.log("   Tokens, CORS, Revalidate webhook, and `.env` — step by step.\n");
  console.log(`   Quick defaults (Enter):  dataset ${DEFAULT_DATASET} · public · tokens · CORS ${DEFAULT_LOCAL_SITE_ORIGIN}.\n`);
  console.log(
    "   The Revalidate webhook needs a public URL (localhost is rejected); keep the example.com placeholder if you have not deployed yet.\n"
  );

  if (isDryRun) {
    console.log("🔍 Dry run (--dry-run): no API calls or file writes.\n");
  }

  const intro = await prompts({
    type: "select",
    name: "projectMode",
    message: "How do you want to start?",
    choices: [
      { title: "Create a new Sanity project", value: "new" },
      { title: "Use an existing project ID", value: "existing" },
    ],
    initial: 0,
  });

  if (intro.projectMode === undefined) {
    console.log("\n👋 Cancelled.\n");
    process.exit(0);
  }

  let organization = "";
  let projectName = "";
  let dataset = DEFAULT_DATASET;
  let datasetVisibility: "public" | "private" = "public";
  let projectId = "";

  if (intro.projectMode === "new") {
    const org = await prompts({
      type: "text",
      name: "organization",
      message: "Organization id or slug (from sanity.io/manage)",
      validate: (v) => {
        if (String(v).trim()) {
          return true;
        }
        return "Required";
      },
    });

    if (org.organization === undefined) {
      console.log("\n👋 Cancelled.\n");
      process.exit(0);
    }

    organization = String(org.organization).trim();

    const nm = await prompts({
      type: "text",
      name: "displayName",
      message: "Project display name",
      validate: (v) => {
        if (String(v).trim()) {
          return true;
        }
        return "Required";
      },
    });

    if (nm.displayName === undefined) {
      console.log("\n👋 Cancelled.\n");
      process.exit(0);
    }

    projectName = String(nm.displayName).trim();

    const ds = await prompts({
      type: "text",
      name: "dataset",
      message: "Initial dataset name",
      initial: DEFAULT_DATASET,
    });

    if (ds.dataset === undefined) {
      console.log("\n👋 Cancelled.\n");
      process.exit(0);
    }

    dataset = String(ds.dataset || DEFAULT_DATASET).trim() || DEFAULT_DATASET;

    const vis = await prompts({
      type: "select",
      name: "visibility",
      message: "Dataset visibility",
      choices: [
        { title: "Public (Content API)", value: "public" },
        { title: "Private", value: "private" },
      ],
      initial: DEFAULT_DATASET_VISIBILITY_INDEX,
    });

    if (vis.visibility === undefined) {
      console.log("\n👋 Cancelled.\n");
      process.exit(0);
    }

    datasetVisibility = vis.visibility as "public" | "private";
  } else {
    const pid = await prompts({
      type: "text",
      name: "projectId",
      message: "Existing project ID",
      validate: (v) => {
        if (String(v).trim()) {
          return true;
        }
        return "Required";
      },
    });

    if (pid.projectId === undefined) {
      console.log("\n👋 Cancelled.\n");
      process.exit(0);
    }

    projectId = String(pid.projectId).trim();

    const ds = await prompts({
      type: "text",
      name: "dataset",
      message: "Dataset name for NEXT_PUBLIC_SANITY_DATASET",
      initial: DEFAULT_DATASET,
    });

    if (ds.dataset === undefined) {
      console.log("\n👋 Cancelled.\n");
      process.exit(0);
    }

    dataset = String(ds.dataset || DEFAULT_DATASET).trim() || DEFAULT_DATASET;
  }

  const tok = await prompts({
    type: "confirm",
    name: "createTokens",
    message: "Create API tokens (Frontend - View + Frontend - Edit)?",
    initial: DEFAULT_CREATE_TOKENS,
  });

  if (tok.createTokens === undefined) {
    console.log("\n👋 Cancelled.\n");
    process.exit(0);
  }

  const corsQ = await prompts({
    type: "confirm",
    name: "addCors",
    message: "Add CORS origins with credentials (Studio + browser token)?",
    initial: DEFAULT_ADD_CORS,
  });

  if (corsQ.addCors === undefined) {
    console.log("\n👋 Cancelled.\n");
    process.exit(0);
  }

  let corsOrigins: string[] = [DEFAULT_LOCAL_SITE_ORIGIN];

  if (corsQ.addCors) {
    const corsInput = await prompts({
      type: "text",
      name: "origins",
      message: "Comma-separated origins (browser + Studio)",
      initial: DEFAULT_LOCAL_SITE_ORIGIN,
    });

    if (corsInput.origins === undefined) {
      console.log("\n👋 Cancelled.\n");
      process.exit(0);
    }

    corsOrigins = String(corsInput.origins)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (corsOrigins.length === 0) {
      corsOrigins = [DEFAULT_LOCAL_SITE_ORIGIN];
    }
  }

  const wh = await prompts({
    type: "confirm",
    name: "createWebhook",
    message: "Create the Revalidate webhook (needs your deployed HTTPS URL)?",
    initial: DEFAULT_CREATE_WEBHOOK,
  });

  if (wh.createWebhook === undefined) {
    console.log("\n👋 Cancelled.\n");
    process.exit(0);
  }

  let createTokens = tok.createTokens === true;
  let createWebhook = wh.createWebhook === true;

  // The webhook is registered with a temporary developer token from the token step, so it cannot run
  // without tokens. Resolve that conflict now instead of failing at the very end.
  if (createWebhook && !createTokens) {
    console.log("\nℹ️  The Revalidate webhook is registered with a temporary developer-role token from the token step.");

    const reconcile = await prompts({
      type: "confirm",
      name: "value",
      message: "Create API tokens so the webhook can be registered automatically? (No = skip the webhook)",
      initial: true,
    });

    if (reconcile.value === undefined) {
      console.log("\n👋 Cancelled.\n");
      process.exit(0);
    }

    if (reconcile.value) {
      createTokens = true;
    } else {
      createWebhook = false;
    }
  }

  const vercelHint = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

  let webhookBase = "";

  if (createWebhook) {
    console.log(
      "\n   Sanity delivers this webhook from its cloud, so it must point at a public URL (localhost and private hosts are rejected).\n   No deployment yet? Keep the example.com placeholder to register it now, then repoint it once you deploy.\n"
    );

    const envSiteUrl = process.env.NEXT_PUBLIC_URL?.trim() ?? "";
    // Prefer a real public URL from env or Vercel; otherwise fall back to a placeholder that registers cleanly (never localhost).
    const realSiteUrl = webhookSiteBaseError(envSiteUrl) === null ? envSiteUrl : vercelHint;
    const webhookInitial = realSiteUrl || PLACEHOLDER_WEBHOOK_SITE;

    const urlAns = await prompts({
      type: "text",
      name: "webhookBaseUrl",
      message: "Public site URL (https://…, not localhost). Full webhook = base + /api/revalidate",
      initial: webhookInitial,
      validate: (v) => {
        const error = webhookSiteBaseError(String(v ?? ""));

        if (error) {
          return error;
        }

        return true;
      },
    });

    if (urlAns.webhookBaseUrl === undefined) {
      console.log("\n👋 Cancelled.\n");
      process.exit(0);
    }

    // `validate` already guaranteed an absolute, publicly reachable URL, so there is no localhost fallback to apply here.
    webhookBase = normalizeWebhookSiteBase(String(urlAns.webhookBaseUrl).trim());

    if (isPlaceholderWebhookHost(new URL(webhookBase).hostname)) {
      console.log(
        `\nℹ️  ${webhookBase} is a placeholder, so the webhook registers but will not deliver. Repoint it at your deployed HTTPS URL in Manage → API → Webhooks (or re-run this setup after deploying).\n`
      );
    }
  }

  const envAns = await prompts({
    type: "text",
    name: "envFile",
    message: "Path to .env to update",
    initial: join(process.cwd(), ".env"),
  });

  if (envAns.envFile === undefined) {
    console.log("\n👋 Cancelled.\n");
    process.exit(0);
  }

  const envPath = String(envAns.envFile).trim() || join(process.cwd(), ".env");

  console.log("\n📋 Summary\n");

  if (intro.projectMode === "new") {
    console.log(`   • New project “${projectName}” in org ${organization}`);
    console.log(`   • Dataset: ${dataset} (${datasetVisibility})`);
  } else {
    console.log(`   • Project ID: ${projectId}`);
    console.log(`   • Dataset: ${dataset}`);
  }

  let tokenSummary = "⏭️  skip";

  if (createTokens) {
    tokenSummary = createWebhook ? "✅ viewer + editor + developer (webhook step)" : "✅ viewer + editor";
  }
  console.log(`   • API tokens: ${tokenSummary}`);
  console.log(`   • CORS: ${corsQ.addCors ? corsOrigins.join(", ") : "⏭️  skip"}`);
  console.log(`   • Webhook: ${createWebhook ? `${webhookBase}/api/revalidate` : "⏭️  skip"}`);
  console.log(`   • Env file: ${envPath}\n`);

  if (isDryRun) {
    console.log("✅ Dry run complete — nothing changed.\n");
    process.exit(0);
  }

  const confirm = await prompts({
    type: "confirm",
    name: "ok",
    message: "Run these steps now?",
    initial: true,
  });

  if (confirm.ok !== true) {
    console.log("\n👋 Cancelled.\n");
    process.exit(0);
  }

  if (intro.projectMode === "new") {
    const spinner = ora("Creating Sanity project…").start();
    const created = runSanityCli([
      "projects",
      "create",
      projectName,
      "--organization",
      organization,
      "--dataset",
      dataset,
      "--dataset-visibility",
      datasetVisibility,
      "--yes",
      "--json",
    ]);

    if (!created.ok) {
      spinner.fail("Project creation failed");
      console.error(created.stderr || created.stdout);
      process.exit(created.status ?? 1);
    }

    try {
      projectId = parseProjectId(parseJsonFromCliOutput(created.stdout));
    } catch (e) {
      spinner.fail("Could not parse project response");
      console.error(e);
      process.exit(1);
    }

    spinner.succeed(`Project created — id ${projectId}`);
  } else {
    console.log(`\n✅ Using project ${projectId}\n`);
  }

  let viewToken = "";
  let editToken = "";
  /** Developer-role token used only for the webhooks HTTP API (not written to `.env`). */
  let webhookManageToken = "";
  /** Token document id — used to delete the temporary developer token after webhook registration. */
  let webhookSetupTokenId = "";

  if (createTokens) {
    let s = ora("Creating viewer token…").start();
    const view = runSanityCli(["tokens", "add", "Frontend - View", "--role=viewer", "--yes", "--json", "-p", projectId]);

    if (!view.ok) {
      s.fail("Viewer token failed");
      console.error(view.stderr || view.stdout);
      process.exit(view.status ?? 1);
    }

    try {
      viewToken = parseTokenKey(parseJsonFromCliOutput(view.stdout));
    } catch (e) {
      s.fail("Invalid token response");
      console.error(e);
      process.exit(1);
    }

    s.succeed("Viewer token created");

    s = ora("Creating editor token…").start();
    const edit = runSanityCli(["tokens", "add", "Frontend - Edit", "--role=editor", "--yes", "--json", "-p", projectId]);

    if (!edit.ok) {
      s.fail("Editor token failed");
      console.error(edit.stderr || edit.stdout);
      process.exit(edit.status ?? 1);
    }

    try {
      editToken = parseTokenKey(parseJsonFromCliOutput(edit.stdout));
    } catch (e) {
      s.fail("Invalid token response");
      console.error(e);
      process.exit(1);
    }

    s.succeed("Editor token created");

    if (createWebhook) {
      s = ora("Creating developer token (webhooks API)…").start();
      const dev = runSanityCli(["tokens", "add", "Setup - Webhook", "--role=developer", "--yes", "--json", "-p", projectId]);

      if (!dev.ok) {
        s.fail("Developer token failed (required to register the webhook via API)");
        console.error(dev.stderr || dev.stdout);
        process.exit(dev.status ?? 1);
      }

      try {
        const devParsed = parseJsonFromCliOutput(dev.stdout);
        webhookManageToken = parseTokenKey(devParsed);
        webhookSetupTokenId = parseTokenId(devParsed);
      } catch (e) {
        s.fail("Invalid developer token response");
        console.error(e);
        process.exit(1);
      }

      s.succeed("Developer token created (temporary — removed after webhook registration)");
    }

    console.log("");
  } else {
    console.log("⏭️  Skipping token creation — ensure SANITY_API_* are in .env if you need them.\n");
  }

  if (corsQ.addCors) {
    for (const origin of corsOrigins) {
      const s = ora(`CORS: ${origin}`).start();
      const cors = runSanityCli(["cors", "add", origin, "--credentials", "-p", projectId]);

      if (!cors.ok) {
        const msg = `${cors.stderr}${cors.stdout}`;

        if (/exist|already|duplicate/i.test(msg)) {
          s.warn(`Already present or similar: ${origin}`);
        } else {
          s.fail("CORS failed");
          console.error(msg);
          process.exit(cors.status ?? 1);
        }
      } else {
        s.succeed(`CORS added — ${origin}`);
      }
    }
    console.log("");
  }

  const secret = generateRevalidateSecret();
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-02-19";

  const updates: Record<string, string> = {
    NEXT_PUBLIC_SANITY_PROJECT_ID: projectId,
    NEXT_PUBLIC_SANITY_DATASET: dataset,
    NEXT_PUBLIC_SANITY_API_VERSION: apiVersion,
    NEXT_PUBLIC_SANITY_STUDIO_BASE_PATH: DEFAULT_STUDIO_PATH,
    SANITY_REVALIDATE_SECRET: secret,
  };

  if (webhookBase) {
    updates.NEXT_PUBLIC_URL = webhookBase;
  }

  if (createTokens) {
    updates.SANITY_API_VIEW_TOKEN = viewToken;
    updates.SANITY_API_EDIT_TOKEN = editToken;
  }

  const examplePath = join(process.cwd(), ".env.example");

  if (ensureEnvFromExample(envPath, examplePath)) {
    console.log(`📄 Created ${envPath} from .env.example\n`);
  } else if (!existsSync(envPath)) {
    console.log(`📄 Creating ${envPath}\n`);
  }

  upsertEnvFile(envPath, updates);
  console.log(`✅ Updated ${envPath}\n`);

  if (createWebhook) {
    const webhookBearer = webhookManageToken;

    if (!webhookBearer) {
      removeWebhookSetupToken(projectId, webhookSetupTokenId);
      console.error(
        "❌ Webhook registration needs a developer-role API token.\n   Enable “Create API tokens” with the webhook step, or create the webhook manually in Manage → API → Webhooks.\n"
      );
      process.exit(1);
    }

    const s = ora("Creating Revalidate webhook…").start();

    let webhookFailed = false;

    try {
      const result = await createRevalidateWebhook({
        projectId,
        bearerToken: webhookBearer,
        webhookBaseUrl: webhookBase,
        secret,
        apiVersion,
      });

      const displayUrl = `${webhookBase}/api/revalidate`;

      if (result.ok) {
        s.succeed(`Webhook live → ${displayUrl}`);
      } else if (result.status === 401) {
        s.warn("Webhook: token cannot manage webhooks (Manage UI required)");
        console.log(
          "\n   This token is not allowed to create webhooks (401). Use a developer-role project token, or create the webhook in Sanity Manage → API → Webhooks:"
        );
        console.log(`   • URL: ${displayUrl}`);
        console.log("   • Secret: same value as SANITY_REVALIDATE_SECRET in your .env\n");
      } else if (result.status === 409 || /duplicate|already exists|conflict/i.test(result.body)) {
        s.warn("Revalidate webhook may already exist. Skipped.");
        console.log(`   If needed, align the secret in Manage with SANITY_REVALIDATE_SECRET.\n`);
      } else {
        s.fail("Webhook API error");
        console.error(result.body);
        console.error(
          "\n💡 Add the webhook manually in Manage → API → Webhooks. Use SANITY_REVALIDATE_SECRET from your .env as the secret.\n"
        );
        webhookFailed = true;
      }
    } catch (e) {
      s.fail("Webhook request failed");
      console.error(e instanceof Error ? e.message : e);
      console.error(
        "\n💡 Add the webhook manually in Manage → API → Webhooks. Use SANITY_REVALIDATE_SECRET from your .env as the secret.\n"
      );
      webhookFailed = true;
    } finally {
      // Always revoke the temporary developer token, regardless of the webhook outcome above.
      removeWebhookSetupToken(projectId, webhookSetupTokenId);
    }

    if (webhookFailed) {
      process.exit(1);
    }

    console.log("");
  }

  console.log("🎉 Done.\n");
  console.log("   Next: `npm run sanity:typegen`\n");
}

main().catch((err) => {
  console.error("\n❌", err);
  process.exit(1);
});
