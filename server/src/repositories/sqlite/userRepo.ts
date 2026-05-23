import { eq } from "drizzle-orm";
import type { DB } from "../../db/client.js";
import { users } from "../../db/schema.js";
import type { User, UserRepo } from "../types.js";

export class SqliteUserRepo implements UserRepo {
  constructor(private db: DB) {}

  async findById(id: number): Promise<User | undefined> {
    const rows = await this.db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const rows = await this.db.select().from(users).where(eq(users.username, username));
    return rows[0];
  }

  async insert(u: Omit<User, "id">): Promise<User> {
    const rows = await this.db.insert(users).values(u).returning();
    return rows[0];
  }

  async update(id: number, patch: Partial<Pick<User, "displayCurrency" | "theme">>): Promise<void> {
    await this.db.update(users).set(patch).where(eq(users.id, id));
  }

  async bumpTokenVersion(id: number): Promise<number> {
    const rows = await this.db.select().from(users).where(eq(users.id, id));
    const next = (rows[0]?.tokenVersion ?? 0) + 1;
    await this.db.update(users).set({ tokenVersion: next }).where(eq(users.id, id));
    return next;
  }
}
