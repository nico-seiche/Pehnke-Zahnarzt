/**
 * Helpers for `scripts/sanity-project-setup/setup.ts` — env merging, Sanity CLI, webhooks API.
 */

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_API_VERSION = "2025-02-19";

/** Abort the webhooks API request if Sanity does not respond, so the wizard never hangs on a stalled spinner. */
const WEBHOOK_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Sanity project API URLs use a path segment like `v2025-02-19` (leading `v`).
 * Env / GROQ often use `2025-02-19` without the prefix.
 */
export function toSanityApiPathVersion(apiVersion: string): string {
  const t = apiVersion.trim();

  if (t.startsWith("v")) {
    return t;
  }
  return `v${t}`;
}

/**
 * If `envPath` is missing and `.env.example` exists, copy the example to `envPath` so upserts preserve all template keys.
 */
export function ensureEnvFromExample(envPath: string, examplePath: string): boolean {
  if (existsSync(envPath)) {
    return false;
  }

  if (!existsSync(examplePath)) {
    return false;
  }
  writeFileSync(envPath, readFileSync(examplePath, "utf8"), "utf8");
  return true;
}

export function generateRevalidateSecret(): string {
  return randomBytes(16).toString("hex");
}

/** Strips trailing slashes so `{base}/api/revalidate` never doubles `//`. */
export function normalizeWebhookBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/**
 * Site origin for the revalidate webhook (no trailing slash).
 * Strips a pasted `…/api/revalidate` suffix and adds `http://` when the scheme is missing (`localhost:3000` → `http://localhost:3000`).
 */
export function normalizeWebhookSiteBase(raw: string): string {
  let s = normalizeWebhookBaseUrl(raw);
  s = s.replace(/\/api\/revalidate\/?$/i, "");
  s = normalizeWebhookBaseUrl(s);

  if (!s) {
    return s;
  }

  if (!/^https?:\/\//i.test(s)) {
    s = `http://${s}`;
  }

  return s;
}

/**
 * True for hosts the Sanity webhook delivery service rejects with `400 "Hostname not allowed"`:
 * loopback, unspecified, private and link-local addresses, plus `localhost` / mDNS (`.local`,
 * `.localhost`) names. The Revalidate webhook is delivered from Sanity's cloud, so the endpoint
 * must be publicly reachable, and these hosts are not.
 */
export function isNonPublicWebhookHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "");

  if (!host) {
    return true;
  }

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }

  // IPv6 loopback (::1) and unspecified (::).
  if (host === "::1" || host === "::") {
    return true;
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);

  if (!ipv4) {
    return false;
  }

  const a = Number(ipv4[1]);
  const b = Number(ipv4[2]);

  // Loopback (127/8), unspecified (0.0.0.0) and the 10/8 private block.
  if (a === 127 || a === 0 || a === 10) {
    return true;
  }

  if (a === 192 && b === 168) {
    return true;
  }

  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }

  // Link-local (169.254/16).
  if (a === 169 && b === 254) {
    return true;
  }

  return false;
}

/**
 * Validates the webhook site base typed by the user. Returns `null` when usable, otherwise a
 * human-readable reason. Enforces an **absolute** URL (explicit `http(s)://` scheme) pointing at a
 * **publicly reachable** host, because Sanity registers the webhook only when it can deliver to it
 * from the cloud: `localhost` and private hosts fail registration with "Hostname not allowed".
 */
export function webhookSiteBaseError(raw: string): string | null {
  const trimmed = raw.trim();

  if (!trimmed) {
    return "Enter your deployed site URL, e.g. https://your-project.vercel.app";
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return "Use an absolute URL including the scheme, e.g. https://your-project.vercel.app";
  }

  let hostname = "";

  try {
    hostname = new URL(normalizeWebhookSiteBase(trimmed)).hostname;
  } catch {
    return "That does not look like a valid URL. Try https://your-project.vercel.app";
  }

  if (isNonPublicWebhookHost(hostname)) {
    return "Sanity delivers webhooks from the cloud, so localhost and private hosts are rejected. Use your deployed HTTPS URL, e.g. https://your-project.vercel.app";
  }

  return null;
}

/**
 * True for public-but-placeholder hosts: the RFC 2606 `example.*` reserved domains (the wizard's
 * default before a deployment exists) and `sanity.io`. These pass `webhookSiteBaseError` and register
 * cleanly because the host is allowed, but they never deliver, so the caller should remind the user
 * to repoint the webhook at their real site once deployed.
 */
