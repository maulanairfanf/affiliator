import { prisma } from "@/lib/db";
import type { ProductFilter, ProductFormData } from "@/types/product";
import type { Prisma } from "@/generated/prisma/client";

function buildWhere(userId: string, filter?: ProductFilter): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { userId };

  if (filter?.source) {
    where.source = filter.source;
  }

  if (filter?.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { description: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  if (filter?.minPrice !== undefined || filter?.maxPrice !== undefined) {
    where.price = {};
    if (filter.minPrice !== undefined) where.price.gte = filter.minPrice;
    if (filter.maxPrice !== undefined) where.price.lte = filter.maxPrice;
  }

  return where;
}

export async function listProducts(userId: string, filter?: ProductFilter) {
  return prisma.product.findMany({
    where: buildWhere(userId, filter),
    orderBy: { createdAt: "desc" },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function createProduct(data: ProductFormData & { userId: string }) {
  return prisma.product.create({ data });
}

export async function updateProduct(id: string, data: Partial<ProductFormData>) {
  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

export async function countProducts(userId: string) {
  return prisma.product.count({ where: { userId } });
}
