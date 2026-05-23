import { eq } from "drizzle-orm";
import type { DB } from "../../db/client.js";
import { records } from "../../db/schema.js";
import type { Record, RecordRepo } from "../types.js";

export class SqliteRecordRepo implements RecordRepo {
  constructor(private db: DB) {}

  async findById(id: number): Promise<Record | undefined> {
    const rows = await this.db.select().from(records).where(eq(records.id, id));
    return rows[0];
  }

  async listByUser(userId: number): Promise<Record[]> {
    return this.db.select().from(records).where(eq(records.userId, userId));
  }

  async insert(r: Omit<Record, "id">): Promise<Record> {
    const rows = await this.db.insert(records).values(r).returning();
    return rows[0];
  }

  async update(id: number, patch: Partial<Omit<Record, "id" | "userId">>): Promise<void> {
    await this.db.update(records).set(patch).where(eq(records.id, id));
  }

  async remove(id: number): Promise<void> {
    await this.db.delete(records).where(eq(records.id, id));
  }
}
