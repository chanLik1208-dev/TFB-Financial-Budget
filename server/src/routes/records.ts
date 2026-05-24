import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { repos } from "../repositories/index.js";
import type { Record } from "../repositories/types.js";
import { isPeriodKey, periodRange } from "../services/period.js";
import { makeConverter } from "../services/rates.js";

type Convert = (cents: number, from: string, to: string) => number;

// API 以「主單位金額」(如 58.5) 收發；DB 內一律存最小單位(分)。
// 一律附上換算為顯示貨幣的金額，前端可同時顯示「顯示貨幣 (原金額)」。
const toDto = (r: Record, displayCurrency: string, convert: Convert) => ({
  id: r.id,
  name: r.name,
  type: r.type,
  amount: r.amount / 100,
  currency: r.currency,
  displayAmount: convert(r.amount, r.currency, displayCurrency) / 100,
  displayCurrency,
  note: r.note,
  interval: r.interval,
  restriction: r.restriction,
  createdAt: r.createdAt,
});

interface Body {
  name: string;
  type: string;
  amount: number;
  currency: string;
  note?: string | null;
  interval?: string | null;
  restriction?: string | null;
}

function validate(b: Partial<Body>): string | null {
  if (!b.name?.trim()) return "name 必填";
  if (!b.type?.trim()) return "type 必填";
  if (typeof b.amount !== "number" || !isFinite(b.amount) || b.amount < 0) return "amount 無效";
  if (!b.currency?.trim()) return "currency 必填";
  if (b.interval !== undefined && b.interval !== null && !["monthly", "yearly", "weekly", "daily"].includes(b.interval)) return "interval 無效";
  if (b.restriction !== undefined && b.restriction !== null && !["workdays", "weekends"].includes(b.restriction)) return "restriction 無效";
  return null;
}

// 確認記錄存在且屬於目前用戶，否則回 404（不洩漏他人記錄是否存在）。
async function ownedRecord(req: FastifyRequest, reply: FastifyReply): Promise<Record | null> {
  const id = Number((req.params as { id: string }).id);
  const rec = await repos.records.findById(id);
  if (!rec || rec.userId !== req.user.id) {
    reply.code(404).send({ error: "找不到記錄" });
    return null;
  }
  return rec;
}

export async function recordRoutes(app: FastifyInstance) {
  // 所有記錄路由都需登入；userId 取自驗證後的 token。
  const auth = { preHandler: app.authenticate };

  app.get("/api/records", auth, async (req, reply) => {
    const { period, type, limit } = req.query as { period?: string; type?: string; limit?: string };
    const [user, rateMap] = await Promise.all([
      repos.users.findById(req.user.id),
      repos.rates.getMap(),
    ]);
    if (!user) return reply.code(404).send({ error: "用戶不存在" });
    const convert = makeConverter(rateMap);

    let rows = await repos.records.listByUser(req.user.id);
    if (period && period !== "all") {
      if (!isPeriodKey(period)) return reply.code(400).send({ error: "無效的區間" });
      const { start, end } = periodRange(period);
      rows = rows.filter((r) => r.createdAt >= start && r.createdAt < end);
    }
    if (type) rows = rows.filter((r) => r.type === type);
    rows.sort((a, b) => b.createdAt - a.createdAt); // 最新在前
    if (limit !== undefined) {
      const n = Number(limit);
      if (Number.isInteger(n) && n > 0) rows = rows.slice(0, n);
    }
    return rows.map((r) => toDto(r, user.displayCurrency, convert));
  });

  app.post("/api/records", auth, async (req, reply) => {
    const b = req.body as Body;
    const err = validate(b);
    if (err) return reply.code(400).send({ error: err });
    const [user, rateMap] = await Promise.all([
      repos.users.findById(req.user.id),
      repos.rates.getMap(),
    ]);
    if (!user) return reply.code(404).send({ error: "用戶不存在" });
    const created = await repos.records.insert({
      userId: req.user.id,
      name: b.name.trim(),
      type: b.type.trim(),
      amount: Math.round(b.amount * 100),
      currency: b.currency.trim(),
      note: b.note?.trim() || null,
      interval: ["服務(訂閱)", "交通", "飲食"].includes(b.type.trim()) ? (b.interval ?? "monthly") : null,
      restriction: ["交通", "飲食"].includes(b.type.trim()) ? (b.restriction ?? null) : null,
      createdAt: Date.now(),
    });
    return reply.code(201).send(toDto(created, user.displayCurrency, makeConverter(rateMap)));
  });

  app.patch("/api/records/:id", auth, async (req, reply) => {
    const rec = await ownedRecord(req, reply);
    if (!rec) return;
    const b = req.body as Partial<Body>;
    const patch: RecordPatch = {};
    if (b.name !== undefined) patch.name = b.name.trim();
    if (b.type !== undefined) patch.type = b.type.trim();
    if (b.amount !== undefined) {
      if (typeof b.amount !== "number" || b.amount < 0) return reply.code(400).send({ error: "amount 無效" });
      patch.amount = Math.round(b.amount * 100);
    }
    if (b.currency !== undefined) patch.currency = b.currency.trim();
    if (b.note !== undefined) patch.note = b.note?.trim() || null;
    const t = (b.type ?? rec.type).trim();
    if (b.interval !== undefined) patch.interval = ["服務(訂閱)", "交通", "飲食"].includes(t) ? (b.interval ?? "monthly") : null;
    if (b.restriction !== undefined) patch.restriction = ["交通", "飲食"].includes(t) ? (b.restriction ?? null) : null;
    await repos.records.update(rec.id, patch);
    return reply.code(204).send();
  });

  app.delete("/api/records/:id", auth, async (req, reply) => {
    const rec = await ownedRecord(req, reply);
    if (!rec) return;
    await repos.records.remove(rec.id);
    return reply.code(204).send();
  });
}

type RecordPatch = Partial<Omit<Record, "id" | "userId">>;
