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

/**
 * Drop the stored sell price. Both the sell-price and projected-profit columns
 * are derived from it, so this is only safe once the viewer is allowed neither.
 * Same rule as above: hiding a column client-side is not enough, the number
 * itself must not be serialized into the page.
 */
export function sanitizeSellPrice(
  products: ProductWithLots[],
): ProductWithLots[] {
  return products.map((product) => ({ ...product, sellPrice: null }));
}
