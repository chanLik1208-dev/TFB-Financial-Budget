import { ref } from "vue";

// 認證狀態：token 存 localStorage，跨重啟保持登入。
export interface PublicUser {
  id: number;
  username: string;
  displayCurrency: string;
  theme: string;
}

const TOKEN_KEY = "fm_token";

export const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
export const user = ref<PublicUser | null>(null);

export function setSession(t: string, u: PublicUser) {
  token.value = t;
  user.value = u;
  localStorage.setItem(TOKEN_KEY, t);
}

export function clearSession() {
  token.value = null;
  user.value = null;
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeader(): Record<string, string> {
  return token.value ? { authorization: `Bearer ${token.value}` } : {};
}
