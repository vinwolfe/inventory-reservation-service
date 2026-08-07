import type { Product } from "@reservation/shared";
import type { ProductRepository } from "./product-repository.js";

export class InMemoryProductRepository implements ProductRepository {
  #products = new Map<string, Product>();

  save(product: Product): void {
    this.#products.set(product.id, product);
  }

  findById(id: string): Product | undefined {
    return this.#products.get(id);
  }
}
