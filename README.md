# TFB — 財政管理器（Financial Budget）

控制及方便管理財政（儲備與消耗）、快速檢查財政損耗的多用戶工具。Web / PWA，支持桌面與行動裝置、多貨幣、每日匯率與預算提醒。

## 功能

- **多用戶登入**：argon2id 密碼哈希、JWT 工作階段。
- **單一登入**：每次登入使其他裝置上的舊 token 失效。
- **防爆破**：登入／註冊端點 IP 限流。
- **記錄管理**：消費記錄寫入／改寫／刪除，類別、備注、多貨幣；依區間與類別篩選。
- **概覽**：財務健康指示器（圓形燈號，可點擊展開明細）、ECharts 動畫圓形圖、年份區間切換、近期記錄、預計下月訂閱開支。
- **多貨幣匯率**：每日自動抓取（USD 基準），所有金額換算為使用者顯示貨幣；離線時用最後快取／fallback。
- **設定**：顯示貨幣、主題色（模組化 token，可擴充）、月預算、通知開關與冷卻。
- **通知**：僅在設定開啟時才請求瀏覽器權限；接近／超出預算時提醒，附冷卻避免重複。
- **PWA**：可安裝、離線快取。

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Vue 3 + Vite + TypeScript + PWA + ECharts |
| 後端 | Node.js + Fastify + TypeScript |
| 資料庫 | libSQL（SQLite 相容）+ drizzle ORM |
| 認證 | @fastify/jwt + @node-rs/argon2 |
| 限流 | @fastify/rate-limit |
| 排程 | node-cron（每日匯率更新） |

> 資料層以 Repository 介面封裝，預留遷移 PostgreSQL 的路徑（只需替換 `db/client.ts` 與各 `*Repo` 實作）。

## 專案結構

```
.
├─ server/   Fastify API（db / repositories / routes / services / plugins）
├─ client/   Vue 3 PWA（modules / components / layouts / themes）
├─ Caddyfile 反向代理 + 自動 HTTPS（部署用）
└─ package.json  npm workspaces
```

## 開發

需求：Node.js 20+（建議 24）。

```bash
npm install

# 初始化資料庫（產生並套用遷移）
npm run db:generate --workspace server
npm run db:migrate  --workspace server

# 啟動（兩個終端）
npm run dev:server   # 後端 http://127.0.0.1:3000
npm run dev:client   # 前端 http://localhost:5173
```

開瀏覽器至 **http://localhost:5173**（前端）。後端僅提供 `/api/*`，前端開發時由 Vite 代理轉發。

## 建置

```bash
npm run build   # 同時建置 server 與 client（含型別檢查）
```

## 環境變數（後端）

| 變數 | 說明 | 預設 |
|---|---|---|
| `PORT` | API 監聽埠 | `3000` |
| `DB_FILE` | libSQL 資料庫檔路徑 | `./data/finance.sqlite` |
| `JWT_SECRET` | JWT 簽章密鑰（**正式環境務必設定高熵值**） | 開發用預設值 |

## 部署

由反向代理（Caddy）終止 TLS、自動申請與續期 Let's Encrypt 憑證；Node 應用只監聽內部 HTTP。見 `Caddyfile`，把網域改成實際值即可。

## 授權

本專案採用 [MIT License](./LICENSE) 開源。
