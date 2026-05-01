"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath, unstable_cache } from "next/cache";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  assertArrayWithLimit,
  assertBoolean,
  assertNonNegativeNumber,
  assertPositiveInt,
  cleanOptionalString,
  cleanRequiredString,
  escapeLikePattern,
  MAX_LOT_IDENTITY_LENGTH,
  MAX_LOT_NOTES_LENGTH,
  parseOptionalDate,
} from "@/lib/validation";

// Single shared bucket for all stock mutations (addProduct, sellLotUnits, …).
// Caps bursty activity per user; 60/min is generous for real UI use but
// cheap to hit with a runaway loop.
async function gateStockMutation(userId: string) {
  await enforceRateLimit(
    `stock:mutation:${userId}`,
    RATE_LIMITS.mutation,
    "stock update",
  );
}

// Tighter bucket for anything that fans out into many Supabase writes per
// call (bulk imports, seed, AI-ingested batches).
async function gateStockBulk(userId: string) {
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
async function syncProductSalesStats(
  supabase: SupabaseInstance,
  productId: string,
) {
  const { data: rows } = await supabase
    .from("Sale")
    .select("quantitySold, totalSalePrice, totalProfit, dateSold, createdAt")
    .eq("productId", productId);

  if (!rows || rows.length === 0) {
    await (supabase.from("Product") as any)
      .update({
        lastSoldAt: null,
        totalRevenue: 0,
        totalProfit: 0,
        totalUnitsSold: 0,
        saleCount: 0,
      })
      .eq("id", productId);
    return;
  }

  let totalRevenue = 0;
  let totalProfit = 0;
  let totalUnitsSold = 0;
  let latestDate = new Date(0);

  for (const s of rows as any[]) {
    totalRevenue += s.totalSalePrice;
    totalProfit += s.totalProfit;
    totalUnitsSold += s.quantitySold;
    const d = new Date(s.dateSold ?? s.createdAt);
    if (d > latestDate) latestDate = d;
  }

  await (supabase.from("Product") as any)
    .update({
      lastSoldAt: latestDate.toISOString(),
      totalRevenue,
      totalProfit,
      totalUnitsSold,
      saleCount: rows.length,
    })
    .eq("id", productId);
}

export async function getRecentProducts(limit = 3) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Product")
    .select("id, name")
    .eq("userId", userId)
    .order("updatedAt", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; name: string }[];
}

export async function getInventory() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("Product")
    .select("*, lots:StockLot(*)")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching inventory:", error);
    throw new Error(error.message);
  }

  type LotLike = { remainingQuantity: number; dateAcquired: string };

  // To match the Prisma orderBy on lots and hide 0-quantity
  const activeProducts = products?.filter((p) => {
    p.lots = ((p.lots as LotLike[] | null) || [])
      .filter((l) => l.remainingQuantity > 0)
      .sort(
        (a, b) =>
          new Date(a.dateAcquired).getTime() -
          new Date(b.dateAcquired).getTime(),
      );
    return p.lots.length > 0;
  });

  return activeProducts || [];
}

