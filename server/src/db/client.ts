import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema.js";

// === 資料庫接入點 ===
// 全應用只透過這裡取得 db。libSQL 與 SQLite 相容、無需原生編譯。
// 遷移 PostgreSQL 時，只需把這個檔換成 drizzle-orm/node-postgres 的初始化，
// 其餘 Repository 與業務碼不動。

const DB_FILE = process.env.DB_FILE ?? "./data/finance.sqlite";
mkdirSync(dirname(DB_FILE), { recursive: true });

const client = createClient({ url: `file:${DB_FILE}` });
export const db = drizzle(client, { schema });
export type DB = typeof db;
