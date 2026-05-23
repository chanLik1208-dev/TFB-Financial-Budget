<script setup lang="ts">
import { ref, inject, onMounted, reactive } from "vue";
import SplitLayout from "../../layouts/SplitLayout.vue";
import { api, type RecordDto } from "../../api";

// 排版比例由伺服器 ui-config 注入；fallback [3,1]（左列表、右寫入）。
const uiConfig = inject<any>("uiConfig");
const ratio = (uiConfig?.layout?.records?.ratio ?? [3, 1]) as [number, number];

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
const categories = ["全部", "食物", "產品", "服務(訂閱)"];
const filterPeriod = ref("all");
const filterType = ref("全部");

const form = reactive({
  name: "",
  type: "食物",
  amount: "" as string,
  currency: "HKD",
  noteOn: false,
  note: "",
});

async function load() {
  rows.value = await api.listRecords({
    period: filterPeriod.value,
    type: filterType.value === "全部" ? undefined : filterType.value,
  });
}

function resetForm() {
  editingId.value = null;
  form.name = "";
  form.type = "食物";
  form.amount = "";
  form.note = "";
  form.noteOn = false;
}

async function submit() {
  const amount = Number(form.amount);
  if (!form.name.trim() || !isFinite(amount) || amount < 0) return;
  const body = {
    name: form.name,
    type: form.type,
    amount,
    currency: form.currency,
    note: form.noteOn ? form.note : null,
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
  form.type = r.type;
  form.amount = String(r.amount);
  form.currency = r.currency;
  form.note = r.note ?? "";
  form.noteOn = !!r.note;
}

async function remove(id: number) {
  await api.deleteRecord(id);
  if (editingId.value === id) resetForm();
  await load();
}

onMounted(load);
</script>

<template>
  <SplitLayout :ratio="ratio">
    <template #left>
      <div class="glass list">
        <div class="list-head">
          <h3>消費記錄</h3>
          <div class="filters">
            <select v-model="filterPeriod" @change="load">
              <option v-for="p in periods" :key="p.key" :value="p.key">{{ p.label }}</option>
            </select>
            <select v-model="filterType" @change="load">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>
        <p v-if="!rows.length" class="empty">尚無記錄</p>
        <div v-for="r in rows" :key="r.id" class="row">
          <div class="main">
            <span class="name">{{ r.name }}</span>
            <span class="type">{{ r.type }}</span>
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
      <div class="glass editor">
        <h3>{{ editingId === null ? "寫入" : "改寫" }}</h3>
        <input v-model="form.name" placeholder="產品名 / 購買的東西" />
        <select v-model="form.type">
          <option>食物</option><option>產品</option><option>服務(訂閱)</option>
        </select>
        <label><input type="checkbox" v-model="form.noteOn" /> 備注</label>
        <textarea v-if="form.noteOn" v-model="form.note" placeholder="備注…" />
        <div class="money">
          <input v-model="form.amount" placeholder="金額" inputmode="decimal" />
          <input v-model="form.currency" placeholder="幣別" class="cur" />
        </div>
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
.empty { opacity: .6; }
.row { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.12); }
.main { display: grid; grid-template-columns: 1fr auto auto auto; gap: 10px; align-items: center; }
.name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.type { opacity: .7; }
.note { margin-top: 4px; font-size: 13px; opacity: .75; }
.editor { display: flex; flex-direction: column; gap: 10px; }
.editor input, .editor select, .editor textarea { padding: 8px; border: none; border-radius: 10px; font: inherit; }
.money { display: flex; gap: 8px; }
.money input { flex: 1; }
.cur { max-width: 80px; }
.add { padding: 10px; border: none; border-radius: 12px; background: var(--c-primary); color: #fff; cursor: pointer; }
.cancel { padding: 8px; border: none; border-radius: 10px; background: transparent; color: var(--c-text); cursor: pointer; }
button { cursor: pointer; }
.ops button { margin-left: 4px; }
</style>