export async function getInventoryPaginated(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Clamp pagination inputs server-side: page >= 1, pageSize in [1, 100].
  // Postgres function also clamps, but we mirror it here so the client math
  // (totalPages) stays consistent.
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : 10;

  const safeSearch =
    typeof search === "string" && search.trim() !== ""
      ? search.trim().slice(0, 200)
      : null;

  const supabase = await createClient();

  // Single round-trip to Postgres. The RPC does the stock filter, search,
  // count, pagination, and lot embedding server-side, so we never build
  // giant `id=in.(…)` URLs (those were pushing on Cloudflare URL limits
  // and caused intermittent 525s under large inventories).
  const { data, error } = await supabase.rpc("get_inventory_paginated", {
    p_user_id: userId,
    p_search: safeSearch,
    p_page: safePage,
    p_page_size: safePageSize,
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
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}

export async function addProduct(data: {
  name: string;
  initialQuantity: number;
  buyPrice: number;
  isStocked: boolean;
  dateAcquired?: Date;
  lotIdentity?: string;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const name = cleanRequiredString(data?.name, "product name");
  assertPositiveInt(data?.initialQuantity, "initialQuantity");
  assertNonNegativeNumber(data?.buyPrice, "buyPrice");
  assertBoolean(data?.isStocked, "isStocked");
  const dateAcquired = parseOptionalDate(data?.dateAcquired, "dateAcquired");
  const lotIdentity = cleanOptionalString(data?.lotIdentity, "lotIdentity", {
    maxLength: MAX_LOT_IDENTITY_LENGTH,
  });
  const notes = cleanOptionalString(data?.notes, "notes", {
    maxLength: MAX_LOT_NOTES_LENGTH,
  });

  const supabase = await createClient();

  // Reuse existing product if same name already exists (case-insensitive).
  const { data: existing } = await supabase
    .from("Product")
    .select("id")
    .eq("userId", userId)
    .ilike("name", escapeLikePattern(name))
    .limit(1)
    .maybeSingle();

  let productId: string;

  const now = new Date().toISOString();

  if (existing) {
    productId = existing.id;
    // Bubble product to top of inventory by stamping updatedAt
    await supabase
      .from("Product")
      .update({ updatedAt: now })
      .eq("id", productId);
  } else {
    const { data: product, error: productError } = await supabase
      .from("Product")
      .insert([
        {
          id: crypto.randomUUID(),
          userId,
          name,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .select()
      .single();

    if (productError) throw new Error(productError.message);
    productId = product.id;
  }

  const { error: lotError } = await supabase.from("StockLot").insert([
    {
      id: crypto.randomUUID(),
      productId,
      initialQuantity: data.initialQuantity,
      remainingQuantity: data.initialQuantity,
      buyPrice: data.buyPrice,
      isStocked: data.isStocked,
      dateAcquired: (dateAcquired ?? new Date()).toISOString(),
      lotIdentity,
      notes: notes ?? null,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  if (lotError) throw new Error(lotError.message);

  revalidatePath("/", "layout");
  return { id: productId };
}

export async function addStockLot(data: {
  productId: string;
  initialQuantity: number;
  buyPrice: number;
  isStocked: boolean;
  dateAcquired?: Date;
  lotIdentity?: string;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const productId = cleanRequiredString(data?.productId, "productId");
  assertPositiveInt(data?.initialQuantity, "initialQuantity");
  assertNonNegativeNumber(data?.buyPrice, "buyPrice");
  assertBoolean(data?.isStocked, "isStocked");
  const dateAcquired = parseOptionalDate(data?.dateAcquired, "dateAcquired");
  const lotIdentity = cleanOptionalString(data?.lotIdentity, "lotIdentity", {
    maxLength: MAX_LOT_IDENTITY_LENGTH,
  });
  const notes = cleanOptionalString(data?.notes, "notes", {
    maxLength: MAX_LOT_NOTES_LENGTH,
  });

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("Product")
    .select("id")
    .eq("id", productId)
    .eq("userId", userId)
    .single();

  if (!product) throw new Error("Product not found or unauthorized");

  const now = new Date().toISOString();

  const { data: lot, error } = await supabase
    .from("StockLot")
    .insert([
      {
        id: crypto.randomUUID(),
        productId,
        initialQuantity: data.initialQuantity,
        remainingQuantity: data.initialQuantity,
        buyPrice: data.buyPrice,
        isStocked: data.isStocked,
        dateAcquired: (dateAcquired ?? new Date()).toISOString(),
        lotIdentity,
        notes: notes ?? null,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Bubble product to top of inventory
  await supabase.from("Product").update({ updatedAt: now }).eq("id", productId);

  revalidatePath("/", "layout");
  return lot;
}

export async function updateLot(
  lotId: string,
  data: {
    remainingQuantity: number;
    buyPrice: number;
    isStocked: boolean;
    dateAcquired: Date;
    lotIdentity?: string;
    notes?: string;
  },
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanLotId = cleanRequiredString(lotId, "lotId");
  if (
    typeof data?.remainingQuantity !== "number" ||
    !Number.isInteger(data.remainingQuantity) ||
    data.remainingQuantity < 1
  )
    throw new Error("remainingQuantity must be a positive integer");
  assertNonNegativeNumber(data?.buyPrice, "buyPrice");
  assertBoolean(data?.isStocked, "isStocked");
  const dateAcquired = parseOptionalDate(data?.dateAcquired, "dateAcquired");
  const lotIdentity = cleanOptionalString(data?.lotIdentity, "lotIdentity", {
    maxLength: MAX_LOT_IDENTITY_LENGTH,
  });
  const notes = cleanOptionalString(data?.notes, "notes", {
    maxLength: MAX_LOT_NOTES_LENGTH,
  });

  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("StockLot")
    .select("id, productId, initialQuantity, Product!inner(userId)")
    .eq("id", cleanLotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");
  if (data.remainingQuantity > lot.initialQuantity)
    throw new Error("remainingQuantity cannot exceed initialQuantity");

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("StockLot")
    .update({
      remainingQuantity: data.remainingQuantity,
      buyPrice: data.buyPrice,
      isStocked: data.isStocked,
      dateAcquired: (dateAcquired ?? new Date()).toISOString(),
      lotIdentity,
      notes: notes ?? null,
      updatedAt: now,
    })
    .eq("id", cleanLotId);

  if (error) throw new Error(error.message);

  // Bubble product to top of inventory
  await supabase
    .from("Product")
    .update({ updatedAt: now })
    .eq("id", lot.productId);

  revalidatePath("/", "layout");
}

export async function markAsStocked(lotId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanLotId = cleanRequiredString(lotId, "lotId");

  const supabase = await createClient();

  // Validate ownership
  const { data: lot } = await supabase
    .from("StockLot")
    .select("id, Product!inner(userId)")
    .eq("id", cleanLotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");

  const { data: updatedLot, error } = await supabase
    .from("StockLot")
    .update({ isStocked: true })
    .eq("id", cleanLotId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  return updatedLot;
}

export async function updateLotNotes(lotId: string, notes: string | null) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanLotId = cleanRequiredString(lotId, "lotId");
  const cleanNotes = cleanOptionalString(notes ?? undefined, "notes", {
    maxLength: MAX_LOT_NOTES_LENGTH,
  });

  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("StockLot")
    .select("id, Product!inner(userId)")
    .eq("id", cleanLotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");

  const { error } = await supabase
    .from("StockLot")
    .update({ notes: cleanNotes ?? null })
    .eq("id", cleanLotId);

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function updateProductName(productId: string, name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanProductId = cleanRequiredString(productId, "productId");
  const cleanName = cleanRequiredString(name, "product name");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Product")
    .update({ name: cleanName })
    .eq("id", cleanProductId)
    .eq("userId", userId)
    .select();

  if (error) throw new Error(error.message);
  if (!data || data.length === 0)
    throw new Error("Product not found or unauthorized");

  revalidatePath("/", "layout");
}

export async function deleteLot(lotId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanLotId = cleanRequiredString(lotId, "lotId");

  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("StockLot")
    .select("id, productId, Product!inner(userId)")
    .eq("id", cleanLotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");

  await supabase.from("StockLot").delete().eq("id", cleanLotId);

  const { count } = await supabase
    .from("StockLot")
    .select("*", { count: "exact", head: true })
    .eq("productId", lot.productId);

  if (count === 0) {
    await supabase.from("Product").delete().eq("id", lot.productId);
  }

  revalidatePath("/", "layout");
}

export async function deleteLotUnits(lotId: string, quantity: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanLotId = cleanRequiredString(lotId, "lotId");
  assertPositiveInt(quantity, "quantity");

  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("StockLot")
    .select("*, Product!inner(userId)")
    .eq("id", cleanLotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");
  if (lot.remainingQuantity < quantity)
    throw new Error("Quantity exceeds stock");

  if (lot.remainingQuantity === quantity) {
    await supabase.from("StockLot").delete().eq("id", cleanLotId);
    const { count } = await supabase
      .from("StockLot")
      .select("*", { count: "exact", head: true })
      .eq("productId", lot.productId);

    if (count === 0) {
      await supabase.from("Product").delete().eq("id", lot.productId);
    }
  } else {
    await supabase
      .from("StockLot")
      .update({ remainingQuantity: lot.remainingQuantity - quantity })
      .eq("id", cleanLotId);
  }

  revalidatePath("/", "layout");
}

export async function sellLotUnits(
  lotId: string,
  quantitySold: number,
  salePricePerUnit: number,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanLotId = cleanRequiredString(lotId, "lotId");
  assertPositiveInt(quantitySold, "quantitySold");
  assertNonNegativeNumber(salePricePerUnit, "salePricePerUnit");

  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("StockLot")
    .select("*, Product!inner(userId)")
    .eq("id", cleanLotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");
  if (lot.remainingQuantity < quantitySold)
    throw new Error("Quantity exceeds stock");

  const totalSalePrice = quantitySold * salePricePerUnit;
  const totalProfit = totalSalePrice - quantitySold * lot.buyPrice;

  await supabase
    .from("StockLot")
    .update({ remainingQuantity: lot.remainingQuantity - quantitySold })
    .eq("id", cleanLotId);

  const { error: saleError } = await supabase.from("Sale").insert([
    {
      id: crypto.randomUUID(),
      productId: lot.productId,
      quantitySold,
      totalSalePrice,
      totalProfit,
      createdAt: new Date().toISOString(),
    },
  ]);

  if (saleError) throw new Error(`Sale insert failed: ${saleError.message}`);

  await syncProductSalesStats(supabase, lot.productId);

  revalidatePath("/", "layout");
}

export async function seedMockData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockBulk(userId);

  const supabase = await createClient();

  await supabase.from("Product").delete().eq("userId", userId);

  const { data: product1 } = await supabase
    .from("Product")
    .insert([
      {
        id: crypto.randomUUID(),
        userId,
        name: "Ergonomic Chair Pro",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (product1) {
    await supabase.from("StockLot").insert([
      {
        id: crypto.randomUUID(),
        productId: product1.id,
        initialQuantity: 10,
        remainingQuantity: 10,
        buyPrice: 150.0,
        isStocked: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        productId: product1.id,
        initialQuantity: 5,
        remainingQuantity: 5,
        buyPrice: 145.0,
        isStocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  const { data: product2 } = await supabase
    .from("Product")
    .insert([
      {
        id: crypto.randomUUID(),
        userId,
        name: "Mechanical Keyboard",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (product2) {
    await supabase.from("StockLot").insert([
      {
        id: crypto.randomUUID(),
        productId: product2.id,
        initialQuantity: 20,
        remainingQuantity: 12,
        buyPrice: 85.0,
        isStocked: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function getSalesHistory(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
) {
  const { userId } = await auth();
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
  const { userId } = await auth();
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
  let countQuery = (supabase.from("Product") as any)
    .select("id", { count: "exact", head: true })
    .eq("userId", userId)
    .not("lastSoldAt", "is", null);
  if (safeSearch) countQuery = countQuery.ilike("name", `%${safeSearch}%`);

  let headersQuery = (supabase.from("Product") as any)
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
  const productIds = (products as any[]).map((p) => p.id);
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
  const salesByProduct = new Map<string, any[]>();
  for (const s of (rawSales as any[]) ?? []) {
    if (!salesByProduct.has(s.productId)) salesByProduct.set(s.productId, []);
    salesByProduct.get(s.productId)!.push(s);
  }

  const groups = (products as any[]).map((p) => ({
    productId: p.id,
    productName: p.name,
    latestDate: p.lastSoldAt as string,
    totalQuantity: (p.totalUnitsSold ?? 0) as number,
    totalSalePrice: (p.totalRevenue ?? 0) as number,
    totalProfit: (p.totalProfit ?? 0) as number,
    sales: (salesByProduct.get(p.id) ?? []).map((s: any) => ({
      id: s.id,
      dateSold: s.dateSold as string | null,
      createdAt: s.createdAt as string,
      quantitySold: s.quantitySold as number,
      totalSalePrice: s.totalSalePrice as number,
      totalProfit: s.totalProfit as number,
      notes: s.notes as string | null,
      Product: { name: p.name as string },
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
  const { userId } = await auth();
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

  await syncProductSalesStats(supabase, (sale as any).productId);

  revalidatePath("/sales");
}

export async function deleteSale(saleId: string) {
  const { userId } = await auth();
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

  await syncProductSalesStats(supabase, (sale as any).productId);

  revalidatePath("/sales");
}

export async function deleteProductSales(productId: string) {
  const { userId } = await auth();
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

export async function getSalesMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

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

export async function getDashboardMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: sales, error: salesError } = await supabase
    .from("Sale")
    .select("totalProfit, totalSalePrice, Product!inner(userId)")
    .eq("Product.userId", userId);

  if (salesError) throw new Error(salesError.message);

  const totalLifetimeProfit = (sales || []).reduce(
    (acc, s) => acc + (s.totalProfit || 0),
    0,
  );

  const { data: lots, error: lotsError } = await supabase
    .from("StockLot")
    .select(
      "remainingQuantity, initialQuantity, buyPrice, Product!inner(userId)",
    )
    .eq("Product.userId", userId);

  if (lotsError) throw new Error(lotsError.message);

  let currentInventoryValue = 0;
  let totalCapitalSpent = 0;

  for (const lot of lots || []) {
    currentInventoryValue += lot.remainingQuantity * lot.buyPrice;
    totalCapitalSpent += lot.initialQuantity * lot.buyPrice;
  }

  const currentROI =
    totalCapitalSpent > 0 ? (totalLifetimeProfit / totalCapitalSpent) * 100 : 0;

  return {
    totalLifetimeProfit,
    currentInventoryValue,
    currentROI,
  };
}

export async function getProfitChartData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: sales, error } = await supabase
    .from("Sale")
    .select("totalProfit, createdAt, Product!inner(userId)")
    .eq("Product.userId", userId)
    .order("createdAt", { ascending: true });

  if (error) throw new Error(error.message);

  const allSales = sales || [];
  const now = new Date();

  // --- Weekly: last 8 weeks ---
  const weeklyData: { name: string; total: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const weekProfit = allSales
      .filter((s) => {
        const d = new Date(s.createdAt);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((acc, s) => acc + (s.totalProfit || 0), 0);

    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    weeklyData.push({ name: label, total: parseFloat(weekProfit.toFixed(2)) });
  }

  // --- Monthly: last 12 months (current month on far right) ---
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
  const monthlyData: { name: string; total: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const monthProfit = allSales
      .filter((s) => {
        const sd = new Date(s.createdAt);
        return sd.getFullYear() === year && sd.getMonth() === month;
      })
      .reduce((acc, s) => acc + (s.totalProfit || 0), 0);

    monthlyData.push({
      name: `${monthNames[month]} ${year.toString().slice(-2)}`,
      total: parseFloat(monthProfit.toFixed(2)),
    });
  }

  // --- All Time: group by month or year depending on data span ---
  const firstSaleDate =
    allSales.length > 0 ? new Date(allSales[0].createdAt) : now;
  const yearsDiff = now.getFullYear() - firstSaleDate.getFullYear();
  const groupByYear = yearsDiff >= 3;

  const allTimeMap = new Map<string, number>();
  for (const sale of allSales) {
    const sd = new Date(sale.createdAt);
    const key = groupByYear
      ? sd.getFullYear().toString()
      : `${monthNames[sd.getMonth()]} ${sd.getFullYear().toString().slice(-2)}`;
    allTimeMap.set(key, (allTimeMap.get(key) || 0) + (sale.totalProfit || 0));
  }
  const allTimeData = Array.from(allTimeMap.entries()).map(([name, total]) => ({
    name,
    total: parseFloat(total.toFixed(2)),
  }));

  return { weeklyData, monthlyData, allTimeData };
}

export async function bulkAddLotsAndProducts(
  items: {
    name: string;
    initialQuantity: number;
    buyPrice: number;
    isStocked: boolean;
    notes?: string;
    dateAcquired?: string;
  }[],
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockBulk(userId);

  assertArrayWithLimit(items, "items");
  const validated = items.map((item, idx) => {
    const name = cleanRequiredString(item?.name, `items[${idx}].name`);
    assertPositiveInt(item?.initialQuantity, `items[${idx}].initialQuantity`);
    assertNonNegativeNumber(item?.buyPrice, `items[${idx}].buyPrice`);
    assertBoolean(item?.isStocked, `items[${idx}].isStocked`);
    const notes = cleanOptionalString(item?.notes, `items[${idx}].notes`, {
      maxLength: MAX_LOT_NOTES_LENGTH,
    });
    const dateAcquired = parseOptionalDate(
      item?.dateAcquired,
      `items[${idx}].dateAcquired`,
    );
    return {
      name,
      initialQuantity: item.initialQuantity,
      buyPrice: item.buyPrice,
      isStocked: item.isStocked,
      notes,
      dateAcquired,
    };
  });

  const supabase = await createClient();

  for (const item of validated) {
    const { data: existingProducts } = await supabase
      .from("Product")
      .select("id")
      .eq("userId", userId)
      .ilike("name", escapeLikePattern(item.name));

    let productId = existingProducts?.[0]?.id;

    if (!productId) {
      const { data: newProduct, error: pError } = await supabase
        .from("Product")
        .insert([
          {
            id: crypto.randomUUID(),
            userId,
            name: item.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (pError) throw new Error(pError.message);
      productId = newProduct.id;
    }

    const { error: lotError } = await supabase.from("StockLot").insert([
      {
        id: crypto.randomUUID(),
        productId,
        initialQuantity: item.initialQuantity,
        remainingQuantity: item.initialQuantity,
        buyPrice: item.buyPrice,
        isStocked: item.isStocked,
        notes: item.notes ?? null,
        dateAcquired: (item.dateAcquired ?? new Date()).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    if (lotError) throw new Error(lotError.message);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function bulkAddSales(
  items: {
    productName: string;
    quantitySold: number;
    salePricePerUnit: number;
    buyPrice?: number;
    dateSold?: string;
    notes?: string;
  }[],
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await gateStockBulk(userId);

  assertArrayWithLimit(items, "items");
  const validated = items.map((item, idx) => {
    const productName = cleanRequiredString(
      item?.productName,
      `items[${idx}].productName`,
    );
    assertPositiveInt(item?.quantitySold, `items[${idx}].quantitySold`);
    const salePricePerUnit =
      Math.round((item?.salePricePerUnit ?? 0) * 100) / 100;
    assertNonNegativeNumber(salePricePerUnit, `items[${idx}].salePricePerUnit`);
    let buyPrice: number | undefined;
    if (item?.buyPrice !== undefined && item.buyPrice !== null) {
      const rounded = Math.round(item.buyPrice * 100) / 100;
      assertNonNegativeNumber(rounded, `items[${idx}].buyPrice`);
      buyPrice = rounded;
    }
    const dateSold = parseOptionalDate(
      item?.dateSold,
      `items[${idx}].dateSold`,
    );
    const notes = cleanOptionalString(item?.notes, `items[${idx}].notes`, {
      maxLength: MAX_LOT_NOTES_LENGTH,
    });
    return {
      productName,
      quantitySold: item.quantitySold,
      salePricePerUnit,
      buyPrice,
      dateSold,
      notes,
    };
  });

  const supabase = await createClient();
  const affectedProductIds = new Set<string>();

  for (const item of validated) {
    const escapedName = escapeLikePattern(item.productName);
    const { data: products } = await supabase
      .from("Product")
      .select("id, lots:StockLot(id, remainingQuantity, buyPrice, createdAt)")
      .eq("userId", userId)
      .ilike("name", `%${escapedName}%`);

    type AILot = {
      id: string;
      remainingQuantity: number;
      buyPrice: number;
      createdAt: string;
    };
    type AIProduct = { id: string; lots: AILot[] | null };

    let product: AIProduct;

    if (!products || products.length === 0) {
      const buyPrice = item.buyPrice || 0;
      const { data: newP, error: pError } = await supabase
        .from("Product")
        .insert([
          {
            id: crypto.randomUUID(),
            userId,
            name: item.productName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (pError) throw new Error(pError.message);

      const newLotId = crypto.randomUUID();
      const { error: lotError } = await supabase.from("StockLot").insert([
        {
          id: newLotId,
          productId: newP.id,
          initialQuantity: item.quantitySold,
          remainingQuantity: item.quantitySold,
          buyPrice: buyPrice,
          isStocked: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      if (lotError) throw new Error(lotError.message);

      product = {
        id: newP.id,
        lots: [
          {
            id: newLotId,
            remainingQuantity: item.quantitySold,
            buyPrice: buyPrice,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    } else {
      product = products[0] as AIProduct;
    }

    const lots = (product.lots || [])
      .filter((l) => l.remainingQuantity > 0)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    let remainingToSell = item.quantitySold;

    // Safety check for stock, if deficit, auto-create missing stock.
    const totalStock = lots.reduce((acc, l) => acc + l.remainingQuantity, 0);
    if (totalStock < item.quantitySold) {
      const missingStock = item.quantitySold - totalStock;
      const lastBuyPrice =
        lots.length > 0 ? lots[lots.length - 1].buyPrice : item.buyPrice || 0;

      const newLotId = crypto.randomUUID();
      await supabase.from("StockLot").insert([
        {
          id: newLotId,
          productId: product.id,
          initialQuantity: missingStock,
          remainingQuantity: missingStock,
          buyPrice: lastBuyPrice,
          isStocked: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      lots.push({
        id: newLotId,
        remainingQuantity: missingStock,
        buyPrice: lastBuyPrice,
        createdAt: new Date().toISOString(),
      });
    }

    // Process FIFO
    for (const lot of lots) {
      if (remainingToSell <= 0) break;

      const qtyFromLot = Math.min(lot.remainingQuantity, remainingToSell);
      const totalSalePrice = qtyFromLot * item.salePricePerUnit;
      const totalProfit = totalSalePrice - qtyFromLot * lot.buyPrice;

      await supabase
        .from("StockLot")
        .update({ remainingQuantity: lot.remainingQuantity - qtyFromLot })
        .eq("id", lot.id);

      const { error: saleError } = await supabase.from("Sale").insert([
        {
          id: crypto.randomUUID(),
          productId: product.id,
          quantitySold: qtyFromLot,
          totalSalePrice,
          totalProfit,
          dateSold: item.dateSold
            ? item.dateSold.toISOString()
            : new Date().toISOString(),
          notes: item.notes ?? null,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (saleError)
        throw new Error(`Sale insert failed: ${saleError.message}`);

      affectedProductIds.add(product.id);
      remainingToSell -= qtyFromLot;
    }
  }

  await Promise.all(
    [...affectedProductIds].map((pid) => syncProductSalesStats(supabase, pid)),
  );

  revalidatePath("/", "layout");
  return { success: true };
}

export async function getProductGroupHeaders(
  page: number = 1,
  pageSize: number = 5,
  search?: string,
  excludeProductId?: string,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 50 ? pageSize : 5;

  const supabase = await createClient();

  const safeSearch =
    search && typeof search === "string" && search.trim() !== ""
      ? escapeLikePattern(search.trim().slice(0, 200))
      : null;

  let countQuery = (supabase.from("Product") as any)
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

  let headersQuery = (supabase.from("Product") as any)
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

  const groups = ((products as any[]) ?? []).map((p) => ({
    productId: p.id as string,
    productName: p.name as string,
    latestDate: p.lastSoldAt as string,
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
  const { userId } = await auth();
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
