import type { ProductWithLots } from "@/lib/stock/types";

/**
 * Strip real purchase prices before inventory is serialized to a viewer who
 * may not see stock amounts. Render-side hiding is cosmetic on top of this —
 * the actual numbers must never reach the client.
 */
export function sanitizeStockAmounts(
  products: ProductWithLots[],
): ProductWithLots[] {
  return products.map((product) => ({
    ...product,
    lots: product.lots.map((lot) => ({ ...lot, buyPrice: 0 })),
  }));
}
