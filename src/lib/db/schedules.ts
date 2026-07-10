import { prisma } from "@/lib/db";

interface CreateScheduleData {
  userId: string;
  productId: string;
  contentId: string;
  platform: string;
  scheduledAt: Date;
}

export async function listSchedules(userId: string) {
  return prisma.schedule.findMany({
    where: { userId },
    orderBy: { scheduledAt: "asc" },
    include: {
      product: { select: { title: true, imageUrl: true } },
      content: { select: { content: true } },
    },
  });
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
  const where: { userId: string; status?: string; scheduledAt?: object } = { userId };
  if (status) {
    where.status = status;
    if (status === "pending") {
      where.scheduledAt = { gte: new Date() };
    }
  }
  return prisma.schedule.count({ where });
}
