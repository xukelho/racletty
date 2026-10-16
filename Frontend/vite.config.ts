import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const legacyFrontend = mode === "legacy";

  return {
    plugins: [react()],
    resolve: !legacyFrontend ? undefined : { alias: [
      { find: "../../Frontend 2/src/workshop.css", replacement: fileURLToPath(new URL("./src/frontend-2-placeholder.css", import.meta.url)) },
      { find: "../../Frontend 2/src/project.css", replacement: fileURLToPath(new URL("./src/frontend-2-placeholder.css", import.meta.url)) },
    ] },
    base: legacyFrontend ? "/legacy/" : "/",
    build: legacyFrontend ? { outDir: fileURLToPath(new URL("../Frontend 2/legacy-dist", import.meta.url)), emptyOutDir: true } : undefined,
    envDir: process.cwd(),
    define: { "import.meta.env.VITE_WORKSHOP_UI": JSON.stringify(legacyFrontend ? "false" : "true") },
    server: {
      allowedHosts: legacyFrontend ? ["racletty-frontend-2"] : undefined,
      fs: { allow: [fileURLToPath(new URL("../", import.meta.url))] },
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:1818",
          changeOrigin: true,
        },
        ...(!legacyFrontend ? { "/legacy": {
          target: env.VITE_LEGACY_PROXY_TARGET || "http://localhost:5386",
          changeOrigin: true,
          ws: true,
        } } : {}),
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  };
});
