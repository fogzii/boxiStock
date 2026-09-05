"use server";

import { revalidatePath } from "next/cache";
// Server actions for bundle sales: create, list, edit, delete, and restore
// stock consumed by bundles where possible.
import {
  type CalendarDay,
  parseCalendarDayInput,
  toStoredTimestamp,
} from "@/lib/date";
import type {
  BundleHeaderRow,
  BundleItemListRow,
  BundleItemRestoreRow,
} from "@/lib/stock/types";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  assertNonNegativeNumber,
  assertPositiveInt,
  cleanRequiredString,
  escapeLikePattern,
} from "@/lib/validation";
import { gateStockMutation, revalidateStockData } from "./_helpers";

export async function createBundle(data: {
  name: string;
  totalSellPrice: number;
  dateSold?: CalendarDay;
  items: Array<{ productId: string; quantity: number }>;
}) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanName = cleanRequiredString(data.name, "name");
  assertNonNegativeNumber(data.totalSellPrice, "totalSellPrice");
  const cleanDate = parseCalendarDayInput(data.dateSold, "dateSold");

  if (!Array.isArray(data.items) || data.items.length === 0)
    throw new Error("Bundle must have at least one item");
  if (data.items.length > 50)
    throw new Error("Bundle cannot have more than 50 items");

  for (const item of data.items) {
    cleanRequiredString(item.productId, "productId");
    assertPositiveInt(item.quantity, "quantity");
  }

  const supabase = await createClient();

  type LotConsumption = {
    lotId: string;
    productId: string;
    productName: string;
    quantityConsumed: number;
    originalRemaining: number;
    buyPricePerUnit: number;
    totalBuyCost: number;
  };

  const allConsumptions: LotConsumption[] = [];
  const affectedProductIds = new Set<string>();

  for (const item of data.items) {
    const { data: lots } = await supabase
      .from("StockLot")
      .select(
        "id, productId, remainingQuantity, buyPrice, Product!inner(id, userId, name)",
      )
      .eq("productId", item.productId)
      .eq("Product.userId", userId)
      .gt("remainingQuantity", 0)
      .order("dateAcquired", { ascending: true })
      // dateAcquired is a calendar day, so same-day lots tie: fall back to
      // insertion order to keep FIFO deterministic.
      .order("createdAt", { ascending: true });

    if (!lots || lots.length === 0)
      throw new Error(`No stock available for the selected product`);

    const embedded = lots[0].Product as
      | { name: string }
      | { name: string }[]
      | null
      | undefined;
    const productName =
      embedded == null
        ? undefined
        : Array.isArray(embedded)
          ? embedded[0]?.name
          : embedded.name;
    if (!productName) {
      throw new Error(`Missing product name for stock lot`);
    }
    let remaining = item.quantity;

    for (const lot of lots) {
      if (remaining === 0) break;
      const take = Math.min(lot.remainingQuantity as number, remaining);
      allConsumptions.push({
        lotId: lot.id as string,
        productId: item.productId,
        productName,
        quantityConsumed: take,
        originalRemaining: lot.remainingQuantity as number,
        buyPricePerUnit: lot.buyPrice as number,
        totalBuyCost: Math.round(take * (lot.buyPrice as number) * 100) / 100,
      });
      remaining -= take;
    }

    if (remaining > 0)
      throw new Error(
        `Insufficient stock for "${productName}": requested ${item.quantity} but only ${item.quantity - remaining} available`,
      );

    affectedProductIds.add(item.productId);
  }

  const totalBuyCost =
    Math.round(allConsumptions.reduce((s, c) => s + c.totalBuyCost, 0) * 100) /
    100;
  const totalProfit =
    Math.round((data.totalSellPrice - totalBuyCost) * 100) / 100;

  const bundleId = crypto.randomUUID();
  const { error: bundleError } = await supabase.from("Bundle").insert([
    {
      id: bundleId,
      userId,
      name: cleanName,
      totalSellPrice: data.totalSellPrice,
      totalBuyCost,
      totalProfit,
      dateSold: cleanDate ? toStoredTimestamp(cleanDate) : null,
      createdAt: new Date().toISOString(),
    },
  ]);
  if (bundleError)
    throw new Error(`Bundle insert failed: ${bundleError.message}`);

  const { error: itemsError } = await supabase.from("BundleItem").insert(
    allConsumptions.map((c) => ({
      id: crypto.randomUUID(),
      bundleId,
      productId: c.productId,
      productName: c.productName,
      lotId: c.lotId,
      quantityConsumed: c.quantityConsumed,
      buyPricePerUnit: c.buyPricePerUnit,
      totalBuyCost: c.totalBuyCost,
      createdAt: new Date().toISOString(),
    })),
  );
  if (itemsError)
    throw new Error(`BundleItem insert failed: ${itemsError.message}`);

  // Deduct from lots and delete depleted ones
  for (const c of allConsumptions) {
    const newQty = c.originalRemaining - c.quantityConsumed;
    if (newQty === 0) {
      await supabase.from("StockLot").delete().eq("id", c.lotId);
    } else {
      await supabase
        .from("StockLot")
        .update({ remainingQuantity: newQty })
        .eq("id", c.lotId);
    }
  }

  // Auto-delete products that have no remaining lots
  for (const productId of affectedProductIds) {
    const { count } = await supabase
      .from("StockLot")
      .select("*", { count: "exact", head: true })
      .eq("productId", productId);

    if (count === 0) {
      await supabase.from("Product").delete().eq("id", productId);
    }
  }

  revalidatePath("/", "layout");
  revalidateStockData(userId);
}

