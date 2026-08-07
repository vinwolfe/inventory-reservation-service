import { describe, expect, it } from "vitest";
import { productSchema } from "./product.js";

const valid = {
  id: "b3b1c2a0-1e2a-4b3a-9c1a-2f3e4d5c6b7a",
  name: "Limited Edition Sneaker",
  totalStock: 100,
};

describe("productSchema", () => {
  it("accepts a valid product", () => {
    const result = productSchema.safeParse(valid);

    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid id", () => {
    const result = productSchema.safeParse({ ...valid, id: "not-a-uuid" });

    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = productSchema.safeParse({ ...valid, name: "" });

    expect(result.success).toBe(false);
  });

  it("rejects negative stock", () => {
    const result = productSchema.safeParse({ ...valid, totalStock: -1 });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer stock", () => {
    const result = productSchema.safeParse({ ...valid, totalStock: 1.5 });

    expect(result.success).toBe(false);
  });
});
