type ThemeVars = Record<string, string>;

export const themes: Record<string, { label: string; swatch: string; vars: ThemeVars }> = {
  default: {
    label: "Default",
    swatch: "#00ACD7",
    vars: {},
  },
  sakura: {
    label: "Sakura",
    swatch: "#D6519E",
    vars: {
      "--accent":        "#D6519E",
      "--accent-2":      "#B57EDC",
      "--accent-glow":   "rgba(214, 81, 158, 0.35)",
      "--accent-subtle": "rgba(214, 81, 158, 0.13)",
      "--accent-border": "rgba(214, 81, 158, 0.40)",
      "--wp-start": "#f9e4f0",
      "--wp-mid":   "#fce8f4",
      "--wp-end":   "#fff0f8",
      "--t-primary":   "rgba(42, 29, 51, 0.90)",
      "--t-secondary": "rgba(107, 92, 117, 0.85)",
      "--t-tertiary":  "rgba(107, 92, 117, 0.50)",
      "--glass-bg":       "rgba(255, 255, 255, 0.45)",
      "--glass-bg-hover": "rgba(255, 255, 255, 0.62)",
      "--glass-bg-input": "rgba(255, 255, 255, 0.58)",
      "--glass-border":   "rgba(214, 81, 158, 0.22)",
    },
  },
  violet: {
    label: "Violet",
    swatch: "#B98AF0",
    vars: {
      "--accent":        "#8B5CF6",
      "--accent-2":      "#A78BFA",
      "--accent-glow":   "rgba(139, 92, 246, 0.30)",
      "--accent-subtle": "rgba(139, 92, 246, 0.10)",
      "--accent-border": "rgba(139, 92, 246, 0.35)",
      "--wp-start": "#f3eeff",
      "--wp-mid":   "#f5f0ff",
      "--wp-end":   "#faf7ff",
      "--glass-bg":        "rgba(255, 255, 255, 0.48)",
      "--glass-bg-hover":  "rgba(255, 255, 255, 0.65)",
      "--glass-bg-active": "rgba(255, 255, 255, 0.78)",
      "--glass-bg-input":  "rgba(255, 255, 255, 0.60)",
      "--glass-border":      "rgba(139, 92, 246, 0.20)",
      "--glass-border-soft": "rgba(139, 92, 246, 0.10)",
      "--t-primary":   "rgba(36, 20, 60, 0.90)",
      "--t-secondary": "rgba(90, 72, 120, 0.80)",
      "--t-tertiary":  "rgba(90, 72, 120, 0.45)",
      "--t-inverse":   "rgba(255, 255, 255, 0.92)",
    },
  },
};

const BASE_VARS = Object.keys(themes.sakura.vars).concat(Object.keys(themes.violet.vars));
const ALL_VARS = [...new Set(BASE_VARS)];

export function applyTheme(name: string) {
  const theme = themes[name] ?? themes.default;
  const root = document.documentElement;
  // Clear any previously applied overrides first
  for (const v of ALL_VARS) root.style.removeProperty(v);
  // Apply new theme vars
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
}
