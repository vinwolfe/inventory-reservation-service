import { describe, expect, it } from "vitest";
import { CORE_READY } from "@reservation/core";
import { API_READY } from "./index.js";

describe("api package", () => {
  it("resolves its workspace dependency on @reservation/core", () => {
    expect(API_READY).toContain(CORE_READY);
  });
});
