import type { Reservation } from "@reservation/shared";
import type { ReservationRepository } from "./reservation-repository.js";

export class InMemoryReservationRepository implements ReservationRepository {
  #reservations = new Map<string, Reservation>();

  save(reservation: Reservation): void {
    this.#reservations.set(reservation.id, reservation);
  }

  findById(id: string): Reservation | undefined {
    return this.#reservations.get(id);
  }

  findByProductId(productId: string): Reservation[] {
    return [...this.#reservations.values()].filter(
      (reservation) => reservation.productId === productId,
    );
  }
}
