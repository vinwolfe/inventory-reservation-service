import { z } from "zod";

export const reservationStatusSchema = z.enum(["active", "confirmed", "cancelled", "expired"]);

export type ReservationStatus = z.infer<typeof reservationStatusSchema>;

export const reservationSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  quantity: z.number().int().positive(),
  status: reservationStatusSchema,
  createdAt: z.date(),
  expiresAt: z.date(),
});

export type Reservation = z.infer<typeof reservationSchema>;
