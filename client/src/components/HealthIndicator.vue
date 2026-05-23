<script setup lang="ts">
import { ref } from "vue";

// 財務健康指示器：圓形燈號 + 一句話。點擊展開成橢圓 + 邊緣漸變羽化。
const props = defineProps<{
  level: "ok" | "warn" | "bad" | "none";
  message: string;
  details?: { label: string; text: string }[];
}>();

const expanded = ref(false);
const ringVar = `var(--c-${props.level === "none" ? "muted" : props.level})`;
</script>

<template>
  <div
    class="indicator glass"
    :class="{ expanded }"
    :style="{ '--ring': ringVar }"
    @click="expanded = !expanded"
  >
    <template v-if="!expanded">
      <span class="dot" />
      <span class="msg">{{ message }}</span>
    </template>
    <template v-else>
      <div class="detail">
        <strong>支出明細</strong>
        <ul>
          <li v-for="d in details" :key="d.label">{{ d.label }}：{{ d.text }}</li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.indicator {
  display: flex; align-items: center; gap: 10px;
  width: 64px; height: 64px; border-radius: 50%;
  padding: 0; justify-content: center; cursor: pointer; overflow: hidden;
  box-shadow: 0 0 24px 2px var(--ring);
  transition: width .4s cubic-bezier(.22,1,.36,1), height .4s, border-radius .4s, padding .4s;
}
/* 展開：高度隨內容自適應，避免文字被裁切；邊緣用環色柔光取代會切字的遮罩 */
.indicator.expanded {
  width: 300px; height: auto; min-height: 120px;
  border-radius: 32px; padding: 18px 22px;
  align-items: flex-start; justify-content: flex-start;
  overflow: visible;
  box-shadow: 0 0 36px 4px var(--ring), inset 0 0 0 1px rgba(255,255,255,.22);
}
.dot { width: 18px; height: 18px; border-radius: 50%; background: var(--ring); }
.msg { display: none; }
.detail { animation: fade .4s ease; width: 100%; }
.detail strong { display: block; margin-bottom: 8px; font-size: 15px; }
.detail ul { list-style: none; font-size: 14px; line-height: 1.8; }
@keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; } }
</style>
