// Shared server-action helpers for stock mutations, rate limits, and product
// sales aggregate maintenance.
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { createClient } from "@/lib/supabase/server";

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
