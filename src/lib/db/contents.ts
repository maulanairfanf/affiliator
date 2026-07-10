import { prisma } from "@/lib/db";

interface CreateContentData {
  userId: string;
  productId?: string;
  platform: string;
  type: string;
  content: string;
  templateId?: string;
}

export async function listContents(userId: string) {
  return prisma.content.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { title: true, imageUrl: true, sourceUrl: true, affiliateLink: true } } },
  });
}

export async function getContent(id: string) {
  return prisma.content.findUnique({
    where: { id },
    include: { product: { select: { title: true, imageUrl: true, sourceUrl: true, affiliateLink: true } } },
  });
}

export async function createContent(data: CreateContentData) {
  return prisma.content.create({ data });
}

export async function deleteContent(id: string, userId: string) {
  const content = await prisma.content.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!content || content.userId !== userId) {
    throw new Error("Content not found");
  }
  return prisma.content.delete({ where: { id } });
}

export async function countContents(userId: string) {
  return prisma.content.count({ where: { userId } });
}
