<script setup lang="ts">
import { ref, computed, shallowRef, onMounted, provide, watch, type Component } from "vue";
import { getModule } from "./modules/registry";
import { applyTheme } from "./themes";
import { token, user, clearSession } from "./auth";
import { api } from "./api";
import AuthView from "./components/AuthView.vue";

interface UiConfig {
  tabs: { id: string; label: string; module: string; order: number }[];
  layout: Record<string, any>;
  features: Record<string, boolean>;
}

const config = ref<UiConfig | null>(null);
const activeTab = ref<string>("");
const activeComponent = shallowRef<Component | null>(null);
const ready = ref(false);
const isAuthed = computed(() => !!token.value);

provide("uiConfig", config);

async function loadModule(moduleId: string) {
  const def = getModule(moduleId);
  if (!def) return;
  activeComponent.value = (await def.component()).default;
}

watch(activeTab, (id) => {
  const tab = config.value?.tabs.find((t) => t.id === id);
  if (tab) loadModule(tab.module);
});

// 齒輪：載入設定模組（非分頁，故清除分頁高亮）。
function openSettings() {
  activeTab.value = "";
  loadModule("settings");
}

// 載入登入後的應用（介面配置 + 套用用戶主題）。失敗則清 session 回登入。
async function boot() {
  try {
    if (!user.value) user.value = await api.me();
    applyTheme(user.value?.theme ?? "sakura");
    const res = await fetch("/api/ui-config");
    const cfg: UiConfig = await res.json();
    cfg.tabs.sort((a, b) => a.order - b.order);
    config.value = cfg;
    activeTab.value = cfg.tabs[0]?.id ?? "";
  } catch {
    clearSession();
  }
}

function logout() {
  clearSession();
}

// token 任何變化都走同一條路徑：登入/註冊 → boot；登出/失效 → 回登入。
watch(token, (t) => {
  if (t) {
    boot();
  } else {
    config.value = null;
    activeComponent.value = null;
    applyTheme("sakura");
  }
});

onMounted(async () => {
  applyTheme("sakura");
  if (token.value) await boot(); // 還原既有 session（重新整理）
  ready.value = true;
});
</script>

<template>
  <template v-if="ready">
    <AuthView v-if="!isAuthed" />

    <div class="app" v-else-if="config">
      <nav class="tabs glass">
        <button
          v-for="t in config.tabs"
          :key="t.id"
          :class="{ active: activeTab === t.id }"
          @click="activeTab = t.id"
        >{{ t.label }}</button>
        <span class="spacer" />
        <span class="who">{{ user?.username }}</span>
        <button class="logout" @click="logout">登出</button>
      </nav>

      <main class="content">
        <component :is="activeComponent" v-if="activeComponent" />
      </main>

      <button class="settings glass" title="設定" @click="openSettings">⚙</button>
    </div>

    <div class="booting" v-else>載入中…</div>
  </template>
</template>

<style scoped>
.app { max-width: 1100px; margin: 0 auto; padding: 16px; min-height: 100vh; }
.booting { min-height: 100vh; display: grid; place-items: center; }
.tabs { display: flex; gap: 8px; padding: 8px; margin-bottom: 20px; align-items: center; }
.tabs button { border: none; background: transparent; padding: 8px 18px; border-radius: 14px; color: var(--c-text); cursor: pointer; }
.tabs button.active { background: var(--c-primary); color: #fff; }
.spacer { flex: 1; }
.who { opacity: .8; font-size: 14px; }
.logout { font-size: 14px; }
.content { padding: 8px 0; }
.settings { position: fixed; right: 20px; bottom: 20px; width: 56px; height: 56px; border-radius: 50%; border: none; font-size: 22px; cursor: pointer; }
</style>
