import type { Record } from "../repositories/types.js";
import { expandDailyRecords } from "./expandRecords.js";
export { thisMonthRange } from "./overview.js";

export interface Breakdown {
  currency: string;
  total: number; // 主單位
  items: { type: string; amount: number }[]; // 各類別，主單位，降序
}

type Convert = (amountCents: number, from: string, to: string) => number;

// 指定區間內、依類別彙總消費（換算為顯示貨幣），供圓形圖使用。
export function computeBreakdown(
  records: Record[],
  range: { start: number; end: number },
  displayCurrency: string,
  convert: Convert,
): Breakdown {
  const inRange = expandDailyRecords(
    records.filter((r) => r.createdAt >= range.start && r.createdAt < range.end),
    range,
  );
  const byType = new Map<string, number>();
  let totalCents = 0;
  for (const r of inRange) {
    const c = convert(r.amount, r.currency, displayCurrency);
    byType.set(r.type, (byType.get(r.type) ?? 0) + c);
    totalCents += c;
  }
  const items = [...byType.entries()]
    .map(([type, cents]) => ({ type, amount: cents / 100 }))
    .sort((a, b) => b.amount - a.amount);
  return { currency: displayCurrency, total: totalCents / 100, items };
}
