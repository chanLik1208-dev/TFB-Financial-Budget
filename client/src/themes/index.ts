// 主題以 token 設定驅動，注入為 CSS 變數。
// 新增主題只在此加一筆，元件永不寫死色碼。

export type ThemeToken = {
  primary: string;
  accent: string;
  glassBg: string;
  text: string;
  muted: string;
  // 狀態色（財務健康指示器）
  ok: string;
  warn: string;
  bad: string;
  // 結構 token
  radius: string;
  blur: string;
};

export const themes: Record<string, ThemeToken> = {
  sakura: {
    primary: "#D6519E", accent: "#B57EDC", glassBg: "rgba(255,255,255,.42)",
    text: "#2a1d33", muted: "#6b5c75",
    ok: "#2E9E63", warn: "#B8860B", bad: "#C0392B",
    radius: "20px", blur: "14px",
  },
  violet: {
    primary: "#B98AF0", accent: "#C9A7F0", glassBg: "rgba(28,16,42,.5)",
    text: "#f6eeff", muted: "#c9bcd9",
    ok: "#5BC98C", warn: "#E8C15B", bad: "#F08585",
    radius: "20px", blur: "16px",
  },
};

export type ThemeName = keyof typeof themes;

export function applyTheme(name: string) {
  const t = themes[name] ?? themes.sakura;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t)) {
    root.style.setProperty(`--c-${k}`, v);
  }
}
