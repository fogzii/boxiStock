"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { InventoryCsvRow, SalesCsvRow } from "@/lib/stock/types";
import { createClient } from "@/lib/supabase/server";
import {
  assertArrayWithLimit,
  assertNonNegativeNumber,
  assertPositiveInt,
  cleanOptionalString,
  cleanRequiredString,
  MAX_LOT_IDENTITY_LENGTH,
  parseOptionalDate,
} from "@/lib/validation";

export type CSVExportRow = InventoryCsvRow;

export type CSVSalesExportRow = SalesCsvRow;

export async function exportInventoryData(): Promise<CSVExportRow[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await enforceRateLimit(
    `settings:export:${userId}`,
    RATE_LIMITS.export,
    "export",
  );

  const supabase = await createClient();

  const { data: lots, error } = await supabase
    .from("StockLot")
    .select("*, Product!inner(name, userId)")
    .eq("Product.userId", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (lots || []).map((lot) => ({
    productName: lot.Product.name,
    initialQuantity: lot.initialQuantity,
    remainingQuantity: lot.remainingQuantity,
    buyPrice: lot.buyPrice,
    isStocked: lot.isStocked,
    dateAcquired: lot.dateAcquired,
    lotIdentity: lot.lotIdentity || null,
  }));
}

export async function exportSalesData(): Promise<CSVSalesExportRow[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await enforceRateLimit(
    `settings:export:${userId}`,
    RATE_LIMITS.export,
    "export",
  );

  const supabase = await createClient();

  const { data: sales, error } = await supabase
    .from("Sale")
    .select("*, Product!inner(name, userId)")
    .eq("Product.userId", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (sales || []).map((sale) => ({
    productName: sale.Product.name,
    quantitySold: sale.quantitySold,
    totalSalePrice: sale.totalSalePrice,
    totalProfit: sale.totalProfit,
    createdAt: sale.createdAt,
  }));
}

export async function importInventoryData(rows: CSVExportRow[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await enforceRateLimit(
    `settings:import:${userId}`,
    RATE_LIMITS.bulk,
    "import",
  );

  if (!rows || rows.length === 0) return { success: true, count: 0 };
  assertArrayWithLimit(rows, "rows");

  // Validate / normalize every row BEFORE touching the database so a bad row
  // doesn't leave us with half-imported data.
  const validated = rows.map((row, idx) => {
    const productName = cleanRequiredString(
      row?.productName,
      `rows[${idx}].productName`,
    );
    const initialQuantity = Number(row?.initialQuantity);
    const remainingQuantity = Number(row?.remainingQuantity);
    const buyPrice = Number(row?.buyPrice);
    assertPositiveInt(initialQuantity, `rows[${idx}].initialQuantity`);
    if (
      !Number.isInteger(remainingQuantity) ||
      remainingQuantity < 0 ||
      remainingQuantity > initialQuantity
    ) {
      throw new Error(
        `Invalid rows[${idx}].remainingQuantity: must be 0..initialQuantity.`,
      );
    }
    assertNonNegativeNumber(buyPrice, `rows[${idx}].buyPrice`);
    const isStocked = String(row?.isStocked).toLowerCase() === "true";
    const dateAcquired = parseOptionalDate(
      row?.dateAcquired,
      `rows[${idx}].dateAcquired`,
    );
    const lotIdentity = cleanOptionalString(
      row?.lotIdentity,
      `rows[${idx}].lotIdentity`,
      { maxLength: MAX_LOT_IDENTITY_LENGTH },
    );
    return {
      productName,
      initialQuantity,
      remainingQuantity,
      buyPrice,
      isStocked,
      dateAcquired: dateAcquired ?? new Date(),
      lotIdentity,
    };
  });

  const supabase = await createClient();

  const distinctProductNames = Array.from(
    new Set(validated.map((r) => r.productName)),
  );

  const { data: existingProducts, error: pError } = await supabase
    .from("Product")
    .select("id, name")
    .eq("userId", userId)
    .in("name", distinctProductNames);

  if (pError) throw new Error(pError.message);

  const productMap = new Map<string, string>();
  for (const p of existingProducts || []) {
    productMap.set(p.name.toLowerCase(), p.id);
  }

  const productsToCreate = distinctProductNames.filter(
    (name) => !productMap.has(name.toLowerCase()),
  );

  if (productsToCreate.length > 0) {
    const newProducts = productsToCreate.map((name) => ({
      id: crypto.randomUUID(),
      userId,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const { data: insertedProducts, error: insertError } = await supabase
      .from("Product")
      .insert(newProducts)
      .select();

    if (insertError) throw new Error(insertError.message);

    for (const p of insertedProducts || []) {
      productMap.set(p.name.toLowerCase(), p.id);
    }
  }

  const lotsToInsert = validated.map((row) => {
    const productId = productMap.get(row.productName.toLowerCase());
    if (!productId) {
      throw new Error(`Missing product id for "${row.productName}".`);
    }
    return {
      id: crypto.randomUUID(),
      productId,
      initialQuantity: row.initialQuantity,
      remainingQuantity: row.remainingQuantity,
      buyPrice: row.buyPrice,
      isStocked: row.isStocked,
      dateAcquired: row.dateAcquired.toISOString(),
      lotIdentity: row.lotIdentity ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const { error: lotError } = await supabase
    .from("StockLot")
    .insert(lotsToInsert);

  if (lotError) throw new Error(lotError.message);

  revalidatePath("/", "layout");
  return { success: true, count: lotsToInsert.length };
}

export async function importSalesData(rows: CSVSalesExportRow[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await enforceRateLimit(
    `settings:import:${userId}`,
    RATE_LIMITS.bulk,
    "import",
  );

  if (!rows || rows.length === 0) return { success: true, count: 0 };
  assertArrayWithLimit(rows, "rows");

  const validated = rows.map((row, idx) => {
    const productName = cleanRequiredString(
      row?.productName,
      `rows[${idx}].productName`,
    );
    const quantitySold = Number(row?.quantitySold);
    const totalSalePrice = Number(row?.totalSalePrice);
    const totalProfit = Number(row?.totalProfit);
    assertPositiveInt(quantitySold, `rows[${idx}].quantitySold`);
    assertNonNegativeNumber(totalSalePrice, `rows[${idx}].totalSalePrice`);
    if (!Number.isFinite(totalProfit)) {
      throw new Error(`Invalid rows[${idx}].totalProfit: must be a number.`);
    }
    const createdAt =
      parseOptionalDate(row?.createdAt, `rows[${idx}].createdAt`) ?? new Date();
    return {
      productName,
      quantitySold,
      totalSalePrice,
      totalProfit,
      createdAt,
    };
  });

  const supabase = await createClient();

  const distinctProductNames = Array.from(
    new Set(validated.map((r) => r.productName)),
  );

  const { data: existingProducts, error: pError } = await supabase
    .from("Product")
    .select("id, name")
    .eq("userId", userId)
    .in("name", distinctProductNames);

  if (pError) throw new Error(pError.message);

  const productMap = new Map<string, string>();
  for (const p of existingProducts || []) {
    productMap.set(p.name.toLowerCase(), p.id);
  }

  const productsToCreate = distinctProductNames.filter(
    (name) => !productMap.has(name.toLowerCase()),
  );

  if (productsToCreate.length > 0) {
    const newProducts = productsToCreate.map((name) => ({
      id: crypto.randomUUID(),
      userId,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const { data: insertedProducts, error: insertError } = await supabase
      .from("Product")
      .insert(newProducts)
      .select();

    if (insertError) throw new Error(insertError.message);

    for (const p of insertedProducts || []) {
      productMap.set(p.name.toLowerCase(), p.id);
    }
  }

  const salesToInsert = validated.map((row) => {
    const productId = productMap.get(row.productName.toLowerCase());
    if (!productId) {
      throw new Error(`Missing product id for "${row.productName}".`);
    }
    return {
      id: crypto.randomUUID(),
      productId,
      quantitySold: row.quantitySold,
      totalSalePrice: row.totalSalePrice,
      totalProfit: row.totalProfit,
      createdAt: row.createdAt.toISOString(),
    };
  });

  const { error: saleError } = await supabase
    .from("Sale")
    .insert(salesToInsert);

  if (saleError) throw new Error(saleError.message);

  revalidatePath("/", "layout");
  return { success: true, count: salesToInsert.length };
}

export async function deleteAllUserData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  await enforceRateLimit(
    `settings:destructive:${userId}`,
    RATE_LIMITS.destructive,
    "destructive action",
  );

  const supabase = await createClient();

  const { data: products } = await supabase
    .from("Product")
    .select("id")
    .eq("userId", userId);

  if (!products || products.length === 0) return { success: true };

  const productIds = products.map((p) => p.id);

  await supabase.from("Sale").delete().in("productId", productIds);
  await supabase.from("StockLot").delete().in("productId", productIds);
  await supabase.from("Product").delete().in("id", productIds);

  revalidatePath("/", "layout");
  return { success: true };
}
