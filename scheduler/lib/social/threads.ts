import { type Browser, type BrowserContext, type Page } from "playwright";
import path from "path";
import fs from "fs";

const STORAGE_DIR = path.resolve(__dirname, "../../storage");
const STATE_FILE = path.join(STORAGE_DIR, "threads-state.json");
const ERRORS_DIR = path.join(STORAGE_DIR, "errors");

const THREADS_URL = "https://www.threads.net";

interface PostItem {
  id: string;
  content: string;
  link?: string;
}

interface PostResult {
  id: string;
  success: boolean;
  error?: string;
}

export class ThreadsProvider {
  constructor(
    private browser: Browser,
    private context: BrowserContext,
  ) {}

  async postBatch(items: PostItem[]): Promise<PostResult[]> {
    if (!fs.existsSync(STATE_FILE)) {
      throw new Error(
        "Threads session not found. Run: npx tsx lib/social/login.ts"
      );
    }

    const results: PostResult[] = [];
    const page = await this.context.newPage();

    try {
      for (const item of items) {
        try {
          await this.postOne(page, item);
          results.push({ id: item.id, success: true });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          await page.screenshot({
            path: path.join(
              ERRORS_DIR,
              `threads-error-${item.id}-${Date.now()}.png`
            ),
            fullPage: true,
          });
          results.push({ id: item.id, success: false, error: message });
        }
      }

      await this.context.storageState({ path: STATE_FILE });
    } finally {
      await page.close();
    }

    return results;
  }

  private async postOne(page: Page, item: PostItem): Promise<void> {
    const postText = item.link
      ? `${item.content}\n\n🔗 ${item.link}`
      : item.content;

    console.log(`[Threads] Posting ${item.id}...`);
    await page.goto(THREADS_URL, { waitUntil: "load" });
    await page.waitForTimeout(2000);

    const composeBtn = page
      .locator('[role="button"]')
      .filter({ hasText: /Buat|Tulis|Baru|New|Create/ });
    await composeBtn.first().waitFor({ state: "visible", timeout: 10000 });
    await composeBtn.first().click();
    await page.waitForTimeout(1000);

    const textbox = page.locator('[role="textbox"]');
    await textbox.waitFor({ state: "visible", timeout: 5000 });
    await textbox.fill(postText);
    await page.waitForTimeout(500);

    const isMac = process.platform === "darwin";
    await page.keyboard.press(isMac ? "Meta+Enter" : "Control+Enter");
    await page.waitForTimeout(2000);

    console.log(`[Threads] ${item.id} posted!`);
  }
}
