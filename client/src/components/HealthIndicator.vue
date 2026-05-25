<script setup lang="ts">
const props = defineProps<{
  level: "ok" | "warn" | "bad" | "none";
  message: string;
  details?: { label: string; text: string }[];
}>();

const levelMap: Record<string, string> = { ok: "var(--c-green)", warn: "var(--c-yellow)", bad: "var(--c-red)", none: "var(--t-secondary)" };
const ringVar = levelMap[props.level] ?? "var(--t-secondary)";
</script>

<template>
  <div class="indicator glass" :style="{ '--ring': ringVar }">
    <div class="head">
      <span class="dot" />
      <span class="msg">{{ message }}</span>
    </div>
    <div class="detail" v-if="details?.length">
      <div class="row" v-for="d in details" :key="d.label">
        <span class="d-label">{{ d.label }}</span>
        <span class="d-text">{{ d.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.indicator {
  padding: 12px 16px;
  border-radius: 18px;
  width: 100%;
}

.head { display: flex; align-items: center; gap: 12px; }
.dot {
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--ring);
  /* 柔和光環取代刺眼陰影 */
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ring) 28%, transparent);
  flex-shrink: 0;
  animation: breathe 2.4s ease-in-out infinite;
}
.msg { font-weight: 600; font-size: 15px; flex: 1; }
.detail { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(128,128,128,.2); animation: fade .3s ease; }
.row { display: flex; justify-content: space-between; gap: 16px; padding: 5px 0; font-size: 14px; }
.d-label { color: var(--t-secondary); }
.d-text { font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace; }

@keyframes breathe {
  0%, 100% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--ring) 28%, transparent); }
  50% { box-shadow: 0 0 0 7px color-mix(in srgb, var(--ring) 12%, transparent); }
}
@keyframes fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
</style>
