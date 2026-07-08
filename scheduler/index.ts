import cron from "node-cron";
import { checkAndPublish } from "./jobs/publish";

const EVERY_MINUTE = "* * * * *";

console.log("[Scheduler] Worker started");

cron.schedule(EVERY_MINUTE, () => {
  checkAndPublish();
});
