# TFB Financial Budget — API 文件

## 目錄

- [基本說明](#基本說明)
- [認證](#認證)
- [記錄](#記錄)
- [概覽](#概覽)
- [設定](#設定)
- [其他](#其他)
- [附錄](#附錄)

---

## 基本說明

**Base URL**
```
http://localhost:3000   （本機開發）
```

**認證方式**

除少數公開端點外，所有 API 都需要在 Header 帶上 JWT Token：

```
Authorization: Bearer <token>
```

Token 由登入或註冊時取得。本系統採**單一裝置登入**，每次登入都會讓舊 Token 失效。

**統一錯誤格式**

```json
{ "error": "錯誤描述" }
```

| 狀態碼 | 意義 |
|--------|------|
| `400` | 欄位驗證失敗 |
| `401` | Token 遺失或已失效 |
| `404` | 資源不存在，或不屬於目前用戶 |
| `409` | 衝突（如：用戶名已被使用） |
| `429` | 請求過於頻繁，已被限速 |

---

## 認證

### 註冊

```
POST /api/auth/register
```

> 限速：每個 IP 10 分鐘內最多 5 次

**Request Body**

```json
{
  "username": "alice",
  "password": "secret123"
}
```

| 欄位 | 說明 |
|------|------|
| `username` | 至少 3 個字，不可重複 |
| `password` | 至少 6 個字 |

**成功回應** `201 Created`

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "username": "alice",
    "displayCurrency": "HKD",
    "theme": "sakura"
  }
}
```

---

### 登入

```
POST /api/auth/login
```

> 限速：每個 IP 5 分鐘內最多 8 次

**Request Body**

```json
{
  "username": "alice",
  "password": "secret123"
}
```

**成功回應** `200 OK`

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "username": "alice",
    "displayCurrency": "HKD",
    "theme": "sakura"
  }
}
```

---

### 取得目前用戶 🔒

```
GET /api/auth/me
```

**成功回應** `200 OK`

```json
{
  "id": 1,
  "username": "alice",
  "displayCurrency": "HKD",
  "theme": "sakura"
}
```

---

## 記錄

### 取得記錄列表 🔒

```
GET /api/records
```

**Query 參數**

| 參數 | 類型 | 可選值 | 預設 |
|------|------|--------|------|
| `period` | string | `all` `this-month` `last-month` `last-3m` `last-6m` `this-year` `last-year` | `all` |
| `type` | string | `普通消費` `飲食` `交通` `服務(訂閱)` | 全部 |
| `limit` | number | 正整數 | 不限 |

結果由新到舊排序。

**成功回應** `200 OK`

```json
[
  {
    "id": 1,
    "name": "MTR",
    "type": "交通",
    "amount": 27.00,
    "currency": "HKD",
    "displayAmount": 27.00,
    "displayCurrency": "HKD",
    "note": null,
    "interval": "daily",
    "restriction": "workdays",
    "createdAt": 1748131200000
  }
]
```

| 欄位 | 說明 |
|------|------|
| `amount` / `currency` | 記錄時填寫的原始金額與幣別 |
| `displayAmount` / `displayCurrency` | 換算為用戶顯示幣別後的金額 |
| `interval` | 重複週期，見下方說明 |
| `restriction` | 日期限制，見下方說明 |
| `createdAt` | Unix 毫秒時間戳 |

> ⚠️ `amount` 為**單次金額**，不會在列表中被乘算。乘算只發生在概覽的支出統計與預估中。

---

### 新增記錄 🔒

```
POST /api/records
```

**Request Body**

```json
{
  "name": "MTR",
  "type": "交通",
  "amount": 27.00,
  "currency": "HKD",
  "note": "上班用",
  "interval": "daily",
  "restriction": "workdays"
}
```

| 欄位 | 必填 | 說明 |
|------|------|------|
| `name` | ✓ | 名稱 |
| `type` | ✓ | `普通消費` `飲食` `交通` `服務(訂閱)` |
| `amount` | ✓ | 非負數 |
| `currency` | ✓ | 幣別代碼，如 `HKD` `TWD` `USD` |
| `note` | | 備注，可為 `null` |
| `interval` | | 重複週期（見附錄） |
| `restriction` | | 日期限制（見附錄） |

**成功回應** `201 Created` — 回傳新建的記錄物件（格式同列表項目）

---

### 更新記錄 🔒

```
PATCH /api/records/:id
```

所有欄位皆可選，只傳要更改的欄位即可。欄位定義與新增相同。

**成功回應** `204 No Content`

---

### 刪除記錄 🔒

```
DELETE /api/records/:id
```

**成功回應** `204 No Content`

---

## 概覽

> **關於每日/每週展開：** 類型為 `交通` 或 `飲食`、週期為 `daily` 或 `weekly` 的記錄，在概覽的支出統計中會被**虛擬展開**——金額乘以本月已過的符合天數。例如每天 HKD 27 限工作日，若本月已過 17 個工作日，概覽顯示 HKD 459。

### 本月財務狀態 🔒

```
GET /api/overview/status
```

**成功回應** `200 OK`

```json
{
  "level": "ok",
  "message": "財政穩健，本月仍有餘裕",
  "currency": "HKD",
  "spent": 459.00,
  "budget": 500.00,
  "details": [
    { "label": "交通", "text": "HKD 459.00" },
    { "label": "本月餘裕", "text": "HKD 41.00" }
  ]
}
```

| `level` | 條件 |
|---------|------|
| `ok` | 支出 < 預算 70% |
| `warn` | 支出 ≥ 預算 70% |
| `bad` | 支出超出預算 |
| `none` | 尚未設定預算 |

---

### 分類支出統計 🔒

```
GET /api/overview/breakdown?period=this-month
```

**Query 參數**

| 參數 | 預設 | 可選值 |
|------|------|--------|
| `period` | `this-month` | 同記錄列表的 period 參數 |

**成功回應** `200 OK`

```json
{
  "currency": "HKD",
  "total": 459.00,
  "items": [
    { "type": "交通", "amount": 459.00 }
  ]
}
```

`items` 按金額由高到低排序。

---

### 下月預估支出 🔒

```
GET /api/overview/projected
```

根據本月的重複性記錄，估算下個月的總開支。

**計算規則**

| 類型 | 週期 | 計算方式 |
|------|------|---------|
| 服務(訂閱) | `monthly` | 每月計入一次 |
| 服務(訂閱) | `yearly` | 僅在週年所在月計入 |
| 交通 / 飲食 | `monthly` | 每月計入一次 |
| 交通 / 飲食 | `weekly` | 金額 × （下月符合天數 ÷ 7） |
| 交通 / 飲食 | `daily` | 金額 × 下月符合天數 |

`restriction` 為 `workdays` 時只計週一至週五，`weekends` 只計週六日，`null` 計所有日。

**成功回應** `200 OK`

```json
{
  "currency": "HKD",
  "total": 594.00,
  "items": [
    { "name": "MTR", "amount": 594.00 }
  ]
}
```

`items` 按金額由高到低排序。

---

## 設定

### 取得所有設定 🔒

```
GET /api/settings
```

**成功回應** `200 OK`

```json
{
  "displayCurrency": "HKD",
  "theme": "sakura",
  "monthlyBudget": 500.00,
  "budgetCurrency": "HKD",
  "notificationsEnabled": false,
  "notifyCooldownMin": 60
}
```

> `monthlyBudget` 和 `budgetCurrency` 未設定時為 `null`。

---

### 更新用戶偏好 🔒

```
PATCH /api/settings/user
```

**Request Body**（欄位皆可選）

```json
{
  "displayCurrency": "TWD",
  "theme": "violet"
}
```

**成功回應** `204 No Content`

---

### 設定月預算 🔒

```
PUT /api/settings/budget
```

預算幣別可與顯示幣別不同，系統會自動換算比較。

**Request Body**

```json
{
  "monthly": 15000,
  "currency": "TWD"
}
```

| 欄位 | 說明 |
|------|------|
| `monthly` | 預算金額，非負數 |
| `currency` | 預算幣別 |

**成功回應** `204 No Content`

---

### 更新通知設定 🔒

```
PATCH /api/settings/notifications
```

**Request Body**（欄位皆可選）

```json
{
  "enabled": true,
  "cooldownMin": 30
}
```

| 欄位 | 說明 |
|------|------|
| `enabled` | 是否啟用通知 |
| `cooldownMin` | 通知冷卻時間（分鐘），非負整數 |

**成功回應** `204 No Content`

---

## 其他

### 健康檢查

```
GET /api/health
```

無需認證。

**成功回應** `200 OK`

```json
{ "status": "ok", "time": 1748131200000 }
```

---

### 介面配置

```
GET /api/ui-config
```

無需認證。伺服器下發的 UI 配置，前端據此動態組裝分頁與排版。

**成功回應** `200 OK`

```json
{
  "tabs": [
    { "id": "overview", "label": "概覽", "module": "overview", "order": 1 },
    { "id": "records",  "label": "記錄",  "module": "records",  "order": 2 }
  ],
  "layout": {
    "records": { "left": "list", "right": "editor", "ratio": [3, 1] }
  },
  "features": {
    "notifications": false,
    "multiCurrency": true
  }
}
```

---

## 附錄

### `interval` 欄位可選值

| 值 | 適用類型 | 說明 |
|----|---------|------|
| `monthly` | 所有重複類型 | 每月一次 |
| `yearly` | 服務(訂閱) | 每年一次（按建立日期週年計算） |
| `weekly` | 交通、飲食 | 每週一次 |
| `daily` | 交通、飲食 | 每天一次 |

### `restriction` 欄位可選值

| 值 | 說明 |
|----|------|
| `null` | 不限，所有日期皆計算 |
| `workdays` | 僅限工作日（週一至週五） |
| `weekends` | 僅限週末（週六、週日） |

### 記錄類型一覽

| 類型 | 支援 interval | 支援 restriction |
|------|:---:|:---:|
| `普通消費` | ✗ | ✗ |
| `飲食` | ✓ | ✓ |
| `交通` | ✓ | ✓ |
| `服務(訂閱)` | ✓（限 monthly / yearly） | ✗ |

### 匯率說明

- 匯率以 USD 為基準，每日凌晨 02:00 自動從 [open.er-api.com](https://open.er-api.com) 更新
- 離線時使用最後快取的匯率
- 首次啟動且無法連線時，使用內建靜態匯率（HKD 7.8、TWD 32 等）
