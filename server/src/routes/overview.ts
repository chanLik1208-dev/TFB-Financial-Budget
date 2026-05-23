import type { FastifyInstance } from "fastify";
import { repos } from "../repositories/index.js";
import { computeStatus } from "../services/overview.js";
import { computeBreakdown } from "../services/breakdown.js";
import { computeProjected } from "../services/projected.js";
import { makeConverter } from "../services/rates.js";
import { isPeriodKey, periodRange } from "../services/period.js";

export async function overviewRoutes(app: FastifyInstance) {
  const auth = { preHandler: app.authenticate };

  // 目前財政健康（以本月為準），供指示器使用。
  app.get("/api/overview/status", auth, async (req, reply) => {
    const userId = req.user.id;
    const [user, records, budgets, rateMap] = await Promise.all([
      repos.users.findById(userId),
      repos.records.listByUser(userId),
      repos.budgets.listByUser(userId),
      repos.rates.getMap(),
    ]);
    if (!user) return reply.code(404).send({ error: "用戶不存在" });
    const monthly = budgets.find((b) => b.period === "monthly");
    return computeStatus(records, monthly, user.displayCurrency, makeConverter(rateMap));
  });

  // 指定區間的類別彙總，供圓形圖使用。
  app.get("/api/overview/breakdown", auth, async (req, reply) => {
    const q = (req.query as { period?: string }).period ?? "this-month";
    if (!isPeriodKey(q)) return reply.code(400).send({ error: "無效的區間" });
    const userId = req.user.id;
    const [user, records, rateMap] = await Promise.all([
      repos.users.findById(userId),
      repos.records.listByUser(userId),
      repos.rates.getMap(),
    ]);
    if (!user) return reply.code(404).send({ error: "用戶不存在" });
    return computeBreakdown(records, periodRange(q), user.displayCurrency, makeConverter(rateMap));
  });

  // 預計下月訂閱開支。
  app.get("/api/overview/projected", auth, async (req, reply) => {
    const [user, records, rateMap] = await Promise.all([
      repos.users.findById(req.user.id),
      repos.records.listByUser(req.user.id),
      repos.rates.getMap(),
    ]);
    if (!user) return reply.code(404).send({ error: "用戶不存在" });
    return computeProjected(records, user.displayCurrency, makeConverter(rateMap));
  });
}
