import type { Config } from "drizzle-kit";

// 目前用 SQLite。遷移 PostgreSQL 時改 dialect 為 "postgresql" 並換 schema 方言。
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${process.env.DB_FILE ?? "./data/finance.sqlite"}`,
  },
} satisfies Config;
