import type { Browser, BrowserContext } from "playwright";
import type { Schedule } from "./types";
import { ThreadsProvider } from "./social/threads";

export async function publishBatch(
  browser: Browser,
  context: BrowserContext,
  schedules: Schedule[]
): Promise<{ id: string; success: boolean; error?: string }[]> {
  const results: { id: string; success: boolean; error?: string }[] = [];

  const threadsItems = schedules.filter((s) => s.platform === "threads");

  if (threadsItems.length > 0) {
    const threads = new ThreadsProvider(browser, context);
    const posts = threadsItems.map((s) => ({
      id: s.id,
      content: s.content,
      link: s.affiliateLink || s.sourceUrl,
    }));
    const postResults = await threads.postBatch(posts);
    results.push(...postResults);
  }

  for (const s of schedules) {
    if (!results.find((r) => r.id === s.id)) {
      results.push({
        id: s.id,
        success: false,
        error: `Unknown platform: ${s.platform}`,
      });
    }
  }

  return results;
}
