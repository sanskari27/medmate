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
    port: 3204,
    proxy: {
      "/auth": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/pharmacy": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
      "/support": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        ws: true,
        bypass(req) {
          const accept = req.headers.accept ?? "";
          if (accept.includes("text/html")) return "/index.html";
        },
      },
      "/sms-mock": {
        target: "http://127.0.0.1:8090",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/sms-mock/, ""),
      },
    },
  },
  build: {
    manifest: true,
    emptyOutDir: true,
  },
});
