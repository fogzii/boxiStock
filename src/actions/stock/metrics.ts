"use server";

import {
  getDashboardMetricsForUser,
  getInventoryValueByStatusForUser,
  getProfitChartDataForUser,
  getSalesMetricsForUser,
} from "@/lib/stock/readers";
// Server actions for dashboard and summary numbers. These authenticate the user
// and delegate read-heavy work to stock readers.
import { getAuthUser } from "@/lib/supabase/auth";

export async function getSalesMetrics() {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  return getSalesMetricsForUser(userId);
}

export async function getInventoryValueByStatus(
  status?: string,
): Promise<number> {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  return getInventoryValueByStatusForUser(userId, status);
}

export async function getDashboardMetrics() {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  return getDashboardMetricsForUser(userId);
}

export async function getProfitChartData() {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  return getProfitChartDataForUser(userId);
}
