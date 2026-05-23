import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import authPlugin from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { uiConfigRoutes } from "./routes/uiConfig.js";
import { authRoutes } from "./routes/auth.js";
import { recordRoutes } from "./routes/records.js";
import { overviewRoutes } from "./routes/overview.js";
import { settingsRoutes } from "./routes/settings.js";
import { startScheduler } from "./services/scheduler.js";

const app = Fastify({ logger: true });

// 只監聽內部 HTTP；TLS 由前面的反向代理(Caddy)終止。
await app.register(cors, { origin: true });
// 限流預設關閉，只有明確開啟的路由（如登入）才套用，用於防爆破。
await app.register(rateLimit, { global: false });
await app.register(authPlugin); // 提供 app.jwt 與 app.authenticate
await app.register(healthRoutes);
await app.register(uiConfigRoutes);
await app.register(authRoutes);
await app.register(recordRoutes);
await app.register(overviewRoutes);
await app.register(settingsRoutes);

await startScheduler(); // 確保匯率可用 + 排程每日更新

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "127.0.0.1" });
