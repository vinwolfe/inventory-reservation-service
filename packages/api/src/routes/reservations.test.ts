import { describe, expect, it } from "vitest";
import type { ProductRepository } from "@reservation/core";
import { buildApp } from "../app.js";

const product = {
  id: "b3b1c2a0-1e2a-4b3a-9c1a-2f3e4d5c6b7a",
  name: "Limited Edition Sneaker",
  totalStock: 5,
};

describe("POST /v1/products/:id/reservations", () => {
  it("returns 201 and the created reservation when stock is available", async () => {
    const { app, products, reservations } = buildApp();
    products.save(product);

    const response = await app.inject({
      method: "POST",
      url: `/v1/products/${product.id}/reservations`,
      payload: { quantity: 2 },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.productId).toBe(product.id);
    expect(body.quantity).toBe(2);
    expect(products.findById(product.id)?.totalStock).toBe(5);
    expect(reservations.findByProductId(product.id)).toHaveLength(1);
  });

  it("returns 404 with a consistent error envelope when the product does not exist", async () => {
    const { app } = buildApp();

    const response = await app.inject({
      method: "POST",
      url: `/v1/products/${product.id}/reservations`,
      payload: { quantity: 1 },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      statusCode: 404,
      error: "Not Found",
      message: expect.stringContaining(product.id),
    });
  });

  it("returns 409 with a consistent error envelope when requested quantity exceeds available stock", async () => {
    const { app, products, reservations } = buildApp();
    products.save(product);

    const response = await app.inject({
      method: "POST",
      url: `/v1/products/${product.id}/reservations`,
      payload: { quantity: 10 },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      statusCode: 409,
      error: "Conflict",
      message: expect.stringContaining("only 5 available"),
    });
    expect(reservations.findByProductId(product.id)).toHaveLength(0);
  });

  it("rejects a reservation that would exceed stock once existing reservations are counted", async () => {
    const { app, products } = buildApp();
    products.save(product);

    await app.inject({
      method: "POST",
      url: `/v1/products/${product.id}/reservations`,
      payload: { quantity: 3 },
    });
    const response = await app.inject({
      method: "POST",
      url: `/v1/products/${product.id}/reservations`,
      payload: { quantity: 3 },
    });

    expect(response.statusCode).toBe(409);
  });

  it("returns 400 with a consistent error envelope when quantity is not a positive integer", async () => {
    const { app, products } = buildApp();
    products.save(product);

    const response = await app.inject({
      method: "POST",
      url: `/v1/products/${product.id}/reservations`,
      payload: { quantity: 0 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      statusCode: 400,
      error: "Bad Request",
      message: expect.any(String),
    });
  });

  it("returns a generic 500 without leaking internal error details", async () => {
    const products: ProductRepository = {
      save: () => undefined,
      findById: () => {
        throw new Error("internal: connection string leaked");
      },
    };
    const { app } = buildApp({ products });

    const response = await app.inject({
      method: "POST",
      url: `/v1/products/${product.id}/reservations`,
      payload: { quantity: 1 },
    });

    expect(response.statusCode).toBe(500);
    const body = response.json();
    expect(body.message).toBe("Internal Server Error");
    expect(JSON.stringify(body)).not.toContain("connection string");
  });
});
