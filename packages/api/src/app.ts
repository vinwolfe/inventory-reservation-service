import { STATUS_CODES } from "node:http";
import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import {
  InMemoryProductRepository,
  InMemoryReservationRepository,
  InvalidTransitionError,
  OutOfStockError,
  ProductNotFoundError,
  ReservationNotFoundError,
  ReservationService,
  systemClock,
  type Clock,
  type ProductRepository,
  type ReservationRepository,
} from "@reservation/core";
import { registerReservationRoutes } from "./routes/reservations.js";

type FastifyErrorLike = Error & { statusCode?: number; code?: string };

function envelope(statusCode: number, code: string, message: string) {
  return {
    statusCode,
    code,
    error: STATUS_CODES[statusCode] ?? "Internal Server Error",
    message,
  };
}

export interface AppDependencies {
  products?: ProductRepository;
  reservations?: ReservationRepository;
  clock?: Clock;
}

export interface App {
  app: FastifyInstance;
  products: ProductRepository;
  reservations: ReservationRepository;
}

export function buildApp(deps: AppDependencies = {}): App {
  const products = deps.products ?? new InMemoryProductRepository();
  const reservations = deps.reservations ?? new InMemoryReservationRepository();
  const clock = deps.clock ?? systemClock;
  const reservationService = new ReservationService(products, reservations, clock);

  const app = Fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Normalizes every error response — Fastify's own validation failures and
  // our domain errors alike — into one {statusCode, code, error, message} envelope.
  // Anything Fastify/domain code didn't already mark as client-safe is logged
  // server-side and reported generically, so internals never leak to the client.
  app.setErrorHandler((error: FastifyErrorLike, request, reply) => {
    if (error instanceof ProductNotFoundError || error instanceof ReservationNotFoundError) {
      return reply.code(404).send(envelope(404, error.name, error.message));
    }
    if (error instanceof OutOfStockError || error instanceof InvalidTransitionError) {
      return reply.code(409).send(envelope(409, error.name, error.message));
    }
    if (error.statusCode) {
      return reply
        .code(error.statusCode)
        .send(envelope(error.statusCode, error.code ?? error.name, error.message));
    }

    request.log.error(error);
    return reply.code(500).send(envelope(500, "INTERNAL_SERVER_ERROR", "Internal Server Error"));
  });

  // Fastify routes unmatched requests through here instead of setErrorHandler —
  // without this, a 404 for an unknown route would carry a different shape
  // than every other error response.
  app.setNotFoundHandler((request, reply) => {
    return reply
      .code(404)
      .send(envelope(404, "NOT_FOUND", `Route ${request.method}:${request.url} not found`));
  });

  registerReservationRoutes(app, reservationService);

  return { app, products, reservations };
}
