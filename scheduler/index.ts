import cron from "node-cron";
import { chromium, type Browser, type BrowserContext } from "playwright";
import fs from "fs";
import path from "path";
import { checkAndPublish } from "./jobs/publish";

const EVERY_MINUTE = "* * * * *";
const STATE_FILE = path.resolve(__dirname, "storage/threads-state.json");
const HEADLESS = process.env.HEADLESS !== "false";

async function main() {
  const hasSession = fs.existsSync(STATE_FILE);

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  if (hasSession) {
    browser = await chromium.launch({ headless: HEADLESS });
    context = await browser.newContext({ storageState: STATE_FILE });
    console.log("[Scheduler] Browser launched, session loaded.");
  } else {
    console.log(
      "[Scheduler] No Threads session found. Run: cd scheduler && npx tsx lib/social/login.ts"
    );
  }

  // Random initial delay (0-30s) to avoid posting at exact :00 every time
  const startupDelay = Math.floor(Math.random() * 30000);
  console.log(`[Scheduler] Starting in ${(startupDelay / 1000).toFixed(1)}s...`);

  setTimeout(() => {
    cron.schedule(EVERY_MINUTE, () => {
      checkAndPublish(browser, context);
    });
    console.log("[Scheduler] Worker started");
  }, startupDelay);

  const cleanup = async () => {
    console.log("[Scheduler] Shutting down...");
    if (browser) await browser.close();
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error("[Scheduler] Fatal:", err);
  process.exit(1);
});
