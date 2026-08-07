import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { ReservationService } from "@reservation/core";

const idParamsSchema = z.object({ id: z.uuid() });
const reserveBodySchema = z.object({ quantity: z.number().int().positive() });

export function registerReservationRoutes(
  app: FastifyInstance,
  reservationService: ReservationService,
): void {
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      "/v1/products/:id/reservations",
      { schema: { params: idParamsSchema, body: reserveBodySchema } },
      async (request, reply) => {
        const { id } = request.params;
        const { quantity } = request.body;

        const reservation = reservationService.reserve(id, quantity);
        return reply.code(201).send(reservation);
      },
    )
    .get("/v1/reservations/:id", { schema: { params: idParamsSchema } }, async (request, reply) => {
      const { id } = request.params;

      const reservation = reservationService.getById(id);
      return reply.send(reservation);
    })
    .post(
      "/v1/reservations/:id/confirm",
      { schema: { params: idParamsSchema } },
      async (request, reply) => {
        const { id } = request.params;

        const reservation = reservationService.confirm(id);
        return reply.send(reservation);
      },
    )
    .post(
      "/v1/reservations/:id/cancel",
      { schema: { params: idParamsSchema } },
      async (request, reply) => {
        const { id } = request.params;

        const reservation = reservationService.cancel(id);
        return reply.send(reservation);
      },
    );
}
