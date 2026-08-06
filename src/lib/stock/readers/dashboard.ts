import "server-only";

// Server-only read helpers for dashboard cards and profit chart data.
import { unstable_cache } from "next/cache";
import type { DashboardMetricsRow, SalesByMonth } from "@/lib/stock/types";
import { createCachedClient } from "@/lib/supabase/server";

export async function getSalesMetricsForUser(userId: string) {
  return unstable_cache(
    async (uid: string) => {
      const supabase = await createCachedClient();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      const sevenDaysAgoIso = sevenDaysAgo.toISOString();

      // For each window, fetch rows where dateSold is in range, OR dateSold is
      // null and createdAt is in range (so we respect user-set sale dates).
      const recentFilter = `dateSold.gte.${sevenDaysAgoIso},and(dateSold.is.null,createdAt.gte.${sevenDaysAgoIso})`;

      const [
        { data: recentSales, error },
        { data: lifetimeSales, error: lifetimeError },
        { data: recentBundles, error: recentBundlesError },
        { data: lifetimeBundles, error: lifetimeBundlesError },
      ] = await Promise.all([
        supabase
          .from("Sale")
          .select(
            "quantitySold, totalSalePrice, totalProfit, dateSold, createdAt, Product!inner(userId)",
          )
          .eq("Product.userId", uid)
          .or(recentFilter),
        supabase
          .from("Sale")
          .select("totalProfit, Product!inner(userId)")
          .eq("Product.userId", uid),
        supabase
          .from("Bundle")
          .select("totalSellPrice, totalProfit, dateSold, createdAt")
          .eq("userId", uid)
          .or(recentFilter),
        supabase.from("Bundle").select("totalProfit").eq("userId", uid),
      ]);

      if (error) throw new Error(error.message);
      if (lifetimeError) throw new Error(lifetimeError.message);
      if (recentBundlesError) throw new Error(recentBundlesError.message);
      if (lifetimeBundlesError) throw new Error(lifetimeBundlesError.message);

      let totalSalesToday = 0;
      let totalUnitsSoldWeek = 0;
      let netProfitWeek = 0;

      for (const sale of recentSales || []) {
        const effectiveDate = new Date(sale.dateSold ?? sale.createdAt);
        totalUnitsSoldWeek += sale.quantitySold;
        netProfitWeek += sale.totalProfit;
        if (effectiveDate >= today) totalSalesToday += sale.totalSalePrice;
      }

      for (const bundle of recentBundles || []) {
        const effectiveDate = new Date(bundle.dateSold ?? bundle.createdAt);
        netProfitWeek += bundle.totalProfit;
        if (effectiveDate >= today) totalSalesToday += bundle.totalSellPrice;
      }

      const netProfitLifetime =
        (lifetimeSales || []).reduce((sum, s) => sum + s.totalProfit, 0) +
        (lifetimeBundles || []).reduce((sum, b) => sum + b.totalProfit, 0);

      return {
        totalSalesToday,
        totalUnitsSoldWeek,
        netProfitWeek,
        netProfitLifetime,
      };
    },
    [`sales-metrics-${userId}`],
    { revalidate: 60, tags: [`stock-data-${userId}`] },
  )(userId);
}

export async function getDashboardMetricsForUser(userId: string) {
  return unstable_cache(
    async (uid: string) => {
      const supabase = await createCachedClient();
      const { data, error } = await supabase.rpc("get_dashboard_metrics", {
        p_user_id: uid,
      });
      if (error) throw new Error(error.message);

      const metrics = data as DashboardMetricsRow;

      const currentROI =
        metrics.totalSoldCost > 0
          ? (metrics.totalLifetimeProfit / metrics.totalSoldCost) * 100
          : 0;

      return {
        totalLifetimeProfit: metrics.totalLifetimeProfit,
        currentInventoryValue: metrics.currentInventoryValue,
        currentROI,
      };
    },
    [`dashboard-metrics-${userId}`],
    { revalidate: 60, tags: [`stock-data-${userId}`] },
  )(userId);
}

export async function getProfitChartDataForUser(userId: string) {
  return unstable_cache(
    async (uid: string) => {
      const supabase = await createCachedClient();
      const { data, error } = await supabase.rpc("get_sales_by_month", {
        p_user_id: uid,
      });
      if (error) throw new Error(error.message);

      const rows: SalesByMonth[] = (data ?? []) as SalesByMonth[];
      const now = new Date();

      const profitByYearMonth = new Map<string, number>();
      let firstYear = now.getFullYear();
      let firstMonth = now.getMonth() + 1;
      for (const r of rows) {
        profitByYearMonth.set(`${r.year}-${r.month}`, Number(r.total_profit));
        if (
          r.year < firstYear ||
          (r.year === firstYear && r.month < firstMonth)
        ) {
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
      const eightWeeksAgoIso = eightWeeksAgo.toISOString();
      const recentWeekFilter = `dateSold.gte.${eightWeeksAgoIso},and(dateSold.is.null,createdAt.gte.${eightWeeksAgoIso})`;

      const [
        { data: recentSales, error: recentError },
        { data: recentBundles, error: recentBundlesError },
      ] = await Promise.all([
        supabase
          .from("Sale")
          .select("totalProfit, dateSold, createdAt, Product!inner(userId)")
          .eq("Product.userId", userId)
          .or(recentWeekFilter)
          .order("createdAt", { ascending: true }),
        supabase
          .from("Bundle")
          .select("totalProfit, dateSold, createdAt")
          .eq("userId", userId)
          .or(recentWeekFilter),
      ]);

      if (recentError) throw new Error(recentError.message);
      if (recentBundlesError) throw new Error(recentBundlesError.message);

      type WeeklyRow = {
        totalProfit: number;
        dateSold: string | null;
        createdAt: string;
      };
      const recentRows: WeeklyRow[] = [
        ...(recentSales || []),
        ...(recentBundles || []),
      ];

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
            const d = new Date(s.dateSold ?? s.createdAt);
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
        allTimeMap.set(
          key,
          (allTimeMap.get(key) ?? 0) + Number(r.total_profit),
        );
      }
      const allTimeData = Array.from(allTimeMap.entries()).map(
        ([name, total]) => ({
          name,
          total: parseFloat(total.toFixed(2)),
        }),
      );

      return { weeklyData, monthlyData, allTimeData };
    },
    [`profit-chart-${userId}`],
    { revalidate: 60, tags: [`stock-data-${userId}`] },
  )(userId);
}
