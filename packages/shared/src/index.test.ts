import { describe, expect, it } from "vitest";
import { PACKAGE_NAME } from "./index.js";

describe("shared package", () => {
  it("builds and loads", () => {
    expect(PACKAGE_NAME).toBe("@reservation/shared");
  });
});
