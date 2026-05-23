// Repository 介面：業務邏輯只依賴這裡，不直接碰任何 DB 引擎。
// SQLite 與未來的 Postgres 各自提供實作；切換時業務碼零改動。

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  displayCurrency: string;
  theme: string;
  tokenVersion: number;
  createdAt: number;
}

export interface Record {
  id: number;
  userId: number;
  name: string;
  type: string;
  amount: number; // 最小單位(分)
  currency: string;
  note: string | null;
  createdAt: number;
}

export interface UserRepo {
  findById(id: number): Promise<User | undefined>;
  findByUsername(username: string): Promise<User | undefined>;
  insert(u: Omit<User, "id">): Promise<User>;
  update(id: number, patch: Partial<Pick<User, "displayCurrency" | "theme">>): Promise<void>;
  // 遞增 token 版本並回傳新值（單一登入用）。
  bumpTokenVersion(id: number): Promise<number>;
}

export interface RecordRepo {
  findById(id: number): Promise<Record | undefined>;
  listByUser(userId: number): Promise<Record[]>;
  insert(r: Omit<Record, "id">): Promise<Record>;
  update(id: number, patch: Partial<Omit<Record, "id" | "userId">>): Promise<void>;
  remove(id: number): Promise<void>;
}

export interface Budget {
  id: number;
  userId: number;
  period: string; // monthly | yearly
  limitAmount: number; // 最小單位(分)
  currency: string;
}

export interface BudgetRepo {
  listByUser(userId: number): Promise<Budget[]>;
  insert(b: Omit<Budget, "id">): Promise<Budget>;
  // 設定某用戶某週期的預算（存在則更新，否則新增）。
  upsert(b: Omit<Budget, "id">): Promise<void>;
}

// 匯率以 USD 為基準：rateMicro = 「1 USD 等於多少該幣」× 1e6。USD 自身為 1e6。
export interface RateRepo {
  // 回傳 quote -> rateMicro 的對照表（最新一批）。
  getMap(): Promise<Map<string, number>>;
  latestDate(): Promise<string | null>;
  upsertMany(date: string, entries: { quote: string; rateMicro: number }[]): Promise<void>;
}

// 每用戶的可熱重載參數（通知開關、冷卻等），key/value 形式。
export interface SettingsRepo {
  getAll(userId: number): Promise<Map<string, string>>;
  set(userId: number, key: string, value: string): Promise<void>;
}

export interface Repositories {
  users: UserRepo;
  records: RecordRepo;
  budgets: BudgetRepo;
  rates: RateRepo;
  settings: SettingsRepo;
}
