"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getInventory() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const products = await prisma.product.findMany({
    where: { userId },
    include: {
      lots: {
        orderBy: { dateAcquired: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products;
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

  const product = await prisma.product.create({
    data: {
      userId,
      name: data.name,
      lots: {
        create: {
          initialQuantity: data.initialQuantity,
          remainingQuantity: data.initialQuantity,
          buyPrice: data.buyPrice,
          isStocked: data.isStocked,
          dateAcquired: data.dateAcquired ?? new Date(),
          lotIdentity: data.lotIdentity,
        },
      },
    },
    include: { lots: true },
  });

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

  const product = await prisma.product.findFirst({
    where: { id: data.productId, userId },
  });
  if (!product) throw new Error("Product not found or unauthorized");

  const lot = await prisma.stockLot.create({
    data: {
      productId: data.productId,
      initialQuantity: data.initialQuantity,
      remainingQuantity: data.initialQuantity,
      buyPrice: data.buyPrice,
      isStocked: data.isStocked,
    },
  });

  revalidatePath("/stock");
  return lot;
}

export async function markAsStocked(lotId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const lot = await prisma.stockLot.findFirst({
    where: {
      id: lotId,
      product: { userId },
    },
  });
  if (!lot) throw new Error("Lot not found or unauthorized");

  const updatedLot = await prisma.stockLot.update({
    where: { id: lotId },
    data: { isStocked: true },
  });

  revalidatePath("/stock");
  return updatedLot;
}

export async function updateProductName(productId: string, name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const product = await prisma.product.updateMany({
    where: { id: productId, userId },
    data: { name },
  });

  if (product.count === 0) {
    throw new Error("Product not found or unauthorized");
  }

  revalidatePath("/stock");
}

export async function deleteLot(lotId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const lot = await prisma.stockLot.findFirst({
    where: {
      id: lotId,
      product: { userId },
    },
  });
  if (!lot) throw new Error("Lot not found or unauthorized");

  await prisma.stockLot.delete({ where: { id: lotId } });

  const remainingLots = await prisma.stockLot.count({
    where: { productId: lot.productId },
  });

  if (remainingLots === 0) {
    await prisma.product.delete({ where: { id: lot.productId } });
  }

  revalidatePath("/stock");
}

export async function recordSale() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // TODO: Implement recordSale with FIFO logic
}

export async function seedMockData() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Clean existing data
  await prisma.product.deleteMany({
    where: { userId },
  });

  // Create products
  const product1 = await prisma.product.create({
    data: {
      userId,
      name: "Ergonomic Chair Pro",
      lots: {
        create: [
          {
            initialQuantity: 10,
            remainingQuantity: 10,
            buyPrice: 150.0,
            isStocked: true,
          },
          {
            initialQuantity: 5,
            remainingQuantity: 5,
            buyPrice: 145.0,
            isStocked: false, // Incoming lot
          },
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      userId,
      name: "Mechanical Keyboard",
      lots: {
        create: [
          {
            initialQuantity: 20,
            remainingQuantity: 12,
            buyPrice: 85.0,
            isStocked: true,
          },
        ],
      },
    },
  });

  revalidatePath("/stock");
  return { success: true };
}
