import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "@reservation/shared";
import { CORE_READY } from "./index.js";

describe("core package", () => {
  it("resolves its workspace dependency on @reservation/shared", () => {
    expect(CORE_READY).toContain(PACKAGE_NAME);
  });
});
