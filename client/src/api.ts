// 客戶端 API 封裝：所有伺服器請求集中於此，自動帶上認證 token。
import { authHeader, clearSession, setSession, type PublicUser } from "./auth";

export interface RecordDto {
  id: number;
  name: string;
  type: string;
  amount: number;
  currency: string;
  displayAmount: number; // 換算為顯示貨幣後的金額
  displayCurrency: string;
  note: string | null;
  createdAt: number;
}

export interface OverviewStatus {
  level: "ok" | "warn" | "bad" | "none";
  message: string;
  currency: string;
  spent: number;
  budget: number | null;
  details: { label: string; text: string }[];
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  // 只有帶 body 時才設 JSON content-type；否則像 DELETE 空 body 會被 Fastify 視為錯誤。
  const headers: Record<string, string> = { ...authHeader(), ...(init.headers as Record<string, string> ?? {}) };
  if (init.body != null) headers["content-type"] = "application/json";
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    clearSession(); // token 失效 → 回登入畫面
    throw new Error("未授權，請重新登入");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string })?.error ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  register: async (username: string, password: string) => {
    const r = await request<{ token: string; user: PublicUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setSession(r.token, r.user);
    return r.user;
  },

  login: async (username: string, password: string) => {
    const r = await request<{ token: string; user: PublicUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setSession(r.token, r.user);
    return r.user;
  },

  me: () => request<PublicUser>("/api/auth/me"),

  listRecords: (filter?: { period?: string; type?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (filter?.period) q.set("period", filter.period);
    if (filter?.type) q.set("type", filter.type);
    if (filter?.limit) q.set("limit", String(filter.limit));
    const qs = q.toString();
    return request<RecordDto[]>(`/api/records${qs ? `?${qs}` : ""}`);
  },

  createRecord: (body: { name: string; type: string; amount: number; currency: string; note?: string | null }) =>
    request<RecordDto>("/api/records", { method: "POST", body: JSON.stringify(body) }),

  updateRecord: (id: number, patch: Partial<RecordDto>) =>
    request<void>(`/api/records/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  deleteRecord: (id: number) => request<void>(`/api/records/${id}`, { method: "DELETE" }),

  overviewStatus: () => request<OverviewStatus>("/api/overview/status"),

  overviewBreakdown: (period: string) =>
    request<Breakdown>(`/api/overview/breakdown?period=${encodeURIComponent(period)}`),

  overviewProjected: () => request<Projected>("/api/overview/projected"),

  getSettings: () => request<Settings>("/api/settings"),

  updateUserSettings: (patch: { displayCurrency?: string; theme?: string }) =>
    request<void>("/api/settings/user", { method: "PATCH", body: JSON.stringify(patch) }),

  setBudget: (monthly: number, currency: string) =>
    request<void>("/api/settings/budget", { method: "PUT", body: JSON.stringify({ monthly, currency }) }),

  updateNotifications: (patch: { enabled?: boolean; cooldownMin?: number }) =>
    request<void>("/api/settings/notifications", { method: "PATCH", body: JSON.stringify(patch) }),
};

export interface Settings {
  displayCurrency: string;
  theme: string;
  monthlyBudget: number | null;
  notificationsEnabled: boolean;
  notifyCooldownMin: number;
}

export interface Breakdown {
  currency: string;
  total: number;
  items: { type: string; amount: number }[];
}

export interface Projected {
  currency: string;
  total: number;
  items: { name: string; amount: number }[];
}
