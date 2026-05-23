import type { FastifyInstance } from "fastify";
import { repos } from "../repositories/index.js";
import { hashPassword, verifyPassword } from "../services/auth.js";
import { seedDefaultBudget } from "../services/bootstrap.js";

interface Credentials {
  username: string;
  password: string;
}

function validate(b: Partial<Credentials>): string | null {
  if (!b.username?.trim() || b.username.trim().length < 3) return "用戶名至少 3 字";
  if (!b.password || b.password.length < 6) return "密碼至少 6 字";
  return null;
}

export async function authRoutes(app: FastifyInstance) {
  // 防爆破：限制憑證端點的嘗試頻率（依來源 IP）。
  const loginLimit = { config: { rateLimit: { max: 8, timeWindow: "5 minutes" } } };
  const registerLimit = { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } };

  app.post("/api/auth/register", registerLimit, async (req, reply) => {
    const b = req.body as Credentials;
    const err = validate(b);
    if (err) return reply.code(400).send({ error: err });

    const username = b.username.trim();
    if (await repos.users.findByUsername(username)) {
      return reply.code(409).send({ error: "用戶名已存在" });
    }

    const user = await repos.users.insert({
      username,
      passwordHash: await hashPassword(b.password),
      displayCurrency: "HKD",
      theme: "sakura",
      tokenVersion: 0,
      createdAt: Date.now(),
    });
    await seedDefaultBudget(user.id, user.displayCurrency);

    const token = app.jwt.sign({ id: user.id, username: user.username, tv: user.tokenVersion });
    return reply.code(201).send({ token, user: publicUser(user) });
  });

  app.post("/api/auth/login", loginLimit, async (req, reply) => {
    const b = req.body as Credentials;
    if (!b?.username || !b?.password) return reply.code(400).send({ error: "缺少憑證" });

    const user = await repos.users.findByUsername(b.username.trim());
    // 用固定錯誤訊息，避免洩漏帳號是否存在。
    const ok = user && (await verifyPassword(user.passwordHash, b.password));
    if (!user || !ok) return reply.code(401).send({ error: "用戶名或密碼錯誤" });

    // 單一登入：每次登入遞增版本，讓其他裝置上的舊 token 失效。
    const tv = await repos.users.bumpTokenVersion(user.id);
    const token = app.jwt.sign({ id: user.id, username: user.username, tv });
    return reply.send({ token, user: publicUser(user) });
  });

  // 取得目前登入者（需 token）
  app.get("/api/auth/me", { preHandler: app.authenticate }, async (req) => {
    const u = await repos.users.findById(req.user.id);
    return u ? publicUser(u) : null;
  });
}

function publicUser(u: { id: number; username: string; displayCurrency: string; theme: string }) {
  return { id: u.id, username: u.username, displayCurrency: u.displayCurrency, theme: u.theme };
}
