import type { Component } from "vue";

// 每個分頁是自包含模組，註冊一筆即可被 ui-config 動態組裝。
// 新增功能只在此 register，不動既有碼。

export interface ModuleDef {
  id: string;
  component: () => Promise<{ default: Component }>;
}

const registry = new Map<string, ModuleDef>();

export function registerModule(def: ModuleDef) {
  registry.set(def.id, def);
}

export function getModule(id: string): ModuleDef | undefined {
  return registry.get(id);
}

// === 模組註冊（懶載入）===
registerModule({ id: "overview", component: () => import("./overview/Overview.vue") });
registerModule({ id: "records", component: () => import("./records/Records.vue") });
registerModule({ id: "settings", component: () => import("./settings/Settings.vue") });
