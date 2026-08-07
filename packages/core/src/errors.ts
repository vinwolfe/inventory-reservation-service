export class ProductNotFoundError extends Error {
  constructor(productId: string) {
    super(`Product not found: ${productId}`);
    this.name = "ProductNotFoundError";
  }
}

export class OutOfStockError extends Error {
  constructor(productId: string, requested: number, available: number) {
    super(`Cannot reserve ${requested} of product ${productId}: only ${available} available`);
    this.name = "OutOfStockError";
  }
}
