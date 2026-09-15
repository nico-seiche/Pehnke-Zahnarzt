import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCreateArgs,
  buildDeleteArgs,
  buildExportArgs,
  buildImportArgs,
  formatExportTimestamp,
  getImportConfirmationMessage,
  getMigrationMode,
  getSanityEnv,
  orderImportChoices,
  validateMigrationOptions,
} from "./lib";

test("getSanityEnv prefers explicit SANITY_* over NEXT_PUBLIC_* fallbacks", () => {
  const env = getSanityEnv({
    SANITY_PROJECT_ID: "explicit",
    SANITY_DATASET: "explicit-ds",
    NEXT_PUBLIC_SANITY_PROJECT_ID: "public",
    NEXT_PUBLIC_SANITY_DATASET: "public-ds",
  });

  assert.equal(env.SANITY_PROJECT_ID, "explicit");
  assert.equal(env.SANITY_DATASET, "explicit-ds");
});

test("getSanityEnv falls back to NEXT_PUBLIC_* when SANITY_* are absent", () => {
  const env = getSanityEnv({
    NEXT_PUBLIC_SANITY_PROJECT_ID: "pub",
    NEXT_PUBLIC_SANITY_DATASET: "pub-ds",
  });

  assert.equal(env.SANITY_PROJECT_ID, "pub");
  assert.equal(env.SANITY_DATASET, "pub-ds");
});

test("getSanityEnv throws when no project id is available", () => {
  assert.throws(() => getSanityEnv({ NEXT_PUBLIC_SANITY_DATASET: "ds" }));
});

test("validateMigrationOptions rejects --replace combined with --clean", () => {
  const result = validateMigrationOptions({ from: "a", to: "b", replace: true, clean: true });

  assert.equal(result.success, false);
  assert.match(result.error ?? "", /cannot be used together/);
});

test("validateMigrationOptions rejects identical source and target", () => {
  const result = validateMigrationOptions({ from: "same", to: "same" });

  assert.equal(result.success, false);
  assert.match(result.error ?? "", /cannot be the same/);
});

test("validateMigrationOptions accepts a valid migration", () => {
  assert.deepEqual(validateMigrationOptions({ from: "a", to: "b" }), { success: true });
});

test("getMigrationMode resolves clean > replace > standard precedence", () => {
  assert.equal(getMigrationMode({ clean: true, replace: true }), "clean");
  assert.equal(getMigrationMode({ replace: true }), "replace");
  assert.equal(getMigrationMode({}), "standard");
});

test("buildImportArgs targets the dataset via flag and appends --replace only when requested", () => {
  assert.deepEqual(buildImportArgs("/tmp/x.tar.gz", "prod", {}), ["dataset", "import", "/tmp/x.tar.gz", "--dataset", "prod"]);
  assert.deepEqual(buildImportArgs("/tmp/x.tar.gz", "prod", { replace: true }), [
    "dataset",
    "import",
    "/tmp/x.tar.gz",
    "--dataset",
    "prod",
    "--replace",
  ]);
});

test("buildDeleteArgs and buildCreateArgs target the right dataset", () => {
  assert.deepEqual(buildDeleteArgs("staging"), ["dataset", "delete", "staging", "--force"]);
  assert.deepEqual(buildCreateArgs("staging"), ["dataset", "create", "staging", "--visibility", "private"]);
  assert.deepEqual(buildCreateArgs("staging", "public"), ["dataset", "create", "staging", "--visibility", "public"]);
});

test("buildExportArgs orders source dataset then output path", () => {
  assert.deepEqual(buildExportArgs("prod", "/tmp/prod.tar.gz"), ["dataset", "export", "prod", "/tmp/prod.tar.gz"]);
});

test("formatExportTimestamp includes date and time so same-day runs do not collide", () => {
  assert.equal(formatExportTimestamp(new Date("2026-06-13T14:30:52.123Z")), "2026-06-13-143052");
});

test("formatExportTimestamp produces distinct values for two times on the same day", () => {
  const a = formatExportTimestamp(new Date("2026-06-13T14:30:52.000Z"));
  const b = formatExportTimestamp(new Date("2026-06-13T14:30:53.000Z"));

  assert.notEqual(a, b);
});

test("getImportConfirmationMessage warns about destruction only in clean mode", () => {
  assert.match(getImportConfirmationMessage("staging", "prod", true), /PERMANENTLY DELETE/);
  assert.doesNotMatch(getImportConfirmationMessage("staging", "prod", false), /PERMANENTLY DELETE/);
});

test("orderImportChoices lists the seed first, then backups newest first", () => {
  const choices = orderImportChoices(true, [
    { name: "production-2026-06-10-000000.tar.gz", mtimeMs: 10 },
    { name: "production-2026-06-15-000000.tar.gz", mtimeMs: 50 },
  ]);

  assert.deepEqual(choices, [
    { title: "seed/seed-dataset.tar.gz (bundled starter content)", value: "seed/seed-dataset.tar.gz" },
    { title: "backups/production-2026-06-15-000000.tar.gz", value: "backups/production-2026-06-15-000000.tar.gz" },
    { title: "backups/production-2026-06-10-000000.tar.gz", value: "backups/production-2026-06-10-000000.tar.gz" },
  ]);
});

test("orderImportChoices omits the seed when it is absent", () => {
  assert.deepEqual(orderImportChoices(false, [{ name: "a.tar.gz", mtimeMs: 1 }]), [
    { title: "backups/a.tar.gz", value: "backups/a.tar.gz" },
  ]);
});
