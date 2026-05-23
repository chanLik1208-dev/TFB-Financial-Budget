import cron from "node-cron";
import { ensureRates, fetchDailyRates } from "./rates.js";

// 啟動時確保有匯率，並排程每日 02:00 更新。
export async function startScheduler() {
  await ensureRates();
  cron.schedule("0 2 * * *", () => {
    fetchDailyRates().catch((e) => console.error("daily rate fetch failed", e));
  });
}
