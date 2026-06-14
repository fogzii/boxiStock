import "server-only";

// Server-only read helpers for the sales page. Combined product+bundle
// pagination/sort runs in Postgres via the get_combined_sales_paginated RPC.
import { unstable_cache } from "next/cache";
import type { BundleItemListRow, SaleListRow } from "@/lib/stock/types";
import { createClient } from "@/lib/supabase/server";

type SalesSortField =
  | "date"
  | "product"
  | "quantity"
  | "buy"
  | "sell"
  | "profit";
type SalesSortDir = "asc" | "desc";

const VALID_SALES_SORT_FIELDS: ReadonlySet<SalesSortField> = new Set([
  "date",
  "product",
  "quantity",
  "buy",
  "sell",
  "profit",
]);

function parseSalesSort(sort: string | null | undefined): {
  field: SalesSortField;
  dir: SalesSortDir;
} {
  if (typeof sort === "string") {
    const idx = sort.lastIndexOf("_");
    if (idx > 0) {
      const field = sort.slice(0, idx);
      const dir = sort.slice(idx + 1);
      if (
        VALID_SALES_SORT_FIELDS.has(field as SalesSortField) &&
        (dir === "asc" || dir === "desc")
      ) {
        return { field: field as SalesSortField, dir };
      }
    }
  }
  return { field: "date", dir: "desc" };
}

