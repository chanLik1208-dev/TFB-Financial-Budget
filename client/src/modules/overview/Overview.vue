<script setup lang="ts">
import { ref, onMounted } from "vue";
import HealthIndicator from "../../components/HealthIndicator.vue";
import DonutChart from "../../components/DonutChart.vue";
import { api, type OverviewStatus, type Breakdown, type RecordDto, type Projected } from "../../api";
import { maybeNotify } from "../../notify";

const status = ref<OverviewStatus | null>(null);
const breakdown = ref<Breakdown | null>(null);
const recent = ref<RecordDto[]>([]);
const projected = ref<Projected | null>(null);
const loading = ref(true);

// 區間選項：label 顯示給用戶，key 傳給後端。
const periods = [
  { key: "this-month", label: "本月" },
  { key: "last-month", label: "上月" },
  { key: "last-3m", label: "上3月" },
  { key: "last-6m", label: "上6月" },
  { key: "this-year", label: "本年" },
  { key: "last-year", label: "上年" },
  { key: "all", label: "所有" },
];
const period = ref("this-month");

// 切換區間時同步更新圓形圖與近期記錄簡覽。
async function loadPeriodData() {
  [breakdown.value, recent.value] = await Promise.all([
    api.overviewBreakdown(period.value),
    api.listRecords({ period: period.value, limit: 6 }),
  ]);
}

onMounted(async () => {
  try {
    const [st, settings] = await Promise.all([
      api.overviewStatus(),
      api.getSettings(),
      loadPeriodData(),
      api.overviewProjected().then((p) => (projected.value = p)),
    ]);
    status.value = st;
    // 依設定決定是否提醒（冷卻內不重複）。
    maybeNotify(st, settings.notificationsEnabled, settings.notifyCooldownMin);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="overview">
    <header class="bar">
      <select class="glass period" v-model="period" @change="loadPeriodData">
        <option v-for="p in periods" :key="p.key" :value="p.key">{{ p.label }}</option>
      </select>
    </header>

    <div class="hero" v-if="status">
      <div class="hero-left glass">
        <div class="chart">
          <DonutChart v-if="breakdown" :data="breakdown" />
        </div>
        <div class="indicator-wrap">
          <HealthIndicator
            :level="status.level"
            :message="status.message"
            :details="status.details"
          />
          <span class="indicator-label">{{ status.message }}</span>
        </div>
      </div>

      <!-- 近期記錄移到圓形圖旁邊 -->
      <div class="recent glass">
        <h3>近期記錄</h3>
        <p v-if="!recent.length" class="empty">本區間尚無記錄</p>
        <div v-for="r in recent" :key="r.id" class="rrow">
          <span class="rname">{{ r.name }}</span>
          <span class="rtype">{{ r.type }}</span>
          <span class="ramt">
            {{ r.displayCurrency }} {{ r.displayAmount.toFixed(2) }}
            <small v-if="r.currency !== r.displayCurrency" class="orig">（{{ r.currency }} {{ r.amount.toFixed(2) }}）</small>
          </span>
        </div>
      </div>
    </div>
    <p v-else-if="loading" class="loading">載入中…</p>

    <!-- 原近期記錄的位置：改放預計下月開支（訂閱） -->
    <div class="projected glass" v-if="projected">
      <div class="proj-head">
        <h3>預計下月開支（訂閱）</h3>
        <strong class="proj-total">{{ projected.currency }} {{ projected.total.toFixed(2) }}</strong>
      </div>
      <p v-if="!projected.items.length" class="empty">本月無訂閱記錄，無法預估</p>
      <div v-for="(i, idx) in projected.items" :key="idx" class="prow">
        <span>{{ i.name }}</span>
        <span class="pamt">{{ projected.currency }} {{ i.amount.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview { display: flex; flex-direction: column; gap: 24px; }
.period { padding: 10px 16px; border: none; color: var(--c-text); font-size: 15px; }
.loading { padding: 24px; }

/* 圓形圖區與近期記錄並排，窄螢幕自動換行堆疊 */
.hero { display: grid; grid-template-columns: minmax(320px, 380px) 1fr; gap: 24px; align-items: stretch; }
@media (max-width: 800px) { .hero { grid-template-columns: 1fr; } }

.hero-left { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; }
.chart { display: grid; place-items: center; }
.indicator-wrap { display: flex; align-items: center; gap: 14px; }
.indicator-label { font-size: 15px; font-weight: 600; }

.recent { padding: 24px; }
.recent h3 { margin-bottom: 16px; font-size: 18px; }
.empty { color: var(--c-muted); }
.rrow {
  display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 14px; align-items: center;
  padding: 12px 0; border-bottom: 1px solid rgba(128,128,128,.18);
}
.rrow:last-child { border-bottom: none; }
.rname { font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rtype { color: var(--c-muted); font-size: 14px; white-space: nowrap; }
.ramt { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
.orig { color: var(--c-muted); font-size: 12px; }

.projected { padding: 24px; }
.proj-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; gap: 12px; flex-wrap: wrap; }
.proj-head h3 { font-size: 18px; }
.proj-total { font-size: 22px; font-weight: 700; color: var(--c-primary); }
.prow {
  display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center;
  padding: 12px 0; border-bottom: 1px solid rgba(128,128,128,.18);
}
.prow:last-child { border-bottom: none; }
.prow .pamt { font-variant-numeric: tabular-nums; }
</style>
