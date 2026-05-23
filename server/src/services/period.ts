// 將區間代碼換算成 [start, end) 的 epoch 毫秒範圍。
export type PeriodKey =
  | "this-month" | "last-month" | "last-3m" | "last-6m"
  | "this-year" | "last-year" | "all";

export const PERIOD_KEYS: PeriodKey[] = [
  "this-month", "last-month", "last-3m", "last-6m", "this-year", "last-year", "all",
];

export function periodRange(key: PeriodKey, now = new Date()): { start: number; end: number } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const ms = (d: Date) => d.getTime();
  const END = ms(now);

  switch (key) {
    case "this-month":
      return { start: ms(new Date(y, m, 1)), end: END };
    case "last-month":
      return { start: ms(new Date(y, m - 1, 1)), end: ms(new Date(y, m, 1)) };
    case "last-3m":
      return { start: ms(new Date(y, m - 2, 1)), end: END };
    case "last-6m":
      return { start: ms(new Date(y, m - 5, 1)), end: END };
    case "this-year":
      return { start: ms(new Date(y, 0, 1)), end: END };
    case "last-year":
      return { start: ms(new Date(y - 1, 0, 1)), end: ms(new Date(y, 0, 1)) };
    case "all":
      return { start: 0, end: END };
  }
}

export function isPeriodKey(v: unknown): v is PeriodKey {
  return typeof v === "string" && (PERIOD_KEYS as string[]).includes(v);
}
