import { prisma } from "@/lib/db";

interface CreateScheduleData {
  userId: string;
  productId?: string;
  contentId: string;
  platform: string;
  scheduledAt: Date;
}

interface ListSchedulesParams {
  userId: string;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listSchedules({ userId, search, status, page = 1, pageSize = 20 }: ListSchedulesParams) {
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { userId };

  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { product: { title: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      skip,
      take: pageSize,
      include: {
        product: { select: { title: true, imageUrl: true } },
        content: { select: { content: true } },
      },
    }),
    prisma.schedule.count({ where }),
  ]);

  return { data, total, page, pageSize, hasMore: skip + data.length < total };
}

export async function getSchedule(id: string) {
  return prisma.schedule.findUnique({ where: { id } });
}

export async function createSchedule(data: CreateScheduleData) {
  return prisma.schedule.create({ data });
}

export async function deleteSchedule(id: string, userId: string) {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!schedule || schedule.userId !== userId) {
    throw new Error("Schedule not found");
  }
  return prisma.schedule.delete({ where: { id } });
}

export async function countSchedules(userId: string, status?: string) {
  const where: Record<string, unknown> = { userId };
  if (status) {
    where.status = status;
  }
  return prisma.schedule.count({ where });
}
