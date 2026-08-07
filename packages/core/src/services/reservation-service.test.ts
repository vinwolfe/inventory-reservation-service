import { describe, expect, it } from "vitest";
import { FakeClock } from "../fake-clock.js";
import { InMemoryProductRepository } from "../repositories/in-memory-product-repository.js";
import { InMemoryReservationRepository } from "../repositories/in-memory-reservation-repository.js";
import { ReservationService } from "./reservation-service.js";
import {
  OutOfStockError,
  ProductNotFoundError,
  InvalidTransitionError,
  ReservationNotFoundError,
} from "../errors.js";

const product = {
  id: "b3b1c2a0-1e2a-4b3a-9c1a-2f3e4d5c6b7a",
  name: "Limited Edition Sneaker",
  totalStock: 10,
};

function setUp(options: { initialStock?: number; ttlMs?: number } = {}) {
  const { initialStock = product.totalStock, ttlMs = 15 * 60 * 1000 } = options;
  const products = new InMemoryProductRepository();
  products.save({ ...product, totalStock: initialStock });
  const reservations = new InMemoryReservationRepository();
  const clock = new FakeClock();
  const service = new ReservationService(products, reservations, clock, ttlMs);
  return { products, reservations, service, clock };
}

describe("ReservationService.reserve", () => {
  it("creates an active reservation without mutating total stock", () => {
    const { products, service } = setUp({ initialStock: 10 });

    const reservation = service.reserve(product.id, 3);

    expect(reservation.productId).toBe(product.id);
    expect(reservation.quantity).toBe(3);
    expect(reservation.status).toBe("active");
    expect(products.findById(product.id)?.totalStock).toBe(10);
  });

  it("sets expiresAt to createdAt plus the configured TTL", () => {
    const { service } = setUp({ ttlMs: 60_000 });

    const reservation = service.reserve(product.id, 1);

    expect(reservation.expiresAt.getTime() - reservation.createdAt.getTime()).toBe(60_000);
  });

  it("accounts for existing reservations when computing available stock", () => {
    const { service } = setUp({ initialStock: 10 });
    service.reserve(product.id, 7);

    expect(() => service.reserve(product.id, 4)).toThrow(OutOfStockError);
    expect(service.reserve(product.id, 3).quantity).toBe(3);
  });

  it("throws OutOfStockError when quantity exceeds available stock", () => {
    const { service } = setUp({ initialStock: 2 });

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
  it("returns total stock minus the sum of active reservations", () => {
    const { service } = setUp({ initialStock: 10 });
    service.reserve(product.id, 4);

    expect(service.getAvailableStock(product.id)).toBe(6);
  });

  it("excludes expired reservations from the reserved total", () => {
    const { service, clock } = setUp({ initialStock: 10, ttlMs: 60_000 });
    service.reserve(product.id, 4);

    clock.advance(60_001);

    expect(service.getAvailableStock(product.id)).toBe(10);
  });

  it("excludes cancelled reservations from the reserved total", () => {
    const { service } = setUp({ initialStock: 10 });
    const reservation = service.reserve(product.id, 4);
    service.cancel(reservation.id);

    expect(service.getAvailableStock(product.id)).toBe(10);
  });

  it("throws ProductNotFoundError for an unknown product", () => {
    const { service } = setUp();

    expect(() => service.getAvailableStock("unknown")).toThrow(ProductNotFoundError);
  });
});

describe("ReservationService.getById", () => {
  it("returns the stored reservation", () => {
    const { service } = setUp();
    const reservation = service.reserve(product.id, 1);

    expect(service.getById(reservation.id)).toEqual(reservation);
  });

  it("reports an effective status of expired without mutating storage", () => {
    const { service, reservations, clock } = setUp({ ttlMs: 60_000 });
    const reservation = service.reserve(product.id, 1);
    clock.advance(60_001);

    expect(service.getById(reservation.id).status).toBe("expired");
    expect(reservations.findById(reservation.id)?.status).toBe("active");
  });

  it("does not reinterpret a confirmed reservation as expired once its hold window passes", () => {
    const { service, clock } = setUp({ ttlMs: 60_000 });
    const reservation = service.reserve(product.id, 1);
    service.confirm(reservation.id);
    clock.advance(60_001);

    expect(service.getById(reservation.id).status).toBe("confirmed");
  });

  it("throws ReservationNotFoundError for an unknown id", () => {
    const { service } = setUp();

    expect(() => service.getById("unknown")).toThrow(ReservationNotFoundError);
  });
});

describe("ReservationService.confirm", () => {
  it("transitions an active reservation to confirmed", () => {
    const { service } = setUp();
    const reservation = service.reserve(product.id, 1);

    const confirmed = service.confirm(reservation.id);

    expect(confirmed.status).toBe("confirmed");
    expect(service.getById(reservation.id).status).toBe("confirmed");
  });

  it("keeps a confirmed reservation counted against available stock", () => {
    const { service } = setUp({ initialStock: 10 });
    const reservation = service.reserve(product.id, 4);
    service.confirm(reservation.id);

    expect(service.getAvailableStock(product.id)).toBe(6);
  });

  it("throws InvalidTransitionError when confirming twice", () => {
    const { service } = setUp();
    const reservation = service.reserve(product.id, 1);
    service.confirm(reservation.id);

    expect(() => service.confirm(reservation.id)).toThrow(InvalidTransitionError);
  });

  it("throws InvalidTransitionError when confirming an expired reservation", () => {
    const { service, clock } = setUp({ ttlMs: 60_000 });
    const reservation = service.reserve(product.id, 1);
    clock.advance(60_001);

    expect(() => service.confirm(reservation.id)).toThrow(InvalidTransitionError);
  });

  it("throws InvalidTransitionError when confirming a cancelled reservation", () => {
    const { service } = setUp();
    const reservation = service.reserve(product.id, 1);
    service.cancel(reservation.id);

    expect(() => service.confirm(reservation.id)).toThrow(InvalidTransitionError);
  });

  it("throws ReservationNotFoundError for an unknown id", () => {
    const { service } = setUp();

    expect(() => service.confirm("unknown")).toThrow(ReservationNotFoundError);
  });
});

describe("ReservationService.cancel", () => {
  it("transitions an active reservation to cancelled and frees its stock", () => {
    const { service } = setUp({ initialStock: 10 });
    const reservation = service.reserve(product.id, 4);

    const cancelled = service.cancel(reservation.id);

    expect(cancelled.status).toBe("cancelled");
    expect(service.getAvailableStock(product.id)).toBe(10);
  });

  it("throws InvalidTransitionError when cancelling twice", () => {
    const { service } = setUp();
    const reservation = service.reserve(product.id, 1);
    service.cancel(reservation.id);

    expect(() => service.cancel(reservation.id)).toThrow(InvalidTransitionError);
  });

  it("throws InvalidTransitionError when cancelling a confirmed reservation", () => {
    const { service } = setUp();
    const reservation = service.reserve(product.id, 1);
    service.confirm(reservation.id);

    expect(() => service.cancel(reservation.id)).toThrow(InvalidTransitionError);
  });

  it("throws InvalidTransitionError when cancelling an expired reservation", () => {
    const { service, clock } = setUp({ ttlMs: 60_000 });
    const reservation = service.reserve(product.id, 1);
    clock.advance(60_001);

    expect(() => service.cancel(reservation.id)).toThrow(InvalidTransitionError);
  });

  it("throws ReservationNotFoundError for an unknown id", () => {
    const { service } = setUp();

    expect(() => service.cancel("unknown")).toThrow(ReservationNotFoundError);
  });
});
