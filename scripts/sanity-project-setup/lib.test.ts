import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  ensureEnvFromExample,
  formatEnvValue,
  generateRevalidateSecret,
  isNonPublicWebhookHost,
  isPlaceholderWebhookHost,
  normalizeWebhookBaseUrl,
  normalizeWebhookSiteBase,
  parseJsonFromCliOutput,
  toSanityApiPathVersion,
  upsertEnvFile,
  webhookSiteBaseError,
} from "./lib";

test("toSanityApiPathVersion ensures a single leading v", () => {
  assert.equal(toSanityApiPathVersion("2025-02-19"), "v2025-02-19");
  assert.equal(toSanityApiPathVersion("v2025-02-19"), "v2025-02-19");
  assert.equal(toSanityApiPathVersion("  2025-02-19  "), "v2025-02-19");
});

test("normalizeWebhookBaseUrl strips trailing slashes", () => {
  assert.equal(normalizeWebhookBaseUrl("https://example.com///"), "https://example.com");
});

test("normalizeWebhookSiteBase strips a pasted /api/revalidate suffix", () => {
  assert.equal(normalizeWebhookSiteBase("https://example.com/api/revalidate"), "https://example.com");
  assert.equal(normalizeWebhookSiteBase("https://example.com/api/revalidate/"), "https://example.com");
});

test("normalizeWebhookSiteBase adds http:// when the scheme is missing", () => {
  assert.equal(normalizeWebhookSiteBase("localhost:3000"), "http://localhost:3000");
});

test("normalizeWebhookSiteBase keeps an explicit https scheme", () => {
  assert.equal(normalizeWebhookSiteBase("https://example.vercel.app/"), "https://example.vercel.app");
});

test("isNonPublicWebhookHost flags loopback, private, and local hosts", () => {
  for (const host of [
    "localhost",
    "app.localhost",
    "printer.local",
    "127.0.0.1",
    "0.0.0.0",
    "10.1.2.3",
    "192.168.0.10",
    "172.16.5.4",
    "172.31.255.255",
    "169.254.1.1",
    "::1",
    "",
  ]) {
    assert.equal(isNonPublicWebhookHost(host), true, host);
  }
});

test("isNonPublicWebhookHost allows public hosts", () => {
  for (const host of ["example.com", "my-project.vercel.app", "8.8.8.8", "172.32.0.1"]) {
    assert.equal(isNonPublicWebhookHost(host), false, host);
  }
});

test("webhookSiteBaseError rejects empty, scheme-less, and non-public URLs", () => {
  assert.match(webhookSiteBaseError("") ?? "", /deployed site URL/i);
  assert.match(webhookSiteBaseError("your-project.vercel.app") ?? "", /absolute URL/i);
  assert.match(webhookSiteBaseError("http://localhost:3000") ?? "", /localhost/i);
  assert.match(webhookSiteBaseError("https://127.0.0.1:3000") ?? "", /localhost|private/i);
});

test("webhookSiteBaseError accepts an absolute public URL and strips a pasted suffix", () => {
  assert.equal(webhookSiteBaseError("https://my-project.vercel.app"), null);
  assert.equal(webhookSiteBaseError("https://example.com/api/revalidate"), null);
});

test("webhookSiteBaseError treats the example.com placeholder as valid (registers cleanly)", () => {
  assert.equal(webhookSiteBaseError("https://example.com"), null);
});

test("isPlaceholderWebhookHost flags example.* and sanity.io, not a real deployment", () => {
  for (const host of ["example.com", "www.example.org", "example.net", "sanity.io", "www.sanity.io"]) {
    assert.equal(isPlaceholderWebhookHost(host), true, host);
  }

  for (const host of ["my-project.vercel.app", "acme.com", "example.io"]) {
    assert.equal(isPlaceholderWebhookHost(host), false, host);
  }
});

test("formatEnvValue quotes values with whitespace or special characters", () => {
  assert.equal(formatEnvValue("plainvalue"), "plainvalue");
  assert.equal(formatEnvValue("has space"), '"has space"');
  assert.equal(formatEnvValue('has"quote'), '"has\\"quote"');
});

test("generateRevalidateSecret returns 32 hex characters", () => {
  assert.match(generateRevalidateSecret(), /^[0-9a-f]{32}$/);
});

test("parseJsonFromCliOutput ignores spinner noise before the object", () => {
  const parsed = parseJsonFromCliOutput('⠋ working...\n{"projectId":"abc"}');

  assert.equal(parsed.projectId, "abc");
});

test("parseJsonFromCliOutput ignores trailing notices after the object", () => {
  const parsed = parseJsonFromCliOutput('{"key":"sk-123"}\n\nA new version of sanity is available.');

  assert.equal(parsed.key, "sk-123");
});

test("parseJsonFromCliOutput handles nested objects and braces inside strings", () => {
  const parsed = parseJsonFromCliOutput('prefix {"a":{"b":1},"label":"a } b"} trailing');

  assert.deepEqual(parsed, { a: { b: 1 }, label: "a } b" });
});

test("parseJsonFromCliOutput throws when no object is present", () => {
  assert.throws(() => parseJsonFromCliOutput("no json here"));
});

test("upsertEnvFile updates existing keys and appends new ones, preserving other lines", () => {
  const dir = mkdtempSync(join(tmpdir(), "env-test-"));
  const file = join(dir, ".env");

  try {
    writeFileSync(file, "# comment\nKEEP_ME=untouched\nNEXT_PUBLIC_SANITY_PROJECT_ID=old\n", "utf8");
    upsertEnvFile(file, { NEXT_PUBLIC_SANITY_PROJECT_ID: "new", SANITY_REVALIDATE_SECRET: "secret123" });

    const out = readFileSync(file, "utf8");

    assert.match(out, /# comment/);
    assert.match(out, /KEEP_ME=untouched/);
    assert.match(out, /NEXT_PUBLIC_SANITY_PROJECT_ID=new/);
    assert.doesNotMatch(out, /NEXT_PUBLIC_SANITY_PROJECT_ID=old/);
    assert.match(out, /SANITY_REVALIDATE_SECRET=secret123/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("upsertEnvFile replaces an exported key in place rather than duplicating it", () => {
  const dir = mkdtempSync(join(tmpdir(), "env-test-"));
  const file = join(dir, ".env");

  try {
    writeFileSync(file, "export FOO=old\n", "utf8");
    upsertEnvFile(file, { FOO: "new" });

    const out = readFileSync(file, "utf8");

    assert.match(out, /FOO=new/);
    assert.equal(out.match(/FOO=/g)?.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ensureEnvFromExample copies the example only when the target is missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "env-test-"));
  const example = join(dir, ".env.example");
  const target = join(dir, ".env");

  try {
    writeFileSync(example, "NEXT_PUBLIC_URL=http://localhost:3000\n", "utf8");

    assert.equal(ensureEnvFromExample(target, example), true);
    assert.match(readFileSync(target, "utf8"), /NEXT_PUBLIC_URL/);
    assert.equal(ensureEnvFromExample(target, example), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
