<script setup lang="ts">
import { ref, onMounted } from "vue";
import { api, type Settings } from "../../api";
import { themes, applyTheme } from "../../themes";
import { user } from "../../auth";
import { enableNotifications } from "../../notify";

const themeNames = Object.keys(themes);
const currencies = ["HKD", "USD", "CNY", "TWD", "JPY", "EUR", "GBP"];

const form = ref<Settings>({
  displayCurrency: "HKD", theme: "sakura", monthlyBudget: null,
  notificationsEnabled: false, notifyCooldownMin: 60,
});
const loading = ref(true);
const saved = ref(false);
const error = ref("");
const notifyHint = ref("");

// 切換通知：只有在開啟時才請求瀏覽器權限（呼應原設計）。
async function toggleNotifications(e: Event) {
  const on = (e.target as HTMLInputElement).checked;
  notifyHint.value = "";
  if (on) {
    const granted = await enableNotifications();
    if (!granted) {
      form.value.notificationsEnabled = false;
      notifyHint.value = "瀏覽器未授權通知，已關閉";
      return;
    }
  }
  form.value.notificationsEnabled = on;
}

onMounted(async () => {
  try {
    form.value = await api.getSettings();
  } finally {
    loading.value = false;
  }
});

// 主題即時預覽
function previewTheme(name: string) {
  form.value.theme = name;
  applyTheme(name);
}

async function save() {
  error.value = "";
  saved.value = false;
  try {
    await api.updateUserSettings({ displayCurrency: form.value.displayCurrency, theme: form.value.theme });
    if (form.value.monthlyBudget !== null && form.value.monthlyBudget !== undefined) {
      await api.setBudget(Number(form.value.monthlyBudget), form.value.displayCurrency);
    }
    await api.updateNotifications({
      enabled: form.value.notificationsEnabled,
      cooldownMin: Number(form.value.notifyCooldownMin),
    });
    if (user.value) {
      user.value.displayCurrency = form.value.displayCurrency;
      user.value.theme = form.value.theme;
    }
    saved.value = true;
  } catch (e) {
    error.value = (e as Error).message;
  }
}
</script>

<template>
  <div class="settings-page" v-if="!loading">
    <h2>設定</h2>

    <section class="glass card">
      <label>顯示貨幣</label>
      <select v-model="form.displayCurrency">
        <option v-for="c in currencies" :key="c">{{ c }}</option>
      </select>
    </section>

    <section class="glass card">
      <label>主題顏色</label>
      <div class="themes">
        <button
          v-for="t in themeNames"
          :key="t"
          class="swatch"
          :class="{ active: form.theme === t }"
          :style="{ background: themes[t].primary }"
          @click="previewTheme(t)"
        >{{ t }}</button>
      </div>
    </section>

    <section class="glass card">
      <label>月預算（{{ form.displayCurrency }}）</label>
      <input v-model.number="form.monthlyBudget" type="number" min="0" placeholder="未設定" />
    </section>

    <section class="glass card">
      <label class="row">
        <span>通知（接近/超出預算時提醒）</span>
        <input type="checkbox" :checked="form.notificationsEnabled" @change="toggleNotifications" />
      </label>
      <div v-if="form.notificationsEnabled" class="cooldown">
        <span>冷卻（分鐘）</span>
        <input v-model.number="form.notifyCooldownMin" type="number" min="0" />
      </div>
      <p v-if="notifyHint" class="err">{{ notifyHint }}</p>
    </section>

    <div class="actions">
      <button class="primary" @click="save">儲存</button>
      <span v-if="saved" class="ok">已儲存</span>
      <span v-if="error" class="err">{{ error }}</span>
    </div>
  </div>
  <p v-else>載入中…</p>
</template>

<style scoped>
.settings-page { display: flex; flex-direction: column; gap: 16px; max-width: 480px; }
.card { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.card label { font-weight: 600; }
.card select, .card input { padding: 9px; border: none; border-radius: 10px; font: inherit; }
.card label.row { display: flex; justify-content: space-between; align-items: center; }
.card label.row input { width: auto; }
.cooldown { display: flex; align-items: center; gap: 10px; }
.cooldown input { width: 100px; }
.themes { display: flex; gap: 10px; flex-wrap: wrap; }
.swatch { padding: 10px 16px; border: 2px solid transparent; border-radius: 12px; color: #fff; cursor: pointer; text-shadow: 0 1px 2px rgba(0,0,0,.3); }
.swatch.active { border-color: var(--c-text); }
.actions { display: flex; align-items: center; gap: 12px; }
.primary { padding: 10px 20px; border: none; border-radius: 12px; background: var(--c-primary); color: #fff; cursor: pointer; }
.ok { color: var(--c-ok); }
.err { color: var(--c-bad); }
</style>
