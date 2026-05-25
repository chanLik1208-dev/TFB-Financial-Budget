<script setup lang="ts">
// 排版原語：左右分欄比例由配置 ratio 驅動（如記錄頁 [3,1]）。
const props = defineProps<{ ratio: [number, number] }>();
</script>

<template>
  <div class="split" :style="{ gridTemplateColumns: `1fr 280px` }">
    <div class="split-left"><slot name="left" /></div>
    <div class="split-right"><slot name="right" /></div>
  </div>
</template>

<style scoped>
.split { display: grid; gap: 16px; height: 100%; }
.split-left, .split-right { min-width: 0; }
@media (max-width: 640px) {
  .split { grid-template-columns: 1fr !important; }
}
</style>