export async function getBundlesGrouped(
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

  let countQuery = supabase
    .from("Bundle")
    .select("id", { count: "exact", head: true })
    .eq("userId", userId);
  if (safeSearch) countQuery = countQuery.ilike("name", `%${safeSearch}%`);

  let headersQuery = supabase
    .from("Bundle")
    .select(
      "id, name, totalSellPrice, totalBuyCost, totalProfit, dateSold, createdAt",
    )
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .range(start, end);
  if (safeSearch) headersQuery = headersQuery.ilike("name", `%${safeSearch}%`);

  const [{ count, error: countError }, { data: bundles, error: bundlesError }] =
    await Promise.all([countQuery, headersQuery]);

  if (countError) throw new Error(countError.message);
  if (bundlesError) throw new Error(bundlesError.message);

  if (!bundles || bundles.length === 0) {
    return {
      bundles: [],
      totalCount: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / safePageSize),
    };
  }

  const bundleIds = (bundles as BundleHeaderRow[]).map((b) => b.id);
  const { data: rawItems, error: itemsError2 } = await supabase
    .from("BundleItem")
    .select(
      "id, bundleId, productId, productName, quantityConsumed, buyPricePerUnit, totalBuyCost, lotId",
    )
    .in("bundleId", bundleIds);

  if (itemsError2) throw new Error(itemsError2.message);

  const itemsByBundle = new Map<string, BundleItemListRow[]>();
  for (const item of (rawItems as BundleItemListRow[]) ?? []) {
    if (!itemsByBundle.has(item.bundleId)) itemsByBundle.set(item.bundleId, []);
    itemsByBundle.get(item.bundleId)?.push(item);
  }

  const bundleGroups = (bundles as BundleHeaderRow[]).map((bundle) => {
    const items = itemsByBundle.get(bundle.id) ?? [];

    // Aggregate by productId (or productName if product was deleted)
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

    for (const item of items) {
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
            ((bundle.totalProfit as number) / numDistinctProducts) * 100,
          ) / 100
        : 0;

    return {
      bundleId: bundle.id as string,
      bundleName: bundle.name as string,
      dateSold: bundle.dateSold as string | null,
      createdAt: bundle.createdAt as string,
      totalSellPrice: bundle.totalSellPrice as number,
      totalBuyCost: bundle.totalBuyCost as number,
      totalProfit: bundle.totalProfit as number,
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
    };
  });

  return {
    bundles: bundleGroups,
    totalCount: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / safePageSize),
  };
}

export async function updateBundle(
  bundleId: string,
  data: { name: string; totalSellPrice: number; dateSold?: CalendarDay },
) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanId = cleanRequiredString(bundleId, "bundleId");
  const cleanName = cleanRequiredString(data.name, "name");
  assertNonNegativeNumber(data.totalSellPrice, "totalSellPrice");
  const cleanDate = parseCalendarDayInput(data.dateSold, "dateSold");

  const supabase = await createClient();

  const { data: bundle } = await supabase
    .from("Bundle")
    .select("id, totalBuyCost")
    .eq("id", cleanId)
    .eq("userId", userId)
    .single();

  if (!bundle) throw new Error("Bundle not found or unauthorized");

  const totalProfit =
    Math.round((data.totalSellPrice - bundle.totalBuyCost) * 100) / 100;

  const { error } = await supabase
    .from("Bundle")
    .update({
      name: cleanName,
      totalSellPrice: data.totalSellPrice,
      totalProfit,
      dateSold: cleanDate ? toStoredTimestamp(cleanDate) : null,
    })
    .eq("id", cleanId);

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
  revalidateStockData(userId);
}

export async function deleteBundle(bundleId: string) {
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
  if (!userId) throw new Error("Unauthorized");
  await gateStockMutation(userId);

  const cleanId = cleanRequiredString(bundleId, "bundleId");
  const supabase = await createClient();

  const { data: bundle } = await supabase
    .from("Bundle")
    .select("id")
    .eq("id", cleanId)
    .eq("userId", userId)
    .single();

  if (!bundle) throw new Error("Bundle not found or unauthorized");

  const { data: items } = await supabase
    .from("BundleItem")
    .select("lotId, productName, quantityConsumed")
    .eq("bundleId", cleanId);

  // Restore stock for lots that still exist
  for (const item of (items as BundleItemRestoreRow[]) ?? []) {
    if (!item.lotId) continue;
    const { data: lot } = await supabase
      .from("StockLot")
      .select("remainingQuantity")
      .eq("id", item.lotId)
      .single();
    if (!lot) continue;
    await supabase
      .from("StockLot")
      .update({
        remainingQuantity: lot.remainingQuantity + item.quantityConsumed,
      })
      .eq("id", item.lotId);
  }

  await supabase.from("Bundle").delete().eq("id", cleanId);

  revalidatePath("/", "layout");
  revalidateStockData(userId);
}
