import type { FastifyInstance } from "fastify";
import { repos } from "../repositories/index.js";

// 設定頁：讀取/更新顯示貨幣、主題、月預算。全部需登入。
export async function settingsRoutes(app: FastifyInstance) {
  const auth = { preHandler: app.authenticate };

  app.get("/api/settings", auth, async (req, reply) => {
    const user = await repos.users.findById(req.user.id);
    if (!user) return reply.code(404).send({ error: "用戶不存在" });
    const budgets = await repos.budgets.listByUser(user.id);
    const monthly = budgets.find((b) => b.period === "monthly");
    const kv = await repos.settings.getAll(user.id);
    return {
      displayCurrency: user.displayCurrency,
      theme: user.theme,
      monthlyBudget: monthly ? monthly.limitAmount / 100 : null,
      notificationsEnabled: kv.get("notificationsEnabled") === "true",
      notifyCooldownMin: Number(kv.get("notifyCooldownMin") ?? "60"),
    };
  });

  // 通知偏好：開關 + 冷卻（分鐘）。可隨時重讀（熱重載）。
  app.patch("/api/settings/notifications", auth, async (req, reply) => {
    const b = req.body as { enabled?: boolean; cooldownMin?: number };
    if (b.enabled !== undefined) {
      await repos.settings.set(req.user.id, "notificationsEnabled", b.enabled ? "true" : "false");
    }
    if (b.cooldownMin !== undefined) {
      if (typeof b.cooldownMin !== "number" || b.cooldownMin < 0) {
        return reply.code(400).send({ error: "冷卻時間無效" });
      }
      await repos.settings.set(req.user.id, "notifyCooldownMin", String(Math.round(b.cooldownMin)));
    }
    return reply.code(204).send();
  });

  app.patch("/api/settings/user", auth, async (req, reply) => {
    const b = req.body as { displayCurrency?: string; theme?: string };
    const patch: { displayCurrency?: string; theme?: string } = {};
    if (b.displayCurrency !== undefined) {
      if (!b.displayCurrency.trim()) return reply.code(400).send({ error: "貨幣無效" });
      patch.displayCurrency = b.displayCurrency.trim().toUpperCase();
    }
    if (b.theme !== undefined) {
      if (!b.theme.trim()) return reply.code(400).send({ error: "主題無效" });
      patch.theme = b.theme.trim();
    }
    await repos.users.update(req.user.id, patch);
    return reply.code(204).send();
  });

  app.put("/api/settings/budget", auth, async (req, reply) => {
    const b = req.body as { monthly: number; currency: string };
    if (typeof b.monthly !== "number" || !isFinite(b.monthly) || b.monthly < 0) {
      return reply.code(400).send({ error: "預算無效" });
    }
    if (!b.currency?.trim()) return reply.code(400).send({ error: "貨幣必填" });
    await repos.budgets.upsert({
      userId: req.user.id,
      period: "monthly",
      limitAmount: Math.round(b.monthly * 100),
      currency: b.currency.trim().toUpperCase(),
    });
    return reply.code(204).send();
  });
}
