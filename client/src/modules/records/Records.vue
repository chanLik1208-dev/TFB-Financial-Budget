<script setup lang="ts">
import { ref, inject, onMounted, reactive, watch, computed } from "vue";
import SplitLayout from "../../layouts/SplitLayout.vue";
import { api, type RecordDto } from "../../api";
import { user } from "../../auth";

// 排版比例由伺服器 ui-config 注入；fallback [3,1]（左列表、右寫入）。
const uiConfig = inject<any>("uiConfig");
const ratio = (uiConfig?.layout?.records?.ratio ?? [3, 1]) as [number, number];

// 新記錄預設帶入使用者的顯示貨幣。
const defaultCurrency = () => user.value?.displayCurrency ?? "HKD";

const rows = ref<RecordDto[]>([]);
const editingId = ref<number | null>(null);

// 篩選：區間 + 類別。
const periods = [
  { key: "all", label: "所有" },
  { key: "this-month", label: "本月" },
  { key: "last-month", label: "上月" },
  { key: "last-3m", label: "上3月" },
  { key: "last-6m", label: "上6月" },
  { key: "this-year", label: "本年" },
  { key: "last-year", label: "上年" },
];
const categories = ["全部", "普通消費", "飲食", "交通", "服務(訂閱)"];
const filterPeriod = ref("all");
const filterType = ref("全部");
const filterSearch = ref("");

const form = reactive({
  name: "",
  type: "普通消費",
  amount: "" as string,
  currency: defaultCurrency(),
  note: "",
  interval: "monthly",
  restriction: null as string | null,
});

const moneyInput = ref("");
let skipTypeWatch = false;

function parseMoney(raw: string) {
  const s = raw.trim();
  // currency-first: TWD300 / TWD 300
  let m = s.match(/^([A-Za-z]{2,4})\s*(\d+(?:\.\d+)?)$/);
  if (m) return { currency: m[1].toUpperCase(), amount: m[2] };
  // amount-first: 300TWD / 300 TWD
  m = s.match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]{2,4})$/);
  if (m) return { currency: m[2].toUpperCase(), amount: m[1] };
  // amount only: 300
  m = s.match(/^(\d+(?:\.\d+)?)$/);
  if (m) return { currency: defaultCurrency(), amount: m[1] };
  return null;
}

function onMoneyInput() {
  const parsed = parseMoney(moneyInput.value);
  if (parsed) {
    form.amount = parsed.amount;
    form.currency = parsed.currency;
  }
}

const filteredRows = computed(() => {
  const q = filterSearch.value.trim().toLowerCase();
  if (!q) return rows.value;
  return rows.value.filter((r) => r.name.toLowerCase().includes(q) || (r.note ?? "").toLowerCase().includes(q));
});

