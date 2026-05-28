"use server";

import { revalidatePath } from "next/cache";
import { getCombinedSalesGroupedForUser } from "@/lib/stock/readers";
import type {
  ProductGroupHeaderRow,
  ProductHeaderRow,
  SaleListRow,
} from "@/lib/stock/types";
// Server actions for sales history workflows: list grouped sales, edit/delete
// sale records, and merge one product's sales into another product.
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  assertNonNegativeNumber,
  assertPositiveInt,
  cleanOptionalString,
  cleanRequiredString,
  escapeLikePattern,
  MAX_LOT_NOTES_LENGTH,
  parseOptionalDate,
} from "@/lib/validation";
import { gateStockMutation, syncProductSalesStats } from "./_helpers";

export async function getSalesHistory(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : 10;

  const supabase = await createClient();

  // Get total count
  let countQuery = supabase
    .from("Sale")
    .select("*, Product!inner(name, userId)", { count: "exact", head: true })
    .eq("Product.userId", userId);

  if (search && typeof search === "string" && search.trim() !== "") {
    countQuery = countQuery.ilike(
      "Product.name",
      `%${escapeLikePattern(search.trim().slice(0, 200))}%`,
    );
  }

  const { count, error: countError } = await countQuery;

  if (countError) throw new Error(countError.message);

  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize - 1;

  let query = supabase
    .from("Sale")
    .select("*, Product!inner(name, userId)")
    .eq("Product.userId", userId)
    .order("dateSold", { ascending: false, nullsFirst: false })
    .order("createdAt", { ascending: false })
    .range(start, end);

  if (search && typeof search === "string" && search.trim() !== "") {
    query = query.ilike(
      "Product.name",
      `%${escapeLikePattern(search.trim().slice(0, 200))}%`,
    );
  }

  const { data: sales, error } = await query;

  if (error) throw new Error(error.message);

  return {
    sales: sales || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / safePageSize),
  };
}

export async function getSalesHistoryGrouped(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : 10;

  const supabase = await createClient();

  const safeSearch =
    search && typeof search === "string" && search.trim() !== ""
      ? escapeLikePattern(search.trim().slice(0, 200))
      : null;

  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize - 1;

  // Count and headers are independent — run in parallel
  let countQuery = supabase
    .from("Product")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .not("lastSoldAt", "is", null);
  if (safeSearch) countQuery = countQuery.ilike("name", `%${safeSearch}%`);

  let headersQuery = supabase
    .from("Product")
    .select(
      "id, name, lastSoldAt, totalRevenue, totalProfit, totalUnitsSold, saleCount",
    )
    .eq("userId", userId)
    .not("lastSoldAt", "is", null)
    .order("lastSoldAt", { ascending: false })
    .range(start, end);
  if (safeSearch) headersQuery = headersQuery.ilike("name", `%${safeSearch}%`);

  const [
    { count, error: countError },
    { data: products, error: productsError },
  ] = await Promise.all([countQuery, headersQuery]);

  if (countError) throw new Error(countError.message);
  if (productsError) throw new Error(productsError.message);

  if (!products || products.length === 0) {
    return {
      groups: [],
      totalCount: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / safePageSize),
    };
  }

  // Batch-fetch individual sales for the current page of products (2 queries total)
  const productIds = (products as ProductHeaderRow[]).map((p) => p.id);
  const { data: rawSales, error: salesError } = await supabase
    .from("Sale")
    .select(
      "id, dateSold, createdAt, quantitySold, totalSalePrice, totalProfit, notes, productId",
    )
    .in("productId", productIds)
    .order("dateSold", { ascending: false, nullsFirst: false })
    .order("createdAt", { ascending: false });
  if (salesError) throw new Error(salesError.message);

  // Index individual sales by productId
  const salesByProduct = new Map<string, SaleListRow[]>();
  for (const s of (rawSales as SaleListRow[]) ?? []) {
    if (!salesByProduct.has(s.productId)) salesByProduct.set(s.productId, []);
    salesByProduct.get(s.productId)?.push(s);
  }

  const groups = (products as ProductHeaderRow[]).map((p) => ({
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
  }));

  return {
    groups,
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / safePageSize),
  };
}