export function isPlaceholderWebhookHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();

  if (host === "sanity.io" || host === "www.sanity.io") {
    return true;
  }

  return /(^|\.)example\.(com|org|net)$/.test(host);
}

/**
 * Parses the first balanced JSON object found in CLI stdout.
 * Tolerates noise both before the object (spinner lines) and after it (version notices, ANSI resets)
 * by scanning for the brace that matches the opening `{` instead of slicing to end-of-output.
 */
export function parseJsonFromCliOutput(stdout: string): Record<string, unknown> {
  const trimmed = stdout.trim();
  const start = trimmed.indexOf("{");

  if (start === -1) {
    throw new Error(`Expected JSON object in CLI output, got:\n${trimmed.slice(0, 500)}`);
  }

  const end = findMatchingBrace(trimmed, start);

  if (end === -1) {
    throw new Error(`Unterminated JSON object in CLI output:\n${trimmed.slice(start, start + 500)}`);
  }

  return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
}

/**
 * Index of the `}` that closes the `{` at `open`, accounting for nested objects and braces inside
 * string literals. Returns -1 when the object is never closed.
 */
function findMatchingBrace(text: string, open: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = open; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

export function runSanityCli(args: string[]): { ok: boolean; stdout: string; stderr: string; status: number | null } {
  const binName = process.platform === "win32" ? "sanity.cmd" : "sanity";
  const bin = join(process.cwd(), "node_modules", ".bin", binName);
  const result = spawnSync(bin, args, {
    encoding: "utf-8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // A spawn-level failure (e.g. the binary is missing) sets `error` and leaves `status` null;
  // surface that message so callers never print an empty error.
  const spawnError = result.error ? result.error.message : "";

  return {
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr || spawnError,
    status: result.status,
  };
}

export function formatEnvValue(value: string): string {
  if (/[\s#'"\\]/.test(value)) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

/**
 * Upserts KEY=value pairs in a `.env` file, preserving unrelated lines and order where possible.
 */
export function upsertEnvFile(filePath: string, updates: Record<string, string>): void {
  const keysRemaining = new Set(Object.keys(updates));
  const lines: string[] = existsSync(filePath) ? readFileSync(filePath, "utf8").split(/\r?\n/) : [];

  const out: string[] = [];
  for (const line of lines) {
    const match = /^(?:export\s+)?([A-Za-z_]\w*)\s*=/.exec(line);

    if (match?.[1] && keysRemaining.has(match[1])) {
      const key = match[1];
      out.push(`${key}=${formatEnvValue(updates[key] ?? "")}`);
      keysRemaining.delete(key);
    } else {
      out.push(line);
    }
  }

  for (const key of keysRemaining) {
    out.push(`${key}=${formatEnvValue(updates[key] ?? "")}`);
  }

  const body = out.join("\n");
  writeFileSync(filePath, body.endsWith("\n") ? body : `${body}\n`, "utf8");
}

/**
 * POSTs a GROQ document webhook for `/api/revalidate`.
 * Use a **developer**-role project token (or equivalent); **editor** tokens get **401** on this endpoint.
 * @see https://www.sanity.io/docs/http-reference/webhooks
 */
export async function createRevalidateWebhook(input: {
  projectId: string;
  bearerToken: string;
  webhookBaseUrl: string;
  secret: string;
  apiVersion?: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const rawVersion = input.apiVersion ?? DEFAULT_API_VERSION;
  // Same `vYYYY-MM-DD` label for the HTTP path and JSON `apiVersion` (GROQ filter/projection).
  const pathVersion = toSanityApiPathVersion(rawVersion);
  const base = normalizeWebhookSiteBase(input.webhookBaseUrl);
  const url = `${base}/api/revalidate`;

  const body = {
    type: "document" as const,
    name: "Revalidate",
    url,
    dataset: "*",
    apiVersion: pathVersion,
    httpMethod: "POST" as const,
    secret: input.secret,
    includeDrafts: false,
    includeAllVersions: false,
    rule: {
      on: ["create", "update", "delete"] as const,
      projection: `{_id, _type, "uri": uri.current}`,
    },
  };

  const endpoint = `https://${input.projectId}.api.sanity.io/${pathVersion}/hooks/projects/${input.projectId}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.bearerToken}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  } finally {
    clearTimeout(timeout);
  }
}
