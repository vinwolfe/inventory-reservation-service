import { z } from "zod";

export const reservationSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  quantity: z.number().int().positive(),
  createdAt: z.date(),
});

export type Reservation = z.infer<typeof reservationSchema>;
