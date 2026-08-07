import type { Reservation } from "@reservation/shared";

export interface ReservationRepository {
  save(reservation: Reservation): void;
  findById(id: string): Reservation | undefined;
  findByProductId(productId: string): Reservation[];
}
