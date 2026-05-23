import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "財政管理器",
        short_name: "財政",
        theme_color: "#E89AC7",
        background_color: "#1a1020",
        display: "standalone",
        icons: [],
      },
    }),
  ],
  server: {
    // 開發時把 /api 轉給後端，避免 CORS 與寫死網址。
    proxy: { "/api": "http://127.0.0.1:3000" },
  },
});
