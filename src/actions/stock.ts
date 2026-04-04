"use server";

import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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

  // To match the Prisma orderBy on lots
  products?.forEach(p => {
    p.lots = (p.lots || []).sort((a: any, b: any) => new Date(a.dateAcquired).getTime() - new Date(b.dateAcquired).getTime());
  });

  return products || [];
}

export async function addProduct(data: {
  name: string;
  initialQuantity: number;
  buyPrice: number;
  isStocked: boolean;
  dateAcquired?: Date;
  lotIdentity?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from("Product")
    .insert([{ userId, name: data.name }])
    .select()
    .single();

  if (productError) throw new Error(productError.message);

  const { error: lotError } = await supabase
    .from("StockLot")
    .insert([{
      productId: product.id,
      initialQuantity: data.initialQuantity,
      remainingQuantity: data.initialQuantity,
      buyPrice: data.buyPrice,
      isStocked: data.isStocked,
      dateAcquired: data.dateAcquired ?? new Date().toISOString(),
      lotIdentity: data.lotIdentity,
    }]);

  if (lotError) throw new Error(lotError.message);

  revalidatePath("/stock");
  return product;
}

export async function addStockLot(data: {
  productId: string;
  initialQuantity: number;
  buyPrice: number;
  isStocked: boolean;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("Product")
    .select("id")
    .eq("id", data.productId)
    .eq("userId", userId)
    .single();

  if (!product) throw new Error("Product not found or unauthorized");

  const { data: lot, error } = await supabase
    .from("StockLot")
    .insert([{
      productId: data.productId,
      initialQuantity: data.initialQuantity,
      remainingQuantity: data.initialQuantity,
      buyPrice: data.buyPrice,
      isStocked: data.isStocked,
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/stock");
  return lot;
}

export async function markAsStocked(lotId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  // Validate ownership
  const { data: lot } = await supabase
    .from("StockLot")
    .select("id, Product!inner(userId)")
    .eq("id", lotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");

  const { data: updatedLot, error } = await supabase
    .from("StockLot")
    .update({ isStocked: true })
    .eq("id", lotId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/stock");
  return updatedLot;
}

export async function updateProductName(productId: string, name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("Product")
    .update({ name })
    .eq("id", productId)
    .eq("userId", userId)
    .select();

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Product not found or unauthorized");

  revalidatePath("/stock");
}

export async function deleteLot(lotId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("StockLot")
    .select("id, productId, Product!inner(userId)")
    .eq("id", lotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");

  await supabase.from("StockLot").delete().eq("id", lotId);

  const { count } = await supabase
    .from("StockLot")
    .select("*", { count: "exact", head: true })
    .eq("productId", lot.productId);

  if (count === 0) {
    await supabase.from("Product").delete().eq("id", lot.productId);
  }

  revalidatePath("/stock");
}

export async function deleteLotUnits(lotId: string, quantity: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("StockLot")
    .select("*, Product!inner(userId)")
    .eq("id", lotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");
  if (lot.remainingQuantity < quantity) throw new Error("Quantity exceeds stock");

  if (lot.remainingQuantity === quantity) {
    await supabase.from("StockLot").delete().eq("id", lotId);
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
      .eq("id", lotId);
  }

  revalidatePath("/stock");
}

export async function sellLotUnits(lotId: string, quantitySold: number, salePricePerUnit: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: lot } = await supabase
    .from("StockLot")
    .select("*, Product!inner(userId)")
    .eq("id", lotId)
    .eq("Product.userId", userId)
    .single();

  if (!lot) throw new Error("Lot not found or unauthorized");
  if (lot.remainingQuantity < quantitySold) throw new Error("Quantity exceeds stock");

  const totalSalePrice = quantitySold * salePricePerUnit;
  const totalProfit = totalSalePrice - (quantitySold * lot.buyPrice);

  await supabase
    .from("StockLot")
    .update({ remainingQuantity: lot.remainingQuantity - quantitySold })
    .eq("id", lotId);

  await supabase
    .from("Sale")
    .insert([{
      productId: lot.productId,
      quantitySold,
      totalSalePrice,
      totalProfit
    }]);

  revalidatePath("/stock");
}

export async function seedMockData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  await supabase.from("Product").delete().eq("userId", userId);

  const { data: product1 } = await supabase
    .from("Product")
    .insert([{ userId, name: "Ergonomic Chair Pro" }])
    .select()
    .single();

  if (product1) {
    await supabase.from("StockLot").insert([
      { productId: product1.id, initialQuantity: 10, remainingQuantity: 10, buyPrice: 150.0, isStocked: true },
      { productId: product1.id, initialQuantity: 5, remainingQuantity: 5, buyPrice: 145.0, isStocked: false }
    ]);
  }

  const { data: product2 } = await supabase
    .from("Product")
    .insert([{ userId, name: "Mechanical Keyboard" }])
    .select()
    .single();

  if (product2) {
    await supabase.from("StockLot").insert([
      { productId: product2.id, initialQuantity: 20, remainingQuantity: 12, buyPrice: 85.0, isStocked: true }
    ]);
  }

  revalidatePath("/stock");
  return { success: true };
}
