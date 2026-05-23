import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";
import { repos } from "../repositories/index.js";

// JWT 認證外掛：簽發/驗證 token，並提供 authenticate preHandler 守門。
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: number; username: string; tv: number };
    user: { id: number; username: string; tv: number };
  }
}

export default fp(async (app) => {
  await app.register(jwt, {
    // 正式環境必須用環境變數提供高熵密鑰。
    secret: process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-me",
  });

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: "未授權" });
    }
    // 單一登入：token 版本須與用戶當前版本相符，否則視為已被新登入取代。
    const user = await repos.users.findById(req.user.id);
    if (!user || user.tokenVersion !== req.user.tv) {
      return reply.code(401).send({ error: "工作階段已失效（可能已在其他裝置登入）" });
    }
  });
});
