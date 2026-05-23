import type { OverviewStatus } from "./api";

// 通知系統：只有在設定開啟通知時才請求權限與追蹤（呼應原設計）。
// 預算接近/超出時提醒，並用冷卻避免重複打擾。

const LAST_KEY = "fm_last_notify";

// 僅在「啟用通知」時呼叫——這是唯一請求瀏覽器權限的入口。
export async function enableNotifications(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const res = await Notification.requestPermission();
  return res === "granted";
}

// 依目前狀態決定是否發通知。enabled 由設定控制；cooldownMin 為冷卻分鐘。
export function maybeNotify(status: OverviewStatus, enabled: boolean, cooldownMin: number) {
  if (!enabled) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (status.level !== "warn" && status.level !== "bad") return;

  const now = Date.now();
  const last = Number(localStorage.getItem(LAST_KEY) ?? "0");
  if (now - last < cooldownMin * 60_000) return; // 冷卻中

  new Notification("財政管理器", {
    body: status.message,
    tag: "fm-budget", // 同 tag 取代舊通知，避免堆疊
  });
  localStorage.setItem(LAST_KEY, String(now));
}
