import { and, eq } from "drizzle-orm";
import type { DB } from "../../db/client.js";
import { budgets } from "../../db/schema.js";
import type { Budget, BudgetRepo } from "../types.js";

export class SqliteBudgetRepo implements BudgetRepo {
  constructor(private db: DB) {}

  async listByUser(userId: number): Promise<Budget[]> {
    return this.db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  async insert(b: Omit<Budget, "id">): Promise<Budget> {
    const rows = await this.db.insert(budgets).values(b).returning();
    return rows[0];
  }

  async upsert(b: Omit<Budget, "id">): Promise<void> {
    const existing = await this.db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, b.userId), eq(budgets.period, b.period)));
    if (existing[0]) {
      await this.db
        .update(budgets)
        .set({ limitAmount: b.limitAmount, currency: b.currency })
        .where(eq(budgets.id, existing[0].id));
    } else {
      await this.db.insert(budgets).values(b);
    }
  }
}
