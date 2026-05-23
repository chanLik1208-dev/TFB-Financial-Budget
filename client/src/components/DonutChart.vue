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
  return ["--c-primary", "--c-accent", "--c-ok", "--c-warn", "--c-bad", "--c-muted"].map(cssVar);
}

function render() {
  if (!chart) return;
  const { items, currency, total } = props.data;
  const textColor = cssVar("--c-text"); // 跟隨主題，避免淺色主題上白字看不見
  const mutedColor = cssVar("--c-muted");
  chart.setOption({
    color: themeColors(),
    tooltip: { trigger: "item", formatter: `{b}: ${currency} {c} ({d}%)` },
    series: [
      {
        type: "pie",
        radius: ["54%", "80%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderWidth: 3, borderColor: "transparent" },
        label: {
          show: true,
          position: "center",
          formatter: () => `{t|本期支出}\n{v|${currency} ${total.toFixed(2)}}`,
          rich: {
            t: { fontSize: 14, color: mutedColor, padding: [0, 0, 8, 0] },
            v: { fontSize: 24, fontWeight: "bold", color: textColor },
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
