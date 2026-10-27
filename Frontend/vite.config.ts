import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    envDir: process.cwd(),
    server: {
      fs: { allow: [fileURLToPath(new URL("../", import.meta.url))] },
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:1818",
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  };
});
