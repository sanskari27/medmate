import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.spec.ts", "src/**/*.spec.tsx"],
  },
  server: {
    port: 3206,
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/sms-mock": {
        target: "http://127.0.0.1:8090",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/sms-mock/, ""),
      },
      "/clinic-api": {
        target: "http://127.0.0.1:8091",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/clinic-api/, ""),
      },
    },
  },
  build: {
    manifest: true,
    emptyOutDir: true,
  },
});
