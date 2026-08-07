import { fileURLToPath } from "node:url";
import { defineWorkspace } from "vitest/config";

// Packages' package.json "exports" point at dist/, so tests must resolve
// straight to source — otherwise `pnpm test` only passes after a build.
const alias = {
  "@reservation/shared": fileURLToPath(new URL("./packages/shared/src/index.ts", import.meta.url)),
  "@reservation/core": fileURLToPath(new URL("./packages/core/src/index.ts", import.meta.url)),
};

export default defineWorkspace([
  { test: { name: "@reservation/shared", root: "packages/shared" }, resolve: { alias } },
  { test: { name: "@reservation/core", root: "packages/core" }, resolve: { alias } },
  { test: { name: "@reservation/api", root: "packages/api" }, resolve: { alias } },
]);
