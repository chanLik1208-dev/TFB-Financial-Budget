import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./client.js";

// 套用 drizzle/ 內的遷移檔。先跑 npm run db:generate 產生遷移。
migrate(db, { migrationsFolder: "./drizzle" });
console.log("migrations applied");
