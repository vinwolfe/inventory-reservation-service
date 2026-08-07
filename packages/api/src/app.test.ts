import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("buildApp", () => {
  it("returns a consistent error envelope for unmatched routes", async () => {
    const { app } = buildApp();

    const response = await app.inject({ method: "GET", url: "/v1/does-not-exist" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      error: "Not Found",
      message: expect.stringContaining("/v1/does-not-exist"),
    });
  });
});
