import { type Browser, type BrowserContext, type Page } from "playwright";
import path from "path";
import fs from "fs";

const STORAGE_DIR = path.resolve(__dirname, "../../storage");
const STATE_FILE = path.join(STORAGE_DIR, "threads-state.json");
const ERRORS_DIR = path.join(STORAGE_DIR, "errors");

const THREADS_URL = "https://www.threads.net";

const MIN_DELAY_MS = 15_000;
const MAX_DELAY_MS = 45_000;

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

function randomDelay(): number {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
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
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Random delay before each post (skip first)
        if (i > 0) {
          const delay = randomDelay();
          console.log(`[Threads] Waiting ${(delay / 1000).toFixed(1)}s before next post...`);
          await new Promise((r) => setTimeout(r, delay));
        }

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

    console.log("[Threads] Navigating to Threads...");
    await page.goto(THREADS_URL, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    console.log("[Threads] Page loaded.");

    console.log("[Threads] Looking for compose button...");
    await page.evaluate(() => {
      const buttons = document.querySelectorAll<HTMLElement>('[role="button"]');
      for (const btn of buttons) {
        if (/Buat|Tulis|Baru|New|Create/i.test(btn.textContent || "")) {
          btn.click();
          break;
        }
      }
    });
    await page.waitForTimeout(1500);
    console.log("[Threads] Compose button clicked.");

    console.log("[Threads] Filling textbox...");
    const textbox = page.locator('[role="textbox"]');
    await textbox.waitFor({ state: "visible", timeout: 5000 });
    await textbox.fill(postText);
    await page.waitForTimeout(500);
    console.log("[Threads] Text filled. Length:", postText.length);

    console.log("[Threads] Clicking post button inside dialog...");
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) throw new Error("No dialog found");
      const buttons = dialog.querySelectorAll('[role="button"]');
      const postBtn = Array.from(buttons).find(btn =>
        /Post|Kirim/i.test(btn.textContent || "")
      );
      if (!postBtn) throw new Error("Post button not found in dialog");
      (postBtn as HTMLElement).click();
    });

    await page.waitForTimeout(3000);

    const screenshotPath = path.join(
      ERRORS_DIR,
      `threads-confirm-${item.id}-${Date.now()}.png`
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log("[Threads] Confirmation screenshot:", screenshotPath);

    console.log(`[Threads] ${item.id} done!`);
  }
}
