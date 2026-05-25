import type { Record, Budget } from "../repositories/types.js";
import { expandDailyRecords } from "./expandRecords.js";

export function thisMonthRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
  return { start, end };
}

export type StatusLevel = "ok" | "warn" | "bad" | "none";

export interface OverviewStatus {
  level: StatusLevel;
  message: string;
  currency: string;
  spent: number; // 主單位，已換算為顯示貨幣
  budget: number | null; // 主單位
  details: { label: string; text: string }[];
}

// 門檻（之後可由 settings 表熱重載）
const WARN_RATIO = 0.7;

type Convert = (amountCents: number, from: string, to: string) => number;

// 計算本期(本月)財務健康狀態。所有金額換算為 displayCurrency 後再比較。
export function computeStatus(
  records: Record[],
  budget: Budget | undefined,
  displayCurrency: string,
  convert: Convert,
): OverviewStatus {
  const { start: monthStart, end: monthEnd } = thisMonthRange();
  const monthRecords = expandDailyRecords(
    records.filter((r) => r.createdAt >= monthStart),
    { start: monthStart, end: monthEnd },
  );

  // 每筆換算為顯示貨幣（分）。
  const inDisplay = (r: Record) => convert(r.amount, r.currency, displayCurrency);

  const spentCents = monthRecords.reduce((s, r) => s + inDisplay(r), 0);
  const spent = spentCents / 100;

  // 各類別小計（供展開細節）
  const byType = new Map<string, number>();
  for (const r of monthRecords) byType.set(r.type, (byType.get(r.type) ?? 0) + inDisplay(r));
  const details = [...byType.entries()].map(([label, cents]) => ({
    label,
    text: `${displayCurrency} ${(cents / 100).toFixed(2)}`,
  }));

  if (!budget) {
    return { level: "none", message: "尚未設定預算", currency: displayCurrency, spent, budget: null, details };
  }

  const limitCents = convert(budget.limitAmount, budget.currency, displayCurrency);
  const limit = limitCents / 100;
  const ratio = limitCents > 0 ? spentCents / limitCents : 0;
  const remaining = limit - spent;
  details.push({ label: "本月餘裕", text: `${displayCurrency} ${remaining.toFixed(2)}` });

  let level: StatusLevel;
  let message: string;
  if (ratio > 1) {
    level = "bad";
    message = "已超出預算，建議檢視記錄";
  } else if (ratio >= WARN_RATIO) {
    level = "warn";
    message = "接近預算上限，留意支出";
  } else {
    level = "ok";
    message = "財政穩健，本月仍有餘裕";
  }
  return { level, message, currency: displayCurrency, spent, budget: limit, details };
}