export async function updateSale(
  saleId: string,
  data: {
    quantitySold: number;
    salePricePerUnit: number;
    dateSold?: Date;
    notes?: string;
  },
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanId = cleanRequiredString(saleId, "saleId");
  assertPositiveInt(data?.quantitySold, "quantitySold");
  assertNonNegativeNumber(data?.salePricePerUnit, "salePricePerUnit");
  const dateSold = parseOptionalDate(data?.dateSold, "dateSold");
  const notes = cleanOptionalString(data?.notes, "notes", {
    maxLength: MAX_LOT_NOTES_LENGTH,
  });

  const supabase = await createClient();

  const { data: sale, error: fetchError } = await supabase
    .from("Sale")
    .select(
      "id, quantitySold, totalSalePrice, totalProfit, productId, Product!inner(userId)",
    )
    .eq("id", cleanId)
    .eq("Product.userId", userId)
    .single();

  if (fetchError || !sale) throw new Error("Sale not found or access denied");

  // Preserve the original buy price per unit when recalculating profit
  const buyPricePerUnit =
    sale.quantitySold > 0
      ? (sale.totalSalePrice - sale.totalProfit) / sale.quantitySold
      : 0;

  const newTotalSalePrice =
    Math.round(data.quantitySold * data.salePricePerUnit * 100) / 100;
  const newTotalProfit =
    Math.round(
      (newTotalSalePrice - data.quantitySold * buyPricePerUnit) * 100,
    ) / 100;

  const { error } = await supabase
    .from("Sale")
    .update({
      quantitySold: data.quantitySold,
      totalSalePrice: newTotalSalePrice,
      totalProfit: newTotalProfit,
      dateSold: dateSold ? dateSold.toISOString() : undefined,
      notes: notes ?? null,
    })
    .eq("id", cleanId);

  if (error) throw new Error(error.message);

  await syncProductSalesStats(supabase, sale.productId);

  revalidatePath("/sales");
}

export async function deleteSale(saleId: string) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  if (typeof saleId !== "string" || !saleId.trim())
    throw new Error("Invalid sale ID");

  const supabase = await createClient();

  // Verify ownership via the joined Product before deleting
  const { data: sale, error: fetchError } = await supabase
    .from("Sale")
    .select("id, productId, Product!inner(userId)")
    .eq("id", saleId)
    .eq("Product.userId", userId)
    .single();

  if (fetchError || !sale) throw new Error("Sale not found or access denied");

  const { error } = await supabase.from("Sale").delete().eq("id", saleId);
  if (error) throw new Error(error.message);

  await syncProductSalesStats(supabase, sale.productId);

  revalidatePath("/sales");
}

export async function deleteProductSales(productId: string) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanId = cleanRequiredString(productId, "productId");

  const supabase = await createClient();

  const { data: product, error: fetchError } = await supabase
    .from("Product")
    .select("id")
    .eq("id", cleanId)
    .eq("userId", userId)
    .single();

  if (fetchError || !product)
    throw new Error("Product not found or access denied");

  const { error } = await supabase
    .from("Sale")
    .delete()
    .eq("productId", cleanId);

  if (error) throw new Error(error.message);

  await syncProductSalesStats(supabase, cleanId);

  revalidatePath("/sales");
}

export async function getProductGroupHeaders(
  page: number = 1,
  pageSize: number = 5,
  search?: string,
  excludeProductId?: string,
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 50 ? pageSize : 5;

  const supabase = await createClient();

  const safeSearch =
    search && typeof search === "string" && search.trim() !== ""
      ? escapeLikePattern(search.trim().slice(0, 200))
      : null;

  let countQuery = supabase
    .from("Product")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .not("lastSoldAt", "is", null);
  if (safeSearch) countQuery = countQuery.ilike("name", `%${safeSearch}%`);
  if (excludeProductId && typeof excludeProductId === "string")
    countQuery = countQuery.neq("id", excludeProductId);
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(countError.message);

  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize - 1;

  let headersQuery = supabase
    .from("Product")
    .select("id, name, lastSoldAt")
    .eq("userId", userId)
    .not("lastSoldAt", "is", null)
    .order("lastSoldAt", { ascending: false })
    .range(start, end);
  if (safeSearch) headersQuery = headersQuery.ilike("name", `%${safeSearch}%`);
  if (excludeProductId && typeof excludeProductId === "string")
    headersQuery = headersQuery.neq("id", excludeProductId);
  const { data: products, error: productsError } = await headersQuery;
  if (productsError) throw new Error(productsError.message);

  const groups = ((products as ProductGroupHeaderRow[]) ?? []).map((p) => ({
    productId: p.id,
    productName: p.name,
    latestDate: p.lastSoldAt,
  }));

  return {
    groups,
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / safePageSize),
  };
}

export async function mergeProductSales(
  sourceProductId: string,
  targetProductId: string,
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanSourceId = cleanRequiredString(sourceProductId, "sourceProductId");
  const cleanTargetId = cleanRequiredString(targetProductId, "targetProductId");

  if (cleanSourceId === cleanTargetId)
    throw new Error("Cannot merge a product into itself");

  const supabase = await createClient();

  const { data: products, error: fetchError } = await supabase
    .from("Product")
    .select("id")
    .eq("userId", userId)
    .in("id", [cleanSourceId, cleanTargetId]);

  if (fetchError) throw new Error(fetchError.message);
  if (!products || products.length !== 2)
    throw new Error("One or both products not found or access denied");

  const { error: updateError } = await supabase
    .from("Sale")
    .update({ productId: cleanTargetId })
    .eq("productId", cleanSourceId);
  if (updateError) throw new Error(updateError.message);

  await syncProductSalesStats(supabase, cleanSourceId);
  await syncProductSalesStats(supabase, cleanTargetId);

  revalidatePath("/sales");
  return { success: true };
}

// ─── Bundle Sale Actions ──────────────────────────────────────────────────────

export async function getCombinedSalesGrouped(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  return getCombinedSalesGroupedForUser(userId, page, pageSize, search);
}
