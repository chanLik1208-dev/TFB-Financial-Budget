<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import type { Breakdown } from "../api";

const props = defineProps<{ data: Breakdown }>();
const el = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

// 讀取目前主題的 CSS 變數，讓圖配色跟隨主題。
function cssVar(n: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(n).trim();
}
function themeColors(): string[] {
  return ["--accent", "--accent-2", "--c-green", "--c-yellow", "--c-red", "--t-secondary"].map(cssVar);
}

function render() {
  if (!chart) return;
  const { items, currency, total } = props.data;
  const textColor = cssVar("--t-primary");
  const mutedColor = cssVar("--t-secondary");
  // 千分位顯示；金額越長字級越小，並限制寬度自動換行，避免超出內圈。
  const amountStr = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const vFont = amountStr.length > 12 ? 16 : amountStr.length > 9 ? 19 : 24;
  chart.setOption({
    color: themeColors(),
    tooltip: { trigger: "item", formatter: `{b}: ${currency} {c} ({d}%)` },
    series: [
      {
        type: "pie",
        radius: ["60%", "82%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderWidth: 3, borderColor: "transparent" },
        label: {
          show: true,
          position: "center",
          // 標題 / 貨幣 / 金額 各自一行，金額過長時於內圈寬度內自動換行
          formatter: () => `{t|本期支出}\n{c|${currency}}\n{v|${amountStr}}`,
          rich: {
            t: { fontSize: 13, color: mutedColor, padding: [0, 0, 4, 0] },
            c: { fontSize: 13, color: mutedColor, padding: [0, 0, 4, 0] },
            v: { fontSize: vFont, fontWeight: "bold", color: textColor, width: 130, overflow: "break", lineHeight: vFont + 4, align: "center" },
          },
        },
        labelLine: { show: false },
        data: items.length
          ? items.map((i) => ({ name: i.type, value: Number(i.amount.toFixed(2)) }))
          : [{ name: "無資料", value: 1, itemStyle: { color: "rgba(128,128,128,.2)" } }],
      },
    ],
    // 同時移動 + 展開的進場動畫
    animationDuration: 700,
    animationEasing: "cubicOut",
  });
}

onMounted(() => {
  if (!el.value) return;
  chart = echarts.init(el.value);
  render();
  window.addEventListener("resize", resize);
});

function resize() {
  chart?.resize();
}

watch(() => props.data, render, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <div ref="el" class="donut" />
</template>

<style scoped>
.donut { width: 260px; height: 260px; }
</style>
