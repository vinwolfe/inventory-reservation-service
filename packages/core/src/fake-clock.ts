import type { Clock } from "./clock.js";

export class FakeClock implements Clock {
  #current: Date;

  constructor(start = new Date("2026-01-01T00:00:00.000Z")) {
    this.#current = start;
  }

  now(): Date {
    return this.#current;
  }

  advance(ms: number): void {
    this.#current = new Date(this.#current.getTime() + ms);
  }
}
