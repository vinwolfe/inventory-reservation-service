import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { ReservationService } from "@reservation/core";

const paramsSchema = z.object({ id: z.uuid() });
const bodySchema = z.object({ quantity: z.number().int().positive() });

export function registerReservationRoutes(
  app: FastifyInstance,
  reservationService: ReservationService,
): void {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      "/v1/products/:id/reservations",
      { schema: { params: paramsSchema, body: bodySchema } },
      async (request, reply) => {
        const { id } = request.params;
        const { quantity } = request.body;

        const reservation = reservationService.reserve(id, quantity);
        return reply.code(201).send(reservation);
      },
    );
}
