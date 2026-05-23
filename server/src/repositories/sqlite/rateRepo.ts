import { desc, eq } from "drizzle-orm";
import type { DB } from "../../db/client.js";
import { rates } from "../../db/schema.js";
import type { RateRepo } from "../types.js";

const BASE = "USD";

export class SqliteRateRepo implements RateRepo {
  constructor(private db: DB) {}

  async latestDate(): Promise<string | null> {
    const rows = await this.db
      .select({ d: rates.fetchedDate })
      .from(rates)
      .orderBy(desc(rates.fetchedDate))
      .limit(1);
    return rows[0]?.d ?? null;
  }

  async getMap(): Promise<Map<string, number>> {
    const date = await this.latestDate();
    const map = new Map<string, number>();
    if (!date) return map;
    const rows = await this.db.select().from(rates).where(eq(rates.fetchedDate, date));
    for (const r of rows) map.set(r.quote, r.rate);
    map.set(BASE, 1_000_000); // USD 基準
    return map;
  }

  async upsertMany(date: string, entries: { quote: string; rateMicro: number }[]): Promise<void> {
    // 同一天重抓：先刪當天再插入，保持冪等。
    await this.db.delete(rates).where(eq(rates.fetchedDate, date));
    if (entries.length === 0) return;
    await this.db.insert(rates).values(
      entries.map((e) => ({ base: BASE, quote: e.quote, rate: e.rateMicro, fetchedDate: date })),
    );
  }
}
