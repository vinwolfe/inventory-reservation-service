import type { Reservation } from "@reservation/shared";
import { type Clock, systemClock } from "../clock.js";
import {
  InvalidTransitionError,
  OutOfStockError,
  ProductNotFoundError,
  ReservationNotFoundError,
} from "../errors.js";
import type { ProductRepository } from "../repositories/product-repository.js";
import type { ReservationRepository } from "../repositories/reservation-repository.js";

const DEFAULT_TTL_MS = 2 * 60 * 1000;

export class ReservationService {
  constructor(
    private readonly products: ProductRepository,
    private readonly reservations: ReservationRepository,
    private readonly clock: Clock = systemClock,
    private readonly ttlMs: number = DEFAULT_TTL_MS,
  ) {}

  getAvailableStock(productId: string, now: Date = this.clock.now()): number {
    const product = this.products.findById(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const reserved = this.reservations
      .findByProductId(productId)
      .filter((reservation) => this.holdsStock(reservation, now))
      .reduce((sum, reservation) => sum + reservation.quantity, 0);

    return product.totalStock - reserved;
  }

  reserve(productId: string, quantity: number): Reservation {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new RangeError(`quantity must be a positive integer, received: ${quantity}`);
    }

    const now = this.clock.now();
    const available = this.getAvailableStock(productId, now);
    if (quantity > available) {
      throw new OutOfStockError(productId, quantity, available);
    }

    const reservation: Reservation = {
      id: crypto.randomUUID(),
      productId,
      quantity,
      status: "active",
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.ttlMs),
    };
    this.reservations.save(reservation);

    return { ...reservation };
  }

  getById(reservationId: string): Reservation {
    const reservation = this.reservations.findById(reservationId);
    if (!reservation) {
      throw new ReservationNotFoundError(reservationId);
    }

    return this.withEffectiveStatus(reservation, this.clock.now());
  }

  confirm(reservationId: string): Reservation {
    return this.transition(reservationId, "confirmed");
  }

  cancel(reservationId: string): Reservation {
    return this.transition(reservationId, "cancelled");
  }

  private transition(reservationId: string, status: "confirmed" | "cancelled"): Reservation {
    const stored = this.reservations.findById(reservationId);
    if (!stored) {
      throw new ReservationNotFoundError(reservationId);
    }

    const now = this.clock.now();
    const current = this.withEffectiveStatus(stored, now);
    if (current.status !== "active") {
      throw new InvalidTransitionError(reservationId, current.status);
    }

    const updated: Reservation = { ...stored, status };
    this.reservations.save(updated);

    return { ...updated };
  }

  // Expiry is derived from expiresAt, never persisted — nothing to reconcile.
  private withEffectiveStatus(reservation: Reservation, now: Date): Reservation {
    if (reservation.status === "active" && reservation.expiresAt <= now) {
      return { ...reservation, status: "expired" };
    }
    // A copy, not the stored reference — callers can't mutate internal state.
    return { ...reservation };
  }

  // Active and confirmed reservations hold stock; cancelled/expired don't.
  private holdsStock(reservation: Reservation, now: Date): boolean {
    const status = this.withEffectiveStatus(reservation, now).status;
    return status === "active" || status === "confirmed";
  }
}
