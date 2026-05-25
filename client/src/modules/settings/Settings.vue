<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { api, type Settings } from "../../api";
import { themes, applyTheme } from "../../themes";
import { user } from "../../auth";
import { enableNotifications } from "../../notify";

const themeList = Object.entries(themes).map(([id, t]) => ({ id, label: t.label, swatch: t.swatch }));
const currencies = ["HKD", "USD", "CNY", "TWD", "JPY", "EUR", "GBP"];

const form = ref<Settings>({
  displayCurrency: "HKD", theme: "default", monthlyBudget: null,
  notificationsEnabled: false, notifyCooldownMin: 60,
});
const loading = ref(true);
const notifyHint = ref("");

const budgetInput = ref("");
const budgetCurrency = ref("HKD");

function parseBudget(raw: string) {
  const s = raw.trim();
  let m = s.match(/^([A-Za-z]{2,4})\s*(\d+(?:\.\d+)?)$/);
  if (m) return { currency: m[1].toUpperCase(), amount: Number(m[2]) };
  m = s.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]{2,4})$/);
  if (m) return { currency: m[2].toUpperCase(), amount: Number(m[1]) };
  m = s.match(/^(\d+(?:\.\d+)?)$/);
  if (m) return { currency: form.value.displayCurrency, amount: Number(m[1]) };
  return null;
}

function onBudgetInput() {
  const parsed = parseBudget(budgetInput.value);
  if (parsed) {
    form.value.monthlyBudget = parsed.amount;
    budgetCurrency.value = parsed.currency;
  }
}

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
    if (form.value.monthlyBudget != null) {
      budgetCurrency.value = form.value.budgetCurrency ?? form.value.displayCurrency;
      budgetInput.value = `${budgetCurrency.value} ${form.value.monthlyBudget}`;
    }
  } finally {
    loading.value = false;
  }
});

function previewTheme(name: string) {
  form.value.theme = name;
  applyTheme(name);
}

async function save() {
  await api.updateUserSettings({ displayCurrency: form.value.displayCurrency, theme: form.value.theme });
  if (form.value.monthlyBudget !== null && form.value.monthlyBudget !== undefined) {
    await api.setBudget(Number(form.value.monthlyBudget), budgetCurrency.value);
  }
  await api.updateNotifications({
    enabled: form.value.notificationsEnabled,
    cooldownMin: Number(form.value.notifyCooldownMin),
  });
  if (user.value) {
    user.value.displayCurrency = form.value.displayCurrency;
    user.value.theme = form.value.theme;
  }
}

watch(() => form.value.displayCurrency, save);
watch(() => form.value.theme, save);
watch(() => form.value.notificationsEnabled, save);
watch(() => form.value.notifyCooldownMin, save);
watch(budgetCurrency, save);
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
          v-for="t in themeList"
          :key="t.id"
          class="swatch"
          :class="{ active: form.theme === t.id }"
          :style="{ '--sw': t.swatch }"
          @click="previewTheme(t.id)"
        >{{ t.label }}</button>
      </div>
    </section>

    <section class="glass card">
      <label>月預算</label>
      <input
        v-model="budgetInput"
        @input="onBudgetInput"
        placeholder="未設定"
      />
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

  </div>
  <p v-else>載入中…</p>
</template>

<style scoped>
.settings-page { display: flex; flex-direction: column; gap: 16px; }
.card { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.card label { font-weight: 600; }
.card select, .card input { padding: 9px; border: none; border-radius: 10px; font: inherit; }
.card label.row { display: flex; justify-content: space-between; align-items: center; }
.card label.row input { width: auto; }
.cooldown { display: flex; align-items: center; gap: 10px; }
.cooldown input { width: 100px; }
.themes { display: flex; gap: 10px; flex-wrap: wrap; }
.swatch { padding: 10px 18px; border: 2px solid transparent; border-radius: 12px; background: var(--sw); color: #fff; cursor: pointer; font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,.35); transition: transform .15s var(--ease-out), box-shadow .15s var(--ease-out); }
.swatch:hover { transform: translateY(-1px); box-shadow: 0 4px 12px color-mix(in srgb, var(--sw) 40%, transparent); }
.swatch.active { border-color: var(--t-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--sw) 35%, transparent); }
.err { color: var(--c-red); }
</style>
