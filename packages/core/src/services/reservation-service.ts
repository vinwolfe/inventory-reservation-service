import type { Reservation } from "@reservation/shared";
import { OutOfStockError, ProductNotFoundError } from "../errors.js";
import type { ProductRepository } from "../repositories/product-repository.js";
import type { ReservationRepository } from "../repositories/reservation-repository.js";

export class ReservationService {
  constructor(
    private readonly products: ProductRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  getAvailableStock(productId: string): number {
    const product = this.products.findById(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    const reserved = this.reservations
      .findByProductId(productId)
      .reduce((sum, reservation) => sum + reservation.quantity, 0);

    return product.totalStock - reserved;
  }

  reserve(productId: string, quantity: number): Reservation {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new RangeError(`quantity must be a positive integer, received: ${quantity}`);
    }

    const available = this.getAvailableStock(productId);
    if (quantity > available) {
      throw new OutOfStockError(productId, quantity, available);
    }

    const reservation: Reservation = {
      id: crypto.randomUUID(),
      productId,
      quantity,
      createdAt: new Date(),
    };
    this.reservations.save(reservation);

    return reservation;
  }
}
