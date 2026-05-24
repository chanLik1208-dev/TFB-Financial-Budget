import type { Record } from "../repositories/types.js";
import { periodRange } from "./period.js";

export interface Projected {
  currency: string;
  total: number; // 主單位
  items: { name: string; amount: number }[];
}

type Convert = (amountCents: number, from: string, to: string) => number;

// 預計下月開支：服務(訂閱) + 交通，換算為顯示貨幣。
// monthly 訂閱每月計入；yearly 訂閱只在週年所在月計入。
// 交通按 interval 乘以下月天數/週數/工作日數/週末數。

function nextMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  return { start, end };
}

function yearlyDueNextMonth(createdAt: number): boolean {
  const { start, end } = nextMonthRange();
  const created = new Date(createdAt);
  for (const year of [start.getFullYear(), start.getFullYear() + 1]) {
    const anniversary = new Date(year, created.getMonth(), created.getDate());
    if (anniversary >= start && anniversary < end) return true;
  }
  return false;
}

// Count days in next month matching a restriction (null = all days).
function countDays(restriction: string | null): number {
  const { start, end } = nextMonthRange();
  const total = (end.getTime() - start.getTime()) / 86400000;
  if (!restriction) return total;
  let count = 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dow === 0 || dow === 6;
    if (restriction === "weekends" && isWeekend) count++;
    if (restriction === "workdays" && !isWeekend) count++;
  }
  return count;
}

function transitMultiplier(interval: string | null, restriction: string | null): number {
  const days = countDays(restriction);
  if (interval === "daily") return days;
  if (interval === "weekly") return days / 7;
  return 1; // monthly
}

export function computeProjected(
  records: Record[],
  displayCurrency: string,
  convert: Convert,
): Projected {
  const { end } = periodRange("this-month");
  const eligible = records.filter((r) => {
    if (r.type === "服務(訂閱)") {
      if (r.interval === "yearly") return yearlyDueNextMonth(r.createdAt);
      return r.createdAt < end;
    }
    if (r.type === "交通" || r.type === "飲食") return r.createdAt < end;
    return false;
  });
  let totalCents = 0;
  const items = eligible.map((r) => {
    const base = convert(r.amount, r.currency, displayCurrency);
    const multiplier = ["交通", "飲食"].includes(r.type) ? transitMultiplier(r.interval, r.restriction) : 1;
    const c = Math.round(base * multiplier);
    totalCents += c;
    return { name: r.name, amount: c / 100 };
  });
  items.sort((a, b) => b.amount - a.amount);
  return { currency: displayCurrency, total: totalCents / 100, items };
}
