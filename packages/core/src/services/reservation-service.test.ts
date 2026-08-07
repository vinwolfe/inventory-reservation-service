import { describe, expect, it } from "vitest";
import { InMemoryProductRepository } from "../repositories/in-memory-product-repository.js";
import { InMemoryReservationRepository } from "../repositories/in-memory-reservation-repository.js";
import { ReservationService } from "./reservation-service.js";
import { OutOfStockError, ProductNotFoundError } from "../errors.js";

const product = {
  id: "b3b1c2a0-1e2a-4b3a-9c1a-2f3e4d5c6b7a",
  name: "Limited Edition Sneaker",
  totalStock: 10,
};

function setUp(initialStock = product.totalStock) {
  const products = new InMemoryProductRepository();
  products.save({ ...product, totalStock: initialStock });
  const reservations = new InMemoryReservationRepository();
  const service = new ReservationService(products, reservations);
  return { products, reservations, service };
}

describe("ReservationService.reserve", () => {
  it("creates a reservation without mutating total stock", () => {
    const { products, service } = setUp(10);

    const reservation = service.reserve(product.id, 3);

    expect(reservation.productId).toBe(product.id);
    expect(reservation.quantity).toBe(3);
    expect(products.findById(product.id)?.totalStock).toBe(10);
  });

  it("accounts for existing reservations when computing available stock", () => {
    const { service } = setUp(10);
    service.reserve(product.id, 7);

    expect(() => service.reserve(product.id, 4)).toThrow(OutOfStockError);
    expect(service.reserve(product.id, 3).quantity).toBe(3);
  });

  it("throws OutOfStockError when quantity exceeds available stock", () => {
    const { service } = setUp(2);

    expect(() => service.reserve(product.id, 3)).toThrow(OutOfStockError);
  });

  it("throws ProductNotFoundError for an unknown product", () => {
    const { service } = setUp();

    expect(() => service.reserve("unknown", 1)).toThrow(ProductNotFoundError);
  });

  it.each([0, -1, 1.5, NaN])(
    "throws RangeError for a non-positive-integer quantity (%s), without recording a reservation",
    (quantity) => {
      const { service, reservations } = setUp();

      expect(() => service.reserve(product.id, quantity)).toThrow(RangeError);
      expect(reservations.findByProductId(product.id)).toHaveLength(0);
    },
  );
});

describe("ReservationService.getAvailableStock", () => {
  it("returns total stock minus the sum of existing reservations", () => {
    const { service } = setUp(10);
    service.reserve(product.id, 4);

    expect(service.getAvailableStock(product.id)).toBe(6);
  });

  it("throws ProductNotFoundError for an unknown product", () => {
    const { service } = setUp();

    expect(() => service.getAvailableStock("unknown")).toThrow(ProductNotFoundError);
  });
});
