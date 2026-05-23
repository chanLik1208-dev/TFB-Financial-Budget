import { repos } from "../repositories/index.js";

// 匯率服務：每日抓取（以 USD 為基準），離線時用最後快取；
// 表為空且抓取失敗時，用一組靜態 fallback 讓應用仍可運作。

const FALLBACK: Record<string, number> = {
  USD: 1, HKD: 7.8, CNY: 7.2, TWD: 32, JPY: 150, EUR: 0.92, GBP: 0.79,
};

const today = () => new Date().toISOString().slice(0, 10);

// 從免費 API 抓 USD 基準匯率（無需金鑰）。失敗回傳 null。
async function fetchUsdRates(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== "success" || !data.rates) return null;
    return data.rates;
  } catch {
    return null;
  }
}

function toEntries(rates: Record<string, number>) {
  return Object.entries(rates).map(([quote, rate]) => ({
    quote,
    rateMicro: Math.round(rate * 1_000_000),
  }));
}

// 抓取並寫入今日匯率。回傳是否成功取得即時資料。
export async function fetchDailyRates(): Promise<boolean> {
  const live = await fetchUsdRates();
  if (live) {
    await repos.rates.upsertMany(today(), toEntries(live));
    return true;
  }
  return false;
}

// 啟動時確保有可用匯率：今日已有則略過；否則嘗試抓取；再失敗且表空則植入 fallback。
export async function ensureRates(): Promise<void> {
  const latest = await repos.rates.latestDate();
  if (latest === today()) return;
  const ok = await fetchDailyRates();
  if (!ok && !latest) {
    await repos.rates.upsertMany(today(), toEntries(FALLBACK));
  }
}

// 以 USD 基準的匯率表，換算金額（最小單位/分）。
// rateMicro(C) = 1 USD 等於多少 C ×1e6。
export function makeConverter(map: Map<string, number>) {
  return (amountCents: number, from: string, to: string): number => {
    if (from === to) return amountCents;
    const rf = map.get(from);
    const rt = map.get(to);
    if (!rf || !rt) return amountCents; // 缺匯率時保守不換算
    // amount(from) -> USD -> to
    return Math.round((amountCents * rt) / rf);
  };
}
