import type { Product } from "@reservation/shared";

export interface ProductRepository {
  save(product: Product): void;
  findById(id: string): Product | undefined;
}
