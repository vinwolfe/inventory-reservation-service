export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product not found: ${productId}`);
    this.name = "ProductNotFoundError";
  }
}

export class OutOfStockError extends Error {
  constructor(productId: string, requested: number, available: number) {
    super(`Cannot reserve ${requested} of product ${productId}: only ${available} available`);
    this.name = "OutOfStockError";
  }
}

export class ReservationNotFoundError extends Error {
  constructor(reservationId: string) {
    super(`Reservation not found: ${reservationId}`);
    this.name = "ReservationNotFoundError";
  }
}

export class InvalidTransitionError extends Error {
  constructor(reservationId: string, status: string) {
    super(`Reservation ${reservationId} cannot be modified: status is ${status}`);
    this.name = "InvalidTransitionError";
  }
}
