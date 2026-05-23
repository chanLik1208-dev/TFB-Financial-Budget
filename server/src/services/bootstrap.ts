import { repos } from "../repositories/index.js";

// 新用戶註冊後給一筆預設月預算，讓概覽指示器一開始就有依據。
// 之後可在設定頁讓用戶調整。
export async function seedDefaultBudget(userId: number, currency: string) {
  const existing = await repos.budgets.listByUser(userId);
  if (existing.length === 0) {
    await repos.budgets.insert({
      userId,
      period: "monthly",
      limitAmount: 500000, // 5,000（分）
      currency,
    });
  }
}
