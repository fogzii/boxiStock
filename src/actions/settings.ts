"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export interface CSVExportRow {
  productName: string;
  initialQuantity: number;
  remainingQuantity: number;
  buyPrice: number;
  isStocked: boolean;
  dateAcquired: string;
  lotIdentity: string | null;
}

export interface CSVSalesExportRow {
  productName: string;
  quantitySold: number;
  totalSalePrice: number;
  totalProfit: number;
  createdAt: string;
}

export async function exportInventoryData(): Promise<CSVExportRow[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

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

  const supabase = await createClient();

  if (!rows || rows.length === 0) return { success: true, count: 0 };

  const distinctProductNames = Array.from(new Set(rows.map((r) => r.productName)));

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
    (name) => !productMap.has(name.toLowerCase())
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

  const lotsToInsert = rows.map((row) => ({
    id: crypto.randomUUID(),
    productId: productMap.get(row.productName.toLowerCase())!,
    initialQuantity: Number(row.initialQuantity) || 0,
    remainingQuantity: Number(row.remainingQuantity) || 0,
    buyPrice: Number(row.buyPrice) || 0,
    isStocked: String(row.isStocked).toLowerCase() === "true",
    dateAcquired: new Date(row.dateAcquired).toISOString(),
    lotIdentity: row.lotIdentity || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const { error: lotError } = await supabase.from("StockLot").insert(lotsToInsert);

  if (lotError) throw new Error(lotError.message);

  revalidatePath("/", "layout");
  return { success: true, count: lotsToInsert.length };
}

export async function importSalesData(rows: CSVSalesExportRow[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  if (!rows || rows.length === 0) return { success: true, count: 0 };

  const distinctProductNames = Array.from(new Set(rows.map((r) => r.productName)));

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
    (name) => !productMap.has(name.toLowerCase())
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

  const salesToInsert = rows.map((row) => ({
    id: crypto.randomUUID(),
    productId: productMap.get(row.productName.toLowerCase())!,
    quantitySold: Number(row.quantitySold) || 0,
    totalSalePrice: Number(row.totalSalePrice) || 0,
    totalProfit: Number(row.totalProfit) || 0,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  }));

  const { error: saleError } = await supabase.from("Sale").insert(salesToInsert);

  if (saleError) throw new Error(saleError.message);

  revalidatePath("/", "layout");
  return { success: true, count: salesToInsert.length };
}

export async function deleteAllUserData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

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
