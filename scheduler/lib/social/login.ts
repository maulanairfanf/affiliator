import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const STORAGE_DIR = path.resolve(__dirname, "../../storage");
const STATE_FILE = path.join(STORAGE_DIR, "threads-state.json");

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("🚀 Opening Threads...");
  await page.goto("https://www.threads.net");

  console.log("📝 Silakan login manual. Setelah login, tekan Enter di terminal ini...");
  console.log("⏳ Menunggu login...");

  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => resolve());
  });

  console.log("💾 Menyimpan session...");
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
  await context.storageState({ path: STATE_FILE });

  await browser.close();
  console.log("✅ Session tersimpan di", STATE_FILE);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Login failed:", err.message);
  process.exit(1);
});
