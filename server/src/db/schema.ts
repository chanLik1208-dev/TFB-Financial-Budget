import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// 設計原則（為遷移 PostgreSQL 預留）：
// - 金額一律存「整數最小單位」(分)，避免浮點誤差。
// - 時間存 epoch 毫秒整數，不依賴 SQLite 日期函式。
// - 不用 SQLite 專屬語法；之後改 pg-core 即可，業務碼不動。

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayCurrency: text("display_currency").notNull().default("HKD"),
  theme: text("theme").notNull().default("sakura"),
  // 單一登入：每次登入遞增，舊 token 的版本不符即失效。
  tokenVersion: integer("token_version").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const records = sqliteTable("records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // food | product | service ...
  amount: integer("amount").notNull(), // 最小單位(分)
  currency: text("currency").notNull(),
  note: text("note"),
  interval: text("interval"), // 服務(訂閱): monthly|yearly / 交通: monthly|weekly|daily
  restriction: text("restriction"), // 交通: workdays | weekends
  createdAt: integer("created_at").notNull(),
});

export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  period: text("period").notNull(), // monthly | yearly
  limitAmount: integer("limit_amount").notNull(),
  currency: text("currency").notNull(),
});

export const rates = sqliteTable("rates", {
  base: text("base").notNull(),
  quote: text("quote").notNull(),
  rate: integer("rate").notNull(), // 匯率 * 1e6，整數存儲
  fetchedDate: text("fetched_date").notNull(),
});

// 可熱重載參數（通知冷卻、主題等），key/value 形式。
export const settings = sqliteTable("settings", {
  userId: integer("user_id").notNull().references(() => users.id),
  key: text("key").notNull(),
  value: text("value").notNull(),
});
