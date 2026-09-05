// Shared server-action helpers for stock mutations, rate limits, and product
// sales aggregate maintenance.
import { revalidateTag } from "next/cache";
import { round2 } from "@/lib/formatting";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { createClient } from "@/lib/supabase/server";
import { escapeLikePattern } from "@/lib/validation";

// Purges every unstable_cache read derived from this user's stock/sales/bundle
// data (see the `stock-data-${userId}` tags in src/lib/stock/readers/*).
// revalidatePath alone does NOT invalidate unstable_cache entries, so every
// mutation must call this alongside its revalidatePath call.
export function revalidateStockData(userId: string) {
  revalidateTag(`stock-data-${userId}`, "max");
}

// Single shared bucket for all stock mutations (addProduct, sellLotUnits, ...).
// Caps bursty activity per user; 60/min is generous for real UI use but
// cheap to hit with a runaway loop.
export async function gateStockMutation(userId: string) {
  await enforceRateLimit(
    `stock:mutation:${userId}`,
    RATE_LIMITS.mutation,
    "stock update",
  );
}

// Tighter bucket for anything that fans out into many Supabase writes per
// call (bulk imports, seed, AI-ingested batches).
export async function gateStockBulk(userId: string) {
  await enforceRateLimit(
    `stock:bulk:${userId}`,
    RATE_LIMITS.bulk,
    "bulk stock operation",
  );
}

type SupabaseInstance = Awaited<ReturnType<typeof createClient>>;

// Re-aggregates Product sales stats from the Sale table.
// Called after every sale insert / update / delete so that
// Product.lastSoldAt / totalRevenue / totalProfit / totalUnitsSold / saleCount
// stay in sync and the grouped sales history query never touches Sale for headers.
export async function syncProductSalesStats(
  supabase: SupabaseInstance,
  productId: string,
) {
  await supabase.rpc("sync_product_sale_stats", { p_product_id: productId });
}

// Seed value for a new product's projected sell price: the lowest per-unit
// price anything of the same name has ever sold for. Matching is by name
// (case-insensitive) rather than product id so a product re-created after its
// last lot was deleted still inherits its old pricing. Returns null when the
// name has no sales history, which the UI renders as NA.
export async function lowestHistoricalUnitPrice(
  supabase: SupabaseInstance,
  userId: string,
  name: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("Sale")
    .select("totalSalePrice, quantitySold, Product!inner(userId, name)")
    .eq("Product.userId", userId)
    // No wildcards survive escaping, so this is an exact case-insensitive match.
    .ilike("Product.name", escapeLikePattern(name))
    .gt("quantitySold", 0);

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  return data.reduce<number | null>((lowest, sale) => {
    const unitPrice = round2(sale.totalSalePrice / sale.quantitySold);
    return lowest === null || unitPrice < lowest ? unitPrice : lowest;
  }, null);
}

// Drops a product once its last lot is gone, so an emptied row does not linger
// as an invisible record. Skipped when the product still has sales: deleting it
// would cascade through Sale.productId and silently take the sales history with
// it, and the inventory list already hides products with no remaining units.
export async function deleteProductIfUnused(
  supabase: SupabaseInstance,
  productId: string,
) {
  const { count: lotCount } = await supabase
    .from("StockLot")
    .select("*", { count: "exact", head: true })
    .eq("productId", productId);
  if (lotCount !== 0) return;

  const { count: saleCount } = await supabase
    .from("Sale")
    .select("*", { count: "exact", head: true })
    .eq("productId", productId);
  if (saleCount !== 0) return;

  await supabase.from("Product").delete().eq("id", productId);
}
