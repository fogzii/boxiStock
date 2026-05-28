import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { escapeLikePattern } from "@/lib/validation";

const VALID_SORTS = new Set([
  "name_asc",
  "name_desc",
  "stock_asc",
  "stock_desc",
  "value_asc",
  "value_desc",
]);
const VALID_STATUSES = new Set(["all", "stocked", "pending"]);

export async function getInventoryPaginatedForUser(
  userId: string,
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sort?: string,
  status?: string,
) {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : 10;

  const safeSearch =
    typeof search === "string" && search.trim() !== ""
      ? search.trim().slice(0, 200)
      : undefined;

  const safeSort =
    typeof sort === "string" && VALID_SORTS.has(sort) ? sort : undefined;
  const safeStatus =
    typeof status === "string" && VALID_STATUSES.has(status) ? status : "all";

  return unstable_cache(
    async (
      uid: string,
      page: number,
      size: number,
      search: string | undefined,
      sort: string | undefined,
      status: string,
    ) => {
      const supabase = await createClient();

      const { data, error } = await supabase.rpc("get_inventory_paginated", {
        p_user_id: uid,
        p_search: search,
        p_page: page,
        p_page_size: size,
        p_sort: sort,
        p_status: status,
      });

      if (error) throw new Error(error.message);

      type PaginatedLot = {
        id: string;
        initialQuantity: number;
        remainingQuantity: number;
        buyPrice: number;
        isStocked: boolean;
        dateAcquired: Date;
        lotIdentity?: string | null;
        notes?: string | null;
      };
      type PaginatedProduct = {
        id: string;
        name: string;
        lots: PaginatedLot[];
      };

      const payload = (data ?? {}) as {
        totalCount?: number;
        products?: PaginatedProduct[];
      };
      const totalCount = payload.totalCount ?? 0;
      const products = payload.products ?? [];

      return {
        products,
        totalCount,
        totalPages: Math.ceil(totalCount / size),
      };
    },
    [`inventory-${userId}`],
    { revalidate: 30 },
  )(userId, safePage, safePageSize, safeSearch, safeSort, safeStatus);
}

export async function getSalesMetricsForUser(userId: string) {
  return unstable_cache(
    async (uid: string) => {
      const supabase = await createClient();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const [
        { data: recentSales, error },
        { data: lifetimeSales, error: lifetimeError },
      ] = await Promise.all([
        supabase
          .from("Sale")
          .select("*, Product!inner(userId)")
          .eq("Product.userId", uid)
          .gte("createdAt", sevenDaysAgo.toISOString()),
        supabase
          .from("Sale")
          .select("totalProfit, Product!inner(userId)")
          .eq("Product.userId", uid),
      ]);

      if (error) throw new Error(error.message);
      if (lifetimeError) throw new Error(lifetimeError.message);

      let totalSalesToday = 0;
      let totalUnitsSoldWeek = 0;
      let netProfitWeek = 0;

      for (const sale of recentSales || []) {
        const saleDate = new Date(sale.createdAt);
        totalUnitsSoldWeek += sale.quantitySold;
        netProfitWeek += sale.totalProfit;
        if (saleDate >= today) totalSalesToday += sale.totalSalePrice;
      }

      const netProfitLifetime = (lifetimeSales || []).reduce(
        (sum, s) => sum + s.totalProfit,
        0,
      );

      return {
        totalSalesToday,
        totalUnitsSoldWeek,
        netProfitWeek,
        netProfitLifetime,
      };
    },
    [`sales-metrics-${userId}`],
    { revalidate: 60 },
  )(userId);
}

export async function getInventoryValueByStatusForUser(
  userId: string,
  status?: string,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_inventory_value_by_status", {
    p_user_id: userId,
    p_status: status ?? "all",
  });
  if (error) throw new Error(error.message);
  return Math.round((data as number) * 100) / 100;
}

export async function getDashboardMetricsForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_metrics", {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);

  const metrics = data as {
    totalLifetimeProfit: number;
    currentInventoryValue: number;
    totalSoldCost: number;
  };

  const currentROI =
    metrics.totalSoldCost > 0
      ? (metrics.totalLifetimeProfit / metrics.totalSoldCost) * 100
      : 0;

  return {
    totalLifetimeProfit: metrics.totalLifetimeProfit,
    currentInventoryValue: metrics.currentInventoryValue,
    currentROI,
  };
}

