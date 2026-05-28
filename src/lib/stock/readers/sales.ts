import "server-only";

// Server-only read helpers for the sales page, including combined product and
// bundle sale grouping.
import { unstable_cache } from "next/cache";
import type {
  BundleHeaderRow,
  BundleItemListRow,
  ProductHeaderRow,
  SaleListRow,
} from "@/lib/stock/types";
import { createClient } from "@/lib/supabase/server";
import { escapeLikePattern } from "@/lib/validation";

const _VALID_SORTS = new Set([
  "name_asc",
  "name_desc",
  "stock_asc",
  "stock_desc",
  "value_asc",
  "value_desc",
]);
const _VALID_STATUSES = new Set(["all", "stocked", "pending"]);

export async function getCombinedSalesGroupedForUser(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : 10;

  const safeSearch =
    search && typeof search === "string" && search.trim() !== ""
      ? escapeLikePattern(search.trim().slice(0, 200))
      : null;

  return unstable_cache(
    async (
      userId: string,
      safePage: number,
      safePageSize: number,
      safeSearch: string | null,
    ) => {
      const supabase = await createClient();

      let productHeadersQuery = supabase
        .from("Product")
        .select(
          "id, name, lastSoldAt, totalRevenue, totalProfit, totalUnitsSold, saleCount",
        )
        .eq("userId", userId)
        .not("lastSoldAt", "is", null)
        .order("lastSoldAt", { ascending: false });
      if (safeSearch)
        productHeadersQuery = productHeadersQuery.ilike(
          "name",
          `%${safeSearch}%`,
        );

      let bundleHeadersQuery = supabase
        .from("Bundle")
        .select(
          "id, name, totalSellPrice, totalBuyCost, totalProfit, dateSold, createdAt",
        )
        .eq("userId", userId)
        .order("createdAt", { ascending: false });
      if (safeSearch)
        bundleHeadersQuery = bundleHeadersQuery.ilike(
          "name",
          `%${safeSearch}%`,
        );

      const [
        { data: allProducts, error: productsError },
        { data: allBundles, error: bundlesError },
      ] = await Promise.all([productHeadersQuery, bundleHeadersQuery]);

      if (productsError) throw new Error(productsError.message);
      if (bundlesError) throw new Error(bundlesError.message);

      type TaggedItem =
        | { kind: "product"; effectiveDate: string; data: ProductHeaderRow }
        | { kind: "bundle"; effectiveDate: string; data: BundleHeaderRow };

      const tagged: TaggedItem[] = [
        ...((allProducts as ProductHeaderRow[]) ?? []).map((p) => ({
          kind: "product" as const,
          effectiveDate: p.lastSoldAt,
          data: p,
        })),
        ...((allBundles as BundleHeaderRow[]) ?? []).map((b) => ({
          kind: "bundle" as const,
          effectiveDate: b.dateSold ?? b.createdAt,
          data: b,
        })),
      ];

      tagged.sort((a, b) => {
        if (a.effectiveDate > b.effectiveDate) return -1;
        if (a.effectiveDate < b.effectiveDate) return 1;
        return 0;
      });

      const total = tagged.length;
      const start = (safePage - 1) * safePageSize;
      const pageSlice = tagged.slice(start, start + safePageSize);

      const productIds = pageSlice
        .filter(
          (
            item,
          ): item is {
            kind: "product";
            effectiveDate: string;
            data: ProductHeaderRow;
          } => item.kind === "product",
        )
        .map((item) => item.data.id);
      const bundleIds = pageSlice
        .filter(
          (
            item,
          ): item is {
            kind: "bundle";
            effectiveDate: string;
            data: BundleHeaderRow;
          } => item.kind === "bundle",
        )
        .map((item) => item.data.id);

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

      const items = pageSlice.map((tagged) => {
        if (tagged.kind === "product") {
          const p = tagged.data;
          return {
            kind: "product" as const,
            data: {
              productId: p.id,
              productName: p.name,
              latestDate: p.lastSoldAt,
              totalQuantity: p.totalUnitsSold ?? 0,
              totalSalePrice: p.totalRevenue ?? 0,
              totalProfit: p.totalProfit ?? 0,
              sales: (salesByProduct.get(p.id) ?? []).map((s) => ({
                id: s.id,
                dateSold: s.dateSold,
                createdAt: s.createdAt,
                quantitySold: s.quantitySold,
                totalSalePrice: s.totalSalePrice,
                totalProfit: s.totalProfit,
                notes: s.notes,
                Product: { name: p.name },
              })),
            },
          };
        }

        const b = tagged.data;
        const bundleItems = itemsByBundle.get(b.id) ?? [];

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
        const allocatedProfitPerProduct =
          numDistinctProducts > 0
            ? Math.round(
                ((b.totalProfit as number) / numDistinctProducts) * 100,
              ) / 100
            : 0;

        return {
          kind: "bundle" as const,
          data: {
            bundleId: b.id as string,
            bundleName: b.name as string,
            dateSold: b.dateSold as string | null,
            createdAt: b.createdAt as string,
            totalSellPrice: b.totalSellPrice as number,
            totalBuyCost: b.totalBuyCost as number,
            totalProfit: b.totalProfit as number,
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
    { revalidate: 30 },
  )(userId, safePage, safePageSize, safeSearch);
}
