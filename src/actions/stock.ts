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

  // To match the Prisma orderBy on lots and hide 0-quantity
  const activeProducts = products?.filter(p => {
    p.lots = (p.lots || [])
      .filter((l: any) => l.remainingQuantity > 0)
      .sort((a: any, b: any) => new Date(a.dateAcquired).getTime() - new Date(b.dateAcquired).getTime());
    return p.lots.length > 0;
  });

  return activeProducts || [];
}

export async function getInventoryPaginated(page: number = 1, pageSize: number = 10, search?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  // 1. Get ALL active product IDs (products that have > 0 stock)
  const { data: activeLotsData, error: activeLotsError } = await supabase
    .from("StockLot")
    .select("productId, Product!inner(userId)")
    .gt("remainingQuantity", 0)
    .eq("Product.userId", userId);
    
  if (activeLotsError) throw new Error(activeLotsError.message);
  
  const activeProductIds = Array.from(new Set(activeLotsData?.map(l => l.productId) || []));

  if (activeProductIds.length === 0) {
    return { products: [], totalCount: 0, totalPages: 0 };
  }

  let matchedIds: string[] = activeProductIds;
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const [pMatchesRes, lotMatchesRes] = await Promise.all([
      supabase.from("Product").select("id").eq("userId", userId).ilike("name", searchTerm).in("id", activeProductIds),
      supabase.from("StockLot").select("productId, Product!inner(userId)").eq("Product.userId", userId).ilike("lotIdentity", searchTerm).gt("remainingQuantity", 0)
    ]);
    
    const ids = new Set([
      ...(pMatchesRes.data || []).map(p => p.id),
      ...(lotMatchesRes.data || []).map(l => l.productId)
    ]);
    matchedIds = Array.from(ids).filter(id => activeProductIds.includes(id));
  }

  if (matchedIds.length === 0) {
    return { products: [], totalCount: 0, totalPages: 0 };
  }

  // Get total count of products
  let countQuery = supabase
    .from("Product")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)
    .in("id", matchedIds);

  const { count, error: countError } = await countQuery;

  if (countError) throw new Error(countError.message);

  // Get paginated products with their active lots
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("Product")
    .select("*, lots:StockLot(*)")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .range(start, end)
    .in("id", matchedIds);

  const { data: products, error } = await query;

  if (error) throw new Error(error.message);

  products?.forEach(p => {
    p.lots = (p.lots || [])
      .filter((l: any) => l.remainingQuantity > 0)
      .sort((a: any, b: any) => new Date(a.dateAcquired).getTime() - new Date(b.dateAcquired).getTime());
  });

  return {
    products: products || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
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
    .insert([{ id: crypto.randomUUID(), userId, name: data.name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
    .select()
    .single();

  if (productError) throw new Error(productError.message);

  const { error: lotError } = await supabase
    .from("StockLot")
    .insert([{
      id: crypto.randomUUID(),
      productId: product.id,
      initialQuantity: data.initialQuantity,
      remainingQuantity: data.initialQuantity,
      buyPrice: data.buyPrice,
      isStocked: data.isStocked,
      dateAcquired: data.dateAcquired ?? new Date().toISOString(),
      lotIdentity: data.lotIdentity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]);

  if (lotError) throw new Error(lotError.message);

  revalidatePath("/", "layout");
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
      id: crypto.randomUUID(),
      productId: data.productId,
      initialQuantity: data.initialQuantity,
      remainingQuantity: data.initialQuantity,
      buyPrice: data.buyPrice,
      isStocked: data.isStocked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
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
  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
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

  const { error: saleError } = await supabase
    .from("Sale")
    .insert([{
      id: crypto.randomUUID(),
      productId: lot.productId,
      quantitySold,
      totalSalePrice,
      totalProfit,
      createdAt: new Date().toISOString()
    }]);
    
  if (saleError) throw new Error(`Sale insert failed: ${saleError.message}`);

  revalidatePath("/", "layout");
}

export async function seedMockData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  await supabase.from("Product").delete().eq("userId", userId);

  const { data: product1 } = await supabase
    .from("Product")
    .insert([{ id: crypto.randomUUID(), userId, name: "Ergonomic Chair Pro", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
    .select()
    .single();

  if (product1) {
    await supabase.from("StockLot").insert([
      { id: crypto.randomUUID(), productId: product1.id, initialQuantity: 10, remainingQuantity: 10, buyPrice: 150.0, isStocked: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: crypto.randomUUID(), productId: product1.id, initialQuantity: 5, remainingQuantity: 5, buyPrice: 145.0, isStocked: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]);
  }

  const { data: product2 } = await supabase
    .from("Product")
    .insert([{ id: crypto.randomUUID(), userId, name: "Mechanical Keyboard", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
    .select()
    .single();

  if (product2) {
    await supabase.from("StockLot").insert([
      { id: crypto.randomUUID(), productId: product2.id, initialQuantity: 20, remainingQuantity: 12, buyPrice: 85.0, isStocked: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function getSalesHistory(page: number = 1, pageSize: number = 10, search?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  // Get total count
  let countQuery = supabase
    .from("Sale")
    .select("*, Product!inner(name, userId)", { count: "exact", head: true })
    .eq("Product.userId", userId);

  if (search && search.trim() !== '') {
    countQuery = countQuery.ilike("Product.name", `%${search.trim()}%`);
  }

  const { count, error: countError } = await countQuery;

  if (countError) throw new Error(countError.message);

  // Get paginated data
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let query = supabase
    .from("Sale")
    .select("*, Product!inner(name, userId)")
    .eq("Product.userId", userId)
    .order("createdAt", { ascending: false })
    .range(start, end);

  if (search && search.trim() !== '') {
    query = query.ilike("Product.name", `%${search.trim()}%`);
  }

  const { data: sales, error } = await query;

  if (error) throw new Error(error.message);

  return {
    sales: sales || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize)
  };
}

export async function getSalesMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // To keep things single-query, get all sales for user and filter in memory since we aren't likely to have massive amounts of rows, 
  // or use Supabase time filtering. For exact dates it's better to fetch records within the week.
  const { data: recentSales, error } = await supabase
    .from("Sale")
    .select("*, Product!inner(userId)")
    .eq("Product.userId", userId)
    .gte("createdAt", sevenDaysAgo.toISOString());

  if (error) throw new Error(error.message);

  let totalSalesToday = 0;
  let totalUnitsSoldWeek = 0;
  let netProfitWeek = 0;

  for (const sale of recentSales || []) {
    const saleDate = new Date(sale.createdAt);
    
    // Accumulate week stats
    totalUnitsSoldWeek += sale.quantitySold;
    netProfitWeek += sale.totalProfit;

    // Check if it's today
    if (saleDate >= today) {
      totalSalesToday += sale.totalSalePrice;
    }
  }

  return {
    totalSalesToday,
    totalUnitsSoldWeek,
    netProfitWeek,
  };
}

export async function getDashboardMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  // Get all sales for lifetime profit
  const { data: sales, error: salesError } = await supabase
    .from("Sale")
    .select("totalProfit, totalSalePrice, Product!inner(userId)")
    .eq("Product.userId", userId);


  if (salesError) throw new Error(salesError.message);

  const totalLifetimeProfit = (sales || []).reduce(
    (acc, s) => acc + (s.totalProfit || 0), 0
  );

  // Get all stock lots for inventory value and capital spent
  const { data: lots, error: lotsError } = await supabase
    .from("StockLot")
    .select("remainingQuantity, initialQuantity, buyPrice, Product!inner(userId)")
    .eq("Product.userId", userId);


  if (lotsError) throw new Error(lotsError.message);

  let currentInventoryValue = 0;
  let totalCapitalSpent = 0;

  for (const lot of lots || []) {
    currentInventoryValue += lot.remainingQuantity * lot.buyPrice;
    totalCapitalSpent += lot.initialQuantity * lot.buyPrice;
  }


  // ROI = (Total Profit / Total Capital Spent) * 100
  const currentROI = totalCapitalSpent > 0
    ? (totalLifetimeProfit / totalCapitalSpent) * 100
    : 0;

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
      .filter(s => {
        const d = new Date(s.createdAt);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((acc, s) => acc + (s.totalProfit || 0), 0);

    const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
    weeklyData.push({ name: label, total: parseFloat(weekProfit.toFixed(2)) });
  }

  // --- Monthly: last 12 months (current month on far right) ---
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData: { name: string; total: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();

    const monthProfit = allSales
      .filter(s => {
        const sd = new Date(s.createdAt);
        return sd.getFullYear() === year && sd.getMonth() === month;
      })
      .reduce((acc, s) => acc + (s.totalProfit || 0), 0);

    monthlyData.push({
      name: `${monthNames[month]} ${year.toString().slice(-2)}`,
      total: parseFloat(monthProfit.toFixed(2)),
    });
  }

  // --- All Time: group by month across all data ---
  const allTimeMap = new Map<string, number>();
  for (const sale of allSales) {
    const sd = new Date(sale.createdAt);
    const key = `${monthNames[sd.getMonth()]} ${sd.getFullYear().toString().slice(-2)}`;
    allTimeMap.set(key, (allTimeMap.get(key) || 0) + (sale.totalProfit || 0));
  }
  const allTimeData = Array.from(allTimeMap.entries()).map(([name, total]) => ({
    name,
    total: parseFloat(total.toFixed(2)),
  }));

  return { weeklyData, monthlyData, allTimeData };
}

export async function bulkAddLotsAndProducts(items: { name: string, initialQuantity: number, buyPrice: number, isStocked: boolean }[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  for (const item of items) {
    // Check if product exists case-insensitively
    const { data: existingProducts } = await supabase
      .from("Product")
      .select("id")
      .eq("userId", userId)
      .ilike("name", item.name.trim());
      
    let productId = existingProducts?.[0]?.id;

    if (!productId) {
      const { data: newProduct, error: pError } = await supabase
        .from("Product")
        .insert([{ id: crypto.randomUUID(), userId, name: item.name.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
        .select()
        .single();
      if (pError) throw new Error(pError.message);
      productId = newProduct.id;
    }

    const { error: lotError } = await supabase
      .from("StockLot")
      .insert([{
        id: crypto.randomUUID(),
        productId,
        initialQuantity: item.initialQuantity,
        remainingQuantity: item.initialQuantity,
        buyPrice: item.buyPrice,
        isStocked: item.isStocked,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);
      
    if (lotError) throw new Error(lotError.message);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function bulkAddSales(items: { productName: string, quantitySold: number, salePricePerUnit: number, buyPrice?: number }[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = await createClient();

  for (const item of items) {
    const { data: products } = await supabase
      .from("Product")
      .select("id, lots:StockLot(id, remainingQuantity, buyPrice, createdAt)")
      .eq("userId", userId)
      .ilike("name", `%${item.productName.trim()}%`);

    let product;

    if (!products || products.length === 0) {
      const buyPrice = item.buyPrice || 0;
      const { data: newP, error: pError } = await supabase
        .from("Product")
        .insert([{ id: crypto.randomUUID(), userId, name: item.productName.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }])
        .select()
        .single();
      if (pError) throw new Error(pError.message);
      
      const newLotId = crypto.randomUUID();
      const { error: lotError } = await supabase
        .from("StockLot")
        .insert([{
          id: newLotId,
          productId: newP.id,
          initialQuantity: item.quantitySold,
          remainingQuantity: item.quantitySold,
          buyPrice: buyPrice,
          isStocked: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]);
      if (lotError) throw new Error(lotError.message);

      product = {
        id: newP.id,
        lots: [{ id: newLotId, remainingQuantity: item.quantitySold, buyPrice: buyPrice, createdAt: new Date().toISOString() }]
      };
    } else {
      product = products[0];
    }

    const lots = (product.lots || []).filter((l: any) => l.remainingQuantity > 0).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let remainingToSell = item.quantitySold;
    
    // Safety check for stock, if deficit, auto-create missing stock.
    let totalStock = lots.reduce((acc: number, l: any) => acc + l.remainingQuantity, 0);
    if (totalStock < item.quantitySold) {
      const missingStock = item.quantitySold - totalStock;
      const lastBuyPrice = lots.length > 0 ? lots[lots.length - 1].buyPrice : (item.buyPrice || 0);

      const newLotId = crypto.randomUUID();
      await supabase
        .from("StockLot")
        .insert([{
          id: newLotId,
          productId: product.id,
          initialQuantity: missingStock,
          remainingQuantity: missingStock,
          buyPrice: lastBuyPrice,
          isStocked: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]);

      lots.push({ id: newLotId, remainingQuantity: missingStock, buyPrice: lastBuyPrice, createdAt: new Date().toISOString() });
    }

    // Process FIFO
    for (const lot of lots) {
      if (remainingToSell <= 0) break;

      const qtyFromLot = Math.min(lot.remainingQuantity, remainingToSell);
      const totalSalePrice = qtyFromLot * item.salePricePerUnit;
      const totalProfit = totalSalePrice - (qtyFromLot * lot.buyPrice);

      await supabase
        .from("StockLot")
        .update({ remainingQuantity: lot.remainingQuantity - qtyFromLot })
        .eq("id", lot.id);

      const { error: saleError } = await supabase
        .from("Sale")
        .insert([{
          id: crypto.randomUUID(),
          productId: product.id,
          quantitySold: qtyFromLot,
          totalSalePrice,
          totalProfit,
          createdAt: new Date().toISOString()
        }]);

      if (saleError) throw new Error(`Sale insert failed: ${saleError.message}`);
      
      remainingToSell -= qtyFromLot;
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}