export async function getProfitChartDataForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_sales_by_month", {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);

  type MonthRow = { year: number; month: number; total_profit: number };
  const rows: MonthRow[] = (data ?? []) as MonthRow[];
  const now = new Date();

  const profitByYearMonth = new Map<string, number>();
  let firstYear = now.getFullYear();
  let firstMonth = now.getMonth() + 1;
  for (const r of rows) {
    profitByYearMonth.set(`${r.year}-${r.month}`, Number(r.total_profit));
    if (r.year < firstYear || (r.year === firstYear && r.month < firstMonth)) {
      firstYear = r.year;
      firstMonth = r.month;
    }
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const eightWeeksAgo = new Date(now);
  eightWeeksAgo.setDate(now.getDate() - 56);

  const { data: recentSales, error: recentError } = await supabase
    .from("Sale")
    .select("totalProfit, createdAt, Product!inner(userId)")
    .eq("Product.userId", userId)
    .gte("createdAt", eightWeeksAgo.toISOString())
    .order("createdAt", { ascending: true });

  if (recentError) throw new Error(recentError.message);
  const recentRows = recentSales || [];

  const weeklyData: { name: string; total: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekProfit = recentRows
      .filter((s) => {
        const d = new Date(s.createdAt);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((acc, s) => acc + (s.totalProfit || 0), 0);

    weeklyData.push({
      name: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      total: parseFloat(weekProfit.toFixed(2)),
    });
  }

  const monthlyData: { name: string; total: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const profit = profitByYearMonth.get(`${year}-${month}`) ?? 0;
    monthlyData.push({
      name: `${monthNames[month - 1]} ${year.toString().slice(-2)}`,
      total: parseFloat(profit.toFixed(2)),
    });
  }

  const nowYear = now.getFullYear();
  const yearsDiff = rows.length > 0 ? nowYear - firstYear : 0;
  const groupByYear = yearsDiff >= 3;

  const allTimeMap = new Map<string, number>();
  for (const r of rows) {
    const key = groupByYear
      ? String(r.year)
      : `${monthNames[r.month - 1]} ${String(r.year).slice(-2)}`;
    allTimeMap.set(key, (allTimeMap.get(key) ?? 0) + Number(r.total_profit));
  }
  const allTimeData = Array.from(allTimeMap.entries()).map(([name, total]) => ({
    name,
    total: parseFloat(total.toFixed(2)),
  }));

  return { weeklyData, monthlyData, allTimeData };
}

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

      type ProductHeaderRow = {
        id: string;
        name: string;
        lastSoldAt: string;
        totalRevenue: number;
        totalProfit: number;
        totalUnitsSold: number;
        saleCount: number;
      };
      type BundleHeaderRow = {
        id: string;
        name: string;
        totalSellPrice: number;
        totalBuyCost: number;
        totalProfit: number;
        dateSold: string | null;
        createdAt: string;
      };
      type SaleRow = {
        id: string;
        dateSold: string | null;
        createdAt: string;
        quantitySold: number;
        totalSalePrice: number;
        totalProfit: number;
        notes: string | null;
        productId: string;
      };
      type BundleItemRow = {
        id: string;
        bundleId: string;
        productId: string | null;
        productName: string;
        quantityConsumed: number;
        buyPricePerUnit: number;
        totalBuyCost: number;
        lotId: string | null;
      };

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
          : Promise.resolve({ data: [] as SaleRow[], error: null }),
        bundleIds.length > 0
          ? supabase
              .from("BundleItem")
              .select(
                "id, bundleId, productId, productName, quantityConsumed, buyPricePerUnit, totalBuyCost, lotId",
              )
              .in("bundleId", bundleIds)
          : Promise.resolve({ data: [] as BundleItemRow[], error: null }),
      ]);

      if (salesResult.error) throw new Error(salesResult.error.message);
      if (bundleItemsResult.error)
        throw new Error(bundleItemsResult.error.message);

      const salesByProduct = new Map<string, SaleRow[]>();
      for (const s of (salesResult.data as SaleRow[]) ?? []) {
        if (!salesByProduct.has(s.productId))
          salesByProduct.set(s.productId, []);
        salesByProduct.get(s.productId)?.push(s);
      }

      const itemsByBundle = new Map<string, BundleItemRow[]>();
      for (const item of (bundleItemsResult.data as BundleItemRow[]) ?? []) {
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
