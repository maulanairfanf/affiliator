import { prisma } from "../lib/db";
import { publish } from "../lib/publisher";

export async function checkAndPublish(): Promise<void> {
  const now = new Date();

  try {
    const dueSchedules = await prisma.schedule.findMany({
      where: {
        scheduledAt: { lte: now },
        status: "pending",
      },
      include: { product: true, content: true },
    });

    console.log(`[Scheduler] Found ${dueSchedules.length} due schedules`);

    for (const schedule of dueSchedules) {
      try {
        await publish({
          id: schedule.id,
          platform: schedule.platform,
          content: schedule.content.content,
          productTitle: schedule.product.title,
        });
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: { status: "published" },
        });
        console.log(`[Scheduler] Published schedule ${schedule.id}`);
      } catch (error) {
        console.error(`[Scheduler] Failed schedule ${schedule.id}:`, error);
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: { status: "failed" },
        });
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error checking schedules:", error);
  }
}
