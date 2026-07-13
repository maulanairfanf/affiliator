import type { Browser, BrowserContext } from "playwright";
import { prisma } from "../lib/db";
import { publishBatch } from "../lib/publisher";

const MAX_POSTS_PER_DAY = parseInt(process.env.MAX_POSTS_PER_DAY || "10", 10);

export async function checkAndPublish(
  browser: Browser | null,
  context: BrowserContext | null,
): Promise<void> {
  if (!browser || !context) {
    console.log("[Scheduler] No browser available, skipping check.");
    return;
  }

  const now = new Date();

  // Daily limit check
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.schedule.count({
    where: {
      status: "published",
      scheduledAt: { gte: todayStart },
    },
  });

  if (todayCount >= MAX_POSTS_PER_DAY) {
    console.log(
      `[Scheduler] Daily limit reached (${todayCount}/${MAX_POSTS_PER_DAY}). Skipping.`
    );
    return;
  }

  try {
    const dueSchedules = await prisma.schedule.findMany({
      where: {
        scheduledAt: { lte: now },
        status: "pending",
      },
      include: { product: true, content: true },
      take: MAX_POSTS_PER_DAY - todayCount,
    });

    console.log(`[Scheduler] Found ${dueSchedules.length} due schedules`);

    if (dueSchedules.length === 0) return;

    const results = await publishBatch(
      browser,
      context,
      dueSchedules.map((s) => ({
        id: s.id,
        platform: s.platform,
        content: s.content.content,
        productTitle: s.product?.title,
        affiliateLink: s.product?.affiliateLink || undefined,
        sourceUrl: s.product?.sourceUrl || undefined,
      }))
    );

    for (const result of results) {
      if (result.success) {
        await prisma.schedule.update({
          where: { id: result.id },
          data: { status: "published" },
        });
        console.log(`[Scheduler] Published schedule ${result.id}`);
      } else {
        console.error(
          `[Scheduler] Failed schedule ${result.id}: ${result.error}`
        );
        await prisma.schedule.update({
          where: { id: result.id },
          data: { status: "failed" },
        });
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error checking schedules:", error);
  }
}
