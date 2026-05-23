import type { FastifyInstance } from "fastify";

// 伺服器下發的介面配置：客戶端據此動態組裝分頁與排版。
// 改功能 / 調權限 / 換排版只改這裡，不必重發前端。
export const uiConfig = {
  tabs: [
    { id: "overview", label: "概覽", module: "overview", order: 1 },
    { id: "records", label: "記錄", module: "records", order: 2 },
  ],
  layout: {
    records: { left: "list", right: "editor", ratio: [3, 1] },
  },
  features: {
    notifications: false,
    multiCurrency: true,
  },
};

export async function uiConfigRoutes(app: FastifyInstance) {
  app.get("/api/ui-config", async () => uiConfig);
}
