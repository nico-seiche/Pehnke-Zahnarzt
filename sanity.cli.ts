import { defineCliConfig } from "sanity/cli";
import { env } from "~/env";

export default defineCliConfig({
  api: {
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  },
  typegen: {
    path: ["./**/*.{ts,tsx}", "!./node_modules/**"],
    schema: "./sanity-schema.json",
    generates: "./sanity/types.ts",
    overloadClientMethods: false,
  },
});
