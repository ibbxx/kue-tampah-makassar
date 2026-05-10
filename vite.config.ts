import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: { entry: "src/server.ts" },
    }),
    react(),
    // Only enable Cloudflare during build to avoid resolution errors in dev
    command === "build" ? cloudflare() : null,
  ],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: [
      "@tanstack/react-start",
      "@tanstack/react-router",
      "@tanstack/start-server-core",
      "@tanstack/start-client-core",
      "@tanstack/react-start-server",
      "@tanstack/react-start-client",
    ],
  },
}));
