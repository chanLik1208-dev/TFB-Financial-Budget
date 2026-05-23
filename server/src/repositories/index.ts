import { db } from "../db/client.js";
import type { Repositories } from "./types.js";
import { SqliteUserRepo } from "./sqlite/userRepo.js";
import { SqliteRecordRepo } from "./sqlite/recordRepo.js";
import { SqliteBudgetRepo } from "./sqlite/budgetRepo.js";
import { SqliteRateRepo } from "./sqlite/rateRepo.js";
import { SqliteSettingsRepo } from "./sqlite/settingsRepo.js";

// 組裝點：目前用 SQLite 實作。遷移 Postgres 時，這裡換成 Pg*Repo 即可。
export const repos: Repositories = {
  users: new SqliteUserRepo(db),
  records: new SqliteRecordRepo(db),
  budgets: new SqliteBudgetRepo(db),
  rates: new SqliteRateRepo(db),
  settings: new SqliteSettingsRepo(db),
};
