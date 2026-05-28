"use server";

// Server actions for dashboard and summary numbers. These authenticate the user
// and delegate read-heavy work to stock readers.
import { auth } from "@clerk/nextjs/server";
import {
  getDashboardMetricsForUser,
  getInventoryValueByStatusForUser,
  getProfitChartDataForUser,
  getSalesMetricsForUser,
} from "@/lib/stock/readers";

export async function getSalesMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return getSalesMetricsForUser(userId);
}

export async function getInventoryValueByStatus(
  status?: string,
): Promise<number> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return getInventoryValueByStatusForUser(userId, status);
}

export async function getDashboardMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return getDashboardMetricsForUser(userId);
}

export async function getProfitChartData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return getProfitChartDataForUser(userId);
}
