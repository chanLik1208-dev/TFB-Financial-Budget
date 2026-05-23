import type { Record } from "../repositories/types.js";
import { periodRange } from "./period.js";

export interface Projected {
  currency: string;
  total: number; // 主單位
  items: { name: string; amount: number }[];
}

type Convert = (amountCents: number, from: string, to: string) => number;

// 預計下月開支：以本月「服務(訂閱)」類記錄為依據（假設每月續訂），換算為顯示貨幣。
const SUBSCRIPTION_TYPE = "服務(訂閱)";

export function computeProjected(
  records: Record[],
  displayCurrency: string,
  convert: Convert,
): Projected {
  const { start, end } = periodRange("this-month");
  const subs = records.filter(
    (r) => r.type === SUBSCRIPTION_TYPE && r.createdAt >= start && r.createdAt < end,
  );
  let totalCents = 0;
  const items = subs.map((r) => {
    const c = convert(r.amount, r.currency, displayCurrency);
    totalCents += c;
    return { name: r.name, amount: c / 100 };
  });
  items.sort((a, b) => b.amount - a.amount);
  return { currency: displayCurrency, total: totalCents / 100, items };
}
