"use server";

import { revalidatePath } from "next/cache";
import { getInventoryPaginatedForUser } from "@/lib/stock/readers";
import type { RecentProductRow } from "@/lib/stock/types";
// Server actions for product and lot inventory workflows: add/edit/delete stock,
// mark lots as stocked, and record direct inventory sales.
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
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
import {
  gateStockMutation,
  lowestHistoricalUnitPrice,
  revalidateStockData,
  syncProductSalesStats,
} from "./_helpers";

export async function getRecentProducts(limit = 3) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Product")
    .select("id, name")
    .eq("userId", userId)
    .order("updatedAt", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as RecentProductRow[];
}

export async function getAllProductNames(): Promise<RecentProductRow[]> {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("Product")
    .select("id, name")
    .eq("userId", userId)
    .order("updatedAt", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as RecentProductRow[];
}

export async function getInventoryPaginated(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sort?: string,
  status?: string,
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  return getInventoryPaginatedForUser(
    userId,
    page,
    pageSize,
    search,
    sort,
    status,
  );
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
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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
    // sellPrice is seeded from sales history by the product_seed_sell_price
    // trigger, so every product-creation path (here, bulk import, CSV restore,
    // AI import) gets the same treatment.
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
  revalidateStockData(userId);
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
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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
  revalidateStockData(userId);
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
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("StockLot")
    .update({
      remainingQuantity: data.remainingQuantity,
      initialQuantity: Math.max(data.remainingQuantity, lot.initialQuantity),
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
  revalidateStockData(userId);
}

export async function markAsStocked(lotId: string) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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
  revalidateStockData(userId);
  return updatedLot;
}

export async function updateLotNotes(lotId: string, notes: string | null) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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
  revalidateStockData(userId);
}

/**
 * Edit a product row: its name and its projected sell price.
 *
 * `sellPrice` is per unit. Passing null clears it, which puts the product back
 * to NA and drops it out of projected-profit totals — that is a real choice the
 * user can make, so null is stored rather than ignored.
 */
export async function updateProduct(
  productId: string,
  data: { name: string; sellPrice: number | null },
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanProductId = cleanRequiredString(productId, "productId");
  const cleanName = cleanRequiredString(data?.name, "product name");

  let sellPrice: number | null = null;
  if (data?.sellPrice !== null && data?.sellPrice !== undefined) {
    assertNonNegativeNumber(data.sellPrice, "sellPrice");
    sellPrice = Math.round(data.sellPrice * 100) / 100;
  }

  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("Product")
    .update({ name: cleanName, sellPrice, updatedAt: new Date().toISOString() })
    .eq("id", cleanProductId)
    .eq("userId", userId)
    .select();

  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0)
    throw new Error("Product not found or unauthorized");

  revalidatePath("/", "layout");
  revalidateStockData(userId);
}

/**
 * Lowest per-unit price this product name has ever sold for, or null when it
 * has no sales history. Powers the "suggested from sales history" hint in the
 * edit-row modal.
 */
export async function getSuggestedSellPrice(
  productName: string,
): Promise<number | null> {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");

  const name = cleanRequiredString(productName, "product name");
  const supabase = await createClient();
  return lowestHistoricalUnitPrice(supabase, userId, name);
}

export async function deleteLot(lotId: string) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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
  revalidateStockData(userId);
}

export async function deleteLotUnits(lotId: string, quantity: number) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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
    // Conditional decrement: refuse if stock changed concurrently since the
    // read above, so remainingQuantity can never go negative.
    const { data: decremented } = await supabase
      .from("StockLot")
      .update({ remainingQuantity: lot.remainingQuantity - quantity })
      .eq("id", cleanLotId)
      .gte("remainingQuantity", quantity)
      .select("id");
    if (!decremented || decremented.length === 0)
      throw new Error("Quantity exceeds stock");
  }

  revalidatePath("/", "layout");
  revalidateStockData(userId);
}

