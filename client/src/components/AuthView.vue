<script setup lang="ts">
import { ref } from "vue";
import { api } from "../api";

const emit = defineEmits<{ authed: [] }>();

const mode = ref<"login" | "register">("login");
const username = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

async function submit() {
  error.value = "";
  busy.value = true;
  try {
    if (mode.value === "login") {
      await api.login(username.value, password.value);
    } else {
      await api.register(username.value, password.value);
    }
    emit("authed");
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="auth-wrap">
    <form class="glass card" @submit.prevent="submit">
      <h2>{{ mode === "login" ? "登入" : "註冊" }}</h2>
      <input v-model="username" placeholder="用戶名" autocomplete="username" />
      <input v-model="password" type="password" placeholder="密碼" autocomplete="current-password" />
      <p v-if="error" class="err">{{ error }}</p>
      <button class="primary" :disabled="busy">{{ busy ? "處理中…" : (mode === "login" ? "登入" : "建立帳號") }}</button>
      <button type="button" class="switch" @click="mode = mode === 'login' ? 'register' : 'login'; error = ''">
        {{ mode === "login" ? "沒有帳號？註冊" : "已有帳號？登入" }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.auth-wrap { min-height: 100vh; display: grid; place-items: center; padding: 16px; }
.card { display: flex; flex-direction: column; gap: 12px; padding: 28px; width: 320px; max-width: 100%; }
.card h2 { text-align: center; }
.card input { padding: 10px; border: none; border-radius: 12px; font: inherit; }
.primary { padding: 11px; border: none; border-radius: 12px; background: var(--c-primary); color: #fff; cursor: pointer; }
.primary:disabled { opacity: .6; cursor: default; }
.switch { background: transparent; border: none; color: var(--c-text); opacity: .8; cursor: pointer; }
.err { color: var(--c-bad); font-size: 14px; }
</style>
