"use server";

import { revalidatePath } from "next/cache";
import type { ProductSaleMatch } from "@/lib/stock/types";
// Server actions for high-volume stock changes: AI-assisted bulk imports for
// lots and sales.
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import {
  assertArrayWithLimit,
  assertBoolean,
  assertNonNegativeNumber,
  assertPositiveInt,
  cleanOptionalString,
  cleanRequiredString,
  escapeLikePattern,
  MAX_LOT_NOTES_LENGTH,
  parseOptionalDate,
} from "@/lib/validation";
import {
  gateStockBulk,
  revalidateStockData,
  syncProductSalesStats,
} from "./_helpers";

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
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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
  revalidateStockData(userId);
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
  const {
    data: { user },
  } = await getAuthUser();
  const userId = user?.id;
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

    let product: ProductSaleMatch;

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
      product = products[0] as ProductSaleMatch;
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
      const totalSalePrice =
        Math.round(qtyFromLot * item.salePricePerUnit * 100) / 100;
      const totalProfit =
        Math.round((totalSalePrice - qtyFromLot * lot.buyPrice) * 100) / 100;

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
  revalidateStockData(userId);
  return { success: true };
}
