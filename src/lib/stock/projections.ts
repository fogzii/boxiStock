// Projected-profit maths, shared by the stock table, the edit-row modal and the
// dashboard card so all three agree on what "projected" means.
//
// Rules, in one place:
//   - Project on every lot that still holds units, received or on order. This
//     is the same basis as the stock row's Total Stock / Total Value, which is
//     what makes `projected sell price - total value = projected profit` hold
//     on every row. The status filter narrows the lots upstream, so the three
//     columns stay in step under "All", "In Stock" and "Pending" alike.
//   - A product with no sell price is NA. It is never treated as $0, so it
//     drops out of totals instead of dragging them down.
//   - Sell price is stored per unit, but a product's lots each have their own
//     buy price. The single per-unit cost we quote against is the weighted
//     average across those units, which keeps
//     `sellPrice * qty - totalCost` equal to the summed per-lot profit.
import { round2 } from "@/lib/formatting";
import type { InventoryLot } from "@/lib/stock/types";

/** Every lot still holding units — the same basis as Total Stock. */
export function projectableLots(lots: InventoryLot[]): InventoryLot[] {
  return lots.filter((lot) => lot.remainingQuantity > 0);
}

export function projectableQuantity(lots: InventoryLot[]): number {
  return projectableLots(lots).reduce(
    (acc, lot) => acc + lot.remainingQuantity,
    0,
  );
}

/** Purchase cost of the units a projection applies to. */
export function projectableCost(lots: InventoryLot[]): number {
  return round2(
    projectableLots(lots).reduce(
      (acc, lot) => acc + lot.remainingQuantity * lot.buyPrice,
      0,
    ),
  );
}

/**
 * Weighted-average buy price across remaining units, or null when there are no
 * units to average over (in which case there is no meaningful per-unit cost to
 * quote a margin against).
 */
export function weightedAvgBuyPrice(lots: InventoryLot[]): number | null {
  const quantity = projectableQuantity(lots);
  if (quantity === 0) return null;
  return round2(projectableCost(lots) / quantity);
}

/**
 * Coerce a stored sell price into a usable number, or null when there isn't
 * one. Tolerates `undefined` and numeric-as-string on purpose:
 *   - For ~30s after a deploy, `unstable_cache` can still serve inventory
 *     payloads built by the previous revision, which carry no sellPrice key at
 *     all. Treating that as 0 would render "$NaN" in the table.
 *   - Postgres `numeric` reaches JS as a string over some transports.
 * Zero is a real price and must survive, so this cannot be a truthiness check.
 */
export function toSellPrice(sellPrice: number | string | null | undefined) {
  if (sellPrice === null || sellPrice === undefined) return null;
  const n = Number(sellPrice);
  return Number.isFinite(n) ? n : null;
}

/** Total revenue this stock would bring in at `sellPrice`, or null if unpriced. */
export function projectedSellTotal(
  lots: InventoryLot[],
  sellPrice: number | null,
): number | null {
  const price = toSellPrice(sellPrice);
  if (price === null) return null;
  return round2(projectableQuantity(lots) * price);
}

/** Total profit this stock would make at `sellPrice`, or null if unpriced. */
export function projectedProfitTotal(
  lots: InventoryLot[],
  sellPrice: number | null,
): number | null {
  const revenue = projectedSellTotal(lots, sellPrice);
  if (revenue === null) return null;
  return round2(revenue - projectableCost(lots));
}
