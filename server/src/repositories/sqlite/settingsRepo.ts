import { and, eq } from "drizzle-orm";
import type { DB } from "../../db/client.js";
import { settings } from "../../db/schema.js";
import type { SettingsRepo } from "../types.js";

export class SqliteSettingsRepo implements SettingsRepo {
  constructor(private db: DB) {}

  async getAll(userId: number): Promise<Map<string, string>> {
    const rows = await this.db.select().from(settings).where(eq(settings.userId, userId));
    return new Map(rows.map((r) => [r.key, r.value]));
  }

  async set(userId: number, key: string, value: string): Promise<void> {
    const existing = await this.db
      .select()
      .from(settings)
      .where(and(eq(settings.userId, userId), eq(settings.key, key)));
    if (existing[0]) {
      await this.db
        .update(settings)
        .set({ value })
        .where(and(eq(settings.userId, userId), eq(settings.key, key)));
    } else {
      await this.db.insert(settings).values({ userId, key, value });
    }
  }
}
