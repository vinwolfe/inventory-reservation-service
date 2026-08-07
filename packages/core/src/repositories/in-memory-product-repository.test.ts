import { describe, expect, it } from "vitest";
import { InMemoryProductRepository } from "./in-memory-product-repository.js";

const product = {
  id: "b3b1c2a0-1e2a-4b3a-9c1a-2f3e4d5c6b7a",
  name: "Limited Edition Sneaker",
  totalStock: 10,
};

describe("InMemoryProductRepository", () => {
  it("returns a saved product by id", () => {
    const repository = new InMemoryProductRepository();
    repository.save(product);

    expect(repository.findById(product.id)).toEqual(product);
  });

  it("returns undefined for an unknown id", () => {
    const repository = new InMemoryProductRepository();

    expect(repository.findById("unknown")).toBeUndefined();
  });
});
