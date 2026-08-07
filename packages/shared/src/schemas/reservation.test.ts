import { describe, expect, it } from "vitest";
import { reservationSchema } from "./reservation.js";

const valid = {
  id: "b3b1c2a0-1e2a-4b3a-9c1a-2f3e4d5c6b7a",
  productId: "c4c2d3b1-2f3b-4c4b-8d2b-3a4f5e6d7c8b",
  quantity: 2,
  createdAt: new Date(),
};

describe("reservationSchema", () => {
  it("accepts a valid reservation", () => {
    const result = reservationSchema.safeParse(valid);

    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid productId", () => {
    const result = reservationSchema.safeParse({ ...valid, productId: "not-a-uuid" });

    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = reservationSchema.safeParse({ ...valid, quantity: 0 });

    expect(result.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const result = reservationSchema.safeParse({ ...valid, quantity: -1 });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer quantity", () => {
    const result = reservationSchema.safeParse({ ...valid, quantity: 1.5 });

    expect(result.success).toBe(false);
  });
});