export async function getCombinedSalesGroupedForUser(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sort?: string | null,
) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : 10;

  const safeSearch =
    search && typeof search === "string" && search.trim() !== ""
      ? search.trim().slice(0, 200)
      : null;

  const { field: sortField, dir: sortDir } = parseSalesSort(sort);
  const safeSort = `${sortField}_${sortDir}`;

  return unstable_cache(
    async (
      userId: string,
      safePage: number,
      safePageSize: number,
      safeSearch: string | null,
      safeSort: string,
    ) => {
      const supabase = await createClient();

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_combined_sales_paginated",
        {
          p_user_id: userId,
          p_page: safePage,
          p_page_size: safePageSize,
          p_search: safeSearch ?? undefined,
          p_sort: safeSort,
        },
      );
      if (rpcError) throw new Error(rpcError.message);

      type CombinedRpcRow = {
        kind: "product" | "bundle";
        id: string;
        name: string;
        effectiveDate: string | null;
        dateSold: string | null;
        createdAt: string | null;
        totalQuantity: number | string;
        totalBuy: number | string;
        totalSell: number | string;
        totalProfit: number | string;
      };

      const payload = (rpcData ?? {}) as {
        totalCount?: number;
        items?: CombinedRpcRow[];
      };
      const total = payload.totalCount ?? 0;
      const pageRows = payload.items ?? [];

      // Postgres NUMERIC columns arrive as strings via PostgREST. Normalize.
      const num = (v: number | string | null | undefined): number => {
        if (v == null) return 0;
        const n = typeof v === "number" ? v : parseFloat(v);
        return Number.isFinite(n) ? n : 0;
      };

      const productIds = pageRows
        .filter((r) => r.kind === "product")
        .map((r) => r.id);
      const bundleIds = pageRows
        .filter((r) => r.kind === "bundle")
        .map((r) => r.id);

      const [salesResult, bundleItemsResult] = await Promise.all([
        productIds.length > 0
          ? supabase
              .from("Sale")
              .select(
                "id, dateSold, createdAt, quantitySold, totalSalePrice, totalProfit, notes, productId",
              )
              .in("productId", productIds)
              .order("dateSold", { ascending: false, nullsFirst: false })
              .order("createdAt", { ascending: false })
          : Promise.resolve({ data: [] as SaleListRow[], error: null }),
        bundleIds.length > 0
          ? supabase
              .from("BundleItem")
              .select(
                "id, bundleId, productId, productName, quantityConsumed, buyPricePerUnit, totalBuyCost, lotId",
              )
              .in("bundleId", bundleIds)
          : Promise.resolve({ data: [] as BundleItemListRow[], error: null }),
      ]);

      if (salesResult.error) throw new Error(salesResult.error.message);
      if (bundleItemsResult.error)
        throw new Error(bundleItemsResult.error.message);

      const salesByProduct = new Map<string, SaleListRow[]>();
      for (const s of (salesResult.data as SaleListRow[]) ?? []) {
        if (!salesByProduct.has(s.productId))
          salesByProduct.set(s.productId, []);
        salesByProduct.get(s.productId)?.push(s);
      }

      const itemsByBundle = new Map<string, BundleItemListRow[]>();
      for (const item of (bundleItemsResult.data as BundleItemListRow[]) ??
        []) {
        if (!itemsByBundle.has(item.bundleId))
          itemsByBundle.set(item.bundleId, []);
        itemsByBundle.get(item.bundleId)?.push(item);
      }

      const items = pageRows.map((row) => {
        if (row.kind === "product") {
          return {
            kind: "product" as const,
            data: {
              productId: row.id,
              productName: row.name,
              latestDate: row.effectiveDate ?? "",
              totalQuantity: num(row.totalQuantity),
              totalSalePrice: num(row.totalSell),
              totalProfit: num(row.totalProfit),
              sales: (salesByProduct.get(row.id) ?? []).map((s) => ({
                id: s.id,
                dateSold: s.dateSold,
                createdAt: s.createdAt,
                quantitySold: s.quantitySold,
                totalSalePrice: s.totalSalePrice,
                totalProfit: s.totalProfit,
                notes: s.notes,
                Product: { name: row.name },
              })),
            },
          };
        }

        const bundleItems = itemsByBundle.get(row.id) ?? [];
        const productMap = new Map<
          string,
          {
            productId: string | null;
            productName: string;
            totalQuantity: number;
            totalBuyCost: number;
            hasRestorable: boolean;
          }
        >();
        for (const item of bundleItems) {
          const key = (item.productId as string | null) ?? item.productName;
          if (!productMap.has(key)) {
            productMap.set(key, {
              productId: item.productId as string | null,
              productName: item.productName as string,
              totalQuantity: 0,
              totalBuyCost: 0,
              hasRestorable: false,
            });
          }
          const p = productMap.get(key);
          if (!p) continue;
          p.totalQuantity += item.quantityConsumed;
          p.totalBuyCost += item.totalBuyCost;
          if (item.lotId) p.hasRestorable = true;
        }

        const products = [...productMap.values()];
        const numDistinctProducts = products.length;
        const bundleProfit = num(row.totalProfit);
        const allocatedProfitPerProduct =
          numDistinctProducts > 0
            ? Math.round((bundleProfit / numDistinctProducts) * 100) / 100
            : 0;

        return {
          kind: "bundle" as const,
          data: {
            bundleId: row.id,
            bundleName: row.name,
            dateSold: row.dateSold,
            createdAt: row.createdAt ?? "",
            totalSellPrice: num(row.totalSell),
            totalBuyCost: num(row.totalBuy),
            totalProfit: bundleProfit,
            products: products.map((p) => ({
              productId: p.productId,
              productName: p.productName,
              totalQuantity: p.totalQuantity,
              totalBuyCost: Math.round(p.totalBuyCost * 100) / 100,
              weightedAvgBuyPrice:
                p.totalQuantity > 0
                  ? Math.round((p.totalBuyCost / p.totalQuantity) * 100) / 100
                  : 0,
              allocatedProfit: allocatedProfitPerProduct,
              hasRestorable: p.hasRestorable,
            })),
          },
        };
      });

      return {
        items,
        total,
        totalPages: Math.ceil(total / safePageSize),
      };
    },
    [`sales-combined-${userId}`],
    { revalidate: 30, tags: [`stock-data-${userId}`] },
  )(userId, safePage, safePageSize, safeSearch, safeSort);
}