function exportCsv() {
  const header = ["名稱", "類別", "金額", "幣別", "備注", "日期"];
  const lines = filteredRows.value.map((r) => [
    `"${r.name.replace(/"/g, '""')}"`,
    r.type,
    r.amount.toFixed(2),
    r.currency,
    `"${(r.note ?? "").replace(/"/g, '""')}"`,
    new Date(r.createdAt).toLocaleDateString("zh-TW"),
  ].join(","));
  const csv = [header.join(","), ...lines].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = `records-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

async function load() {
  rows.value = await api.listRecords({
    period: filterPeriod.value,
    type: filterType.value === "全部" ? undefined : filterType.value,
  });
}

function resetForm() {
  editingId.value = null;
  form.name = "";
  form.type = "普通消費";
  form.amount = "";
  form.currency = defaultCurrency();
  form.note = "";
  form.interval = "monthly";
  form.restriction = null;
  moneyInput.value = "";
}

async function submit() {
  const amount = Number(form.amount);
  if (!form.name.trim() || !isFinite(amount) || amount < 0) return;
  const body = {
    name: form.name,
    type: form.type,
    amount,
    currency: form.currency,
    note: form.note.trim() || null,
    interval: (form.type === "服務(訂閱)" || form.type === "交通" || form.type === "飲食") ? form.interval : null,
    restriction: (form.type === "交通" || form.type === "飲食") ? form.restriction : null,
  };
  if (editingId.value !== null) {
    await api.updateRecord(editingId.value, body);
  } else {
    await api.createRecord(body);
  }
  resetForm();
  await load();
}

function edit(r: RecordDto) {
  editingId.value = r.id;
  form.name = r.name;
  form.amount = String(r.amount);
  form.currency = r.currency;
  form.note = r.note ?? "";
  form.interval = r.interval ?? "monthly";
  form.restriction = r.restriction ?? null;
  skipTypeWatch = true;
  form.type = r.type;
  moneyInput.value = `${r.currency} ${r.amount}`;
}

async function remove(id: number) {
  if (!confirm("確定刪除這筆記錄？")) return;
  await api.deleteRecord(id);
  if (editingId.value === id) resetForm();
  await load();
}

watch(() => form.type, () => {
  if (skipTypeWatch) { skipTypeWatch = false; return; }
  form.interval = "monthly";
  form.restriction = null;
});

onMounted(load);
</script>

<template>
  <SplitLayout :ratio="ratio">
    <template #left>
      <div class="glass list">
        <div class="list-head">
          <h3>消費記錄</h3>
          <button class="export" @click="exportCsv" title="匯出 CSV">↓ CSV</button>
          <div class="filters">
            <select v-model="filterPeriod" @change="load">
              <option v-for="p in periods" :key="p.key" :value="p.key">{{ p.label }}</option>
            </select>
            <select v-model="filterType" @change="load">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <input class="search" v-model="filterSearch" placeholder="搜尋名稱 / 備注…" />
        </div>
        <p v-if="!filteredRows.length" class="empty">尚無記錄</p>
        <div v-for="r in filteredRows" :key="r.id" class="row">
          <div class="main">
            <span class="name">{{ r.name }}</span>
            <span class="type">{{ r.type }}<span v-if="r.interval" class="badge">{{ { monthly:'每月', yearly:'每年', weekly:'每週', daily:'每天' }[r.interval] }}{{ r.restriction ? (r.restriction==='workdays'?' 工作日':' 週末') : '' }}</span></span>
            <span class="amt">{{ r.currency }} {{ r.amount.toFixed(2) }}</span>
            <span class="ops">
              <button @click="edit(r)">改</button>
              <button @click="remove(r.id)">刪</button>
            </span>
          </div>
          <p v-if="r.note" class="note">📝 {{ r.note }}</p>
        </div>
      </div>
    </template>
    <template #right>
      <div class="glass editor" @keydown.enter.prevent="submit">
        <h3>{{ editingId === null ? "寫入" : "改寫" }}</h3>
        <input v-model="form.name" placeholder="名稱" />
        <select v-model="form.type">
          <option>普通消費</option><option>飲食</option><option>交通</option><option>服務(訂閱)</option>
        </select>
        <select v-if="form.type === '服務(訂閱)'" v-model="form.interval">
          <option value="monthly">每月</option>
          <option value="yearly">每年</option>
        </select>
        <template v-if="form.type === '交通' || form.type === '飲食'">
          <select v-model="form.interval">
            <option value="monthly">每月</option>
            <option value="weekly">每週</option>
            <option value="daily">每天</option>
          </select>
          <select v-model="form.restriction">
            <option :value="null">不限</option>
            <option value="workdays">限工作日</option>
            <option value="weekends">限週末</option>
          </select>
        </template>
        <textarea v-model="form.note" placeholder="備注…" />
        <input
          v-model="moneyInput"
          @input="onMoneyInput"
          placeholder="金額"
          inputmode="decimal"
        />
        <button class="add" @click="submit">{{ editingId === null ? "＋ 增加" : "✓ 儲存" }}</button>
        <button v-if="editingId !== null" class="cancel" @click="resetForm">取消</button>
      </div>
    </template>
  </SplitLayout>
</template>

<style scoped>
.list, .editor { padding: 16px; }
.editor h3 { margin-bottom: 12px; }
.list-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.filters { display: flex; gap: 8px; }
.filters select { padding: 6px 10px; border: none; border-radius: 10px; font: inherit; }
.export { padding: 4px 10px; border: none; border-radius: 8px; font: inherit; font-size: 13px; background: var(--glass-bg-input); color: var(--t-primary); cursor: pointer; }
.search { width: 100%; padding: 7px 10px; border: none; border-radius: 10px; font: inherit; background: var(--glass-bg-input); color: var(--t-primary); box-sizing: border-box; }
.empty { opacity: .6; }
.row { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.12); }
.main { display: grid; grid-template-columns: 1fr auto auto auto; gap: 10px; align-items: center; }
.name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type { opacity: .7; }
.badge { margin-left: 5px; font-size: 11px; padding: 1px 6px; border-radius: 6px; background: var(--accent-subtle); color: var(--accent); opacity: 1; }
.amt { font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace; }
.note { margin-top: 4px; font-size: 13px; opacity: .75; }
.editor { display: flex; flex-direction: column; gap: 10px; }
.editor > input, .editor > select, .editor > textarea { padding: 8px; border: none; border-radius: 10px; font: inherit; background: var(--glass-bg-input); color: var(--t-primary); }
.editor > textarea { resize: vertical; }
.add { padding: 10px; border: none; border-radius: 12px; background: var(--accent); color: #fff; cursor: pointer; }
.cancel { padding: 8px; border: none; border-radius: 10px; background: transparent; color: var(--t-primary); cursor: pointer; }
button { cursor: pointer; }
.ops { display: flex; gap: 4px; }
.ops button { padding: 4px 10px; border: none; border-radius: 8px; font: inherit; font-size: 13px; background: rgba(255,255,255,.12); color: var(--t-primary); cursor: pointer; transition: background .15s; }
.ops button:hover { background: rgba(255,255,255,.22); }
</style>
