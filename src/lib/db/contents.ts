import { prisma } from "@/lib/db";

interface CreateContentData {
  userId: string;
  productId?: string;
  platform: string;
  type: string;
  content: string;
  title?: string;
  templateId?: string;
}

interface ListContentsParams {
  userId: string;
  search?: string;
  platform?: string;
  page?: number;
  pageSize?: number;
}

export async function listContents({ userId, search, platform, page = 1, pageSize = 20 }: ListContentsParams) {
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { userId };

  if (platform && platform !== "all") {
    where.platform = platform;
  }

  if (search) {
    where.OR = [
      { content: { contains: search, mode: "insensitive" } },
      { product: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { product: { select: { title: true, imageUrl: true, sourceUrl: true, affiliateLink: true } } },
    }),
    prisma.content.count({ where }),
  ]);

  return { data, total, page, pageSize, hasMore: skip + data.length < total };
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

export async function updateContent(id: string, userId: string, data: { content?: string; title?: string | null }) {
  const existing = await prisma.content.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing || existing.userId !== userId) {
    throw new Error("Content not found");
  }
  const updateData: Record<string, unknown> = {};
  if (data.content !== undefined) updateData.content = data.content;
  if (data.title !== undefined) updateData.title = data.title;
  return prisma.content.update({ where: { id }, data: updateData });
}

export async function countContents(userId: string) {
  return prisma.content.count({ where: { userId } });
}