export async function sellLotUnits(
  lotId: string,
  quantitySold: number,
  salePricePerUnit: number,
  dateSold: Date,
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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

  const totalSalePrice =
    Math.round(quantitySold * salePricePerUnit * 100) / 100;
  const totalProfit =
    Math.round((totalSalePrice - quantitySold * lot.buyPrice) * 100) / 100;

  // Conditional decrement: refuse if stock changed concurrently since the read
  // above, so remainingQuantity can never go negative.
  const { data: decremented } = await supabase
    .from("StockLot")
    .update({ remainingQuantity: lot.remainingQuantity - quantitySold })
    .eq("id", cleanLotId)
    .gte("remainingQuantity", quantitySold)
    .select("id");
  if (!decremented || decremented.length === 0)
    throw new Error("Quantity exceeds stock");

  const { error: saleError } = await supabase.from("Sale").insert([
    {
      id: crypto.randomUUID(),
      productId: lot.productId,
      quantitySold,
      totalSalePrice,
      totalProfit,
      dateSold: dateSold.toISOString(),
      createdAt: new Date().toISOString(),
    },
  ]);

  if (saleError) throw new Error(`Sale insert failed: ${saleError.message}`);

  await syncProductSalesStats(supabase, lot.productId);

  revalidatePath("/", "layout");
  revalidateStockData(userId);
}

export async function sellAllLots(
  productId: string,
  totalSellPrice: number,
  dateSold: Date,
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanProductId = cleanRequiredString(productId, "productId");
  assertNonNegativeNumber(totalSellPrice, "totalSellPrice");

  const supabase = await createClient();

  const { data: lots } = await supabase
    .from("StockLot")
    .select("*, Product!inner(userId)")
    .eq("productId", cleanProductId)
    .eq("Product.userId", userId)
    .gt("remainingQuantity", 0)
    .order("dateAcquired", { ascending: true });

  if (!lots || lots.length === 0) throw new Error("No stock to sell");

  const totalQty = lots.reduce((s, l) => s + l.remainingQuantity, 0);
  const perUnitPrice = Math.round((totalSellPrice / totalQty) * 100) / 100;
  const dateSoldIso = dateSold.toISOString();
  const now = new Date().toISOString();

  // Pre-compute each lot's sale price, then adjust last lot for any cent remainder.
  const lotSalePrices = lots.map(
    (l) => Math.round(l.remainingQuantity * perUnitPrice * 100) / 100,
  );
  const priceSum =
    Math.round(lotSalePrices.reduce((s, p) => s + p, 0) * 100) / 100;
  const remainder = Math.round((totalSellPrice - priceSum) * 100) / 100;
  lotSalePrices[lotSalePrices.length - 1] =
    Math.round((lotSalePrices[lotSalePrices.length - 1] + remainder) * 100) /
    100;

  for (let i = 0; i < lots.length; i++) {
    const lot = lots[i];
    const lotSalePrice = lotSalePrices[i];
    const lotProfit =
      Math.round((lotSalePrice - lot.remainingQuantity * lot.buyPrice) * 100) /
      100;

    const { error: updateError } = await supabase
      .from("StockLot")
      .update({ remainingQuantity: 0 })
      .eq("id", lot.id);
    if (updateError)
      throw new Error(`Lot update failed: ${updateError.message}`);

    const { error: saleError } = await supabase.from("Sale").insert([
      {
        id: crypto.randomUUID(),
        productId: cleanProductId,
        quantitySold: lot.remainingQuantity,
        totalSalePrice: lotSalePrice,
        totalProfit: lotProfit,
        dateSold: dateSoldIso,
        createdAt: now,
      },
    ]);
    if (saleError) throw new Error(`Sale insert failed: ${saleError.message}`);
  }

  await syncProductSalesStats(supabase, cleanProductId);
  revalidatePath("/", "layout");
  revalidateStockData(userId);
}
