import { describe, expect, it } from "vitest";
import { InMemoryReservationRepository } from "./in-memory-reservation-repository.js";

const reservation = {
  id: "b3b1c2a0-1e2a-4b3a-9c1a-2f3e4d5c6b7a",
  productId: "c4c2d3b1-2f3b-4c4b-8d2b-3a4f5e6d7c8b",
  quantity: 2,
  status: "active" as const,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 60_000),
};

describe("InMemoryReservationRepository", () => {
  it("returns a saved reservation by id", () => {
    const repository = new InMemoryReservationRepository();
    repository.save(reservation);

    expect(repository.findById(reservation.id)).toEqual(reservation);
  });

  it("returns undefined for an unknown id", () => {
    const repository = new InMemoryReservationRepository();

    expect(repository.findById("unknown")).toBeUndefined();
  });

  it("returns all reservations for a product", () => {
    const repository = new InMemoryReservationRepository();
    repository.save(reservation);
    repository.save({ ...reservation, id: "other-id", productId: "other-product" });

    expect(repository.findByProductId(reservation.productId)).toEqual([reservation]);
  });

  it("returns an empty array when a product has no reservations", () => {
    const repository = new InMemoryReservationRepository();

    expect(repository.findByProductId("unknown")).toEqual([]);
  });
});
