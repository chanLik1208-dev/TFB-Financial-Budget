import type { Record } from "../repositories/types.js";

// Count qualifying days between two timestamps (inclusive start, exclusive end).
function countQualifyingDays(
  fromMs: number,
  toMs: number,
  restriction: string | null,
): number {
  const from = new Date(fromMs);
  const to = new Date(toMs);
  // Normalise to date boundaries
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  let count = 0;
  for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    if (restriction === "workdays" && isWeekend) continue;
    if (restriction === "weekends" && !isWeekend) continue;
    count++;
  }
  return count;
}

// Expand daily 交通 records into a virtual amount for the given range.
// Returns a new array where daily records have their amount multiplied by
// the number of qualifying days that fell within [range.start, min(now, range.end)).
export function expandDailyRecords(
  records: Record[],
  range: { start: number; end: number },
): Record[] {
  const now = Date.now();
  const effectiveEnd = Math.min(now, range.end);
  return records.map((r) => {
    if (!["交通", "飲食"].includes(r.type) || !["daily", "weekly"].includes(r.interval ?? "")) return r;
    const days = countQualifyingDays(range.start, effectiveEnd, r.restriction);
    const multiplier = r.interval === "weekly" ? days / 7 : days;
    if (multiplier <= 1) return r;
    return { ...r, amount: Math.round(r.amount * multiplier) };
  });
}
