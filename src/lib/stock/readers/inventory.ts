import "server-only";

// Server-only read helpers for inventory pages: paginated product/lot data and
// inventory value totals.
import { unstable_cache } from "next/cache";
import type { PaginatedInventoryProduct } from "@/lib/stock/types";
import { createClient } from "@/lib/supabase/server";

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

      const payload = (data ?? {}) as {
        totalCount?: number;
        products?: PaginatedInventoryProduct[];
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
